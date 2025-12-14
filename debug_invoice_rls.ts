
import { supabase } from './supabaseClient';

async function inspectPolicies() {
    const { data, error } = await supabase
        .rpc('get_policies', { table_name: 'invoices' }); // This might not work if rpc doesn't exist.

    // Alternative: try to insert a dummy invoice and see the error
    const { error: insertError } = await supabase.from('invoices').insert({
        company_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        invoice_number: 'TEST-RLS',
        status: 'Draft',
        issue_date: new Date().toISOString(),
        subtotal: 0,
        tax_total: 0,
        total_amount: 0
    });

    console.log('Insert Error:', insertError);
}

inspectPolicies();
