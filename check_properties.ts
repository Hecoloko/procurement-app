import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
const envConfig: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProperties() {
    // Sign in to bypass RLS
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'alexa.reserva.demo_v3@gmail.com',
        password: 'Xoxoxo123'
    });

    if (authError) {
        console.error("Failed to sign in:", authError.message);
    } else {
        console.log("Signed in successfully.\n");
    }

    // Get all companies
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name');

    if (compError) {
        console.error('Error fetching companies:', compError);
        return;
    }

    console.log('Companies:');
    companies?.forEach(c => console.log(`  ${c.id}: ${c.name}`));

    // Get all properties (without user_ids)
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, name, company_id, address');

    if (propError) {
        console.error('\nError fetching properties:', propError);
    } else {
        console.log(`\nTotal properties: ${properties.length}`);
        console.log('\nProperties by company:');
        companies?.forEach(company => {
            const compProps = properties.filter(p => p.company_id === company.id);
            console.log(`\n${company.name} (${company.id}): ${compProps.length} properties`);
            compProps.forEach(p => {
                console.log(`  - ${p.name} (${p.id})`);
            });
        });
    }
}

checkProperties();
