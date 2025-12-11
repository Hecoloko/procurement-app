
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Hardcoded from current context/run_migration.ts to ensure it works
const supabaseUrl = 'https://hrlyuobsabqpdafuylgo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHl1b2JzYWJxcGRhZnV5bGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDk1NjMsImV4cCI6MjA3OTA4NTU2M30.Z6HieyAT_sziXm0ZYerHXOv4qKMrSGLNS4Aotxc_p5c';

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
    console.log('🚀 Applying Migration: 20251211_auto_bill_trigger.sql');

    try {
        const migrationPath = path.join(__dirname, 'migrations', '20251211_auto_bill_trigger.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute via RPC
        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            console.error('❌ Migration Failed:', error);
        } else {
            console.log('✅ Migration Applied Successfully!');
            console.log('   - Function: process_paid_invoice_items() created/updated');
            console.log('   - Trigger: on_invoice_paid attached to vendor_invoices');
        }

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
    }
}

applyMigration();
