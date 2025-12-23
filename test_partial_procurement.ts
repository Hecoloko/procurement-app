import { createClient } from '@supabase/supabase-js';

// Use same credentials
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPartialProcurement() {
    console.log('🧪 Starting Partial Procurement Test...');

    // 1. Setup Test Data
    const companyId = 'comp-1'; // Alpha Corp
    const userId = 'user-c1-5'; // Ricardo (Purchaser)
    const propertyId = 'prop-1';

    // Create Cart
    const cartId = `test-cart-${Date.now()}`;
    const cartPayload = {
        id: cartId,
        company_id: companyId,
        name: 'Partial Proc Test Cart',
        type: 'Standard',
        status: 'Submitted',
        item_count: 7,
        total_cost: 700,
        property_id: propertyId,
        created_by: userId
    };

    const { error: cartError } = await supabase.from('carts').insert(cartPayload);
    if (cartError) return console.error('❌ Cart Creation Failed:', cartError);
    console.log('✅ Cart Created:', cartId);

    // Add 7 Items
    const items = [];
    for (let i = 1; i <= 7; i++) {
        items.push({
            cart_id: cartId,
            name: `Item ${i}`,
            quantity: 1,
            unit_price: 100,
            vendor_id: i <= 6 ? (i % 2 === 0 ? 'vendor-1' : 'vendor-2') : null, // 1 manual item (7)
            approval_status: 'Approved'
        });
    }
    const { error: itemsError } = await supabase.from('cart_items').insert(items);
    if (itemsError) return console.error('❌ Items Creation Failed:', itemsError);
    console.log('✅ 7 Items Added (1 Manual)');

    // 2. Convert to Order
    const orderId = `test-order-${Date.now()}`;
    const orderPayload = {
        id: orderId,
        company_id: companyId,
        cart_id: cartId,
        cart_name: 'Partial Proc Test Order',
        submitted_by: userId,
        status: 'Approved', // Start as Approved
        total_cost: 700,
        property_id: propertyId
    };
    const { error: orderError } = await supabase.from('orders').insert(orderPayload);
    if (orderError) return console.error('❌ Order Creation Failed:', orderError);
    console.log('✅ Order Created & Approved:', orderId);

    // 3. Procure 3 Items (Partial)
    // Fetch items to get IDs
    const { data: dbItems } = await supabase.from('cart_items').select('id, name, vendor_id').eq('cart_id', cartId);
    if (!dbItems) return console.error('❌ Failed to fetch items');

    const itemsToProcure = dbItems.slice(0, 3); // Pick first 3
    const poItems = itemsToProcure.map(i => ({
        ...i,
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100
    }));

    const poId = `po-${Date.now()}`;
    const poPayload = {
        id: poId,
        original_order_id: orderId,
        vendor_id: 'vendor-1', // Assuming compatible vendor
        status: 'Issued'
    };

    // We can't insert complex JSON into 'items' column of PO because schema calls for 'items' logic to be separate or JSON?
    // Wait, let's check schema. PurchaseOrder table doesn't have 'items' column?
    // Schema says: 
    // CREATE TABLE purchase_orders ( ... );
    // And cart_items has purchase_order_id? NO, schema doesn't show `purchase_order_id` in `cart_items` table definition in Step 31.
    // Wait, Step 31 shows `cart_items` table:
    // CREATE TABLE cart_items ( ... approval_status ... );
    // DOES NOT HAVE purchase_order_id!

    // BUT `types.ts` has `purchaseOrderId?: string;`
    // And `migrations/20251214_link_items_to_po.sql` might have added it.

    // Let's verify if `purchase_order_id` exists in `cart_items` using `inspect_db`.
    // Or just look at `run_migration.ts` or `supabase_schema.md` better.
    // `supabase_schema.md` shows:
    /*
    175: CREATE TABLE cart_items (
    ...
    186:   created_at timestamptz DEFAULT now()
    187: );
    */
    // It is MISSING purchase_order_id in that create block. However, there might be a migration file I missed or it was added later? 
    // Step 37 shows `20251214_link_items_to_po.sql` size 230 bytes. That likely adds the column.

    // So I should try to update `cart_items` with `purchase_order_id`.

    const { error: poError } = await supabase.from('purchase_orders').insert(poPayload);
    if (poError) return console.error('❌ PO Creation Failed:', poError);
    console.log('✅ PO Created:', poId);

    // Link items to PO
    const itemIds = itemsToProcure.map(i => i.id);
    const { error: linkError } = await supabase.from('cart_items')
        .update({ purchase_order_id: poId } as any) // Cast to any if TS complains, but runtime is fine
        .in('id', itemIds);

    if (linkError) return console.error('❌ Linking Items Failed (Maybe column missing?):', linkError);
    console.log('✅ Items Linked to PO');

    // 4. Update Order Status to 'Partially Procured'
    const { error: updateError } = await supabase.from('orders')
        .update({ status: 'Partially Procured' } as any)
        .eq('id', orderId);

    if (updateError) return console.error('❌ Update Status Failed:', updateError);
    console.log('✅ Order Status Updated to "Partially Procured"');

    // 5. Verification
    const { data: finalOrder } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (finalOrder.status === 'Partially Procured') {
        console.log('🎉 SUCCESS: Order is Partially Procured!');
    } else {
        console.error('❌ FAILURE: Order status is', finalOrder.status);
    }
}

testPartialProcurement();
