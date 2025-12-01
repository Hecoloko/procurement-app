
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log("--- COMPANIES ---");
    const { data: companies } = await supabase.from('companies').select('*');
    if (companies) {
        companies.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));
    } else {
        console.log("No companies found or error.");
    }

    console.log("\n--- USERS ---");
    const { data: users } = await supabase.from('profiles').select('email, full_name, company_id');
    if (users) {
        users.forEach(u => console.log(`Email: ${u.email}, Name: ${u.full_name}, Company ID: ${u.company_id}`));
    } else {
        console.log("No users found or error.");
    }

    console.log("\n--- VENDORS ---");
    const { data: vendors } = await supabase.from('vendors').select('id, name, company_id');
    if (vendors) {
        vendors.forEach(v => console.log(`ID: ${v.id}, Name: ${v.name}, Company ID: ${v.company_id}`));
    } else {
        console.log("No vendors found or error.");
    }
}

inspectData();
