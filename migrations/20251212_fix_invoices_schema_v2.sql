-- Fix Invoices Schema v2
-- 2025-12-12
-- Adds missing columns expected by the application layer and fixes constraints

DO $$
BEGIN
    -- 1. Add invoice_number if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
    END IF;

    -- 2. Add issue_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'issue_date') THEN
        ALTER TABLE invoices ADD COLUMN issue_date DATE;
    END IF;

    -- 3. Add subtotal if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal') THEN
        ALTER TABLE invoices ADD COLUMN subtotal NUMERIC(15, 2) DEFAULT 0;
    END IF;

    -- 4. Add tax_total if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_total') THEN
        ALTER TABLE invoices ADD COLUMN tax_total NUMERIC(15, 2) DEFAULT 0;
    END IF;

    -- 5. Add notes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'notes') THEN
        ALTER TABLE invoices ADD COLUMN notes TEXT;
    END IF;

    -- 6. Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
        ALTER TABLE invoices ADD COLUMN created_by TEXT;
    END IF;

    -- 7. Handle 'invoice_type' (Make it default to 'Standard' to prevent NOT NULL errors on legacy inserts if any, or just for robustness)
    ALTER TABLE invoices ALTER COLUMN invoice_type SET DEFAULT 'Standard';
    
    -- 8. Ensure 'amount' corresponds to total_amount logic. 
    -- We won't rename valid data columns, but we will ensure the code uses 'amount'.
    -- (No DB change needed for this, strictly code, but good to note)

END $$;
