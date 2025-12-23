-- Add 'Partially Procured' to order_status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        RAISE EXCEPTION 'Type order_status does not exist';
    END IF;

    ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'Partially Procured' AFTER 'Approved';
END $$;
