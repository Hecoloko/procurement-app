
import { createClient } from '@supabase/supabase-js';

// Hardcoded for this script execution context
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_USERS = [
    // Company 1
    { email: 'alexa.reserva.demo_v3@gmail.com', name: 'Alexa Reserva (C1 - Master Admin)', company: 'Company 1' },
    { email: 'miguel.santos.demo_v3@gmail.com', name: 'Miguel Santos (C1 - Basic User)', company: 'Company 1' },
    { email: 'jasmine.torres.demo_v3@gmail.com', name: 'Jasmine Torres (C1 - Basic User)', company: 'Company 1' },
    { email: 'kevin.delacruz.demo_v3@gmail.com', name: 'Kevin Dela Cruz (C1 - Reviewer)', company: 'Company 1' },
    { email: 'ricardo.morales.demo_v3@gmail.com', name: 'Ricardo Morales (C1 - Reviewer)', company: 'Company 1' },
    { email: 'sophia.lim.demo_v3@gmail.com', name: 'Sophia Lim (C1 - Approver)', company: 'Company 1' },
    { email: 'daniel.reyes.demo_v3@gmail.com', name: 'Daniel Reyes (C1 - Approver)', company: 'Company 1' },
    // Company 2
    { email: 'amelia.cruz.demo_v3@gmail.com', name: 'Amelia Cruz (C2 - Master Admin)', company: 'Company 2' },
    { email: 'noah.velasco.demo_v3@gmail.com', name: 'Noah Velasco (C2 - Basic User)', company: 'Company 2' },
    { email: 'patricia.rojas.demo_v3@gmail.com', name: 'Patricia Rojas (C2 - Basic User)', company: 'Company 2' },
    { email: 'carlos.garcia.demo_v3@gmail.com', name: 'Carlos Garcia (C2 - Reviewer)', company: 'Company 2' },
    { email: 'nicole.uy.demo_v3@gmail.com', name: 'Nicole Uy (C2 - Reviewer)', company: 'Company 2' },
    { email: 'andrew.mendoza.demo_v3@gmail.com', name: 'Andrew Mendoza (C2 - Approver)', company: 'Company 2' },
    { email: 'francesca.rivera.demo_v3@gmail.com', name: 'Francesca Rivera (C2 - Approver)', company: 'Company 2' },
];

const defaultPass = 'Xoxoxo123';

async function seedUsers() {
    console.log("Starting user seed...");

    for (const user of DEMO_USERS) {
        console.log(`Processing ${user.email}...`);

        // 1. Try to Sign In
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: defaultPass
        });

        if (signInData.session) {
            console.log(`  - User already exists and logged in.`);
            // Optional: Update profile if needed, but we can't easily do that with anon key unless RLS allows update-own
            continue;
        }

        // 2. If Sign In fails, Try to Sign Up
        console.log(`  - User not found (or wrong pass). Attempting to Sign Up...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: user.email,
            password: defaultPass,
            options: {
                data: {
                    full_name: user.name.split(' (')[0]
                }
            }
        });

        if (signUpError) {
            console.error(`  - Failed to sign up ${user.email}:`, signUpError.message);
        } else if (signUpData.user) {
            console.log(`  - Successfully created user: ${signUpData.user.id}`);
        } else {
            console.log(`  - Sign up response but no user?`, signUpData);
        }
    }

    console.log("User seed complete.");
}

seedUsers();
