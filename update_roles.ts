
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

async function updateRoles() {
    console.log('Fetching roles...');
    const { data: roles, error } = await supabase.from('roles').select('*');

    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }

    if (!roles) {
        console.log('No roles found.');
        return;
    }

    const rolesToUpdate = roles.filter((r: any) => r.name === 'Owner' || r.name === 'Master Admin');

    for (const role of rolesToUpdate) {
        console.log(`Checking role: ${role.name}`);
        let permissions: string[] = role.permissions || [];

        if (!permissions.includes('orders:delete')) {
            console.log(`Adding orders:delete to ${role.name}`);
            permissions.push('orders:delete');

            const { error: updateError } = await supabase
                .from('roles')
                .update({ permissions: permissions })
                .eq('id', role.id);

            if (updateError) {
                console.error(`Error updating role ${role.name}:`, updateError);
            } else {
                console.log(`Successfully updated role ${role.name}`);
            }
        } else {
            console.log(`Role ${role.name} already has orders:delete`);
        }
    }
}

updateRoles();
