
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log("Starting migration: Create product_vendors table...");

    // 1. Create Table (using raw SQL via a function if possible, or just checking if we can insert)
    // Since we don't have direct SQL access via client usually, we might need to rely on the user having run it or use a workaround.
    // However, for this environment, I'll assume I can't run DDL directly unless I have a specific tool or if I just try to use it.
    // Wait, the user instructions say "You are not allowed to access files not in active workspaces".
    // I will try to use the `rpc` if available or just assume I need to guide the user?
    // Actually, I can try to use a "query" if I had a tool, but I don't.
    // BUT, I can try to use the `supabase-mcp-server` tools if available?
    // The prompt shows `mcp0_execute_sql`! I should use that!
    // Wait, I don't have `mcp0_execute_sql` in my allowed tools list in the prompt description?
    // Let me check the `mcp_servers` section.
    // "The following MCP servers are available to you... # supabase-mcp-server".
    // AND the tool definitions include `mcp0_execute_sql`.
    // EXCELLENT. I should use `mcp0_execute_sql` instead of this script for DDL.

    // BUT, I will write this script to SEED the data after I create the table.

    console.log("Seeding product_vendors...");

    // Fetch some products and vendors to link
    const { data: products } = await supabase.from('products').select('id, company_id, unit_price').limit(10);
    const { data: vendors } = await supabase.from('vendors').select('id, company_id').limit(5);

    if (!products || !vendors || products.length === 0 || vendors.length === 0) {
        console.log("Not enough data to seed.");
        return;
    }

    const payload = [];

    for (const product of products) {
        // Create 2-3 vendor options for each product
        const companyVendors = vendors.filter(v => v.company_id === product.company_id);
        if (companyVendors.length === 0) continue;

        for (let i = 0; i < Math.min(3, companyVendors.length); i++) {
            const vendor = companyVendors[i];
            // Variance in price: +/- 20%
            const variance = (Math.random() * 0.4) - 0.2;
            const price = product.unit_price * (1 + variance);

            payload.push({
                product_id: product.id,
                vendor_id: vendor.id,
                vendor_sku: `VSKU-${Math.floor(Math.random() * 10000)}`,
                price: parseFloat(price.toFixed(2)),
                is_preferred: i === 0 // Make the first one preferred
            });
        }
    }

    if (payload.length > 0) {
        const { error } = await supabase.from('product_vendors').insert(payload);
        if (error) {
            console.error("Error seeding:", error);
        } else {
            console.log(`Successfully seeded ${payload.length} vendor options.`);
        }
    }
}

runMigration();
