-- Add property_id and unit_id to invoices table
-- 2025-12-12
-- Supports invoicing Properties/Units directly (instead of just Customers)

DO $$
BEGIN
    -- Add property_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'property_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN property_id TEXT REFERENCES properties(id);
    END IF;

    -- Add unit_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN unit_id TEXT; -- Assuming unit_id is TEXT like property_id usually is in this codebase
    END IF;

    -- Ensure customer_id is NULLABLE (just in case it was set to NOT NULL previously)
    ALTER TABLE invoices ALTER COLUMN customer_id DROP NOT NULL;

END $$;
