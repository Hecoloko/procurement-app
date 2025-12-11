
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys for verification
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRelations() {
    console.log("--- Inspecting PO -> Order -> Cart -> Items Chain ---");

    // 1. Get recent Paid POs
    const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('payment_status', 'Paid')
        .order('payment_date', { ascending: false })
        .limit(3);

    if (poError || !pos || pos.length === 0) {
        console.error("No Paid POs found or error:", poError);
        return;
    }

    console.log(`Found ${pos.length} Paid POs. Inspecting the most recent one: ${pos[0].id}`);
    const poId = pos[0].id;

    // 2. Replicate the query from billbackService
    const { data: deepPO, error: deepError } = await supabase
        .from('purchase_orders')
        .select(`
            *,
            orders!original_order_id (
                id,
                company_id,
                property_id,
                cart:carts (
                    id,
                    cart_items (
                        id,
                        name,
                        quantity,
                        unit_price,
                        total_price
                    )
                )
            )
        `)
        .eq('id', poId)
        .single();

    if (deepError) {
        console.error("Deep Fetch Error:", deepError);
        return;
    }

    console.log("--- Deep Fetch Result ---");
    const order = deepPO.orders as any;
    console.log(`PO ID: ${deepPO.id}`);
    console.log(`Linked Order ID: ${order?.id || 'NULL'}`);

    if (order) {
        const cart = order.cart;
        console.log(`Linked Cart ID: ${cart?.id || 'NULL'}`);
        if (cart) {
            const items = cart.cart_items;
            console.log(`Cart Items Found: ${Array.isArray(items) ? items.length : 'Not an array'}`);
            if (Array.isArray(items)) {
                console.table(items);
            }
        }
    }
}

inspectRelations();
