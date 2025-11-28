import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
    // Sign in to bypass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Failed to sign in:", authError.message);
        console.log("Attempting to proceed anonymously...");
    } else {
        console.log("Signed in successfully.\n");
    }

    // First, get total count
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error counting products:', countError);
    } else {
        console.log(`Total products in database: ${count}`);
    }

    // Then get first 50 products with details
    const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, company_id, image_url')
        .limit(50);

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log(`\nFound ${data.length} products (showing first 50):`);
        data.forEach(p => {
            console.log(`Name: "${p.name}" | SKU: "${p.sku}" | Company: ${p.company_id} | Image: ${p.image_url?.substring(0, 50)}...`);
        });
    }
}

listProducts();
