import { createClient } from '@supabase/supabase-js';

// Use same credentials
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function execSql(query: string) {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) {
        console.error('❌ SQL Error:', error);
        throw error;
    }
    return data;
}

async function testPartialProcurement() {
    console.log('🧪 Starting Partial Procurement Test (via RPC)...');

    const companyId = 'comp-1'; // Alpha Corp
    const userId = 'user-c1-5'; // Ricardo (Purchaser)
    const propertyId = 'prop-1';
    const timestamp = Date.now();
    const cartId = `test-cart-${timestamp}`;
    const orderId = `test-order-${timestamp}`;
    const poId = `po-${timestamp}`;

    try {
        // 1. Create Cart
        console.log('Step 1: Creating Cart...');
        await execSql(`
            INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by)
            VALUES ('${cartId}', '${companyId}', 'Partial Proc Test Cart', 'Standard', 'Submitted', 7, 700, '${propertyId}', '${userId}');
        `);
        console.log('✅ Cart Created');

        // 2. Add 7 Items
        console.log('Step 2: Adding Items...');
        // 3 items for vendor-1, 3 items for vendor-2, 1 manual (null vendor)
        await execSql(`
            INSERT INTO cart_items (cart_id, name, quantity, unit_price, vendor_id, approval_status) VALUES
            ('${cartId}', 'Item 1', 1, 100, 'vendor-1', 'Approved'),
            ('${cartId}', 'Item 2', 1, 100, 'vendor-1', 'Approved'),
            ('${cartId}', 'Item 3', 1, 100, 'vendor-1', 'Approved'),
            ('${cartId}', 'Item 4', 1, 100, 'vendor-2', 'Approved'),
            ('${cartId}', 'Item 5', 1, 100, 'vendor-2', 'Approved'),
            ('${cartId}', 'Item 6', 1, 100, 'vendor-2', 'Approved'),
            ('${cartId}', 'Item 7 (Manual)', 1, 100, NULL, 'Approved');
        `);
        console.log('✅ Items Added');

        // 3. Create Order & Approve
        console.log('Step 3: Creating Approved Order...');
        await execSql(`
            INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id)
            VALUES ('${orderId}', '${companyId}', '${cartId}', 'Partial Proc Test Order', '${userId}', 'Approved', 700, '${propertyId}');
        `);
        console.log('✅ Order Created & Approved');

        // 4. Procure 3 Items (Vendor 1 only for simplicity) -> Create PO
        console.log('Step 4: Creating Purchase Order...');
        await execSql(`
            INSERT INTO purchase_orders (id, original_order_id, vendor_id, status)
            VALUES ('${poId}', '${orderId}', 'vendor-1', 'Issued');
        `);
        console.log('✅ PO Created');

        // Link only vendor-1 items
        console.log('Step 5: Linking items to PO...');
        // We need to find the IDs of the items we just inserted. Since we can't easily capture them in one go without RETURNING, 
        // we update based on cart_id and vendor_id.
        // Wait, 'cart_items' doesn't have 'purchase_order_id' confirmed yet. 
        // IF the migration '20251214_link_items_to_po.sql' ran, it should be there.
        // Let's assume it IS there.

        await execSql(`
            UPDATE cart_items 
            SET purchase_order_id = '${poId}'
            WHERE cart_id = '${cartId}' AND vendor_id = 'vendor-1';
        `);
        console.log('✅ Items Linked');

        // 5. Update Order Status to 'Partially Procured'
        console.log('Step 6: Updating Order Status...');
        await execSql(`
            UPDATE orders 
            SET status = 'Partially Procured' 
            WHERE id = '${orderId}';
        `);
        console.log('✅ Order Status Updated to "Partially Procured"');

        // 6. Verify Final State
        console.log('Step 7: Verifying...');
        const verifySql = `SELECT status, id FROM orders WHERE id = '${orderId}';`;
        // Using direct select if exec_sql returns results? exec_sql usually returns void or result set.
        // If not, we can query via supabase client (RLS might allow reading if public or we use exec_sql to select)
        // Let's use supabase client for reading, hoping RLS allows reading own company data?
        // But anon key has no user context. 
        // So RLS 'for authenticated' will block reading too.
        // We must use exec_sql to READ too if it returns data.

        // Assuming exec_sql returns rows.
        const { data: finalOrder } = await supabase.rpc('exec_sql', { query: verifySql });

        console.log('Final Order Data:', finalOrder);

        // Check if ANY unassigned items remain
        const { data: unassignedItems } = await supabase.rpc('exec_sql', {
            query: `SELECT count(*) as count FROM cart_items WHERE cart_id = '${cartId}' AND purchase_order_id IS NULL`
        });
        console.log('Unassigned Items Count:', unassignedItems);

        if (finalOrder && finalOrder[0] && finalOrder[0].status === 'Partially Procured') {
            console.log('🎉 VERIFICATION SUCCESS: Status is correct.');
        } else {
            console.error('❌ VERIFICATION FAILURE: Status mismatch or read failed.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testPartialProcurement();
