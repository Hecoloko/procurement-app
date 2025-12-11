import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = "re_e4ckgkJc_7yxL3cGNnSFDWHAh7QWmkamv";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { invoiceId, email } = await req.json();

        if (!RESEND_API_KEY) {
            throw new Error("Missing RESEND_API_KEY");
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch Invoice Details
        const { data: invoice, error } = await supabaseClient
            .from("invoices")
            .select("*, customer:customers(*), items:invoice_items(*)")
            .eq("id", invoiceId)
            .single();

        if (error || !invoice) throw new Error("Invoice not found");

        const paymentLink = `https://nexuspay.app/pay/${invoice.invoice_number}`;

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Acme <onboarding@resend.dev>", // Replace with verified domain
                to: [email || invoice.customer.email],
                subject: `New Invoice ${invoice.invoice_number} from Acme`,
                html: `
          <h1>New Invoice Shared</h1>
          <p>Hi ${invoice.customer.name},</p>
          <p>Here is your invoice for <strong>$${invoice.total_amount.toFixed(2)}</strong>.</p>
          <p>Due Date: ${invoice.due_date || 'Upon Receipt'}</p>
          <br/>
          <a href="${paymentLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Pay Invoice
          </a>
          <br/><br/>
          <p>Thank you for your business!</p>
        `,
            }),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
