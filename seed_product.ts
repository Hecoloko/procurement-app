
import { createClient } from '@supabase/supabase-js';

// Hardcoded for this script execution context
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProduct() {
    console.log("Seeding product for Company 1...");

    // 0. Authenticate as Admin
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Auth failed:", authError.message);
        return;
    }
    console.log("Authenticated as Alexa (Admin)");

    // 1. Get Company 1 ID
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'Company 1')
        .single();

    if (companyError || !companies) {
        console.error("Could not find Company 1:", companyError);
        // Fallback to 'comp-1' if name lookup fails (assuming mock IDs)
    }

    const companyId = companies?.id || 'comp-1';
    console.log(`Using Company ID: ${companyId}`);

    // 2. Insert Product
    const { data, error } = await supabase
        .from('products')
        .insert({
            id: crypto.randomUUID(),
            company_id: companyId,
            sku: 'COFFEE-001',
            name: 'Gourmet Coffee Beans',
            description: 'Premium Arabica beans, 1kg',
            unit_price: 25.00,
            primary_category: 'Kitchen & Breakroom',
            secondary_category: 'Beverages',
            image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=200&h=200'
        })
        .select();

    if (error) {
        console.error("Error seeding product:", error.message);
    } else {
        console.log("Product seeded successfully:", data);
    }
}

seedProduct();
