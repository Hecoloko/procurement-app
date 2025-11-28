
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const IMAGE_MAPPINGS = {
    "Ravinte 30 Pack Solid 5 Inch Kitchen Cabinet Handles": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80",
    "Ballpoint Pens (Black)": "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=400&q=80",
    "Ergonomic Chair": "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=400&q=80",
    "Safety Gloves (L)": "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=400&q=80",
    "LED Light Bulb 60W": "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80",
    "Cleaning Spray": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    "Black Kitchen Faucets with Pull Down Sprayer": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=400&q=80",
    "20x30 Mirror": "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=400&q=80",
    "Shower Head": "https://images.unsplash.com/photo-1520170350707-b21e5fca4342?auto=format&fit=crop&w=400&q=80",
    "Cabinet Hinges": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80",
    "3 in. x 6 in. Ceramic Tile": "https://images.unsplash.com/photo-1599692612478-f753a5add1ca?auto=format&fit=crop&w=400&q=80",
    "30x80 Door Slab": "https://images.unsplash.com/photo-1489171078254-c3365d6e359f?auto=format&fit=crop&w=400&q=80",
    "A4 Paper Ream": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
    "33 in. Drop-in Sink": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    "Bathroom Faucet": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=400&q=80",
    "Flush Mount Light": "https://images.unsplash.com/photo-1513506003013-d5347641d3db?auto=format&fit=crop&w=400&q=80",
    "Vanity Light": "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=400&q=80",
    "Moldings/Trim": "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80",
    "Privacy Door Knobs": "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80",
    "27\" 4K Monitor": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80",
    "Wireless Mouse": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=400&q=80",
    "Network Switch 24-Port": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
    "Industrial Shelving": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80",
    "Packing Tape (6 Rolls)": "https://images.unsplash.com/photo-1616401784845-180886ba9ca8?auto=format&fit=crop&w=400&q=80",
    "Barcode Scanner": "https://images.unsplash.com/photo-1591485112902-5b328dd9c49f?auto=format&fit=crop&w=400&q=80",
    "1x4 LED Flat Panel Light": "https://images.unsplash.com/photo-1563302111-eab4b145e6c9?auto=format&fit=crop&w=400&q=80"
};

async function updateImages() {
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Failed to sign in:", authError.message);
        return;
    }

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products. Updating images...`);

    for (const product of products) {
        const newUrl = IMAGE_MAPPINGS[product.name];
        if (newUrl) {
            console.log(`Updating ${product.name}...`);
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: newUrl })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Failed to update ${product.name}:`, updateError.message);
            }
        } else {
            console.log(`No mapping for ${product.name}, skipping.`);
        }
    }

    console.log("Update complete.");
}

updateImages();
