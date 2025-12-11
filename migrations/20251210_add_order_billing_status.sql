-- Migration: Add billing tracking to orders
-- Description: Adds a status to track if an order has been billed to the property, and links it to an invoice.

-- 1. Create billing_status enum if it doesn't exist (simulated via text check constraint or just text)
-- keeping it simple with text for now to avoid type issues, but logically it's an enum.

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billing_status text DEFAULT 'Unbilled' CHECK (billing_status IN ('Unbilled', 'Partially Billed', 'Billed')),
ADD COLUMN IF NOT EXISTS invoice_id text REFERENCES invoices(id) ON DELETE SET NULL;

-- 2. Index for faster lookup of unbilled orders
CREATE INDEX IF NOT EXISTS idx_orders_billing_status_property ON orders(company_id, property_id, billing_status);

-- 3. (Optional) We might want to store the markup applied at the order level for audit, 
-- but usually that's better on the invoice item. 
-- However, let's add a jsonb column for flexible billing events history if needed later.
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS billing_history jsonb DEFAULT '[]'::jsonb;
