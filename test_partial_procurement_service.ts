import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim()];
        })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPartialProcurement() {
    console.log('🧪 Starting Partial Procurement Test (Service Key Mode)...');

    try {
        // 0. Fetch Valid User/Company
        const { data: profile } = await supabase.from('profiles').select('id, company_id').limit(1).single();

        if (!profile) {
            console.error('❌ No profiles found in DB to test with.');
            return;
        }

        const userId = profile.id;
        const companyId = profile.company_id || 'comp-1';
        const propertyId = 'prop-1'; // Assuming this exists or is not FK checked? Let's hope.

        console.log(`Using User: ${userId}, Company: ${companyId}`);

        const timestamp = Date.now();
        const cartId = `test-cart-${timestamp}`;
        const orderId = `test-order-${timestamp}`;
        const poId = `po-${timestamp}`;

        // 1. Create Cart
        console.log('Step 1: Creating Cart...');
        const { error: cartError } = await supabase.from('carts').insert({
            id: cartId,
            company_id: companyId,
            name: 'Partial Proc Test Cart',
            type: 'Standard',
            status: 'Submitted',
            item_count: 7,
            total_cost: 700,
            property_id: propertyId,
            created_by: userId
        });
        if (cartError) throw cartError;
        console.log('✅ Cart Created');

        // 2. Add 7 Items
        console.log('Step 2: Adding Items...');
        // 3 items for vendor-1, 3 items for vendor-2, 1 manual (null vendor)
        const items = [
            { cart_id: cartId, name: 'Item 1', quantity: 1, unit_price: 100, vendor_id: 'vendor-1', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 2', quantity: 1, unit_price: 100, vendor_id: 'vendor-1', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 3', quantity: 1, unit_price: 100, vendor_id: 'vendor-1', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 4', quantity: 1, unit_price: 100, vendor_id: 'vendor-2', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 5', quantity: 1, unit_price: 100, vendor_id: 'vendor-2', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 6', quantity: 1, unit_price: 100, vendor_id: 'vendor-2', approval_status: 'Approved' },
            { cart_id: cartId, name: 'Item 7 (Manual)', quantity: 1, unit_price: 100, vendor_id: null, approval_status: 'Approved' }
        ];
        const { error: itemsError } = await supabase.from('cart_items').insert(items);
        if (itemsError) throw itemsError;
        console.log('✅ Items Added');

        // 3. Create Order & Approve
        console.log('Step 3: Creating Approved Order...');
        const { error: orderError } = await supabase.from('orders').insert({
            id: orderId,
            company_id: companyId,
            cart_id: cartId,
            cart_name: 'Partial Proc Test Order',
            submitted_by: userId,
            status: 'Approved',
            total_cost: 700,
            property_id: propertyId
        });
        if (orderError) throw orderError;
        console.log('✅ Order Created & Approved');

        // 4. Procure 3 Items (Vendor 1 only) -> Create PO
        console.log('Step 4: Creating Purchase Order...');
        const { error: poError } = await supabase.from('purchase_orders').insert({
            id: poId,
            original_order_id: orderId,
            vendor_id: 'vendor-1',
            status: 'Issued'
        });
        if (poError) throw poError;
        console.log('✅ PO Created');

        // Link only vendor-1 items
        console.log('Step 5: Linking items to PO...');
        const { error: linkError } = await supabase.from('cart_items')
            .update({ purchase_order_id: poId } as any)
            .eq('cart_id', cartId)
            .eq('vendor_id', 'vendor-1');
        if (linkError) throw linkError;
        console.log('✅ Items Linked');

        // 5. Update Order Status to 'Partially Procured'
        console.log('Step 6: Updating Order Status to "Partially Procured"...');
        const { error: updateError } = await supabase.from('orders')
            .update({ status: 'Partially Procured' } as any)
            .eq('id', orderId);

        if (updateError) {
            console.error('❌ Update Status Failed. This likely means the migration script was NOT run manually.');
            console.error('Error Details:', updateError);
        } else {
            console.log('✅ Order Status Updated to "Partially Procured"');
            console.log('🎉 SUCCESS: The "Partially Procured" status is valid and working!');
        }

    } catch (e: any) {
        console.error('❌ Test Failed:', e);
        if (e.code === '23503') {
            console.error('DEBUG FK Error: Check if propertyId (prop-1) or other FKs exist.');
        }
    }
}

testPartialProcurement();
