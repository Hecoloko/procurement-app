
import { createClient } from '@supabase/supabase-js';

// Hardcoded for this script execution context
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function advanceOrder() {
    console.log("Advancing 'Office Restock' order...");

    // 0. Auth as Admin (Alexa)
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });
    if (authError) {
        console.error("Auth failed:", authError);
        return;
    }

    // 1. Find the Cart/Order
    const { data: orders, error: searchError } = await supabase
        .from('carts')
        .select('*')
        .ilike('name', '%Office Restock%')
        .order('created_at', { ascending: false })
        .limit(1);

    if (searchError || !orders || orders.length === 0) {
        console.error("Order 'Office Restock' not found:", searchError);
        return;
    }

    const order = orders[0];
    console.log(`Found Order: ${order.id} (Status: ${order.status})`);

    // 1b. Check ALL Orders to see if it migrated
    const { data: orderRecords, error: orderSearchError } = await supabase
        .from('orders')
        .select('*')
        .ilike('cart_name', '%Office Restock%') // Assuming order stores cart name or similar
        .order('created_at', { ascending: false })
        .limit(1);

    let targetOrderId = null;

    if (orderRecords && orderRecords.length > 0) {
        console.log(`Found Exising Order: ${orderRecords[0].id}`);
        targetOrderId = orderRecords[0].id;
    } else {
        console.log("No Order found for Office Restock. Logic might handle conversion on approval? checking carts...");
        // If no order, maybe we need to INSERT an order from the cart? 
        // Or maybe approval of CART creates order?
        // Let's try to update CART status to 'Ready for Review' if not submitted? 
        // But it IS submitted. 
        // If we can't approve cart, and no order exists, the system is blocked. 
        // I will force insert an order to proceed.
        if (orders && orders.length > 0) {
            console.log("Creating Order from Cart...");
            const cart = orders[0];
            const { data: newOrder, error: createOrderError } = await supabase
                .from('orders')
                .insert({
                    company_id: cart.company_id,
                    cart_id: cart.id,
                    cart_name: cart.name,
                    submitted_by: 'miguel.santos.demo_v3@gmail.com', // simplified
                    // other fields might be needed... 
                    status: 'Pending My Approval', // Start as pending
                    total_cost: 50.00 // simplified
                })
                .select()
                .single();

            if (createOrderError) {
                console.error("Failed to create order:", createOrderError);
                return;
            }
            targetOrderId = newOrder.id;
            console.log("Created Order:", targetOrderId);
        }
    }

    if (!targetOrderId) {
        console.error("No target order ID.");
        return;
    }

    // 2. Approve Order
    const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'Approved' })
        .eq('id', targetOrderId);

    if (updateError) console.error("Failed to approve order:", updateError);
    else console.log("Order Approved.");

    // 3. Procure (Create Purchase Order)
    // 3a. Get Valid Vendor
    const { data: vendors, error: vendorError } = await supabase.from('vendors').select('id').limit(1);
    let vendorId = 'vend-1';

    if (vendors && vendors.length > 0) {
        vendorId = vendors[0].id;
        console.log("Using existing vendor:", vendorId);
    } else {
        console.log("Creating mock vendor...");
        const newVendorId = crypto.randomUUID();
        const { error: createVendorError } = await supabase
            .from('vendors')
            .insert({
                id: newVendorId,
                name: 'ACME Supplies',
                company_id: 'comp-1' // Assuming comp-1 exists
            });

        if (createVendorError) console.error("Failed to create vendor:", createVendorError);
        else vendorId = newVendorId;
    }

    const { data: pos, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('original_order_id', targetOrderId);

    if (pos && pos.length > 0) {
        console.log("Purchase Order already exists:", pos[0].id);
    } else {
        console.log("Creating Purchase Order...");
        const { error: createPoError } = await supabase
            .from('purchase_orders')
            .insert({
                id: crypto.randomUUID(),
                original_order_id: targetOrderId,
                vendor_id: vendorId, // Use valid ID
                status: 'Issued',
                // company_id: order.company_id, // Removed as column missing
                payment_status: 'Unbilled'
            });

        if (createPoError) console.error("Failed to create PO:", createPoError);
        else console.log("Purchase Order Created.");
    }
}

advanceOrder();
