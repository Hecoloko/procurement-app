
import { createClient } from '@supabase/supabase-js';

// Hardcoded for this script execution context
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUsers() {
    console.log("Starting user fix...");

    // 1. Get the target company ID (we'll use 'comp-1' as the default main company)
    const targetCompanyId = 'comp-1';

    // 2. Fetch all profiles
    const { data: profiles, error } = await supabase.from('profiles').select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Found ${profiles.length} profiles.`);

    // 3. Update all profiles to have company_id = 'comp-1'
    for (const profile of profiles) {
        if (profile.company_id !== targetCompanyId) {
            console.log(`Updating user ${profile.email} (${profile.full_name}) from ${profile.company_id} to ${targetCompanyId}`);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ company_id: targetCompanyId })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Failed to update ${profile.email}:`, updateError);
            } else {
                console.log(`Successfully updated ${profile.email}`);
            }
        } else {
            console.log(`User ${profile.email} is already in correct company.`);
        }
    }

    console.log("User fix complete.");
}

fixUsers();
