
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking tables...");

    // Check payment settings columns
    const { data: settings, error: settingsError } = await supabase.from('company_payment_settings').select('*').limit(1);
    if (settings && settings.length > 0) console.log("Settings Keys:", Object.keys(settings[0]));
    else if (settingsError) console.log("Settings Error:", settingsError.message);
    else console.log("No settings rows found, cannot check keys easily without permissions.");
}

checkSchema();
