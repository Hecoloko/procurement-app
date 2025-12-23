import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use same credentials as App.tsx or run_migration.ts
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Running migration: 20251223_add_partially_procured.sql');

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'migrations', '20251223_add_partially_procured.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL:', sql);

    // Using rpc 'exec_sql' if available, otherwise we might need another way.
    // Based on previous files, it seems valid to try rpc first or use the direct client if it allows DDL (usually doesn't via client unless service role, but let's try RPC as seen in run_migration.ts)

    const { error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.error('❌ Migration Error:', error);

        // Fallback: This might fail if the user is anon, but the key provided seems to be what was used in other scripts. 
        // If exec_sql RPC doesn't exist, we might be stuck without a service key, but let's assume it exists as per run_migration.ts
    } else {
        console.log('✅ Migration applied successfully.');
    }
}

runMigration();
