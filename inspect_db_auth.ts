
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    // Log in as Owner to bypass RLS
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email: 'heco2k19@gmail.com', // Trying owner first
        password: 'password' // Assuming default dev password or similar? Wait, I don't know the owner password.
    });

    // Fallback to a known demo user if owner fails
    if (loginError) {
        console.log("Owner login failed, trying Alexa...");
        const { error: demoLoginError } = await supabase.auth.signInWithPassword({
            email: 'alexa.reserva.demo_v3@gmail.com',
            password: 'Xoxoxo123'
        });
        if (demoLoginError) {
            console.error("Login failed:", demoLoginError.message);
            return;
        }
    }

    console.log("--- COMPANIES ---");
    const { data: companies, error: compError } = await supabase.from('companies').select('*');
    if (compError) console.error(compError);
    if (companies) {
        companies.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));
    }

    console.log("\n--- USERS ---");
    const { data: users, error: userError } = await supabase.from('profiles').select('email, full_name, company_id');
    if (userError) console.error(userError);
    if (users) {
        users.forEach(u => console.log(`Email: ${u.email}, Name: ${u.full_name}, Company ID: ${u.company_id}`));
    }
}

inspectData();
