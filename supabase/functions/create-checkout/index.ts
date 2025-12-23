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
        const { invoiceId, companyId } = await req.json();

        // 1. Get Invoice from Supabase via RPC (Bypasses RLS securely)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        // Fetch invoice using the public RPC function
        const { data: invoice, error: invoiceError } = await supabaseClient
            .rpc('get_public_invoice', { invoice_uuid: invoiceId });

        if (invoiceError || !invoice) {
            console.error("Invoice fetch error:", invoiceError);
            throw new Error("Invoice not found");
        }

        // 2. Prepare Line Items
        let line_items = [];
        if (invoice.items && invoice.items.length > 0) {
            line_items = invoice.items.map((item: any) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.description,
                    },
                    unit_amount: Math.round((item.unit_price || item.total_price) * 100), // Handle varied schemas
                },
                quantity: item.quantity || 1,
            }));
        } else {
            // Fallback if no items (e.g. flat invoice)
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Invoice #${invoice.invoice_number || invoice.id}`,
                    },
                    unit_amount: Math.round(invoice.amount * 100), // Corrected: amount column
                },
                quantity: 1,
            });
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            // Update to use Hash Routing #/pay/:id
            success_url: `${req.headers.get("origin")}/#/pay/${invoiceId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get("origin")}/#/pay/${invoiceId}?canceled=true`,
            metadata: {
                invoiceId: invoice.id,
                companyId: companyId || invoice.company_id,
                customerId: invoice.customer_id
            },
            client_reference_id: invoice.id,
        });

        return new Response(
            JSON.stringify({ url: session.url, sessionId: session.id }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("Checkout Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
