
import { supabase } from '../supabaseClient';

interface PaymentResult {
    success: boolean;
    transactionId?: string;
    error?: string;
}

/**
 * Processes a payment using the secure Edge Function.
 * Wraps the 'test-connection' (or 'process-payment') function to handle real transactions.
 * 
 * @param invoiceId - The ID of the invoice/PO being paid.
 * @param paymentToken - Legacy token or placeholder.
 * @param paymentMetadata - Optional metadata including selected settings and card details.
 */
export async function processPayment(invoiceId: string, paymentToken: string, amount: number, paymentMetadata?: any): Promise<PaymentResult> {
    try {
        console.log(`Starting payment process for Invoice: ${invoiceId}, Amount: ${amount}`);
        console.log('Payment Metadata:', paymentMetadata);

        // 1. Determine Company
        const companyId = 'comp-1'; // Hardcoded for this demo context

        // 2. Prepare Payload for Edge Function
        // Using 'test-connection' which now supports dynamic payload

        const settingsId = paymentMetadata?.settingsId;

        const { data, error } = await supabase.functions.invoke('test-connection', {
            body: {
                company_id: companyId,
                settings_id: settingsId,
                amount: amount,
                invoice_number: invoiceId, // Pass PO ID as invoice number
                card_details: paymentMetadata?.newCardDetails,
                // New Features
                save_card: paymentMetadata?.saveCard,
                email_receipt: paymentMetadata?.emailReceipt
            }
        });

        if (error) {
            console.error('Edge Function Error:', error);
            return { success: false, error: error.message };
        }

        const result = data;
        console.log('Payment Service Response:', result);

        if (result.xResult === 'A') {
            return { success: true, transactionId: result.xRefNum };
        } else {
            return { success: false, error: result.xError || result.xStatus };
        }

    } catch (err: any) {
        console.error("Payment Process Error:", err);
        return { success: false, error: err.message };
    }
}

// Keep the runTestTransaction for the Settings page
export async function runTestTransaction(companyId: string, settingsId?: string) {
    console.log(`[Connection Tester] Starting Sola Sandbox test for Company: ${companyId}`);

    try {
        const { data, error } = await supabase.functions.invoke('test-connection', {
            body: { company_id: companyId, settings_id: settingsId }
        });

        if (error) throw error;

        console.log("[Connection Tester] Response:", data);

        const success = data.xResult === 'A';
        return {
            success,
            message: success ? 'Connection Verified' : `Failed: ${data.xStatus} - ${data.xError}`,
            refNum: data.xRefNum,
            responsePayload: data
        };
    } catch (error: any) {
        console.error("Connection Test Error:", error);
        return { success: false, message: error.message, responsePayload: null };
    }
}
