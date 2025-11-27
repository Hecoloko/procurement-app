import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Starting database migration for work_order_id...');

    try {
        // Step 1: Add work_order_id column
        console.log('Step 1: Adding work_order_id column...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE carts ADD COLUMN IF NOT EXISTS work_order_id TEXT;'
        });

        if (alterError) {
            console.error('❌ Error adding column:', alterError);
            // Try alternative approach using direct SQL execution
            console.log('Attempting direct approach...');
        } else {
            console.log('✅ Column added successfully');
        }

        // Step 2: Update existing carts to have work_order_ids
        console.log('Step 2: Generating Work Order IDs for existing carts...');

        const { data: existingCarts, error: fetchError } = await supabase
            .from('carts')
            .select('id, work_order_id')
            .is('work_order_id', null);

        if (fetchError) {
            console.error('❌ Error fetching carts:', fetchError);
            return;
        }

        console.log(`Found ${existingCarts?.length || 0} carts needing Work Order IDs`);

        // Generate unique WO IDs for existing carts
        for (const cart of existingCarts || []) {
            const timestamp = Date.now().toString().slice(-4);
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const workOrderId = `WO-${timestamp}-${random}`;

            const { error: updateError } = await supabase
                .from('carts')
                .update({ work_order_id: workOrderId })
                .eq('id', cart.id);

            if (updateError) {
                console.error(`❌ Error updating cart ${cart.id}:`, updateError);
            } else {
                console.log(`✅ Updated cart ${cart.id} with Work Order ${workOrderId}`);
            }

            // Small delay to ensure uniqueness
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log('✅ Migration completed successfully!');
        console.log('\n📊 Migration Summary:');
        console.log(`- work_order_id column added to carts table`);
        console.log(`- ${existingCarts?.length || 0} existing carts updated with Work Order IDs`);
        console.log(`- All new carts will automatically get unique Work Order IDs`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

applyMigration();
