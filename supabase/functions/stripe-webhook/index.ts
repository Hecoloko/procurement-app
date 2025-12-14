import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
});
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");

    try {
        const body = await req.text();
        let event;

        if (endpointSecret) {
            try {
                event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);
            } catch (err: any) {
                console.error(`Webhook signature verification failed.`, err.message);
                return new Response(err.message, { status: 400 });
            }
        } else {
            event = JSON.parse(body);
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log(`Received event: ${event.type}`);

        switch (event.type) {
            case "invoice.paid": {
                const invoice = event.data.object;
                const invoiceId = invoice.metadata?.invoiceId || invoice.metadata?.app_invoice_id;
                const companyId = invoice.metadata?.companyId || invoice.metadata?.company_id;
                const customerId = invoice.metadata?.customerId || invoice.metadata?.customer_id;

                if (invoiceId && companyId) {
                    // 1. Update Invoice Status
                    const { error: invoiceError } = await supabaseClient
                        .from("invoices")
                        .update({
                            status: "Paid",
                            stripe_invoice_id: invoice.id,
                            amount_paid: invoice.amount_paid / 100, // Stripe is in cents
                            payment_date: new Date().toISOString(),
                            balance_due: 0
                        })
                        .eq("id", invoiceId);

                    if (invoiceError) console.error("Error updating invoice:", invoiceError);

                    // 1b. Log Activity
                    await supabaseClient.from('invoice_activities').insert({
                        invoice_id: invoiceId,
                        activity_type: 'PAYMENT_RECEIVED',
                        description: `Payment received via Stripe Invoice`,
                        metadata: {
                            stripe_id: invoice.id,
                            amount: invoice.amount_paid / 100,
                            currency: invoice.currency
                        }
                    });

                    // 2. Create AR Ledger Entry
                    if (customerId) {
                        const { error: ledgerError } = await supabaseClient
                            .from("ar_ledger")
                            .insert({
                                company_id: companyId,
                                customer_id: customerId,
                                type: 'Payment',
                                amount: -(invoice.amount_paid / 100),
                                description: `Payment for Invoice #${invoice.number}`,
                                reference_id: invoiceId,
                                transaction_date: new Date().toISOString()
                            });
                        if (ledgerError) console.error("Error creating ledger entry:", ledgerError);
                    }
                }
                break;
            }

            case "payment_intent.succeeded": {
                const pi = event.data.object;
                const companyId = pi.metadata?.companyId || pi.metadata?.company_id;

                if (companyId) {
                    await supabaseClient.from('stripe_payment_records').insert({
                        company_id: companyId,
                        stripe_payment_intent_id: pi.id,
                        stripe_charge_id: pi.latest_charge,
                        stripe_customer_id: pi.customer,
                        amount: pi.amount / 100,
                        currency: pi.currency,
                        status: pi.status,
                        metadata: pi.metadata
                    });

                    // Log Activity if invoiceId is present
                    const invoiceId = pi.metadata?.invoiceId;
                    if (invoiceId) {
                        // Update Invoice as Paid
                        await supabaseClient
                            .from("invoices")
                            .update({
                                status: "Paid",
                                stripe_payment_intent_id: pi.id,
                                amount_paid: pi.amount / 100,
                                payment_date: new Date().toISOString(),
                                balance_due: 0
                            })
                            .eq("id", invoiceId);

                        // Log Activity
                        await supabaseClient.from('invoice_activities').insert({
                            invoice_id: invoiceId,
                            activity_type: 'PAYMENT_RECEIVED',
                            description: `Payment received via Card`,
                            metadata: {
                                stripe_pi_id: pi.id,
                                amount: pi.amount / 100,
                                card: pi.payment_method_types?.[0] || 'card'
                            }
                        });
                    }
                }
                break;
            }

            case "checkout.session.completed": {
                // Handling Checkout Session for Invoice Payment
                const session = event.data.object;
                // Rely on invoice.paid if it's an invoice mode session? 
                // If 'mode' is 'payment', it might not generate an invoice.
                // Fallback to update invoice if metadata exists
                const invoiceId = session.metadata?.invoiceId;
                if (invoiceId) {
                    await supabaseClient.from("invoices").update({
                        status: "Paid",
                        stripe_session_id: session.id,
                        // Don't fully update amount if we rely on invoice.paid, but good for immediate feedback
                    }).eq("id", invoiceId);
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
});
