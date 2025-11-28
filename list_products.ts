
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vjscubdmojfPdmw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqc2N1YmRtb2pmZGRtdyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE1MzQ1NjY4LCJleHAiOjIwMzA5MjE2Njh9.3_7_2_1_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0_0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, company_id, image_url')
        .order('company_id');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(JSON.stringify(products, null, 2));
}

listProducts();
