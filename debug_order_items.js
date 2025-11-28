
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrderItems() {
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Failed to sign in:", authError.message);
        return;
    }

    // Fetch orders to find the one matching the ID prefix from the screenshot
    // PO ID: PO-e2dff658...
    // Order ID likely contains e2dff658

    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, cart_id, cart_name')
        .ilike('id', '%e2dff658%');

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    console.log(`Found ${orders.length} matching orders.`);

    for (const order of orders) {
        console.log(`Checking Order: ${order.id} (Cart: ${order.cart_id})`);

        // Fetch cart items
        const { data: items, error: itemsError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', order.cart_id);

        if (itemsError) {
            console.error('Error fetching items:', itemsError);
            continue;
        }

        console.log(`Found ${items.length} items.`);

        const idCounts = {};
        items.forEach(item => {
            idCounts[item.id] = (idCounts[item.id] || 0) + 1;
            console.log(`Item: ${item.name}, ID: ${item.id}, VendorID: ${item.vendor_id || 'N/A'}`);
        });

        const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log('DUPLICATE IDs FOUND:', duplicates);
        } else {
            console.log('No duplicate IDs found.');
        }
    }
}

debugOrderItems();
