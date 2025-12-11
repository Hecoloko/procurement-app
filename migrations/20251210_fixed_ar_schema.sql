-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id TEXT NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    billing_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view customers for their company' AND tablename = 'customers') THEN
        CREATE POLICY "Users can view customers for their company" ON customers
            FOR SELECT
            USING (company_id IN (
                SELECT company_id::text FROM profiles WHERE id = auth.uid()::text
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert customers for their company' AND tablename = 'customers') THEN
        CREATE POLICY "Users can insert customers for their company" ON customers
            FOR INSERT
            WITH CHECK (company_id IN (
                SELECT company_id::text FROM profiles WHERE id = auth.uid()::text
            ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update customers for their company' AND tablename = 'customers') THEN
        CREATE POLICY "Users can update customers for their company" ON customers
            FOR UPDATE
            USING (company_id IN (
                SELECT company_id::text FROM profiles WHERE id = auth.uid()::text
            ));
    END IF;
END $$;

-- Add customer_id to invoices if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN customer_id UUID REFERENCES customers(id);
    ELSE
        -- If column exists, try to add FK constraint if missing
        BEGIN
            ALTER TABLE invoices ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
