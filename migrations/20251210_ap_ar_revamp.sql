-- AP / AR REVAMP MIGRATION
-- Adds Banking Details to Vendors
-- Adds Payment Tracking to Invoices
-- Adds Markup Logic to Invoice Items

-- 1. ACCOUNTS PAYABLE UPDATES (Vendors)
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS routing_number text,
ADD COLUMN IF NOT EXISTS swift_code text,
ADD COLUMN IF NOT EXISTS payment_preference text CHECK (payment_preference IN ('bank_transfer', 'cheque', 'qr'));

-- 2. ACCOUNTS RECEIVABLE UPDATES

-- 2.1 Invoices Table Updates
-- Enum update not easily doable if type already exists and used, but we can just use text or check constraint if adding new statuses. 
-- Existing ENUM: 'Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'
-- Requested ENUM: 'draft', 'sent', 'paid', 'overdue', 'void' (lowercase/slightly diff)
-- We will stick to the existing PascalCase ENUM to avoid breaking existing data/code, but ensure 'Void' is available if needed.
-- Or just reuse 'Cancelled'. Let's stick to existing + 'Void' if needed.
ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'Void';

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_date timestamptz,
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- 2.2 Invoice Items Updates (Markup Logic)
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS cost_price numeric(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_percentage numeric(5, 2) DEFAULT 20.00; -- Default 20%
