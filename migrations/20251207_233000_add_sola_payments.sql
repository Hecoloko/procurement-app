
-- PAYMENT SETTINGS
CREATE TABLE IF NOT EXISTS company_payment_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_label text NOT NULL, -- e.g. "Operating Account", "Reserve Fund"
    sola_xkey text NOT NULL,     -- The Transaction Key (keep secure!)
    sola_ifields_key text NOT NULL, -- The iFields Key (public-ish)
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- INVOICE TYPE MAPPINGS
CREATE TABLE IF NOT EXISTS invoice_type_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_type text NOT NULL, -- e.g. "Maintenance", "Utilities"
    payment_settings_id uuid NOT NULL REFERENCES company_payment_settings(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, invoice_type)
);

-- SAVED PAYMENT METHODS
CREATE TABLE IF NOT EXISTS saved_payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id text,
    payment_settings_id uuid REFERENCES company_payment_settings(id) ON DELETE SET NULL, 
    sola_xtoken text NOT NULL, -- The Vault Token from Sola
    card_last4 text,
    card_brand text,
    exp_month integer,
    exp_year integer,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- ENABLE RLS
ALTER TABLE company_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_type_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON company_payment_settings;
CREATE POLICY "Enable all access for authenticated users" ON company_payment_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON invoice_type_mappings;
CREATE POLICY "Enable all access for authenticated users" ON invoice_type_mappings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON saved_payment_methods;
CREATE POLICY "Enable all access for authenticated users" ON saved_payment_methods FOR ALL USING (auth.role() = 'authenticated');
