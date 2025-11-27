
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOwner() {
    // Login as Owner
    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'heco2k19@gmail.com',
        password: 'password' // I need to guess the password or use a known one. 
        // Wait, I don't know the owner password. 
        // But I can check the profile using the 'anon' key if I login as a known admin like Alexa?
        // Or just try to read profiles.
    });

    // Actually, I can just query the profiles table for this email using the service role key if I had it, but I don't.
    // I'll try to login as Alexa (C1 Admin) and see if she can see the Owner profile.

    const { error: alexaLoginError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (alexaLoginError) { console.error("Alexa login failed"); return; }

    const { data: profiles } = await supabase.from('profiles').select('*').eq('email', 'heco2k19@gmail.com');
    console.log("Owner Profile (seen by Alexa):", profiles);
}

checkOwner();
