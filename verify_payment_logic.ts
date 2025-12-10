
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("Verifying Payment Routing Logic...");

    // 1. Check if 'invoices' table exists and we can select from it
    console.log("Checking 'invoices' table...");
    const { data: invoices, error: invoiceError } = await supabase.from('invoices').select('*').limit(1);
    if (invoiceError) {
        console.error("Error accessing invoices:", invoiceError.message);
    } else {
        console.log("Invoices table access OK. Rows:", invoices.length);
    }

    // 2. Check 'company_payment_settings' for new columns
    console.log("Checking 'company_payment_settings' columns...");
    const { data: settings, error: settingsError } = await supabase
        .from('company_payment_settings')
        .select('id, x_key, ifields_key, account_name')
        .limit(1);

    if (settingsError) {
        console.error("Error accessing settings:", settingsError.message);
    } else {
        console.log("Payment Settings access OK. Sample:", settings[0] || 'No rows');
    }

    // 3. Simulate Logic Query: Find Mapping
    console.log("Testing Mapping Query...");
    const testCompanyId = 'comp-1'; // Assuming this exists from seeds
    const testType = 'Utilities';

    const { data: mapping } = await supabase
        .from('invoice_type_mappings')
        .select('payment_settings_id')
        .eq('company_id', testCompanyId)
        .eq('invoice_type', testType)
        .maybeSingle();

    console.log("Mapping query executed. Result:", mapping);
}

verify();
