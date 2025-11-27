
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    console.log("Checking row counts with Auth...");

    // Login as Alexa (Company 1)
    await supabase.auth.signInWithPassword({ email: 'alexa.reserva.demo_v3@gmail.com', password: 'Xoxoxo123' });

    const tables = ['products', 'messages', 'carts', 'orders', 'cart_items'];

    console.log("--- Company 1 (Alexa) ---");
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.error(`Error counting ${table}:`, error.message);
        else console.log(`${table}: ${count}`);
    }

    await supabase.auth.signOut();

    // Login as Amelia (Company 2)
    await supabase.auth.signInWithPassword({ email: 'amelia.cruz.demo_v3@gmail.com', password: 'Xoxoxo123' });

    console.log("\n--- Company 2 (Amelia) ---");
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) console.error(`Error counting ${table}:`, error.message);
        else console.log(`${table}: ${count}`);
    }
}

checkCounts();
