import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { company_id, amount, payment_method, payment_settings_id } = await req.json();

        if (!company_id || !amount || !payment_method || !payment_settings_id) {
            throw new Error("Missing required fields: company_id, amount, payment_method, payment_settings_id");
        }

        // 1. Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: req.headers.get('Authorization')! } }
        });

        // 2. Fetch Credentials
        // We need to get the real xKey for this transaction. 
        // Note: For security, fetching raw secrets should be done carefully.
        // We will fetch the row and assume 'sola_xkey_text' is populated (our fallback).
        // If we were using Vault, we'd need to decrypt.

        const { data: settings, error: settingsError } = await supabase
            .from('company_payment_settings')
            .select('sola_xkey_text, sola_xkey_id')
            .eq('id', payment_settings_id) // Use the specific account selected
            .single();

        if (settingsError || !settings) {
            throw new Error("Could not fetch payment settings for the selected account.");
        }

        const xKey = settings.sola_xkey_text;

        if (!xKey || xKey.startsWith('xkey_')) {
            // Mock scenario handling: If key looks like our generated test key, we keep mocking.
            if (xKey && xKey.startsWith('xkey_')) {
                console.log('Detected Mock Key, simulating transaction...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                const mockToken = `195325${Math.floor(Math.random() * 1000000000)}`;
                const transactionId = `trans_${Math.random().toString(36).substring(7)}`;

                // Save mock record
                await supabase.from('saved_payment_methods').insert({
                    company_id,
                    sola_xtoken: mockToken,
                    card_last4: payment_method.card_number.slice(-4),
                    card_brand: 'Visa (Mock)',
                    exp_month: 12,
                    exp_year: 2030,
                    payment_settings_id // Link it
                });

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: "Mock Transaction Approved (Local Only)",
                        transactionId,
                        token: mockToken
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            throw new Error("No valid xKey found for this account.");
        }

        // 3. Real Sola Transaction
        console.log(`Processing REAL payment of $${amount} via Sola Gateway...`);

        // Construct Sola Payload
        // Using 'sale' type for immediate transaction
        const solaPayload = {
            "xKey": xKey,
            "xVersion": "4.5.9",
            "xSoftwareName": "ProcurementApp",
            "xSoftwareVersion": "1.0.0",
            "xCommand": "cc:sale",
            "xAmount": amount,
            "xCardNum": payment_method.card_number,
            "xExp": payment_method.exp_date.replace('/', ''), // MMYY
            "xStreet": "123 Test St",
            "xZip": "12345",
            "xName": "Test User"
        };

        // Call Sola Sandbox API
        // Note: In production this URL would change
        const solaResponse = await fetch("https://sandbox.gateway.sola.com/api/v1/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(solaPayload)
        });

        const solaResult = await solaResponse.json();
        console.log('Sola Response:', solaResult);

        if (solaResult.xResult === "A") { // Approved
            const transactionId = solaResult.xRefNum;
            const token = solaResult.xToken || `tok_${Math.random()}`; // Sola returns token?

            // Save record
            await supabase.from('saved_payment_methods').insert({
                company_id,
                sola_xtoken: token,
                card_last4: payment_method.card_number.slice(-4),
                card_brand: solaResult.xCardType || 'Unknown',
                exp_month: parseInt(payment_method.exp_date.split('/')[0]),
                exp_year: parseInt(payment_method.exp_date.split('/')[1]),
                payment_settings_id
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Transaction Approved by Sola",
                    transactionId,
                    token,
                    raw: solaResult
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        } else {
            throw new Error(solaResult.xError || "Transaction Declined by Gateway");
        }

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
