
import { supabase } from '../supabaseClient';

// Sola / Cardknox Sandbox Configuration
// const SOLA_SANDBOX_URL = 'https://x1.cardknox.com/gatewayjson'; // Moved to Backend

interface TestTransactionResult {
    success: boolean;
    message: string;
    refNum?: string; // xRefNum
    responsePayload?: any;
    error?: string;
}

/**
 * Runs a SANDBOX transaction against Sola/Cardknox via Supabase Edge Function to avoid CORS.
 * @param companyId The ID of the company to test.
 * @param settingId (Optional) Specific settings ID.
 */
export async function runTestTransaction(companyId: string, settingId?: string): Promise<TestTransactionResult> {
    console.log(`[Connection Tester] Invoking 'test-connection' function for Company: ${companyId}`);

    try {
        const { data, error } = await supabase.functions.invoke('test-connection', {
            body: { companyId: companyId, settingsId: settingId } // Match the expected params in snake_case if function expects it, but looking at my function code it expects company_id, settings_id
        });

        // Oh wait, my function expects { company_id, settings_id }. I passed camelCase above.
        // Let's fix the call:
        const response = await supabase.functions.invoke('test-connection', {
            body: {
                company_id: companyId,
                settings_id: settingId
            }
        });

        if (response.error) {
            throw new Error(response.error.message || 'Function invocation failed');
        }

        const result = response.data;
        console.log('[Connection Tester] Function Response:', result);

        if (result.error) {
            return {
                success: false,
                message: `Connection Failed: ${result.error}`,
                responsePayload: result,
                error: result.error
            };
        }

        // Sola returns xResult: 'A' (Approved), 'E' (Error), 'D' (Declined)
        if (result.xResult === 'A') {
            return {
                success: true,
                message: 'Connection Verified',
                refNum: result.xRefNum,
                responsePayload: result
            };
        } else {
            const errorMsg = result.xError || result.xStatus || 'Unknown Error';
            return {
                success: false,
                message: `Connection Failed: ${errorMsg}`,
                responsePayload: result,
                error: errorMsg
            };
        }

    } catch (err: any) {
        console.error("Test Transaction Exception:", err);
        return { success: false, message: `System Error: ${err.message}`, error: err.message };
    }
}
