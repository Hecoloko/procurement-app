
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_USERS = [
    // Company 1 (comp-1)
    { email: 'alexa.reserva.demo_v3@gmail.com', name: 'Alexa Reserva (C1 - Master Admin)', companyId: 'comp-1', roleId: 'role-1' },
    { email: 'miguel.santos.demo_v3@gmail.com', name: 'Miguel Santos (C1 - Basic User)', companyId: 'comp-1', roleId: 'role-2' },
    { email: 'jasmine.torres.demo_v3@gmail.com', name: 'Jasmine Torres (C1 - Basic User)', companyId: 'comp-1', roleId: 'role-2' },
    { email: 'kevin.delacruz.demo_v3@gmail.com', name: 'Kevin Dela Cruz (C1 - Reviewer)', companyId: 'comp-1', roleId: 'role-3' },
    { email: 'ricardo.morales.demo_v3@gmail.com', name: 'Ricardo Morales (C1 - Reviewer)', companyId: 'comp-1', roleId: 'role-3' },
    { email: 'sophia.lim.demo_v3@gmail.com', name: 'Sophia Lim (C1 - Approver)', companyId: 'comp-1', roleId: 'role-4' },
    { email: 'daniel.reyes.demo_v3@gmail.com', name: 'Daniel Reyes (C1 - Approver)', companyId: 'comp-1', roleId: 'role-4' },
    // Company 2 (comp-2)
    { email: 'amelia.cruz.demo_v3@gmail.com', name: 'Amelia Cruz (C2 - Master Admin)', companyId: 'comp-2', roleId: 'role-1' },
    { email: 'noah.velasco.demo_v3@gmail.com', name: 'Noah Velasco (C2 - Basic User)', companyId: 'comp-2', roleId: 'role-2' },
    { email: 'patricia.rojas.demo_v3@gmail.com', name: 'Patricia Rojas (C2 - Basic User)', companyId: 'comp-2', roleId: 'role-2' },
    { email: 'carlos.garcia.demo_v3@gmail.com', name: 'Carlos Garcia (C2 - Reviewer)', companyId: 'comp-2', roleId: 'role-3' },
    { email: 'nicole.uy.demo_v3@gmail.com', name: 'Nicole Uy (C2 - Reviewer)', companyId: 'comp-2', roleId: 'role-3' },
    { email: 'andrew.mendoza.demo_v3@gmail.com', name: 'Andrew Mendoza (C2 - Approver)', companyId: 'comp-2', roleId: 'role-4' },
    { email: 'francesca.rivera.demo_v3@gmail.com', name: 'Francesca Rivera (C2 - Approver)', companyId: 'comp-2', roleId: 'role-4' },
];

const defaultPass = 'Xoxoxo123';

async function fixProfiles() {
    console.log("Starting profile fix...");

    for (const user of DEMO_USERS) {
        console.log(`Processing ${user.email}...`);

        // 1. Sign In to get the User ID (Auth UUID)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: defaultPass
        });

        let userId = signInData.session?.user?.id;

        if (!userId) {
            console.log(`  - User not found in Auth. Creating...`);
            const { data: signUpData } = await supabase.auth.signUp({
                email: user.email,
                password: defaultPass,
                options: { data: { full_name: user.name.split(' (')[0] } }
            });
            userId = signUpData.user?.id;
        }

        if (userId) {
            console.log(`  - Ensuring profile for ${userId} in ${user.companyId}`);

            // 2. Upsert the profile with correct Company ID and Role
            const { error: upsertError } = await supabase.from('profiles').upsert({
                id: userId,
                company_id: user.companyId,
                email: user.email,
                full_name: user.name.split(' (')[0],
                role_id: user.roleId,
                status: 'Active'
            });

            if (upsertError) {
                console.error(`  - Failed to update profile:`, upsertError.message);
            } else {
                console.log(`  - Profile updated successfully.`);
            }
        } else {
            console.error(`  - Could not get User ID for ${user.email}`);
        }
    }

    console.log("Profile fix complete.");
}

fixProfiles();
