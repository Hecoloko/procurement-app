
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
let env: Record<string, string> = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listRoles() {
    console.log('Fetching roles...');
    const { data: roles, error } = await supabase.from('roles').select('*');

    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }

    if (!roles || roles.length === 0) {
        console.log('No roles found.');
        return;
    }

    console.log(`Found ${roles.length} roles:`);
    roles.forEach((r: any) => console.log(`- ${r.name} (ID: ${r.id})`));
}

listRoles();
