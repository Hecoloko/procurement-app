import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
});

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { company_id, settings_id, amount, payment_token, method_id, save_card, email_receipt, gateway, invoice_id } = await req.json();

        // 1. Setup Supabase Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Route by Gateway
        if (gateway === 'sola') {
            // ... Sola Logic (Simplified port from test-connection)
            const { data: settings } = await supabase.from('company_payment_settings').select('sola_xkey_text').eq('id', settings_id).single();
            if (!settings?.sola_xkey_text) throw new Error("Sola configuration missing.");

            // Construct Sola Payload
            const SOLA_URL = 'https://x1.cardknox.com/gatewayjson';
            const payload = {
                xKey: settings.sola_xkey_text,
                xCommand: 'cc:sale',
                xVersion: '4.5.9',
                xSoftwareName: 'NexusPay',
                xSoftwareVersion: '1.0',
                xCardNum: payment_token, // For Sola, token is passed in xCardNum or xToken
                xAmount: amount,
                xInvoice: invoice_id || `INV-${Date.now()}`
            };

            const response = await fetch(SOLA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.xResult === 'A') {
                return new Response(JSON.stringify({ success: true, transactionId: result.xRefNum }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            } else {
                throw new Error(result.xError || result.xStatus);
            }

        } else {
            // ... Stripe Logic
            if (!method_id) throw new Error("Missing Payment Method ID");

            let customerId = null;

            // Check/Create Customer if saving card
            if (save_card) {
                const { data: company } = await supabase.from('companies').select('stripe_customer_id, name, email').eq('id', company_id).single();
                if (company) {
                    if (company.stripe_customer_id) {
                        customerId = company.stripe_customer_id;
                    } else {
                        const customer = await stripe.customers.create({
                            name: company.name,
                            email: email_receipt || company.email || undefined,
                            metadata: { companyId: company_id }
                        });
                        customerId = customer.id;
                        await supabase.from('companies').update({ stripe_customer_id: customerId }).eq('id', company_id);
                    }
                }
            }

            // Create PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: 'usd',
                payment_method: method_id,
                customer: customerId || undefined,
                confirm: true,
                return_url: `${req.headers.get("origin")}/payment-result`,
                automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: 'never'
                },
                metadata: { company_id, invoice_id }
            });

            // Save Card logic
            if (save_card && customerId && paymentIntent.status === 'succeeded') {
                await stripe.paymentMethods.attach(method_id, { customer: customerId });
                // Get Card Details
                const pm = await stripe.paymentMethods.retrieve(method_id);
                // Save to DB
                await supabase.from('saved_payment_methods').insert({
                    company_id,
                    gateway: 'stripe',
                    stripe_payment_method_id: method_id,
                    card_last4: pm.card?.last4,
                    card_brand: pm.card?.brand,
                    exp_month: pm.card?.exp_month,
                    exp_year: pm.card?.exp_year,
                    customer_id: customerId
                });
            }

            // [NEW] Record Transaction in stripe_payment_records
            if (paymentIntent.status === 'succeeded') {
                await supabase.from('stripe_payment_records').insert({
                    company_id,
                    stripe_payment_intent_id: paymentIntent.id,
                    stripe_charge_id: paymentIntent.latest_charge, // charge id if available
                    stripe_customer_id: customerId || paymentIntent.customer,
                    amount: amount,
                    currency: paymentIntent.currency,
                    status: paymentIntent.status,
                    metadata: { ...paymentIntent.metadata, invoice_id }
                });
            }

            return new Response(JSON.stringify({ success: true, paymentIntent }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
