import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables manually
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

// Mapping based on the actual product names in the database
const productsToUpdate = [
    { name: "Ravinte 30 Pack Solid 5 Inch Kitchen Cabinet Handles", imageUrl: "https://m.media-amazon.com/images/I/51fbXyrYHPL._AC_SX679_PIbundle-30,TopRight,0,0_SH20_.jpg" },
    { name: "1x4 LED Flat Panel Light", imageUrl: "https://m.media-amazon.com/images/I/61jSyByUrfL._AC_SX679_PIbundle-6,TopRight,0,0_SH20_.jpg" },
    { name: "Black Kitchen Faucets with Pull Down Sprayer", imageUrl: "https://m.media-amazon.com/images/I/414YY8ISGBL._AC_SX679_.jpg" },
    { name: "Bathroom Faucet", imageUrl: "https://m.media-amazon.com/images/I/61pXtZA45OL._AC_SX679_.jpg" },
    { name: "20x30 Mirror", imageUrl: "https://m.media-amazon.com/images/I/81vmeKKoXOL._AC_SX679_.jpg" },
    { name: "Vanity Light", imageUrl: "https://m.media-amazon.com/images/I/61w5lA8f29L._AC_SX679_.jpg" },
    { name: "Shower Head", imageUrl: "https://m.media-amazon.com/images/I/61EPms1SgPL._AC_SX679_.jpg" },
    { name: "Privacy Door Knobs", imageUrl: "https://m.media-amazon.com/images/I/71G8VA7Be0L._AC_SX679_PIbundle-10,TopRight,0,0_SH20_.jpg" },
    { name: "Cabinet Hinges", imageUrl: "https://m.media-amazon.com/images/I/51cRc6otPZL._AC_SX679_PIbundle-18,TopRight,0,0_SH20_.jpg" },
    { name: "Flush Mount Light", imageUrl: "https://m.media-amazon.com/images/I/614eICa92cL._AC_SX679_.jpg" },
    { name: "3 in. x 6 in. Ceramic Tile", imageUrl: "https://images.thdstatic.com/productImages/2495ce2a-b091-49c2-9692-f3a09e769814/svn/bright-white-daltile-ceramic-tile-re1536modhd1p4-64_100.jpg" },
    { name: "33 in. Drop-in Sink", imageUrl: "https://images.thdstatic.com/productImages/f832730a-27f2-4988-87bc-7910b27b6347/svn/stainless-steel-glacier-bay-drop-in-kitchen-sinks-hddb332284-40_100.jpg" },
    { name: "30x80 Door Slab", imageUrl: "https://images.thdstatic.com/productImages/92040d09-d5d5-4cc9-a12d-002db0974d59/svn/primed-jeld-wen-slab-doors-thdjw136500708-66_100.jpg" },
    { name: "Moldings/Trim", imageUrl: "https://images.thdstatic.com/productImages/3224a228-a07e-408c-87bf-fb0fb0879d21/svn/alexandria-moulding-window-door-kits-l412a-93096pk-64_100.jpg" }
];

async function updateImages() {
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

    console.log(`Starting update for ${productsToUpdate.length} products...`);

    for (const product of productsToUpdate) {
        const { data, error } = await supabase
            .from('products')
            .update({ image_url: product.imageUrl })
            .eq('name', product.name)
            .select();

        if (error) {
            console.error(`Error updating ${product.name}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✓ Updated ${product.name}: Success (${data.length} rows)`);
        } else {
            console.warn(`✗ Product not found: ${product.name}`);
        }
    }
    console.log("\nUpdate complete.");
}

updateImages();
