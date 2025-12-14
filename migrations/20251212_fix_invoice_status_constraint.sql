-- Fix Invoice Status Constraint
-- 2025-12-12
-- The original constraint was too restrictive (only allowed pending/paid/failed/refunded).
-- We need to support AR statuses: Draft, Sent, Overdue, Void, etc.

DO $$
BEGIN
    -- Drop the restrictive constraint
    ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

    -- Add the correct constraint
    ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
    CHECK (status IN (
        'Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Void', 'Cancelled', 
        'pending', 'failed', 'refunded', 'succeeded' -- Keep lowercase for legacy compatibility if needed
    ));
END $$;
