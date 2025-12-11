import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Reusing credentials from run_migration_global_products.ts
// Ideally these should be in env vars, but using them here for consistency with previous scripts in this environment
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Starting database migration for billable items fix...');

    const sqlPath = path.join(process.cwd(), 'migrations', '20251211_fix_billable_items_data.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        console.log('Executing SQL...');
        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('❌ Error executing SQL:', error);
            console.log('Attempting to split statements...');
            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            for (const stmt of statements) {
                const { error: stmtError } = await supabase.rpc('exec_sql', { query: stmt });
                if (stmtError) console.error(`❌ Error executing statement: ${stmt.substring(0, 50)}...`, stmtError);
            }
        } else {
            console.log('✅ Migration applied successfully!');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

applyMigration();
