import { runTestTransaction } from './services/paymentTester';
import { supabase } from './supabaseClient';

// MOCK GLOBAL FETCH for Testing purposes
// MOCK GLOBAL FETCH REMOVED to allow real Edge Function call
// const originalFetch = global.fetch; ...

// We need to ensure we have at least one company and setting to test with.
async function setupAndVerify() {
    console.log("Starting Verification of Connection Tester...");

    // 0. Authenticate as Admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError || !authData.session) {
        console.error("Authentication failed:", authError?.message);
        return;
    }
    console.log("Authenticated as Admin:", authData.user?.email);

    // 1. Get a Company ID (or create one if needed, but we likely have 'comp-1')
    const companyId = 'comp-1';

    // 2. Ensure Payment Settings exist for this company
    let { data: settings } = await supabase
        .from('company_payment_settings')
        .select('*')
        .eq('company_id', companyId)
        .limit(1)
        .maybeSingle();

    if (!settings) {
        console.log("No settings found. creating mock settings...");
        const { data: newSettings, error } = await supabase.from('company_payment_settings').insert({
            company_id: companyId,
            // gateway_name: 'sola', // Removed: Not in schema
            is_active: true, // Corrected column name from is_enabled
            sola_xkey_text: 'simchadevf2f688639c58479793428c0d2e4a4117', // Real Key from User
            sola_ifields_key: 'ifields_simchadev3997ca8859db4995a41e06eb0abc',
            account_label: 'Test Account' // Corrected column name
        }).select().single();

        if (error) {
            console.error("Failed to create mock settings:", error);
            return;
        }
        settings = newSettings;
    } else {
        // If settings exist but might be missing keys, update them for the test
        // ALWAYS update to the provided key for this test run to ensure we test the new creds
        console.log("Updating existing settings with REAL credentials...");
        const { data: updated, error: updateError } = await supabase
            .from('company_payment_settings')
            .update({
                sola_xkey_text: 'simchadevf2f688639c58479793428c0d2e4a4117',
                sola_ifields_key: 'ifields_simchadev3997ca8859db4995a41e06eb0abc',
                is_active: true
            })
            .eq('id', settings.id)
            .select()
            .single();

        if (!updateError) settings = updated;
        else console.error("Failed to update settings:", updateError);
    }
    // Brace removed to extend function scope

    console.log(`Testing with Company: ${companyId} and Settings ID: ${settings.id}`);

    // 3. Run the Tester (Standard)
    console.log("---------------------------------------------------");
    console.log("TEST 1: Standard Connection Test (Default Card)");
    const result1 = await runTestTransaction(companyId, settings.id);
    console.log("RESULT 1:", result1.success ? "SUCCESS" : "FAILED");


    // 4. Run the Tester (Dynamic Card Details)
    console.log("---------------------------------------------------");
    console.log("TEST 2: Dynamic Card Details (Payment Modal Scenario)");

    // Direct invoke to simulate what paymentService.processPayment will do
    const { data: dynamicResult, error: dynamicError } = await supabase.functions.invoke('test-connection', {
        body: {
            company_id: companyId,
            settings_id: settings.id,
            card_details: {
                cardNumber: '4111111111111111',
                expDate: '1235', // Distinct date to verify override
                cvv: '999',
                zip: '90210'
            }
        }
    });

    if (dynamicError) {
        console.error("Dynamic Test Failed:", dynamicError);
    } else {
        console.log("Dynamic Response Payload (Check xExp='1235'):", {
            xResult: dynamicResult.xResult,
            xStatus: dynamicResult.xStatus,
            xMaskedCardNumber: dynamicResult.xMaskedCardNumber,
            xExp: dynamicResult.xExp, // CRITICAL CHECK
            xZip: dynamicResult.xZip  // CRITICAL CHECK (Gateway often echoes this)
        });
    }
    console.log("---------------------------------------------------");

    // 5. Run the Tester (Dynamic Amount)
    console.log("TEST 3: Dynamic Amount Check");
    const testAmount = 150.75;
    const { data: amountResult, error: amountError } = await supabase.functions.invoke('test-connection', {
        body: {
            company_id: companyId,
            settings_id: settings.id,
            amount: testAmount,
            invoice_number: 'TEST-AMOUNT-CHECK'
        }
    });

    if (amountError) {
        console.error("Amount Test Failed:", amountError);
    } else {
        console.log(`Amount Response Payload (Check xAmount=${testAmount}):`, {
            xResult: amountResult.xResult,
            xStatus: amountResult.xStatus,
            xAmount: amountResult.xAmount,
            xAuthAmount: amountResult.xAuthAmount, // Check this one too
            xRefNum: amountResult.xRefNum
        });
    }
    console.log("---------------------------------------------------");
}

setupAndVerify();
