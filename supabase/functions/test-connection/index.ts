
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { company_id, settings_id, amount, card_details, invoice_number } = await req.json();

        if (!company_id) {
            throw new Error("Missing company_id");
        }

        // 1. Initialize Supabase Client
        // Use Service Role if available to ensure we can read settings, 
        // OR use the user's auth context. 
        // Better to use Auth context to respect RLS, assuming the user (Admin) has access.
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } }
        });

        // 2. Fetch Credentials
        let query = supabase.from('company_payment_settings').select('sola_xkey_text, sola_xkey_id, account_label').eq('company_id', company_id);
        if (settings_id) {
            query = query.eq('id', settings_id);
        } else {
            query = query.limit(1);
        }

        const { data: settings, error: settingsError } = await query.single();

        if (settingsError || !settings) {
            console.error("Settings fetch error:", settingsError);
            throw new Error("Could not fetch payment settings for the selected account.");
        }

        const xKey = settings.sola_xkey_text;

        if (!xKey) {
            throw new Error("Missing xKey in configuration.");
        }

        // 3. Prepare Sola/Cardknox Request
        const SOLA_SANDBOX_URL = 'https://x1.cardknox.com/gatewayjson';

        // Use provided details or fallbacks for testing if missing (though they should be provided for real payments)
        const txnAmount = amount ? parseFloat(amount) : 1.00;
        const txnCardNum = card_details?.cardNumber || '4111111111111111';
        const txnExp = card_details?.expDate || '1230';
        const txnCVV = card_details?.cvv || '123';
        const txnZip = card_details?.zip || undefined;
        const txnInvoice = invoice_number || ('TEST-' + Date.now().toString().slice(-6));

        const payload = {
            xKey: xKey,
            xCommand: 'cc:sale',
            xVersion: '4.5.9',
            xSoftwareName: 'NexusPay',
            xSoftwareVersion: '1.0',
            xCardNum: txnCardNum,
            xExp: txnExp,
            xCVV: txnCVV,
            xZip: txnZip,
            xAmount: txnAmount,
            xDescription: 'NexusPay Bill Payment',
            xInvoice: txnInvoice
        };

        console.log(`Sending request to ${SOLA_SANDBOX_URL} using Key: ...${xKey.slice(-4)}`, { amount: txnAmount, invoice: txnInvoice });

        // 4. Send Request (Server-side fetch, no CORS issues)
        const response = await fetch(SOLA_SANDBOX_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('Sola Response:', result);

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Test Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message, xResult: 'E', xError: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
