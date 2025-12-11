
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys for verification
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log("--- Inspecting Billable Items ---");
    const { data: items, error } = await supabase
        .from('billable_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    if (items.length === 0) {
        console.log("No billable items found.");
    } else {
        console.table(items.map(i => ({
            id: i.id,
            desc: i.description,
            status: i.status,
            property_id: i.property_id,
            source: i.source_id,
            created: i.created_at
        })));
    }

    console.log("\n--- Inspecting Recently Paid POs ---");
    const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('*, orders!original_order_id(property_id)')
        .eq('payment_status', 'Paid')
        .order('payment_date', { ascending: false })
        .limit(5);

    if (poError) {
        console.error(poError);
    } else {
        console.table(pos.map(p => ({
            id: p.id,
            status: p.payment_status,
            pay_date: p.payment_date,
            method: p.payment_method,
            order_prop: (p.orders as any)?.property_id
        })));
    }
}

inspectData();
