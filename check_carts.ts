
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCarts() {
    console.log("Listing all carts (Admin view)...");
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    const { data: carts, error } = await supabase
        .from('carts')
        .select('id, name, status, type, created_at')
        // .eq('company_id', 'comp-1') // Commented out to see everything just in case
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error("Error:", error);
    else console.log("Carts:", carts);
}

listCarts();
