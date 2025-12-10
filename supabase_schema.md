
-- 1. RESET SCHEMA (Drop existing tables to fix type errors and ensure clean slate)
DROP TABLE IF EXISTS notification_settings CASCADE;
DROP TABLE IF EXISTS approval_rules CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS communication_threads CASCADE;
DROP TABLE IF EXISTS po_status_history CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS vendor_accounts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS saved_payment_methods CASCADE;
DROP TABLE IF EXISTS invoice_type_mappings CASCADE;
DROP TABLE IF EXISTS company_payment_settings CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Drop triggers and functions to ensure clean slate for Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop types to ensure clean slate
DROP TYPE IF EXISTS po_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS item_approval_status CASCADE;
DROP TYPE IF EXISTS recurring_frequency CASCADE;
DROP TYPE IF EXISTS cart_status CASCADE;
DROP TYPE IF EXISTS cart_type CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

-- 2. CREATE TYPES
CREATE TYPE user_status AS ENUM ('Active', 'Inactive');
CREATE TYPE cart_type AS ENUM ('Standard', 'Recurring', 'Scheduled');
CREATE TYPE cart_status AS ENUM ('Draft', 'Ready for Review', 'Submitted');
CREATE TYPE recurring_frequency AS ENUM ('Weekly', 'Bi-weekly', 'Monthly', 'Quarterly');
CREATE TYPE item_approval_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE order_status AS ENUM (
  'Draft', 'Ready for Review', 'Submitted', 'Pending My Approval', 'Pending Others',
  'Approved', 'Needs Revision', 'Rejected', 'Processing', 'Shipped', 'Completed'
);
CREATE TYPE po_status AS ENUM ('Issued', 'Purchased', 'In Transit', 'Received');

-- 3. CREATE TABLES

-- COMPANIES
CREATE TABLE companies (
    id text PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ROLES
CREATE TABLE roles (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  permissions text[],
  created_at timestamptz DEFAULT now()
);

-- PROFILES
CREATE TABLE profiles (
  id text PRIMARY KEY,
  company_id text REFERENCES companies(id),
  full_name text,
  email text,
  role_id text REFERENCES roles(id),
  avatar_url text,
  status user_status DEFAULT 'Active',
  property_ids text[],
  created_at timestamptz DEFAULT now()
);

-- PROPERTIES
CREATE TABLE properties (
    id text PRIMARY KEY,
    company_id text NOT NULL REFERENCES companies(id),
    name text NOT NULL,
    address jsonb,
    created_at timestamptz DEFAULT now()
);

-- UNITS
CREATE TABLE units (
    id text PRIMARY KEY,
    property_id text NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- VENDORS
CREATE TABLE vendors (
    id text PRIMARY KEY,
    company_id text REFERENCES companies(id),
    name text NOT NULL,
    phone text,
    email text,
    created_at timestamptz DEFAULT now()
);

-- VENDOR ACCOUNTS
CREATE TABLE vendor_accounts (
    id text PRIMARY KEY,
    vendor_id text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    property_id text NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    account_number text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- PRODUCTS
CREATE TABLE products (
  id text PRIMARY KEY,
  company_id text REFERENCES companies(id),
  name text NOT NULL,
  sku text,
  description text,
  unit_price numeric(10, 2) NOT NULL,
  image_url text,
  vendor_id text REFERENCES vendors(id) ON DELETE SET NULL,
  primary_category text,
  secondary_category text,
  rating numeric(2,1),
  tags text[],
  global_product_id text REFERENCES global_products(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- GLOBAL PRODUCTS
CREATE TABLE global_products (
    id text PRIMARY KEY,
    name text NOT NULL,
    sku text,
    description text,
    unit_price numeric(10, 2) NOT NULL,
    image_url text,
    category text,
    provider text,
    specs jsonb,
    created_at timestamptz DEFAULT now()
);

-- CARTS
-- CRITICAL: ON UPDATE CASCADE required for Demo User Account claiming logic
CREATE TABLE carts (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id),
  name text NOT NULL,
  type cart_type NOT NULL DEFAULT 'Standard',
  status cart_status NOT NULL DEFAULT 'Draft',
  item_count integer DEFAULT 0,
  total_cost numeric(10, 2) DEFAULT 0,
  property_id text REFERENCES properties(id),
  created_by text REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL, 
  
  category text,
  scheduled_date date,
  frequency recurring_frequency,
  start_date date,
  day_of_week integer,
  day_of_month integer,
  last_run_at timestamptz, 
  
  last_modified timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- CART ITEMS
CREATE TABLE cart_items (
  id text PRIMARY KEY DEFAULT 'item-' || gen_random_uuid()::text,
  cart_id text NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  quantity integer NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  note text,
  approval_status item_approval_status DEFAULT 'Pending',
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- COMMUNICATION THREADS
CREATE TABLE communication_threads (
  id text PRIMARY KEY,
  company_id text REFERENCES companies(id),
  subject text,
  order_id text,
  participant_ids text[], -- Array of profile IDs
  last_message_at timestamptz DEFAULT now(),
  last_message_snippet text,
  is_read boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ORDERS
-- CRITICAL: ON UPDATE CASCADE required for Demo User Account claiming logic
CREATE TABLE orders (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id),
  cart_id text REFERENCES carts(id),
  cart_name text,
  submitted_by text REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  submission_date date DEFAULT CURRENT_DATE,
  total_cost numeric(10, 2),
  status order_status NOT NULL DEFAULT 'Submitted',
  type cart_type,
  item_count integer,
  property_id text REFERENCES properties(id),
  thread_id text REFERENCES communication_threads(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add FK from communication_threads back to orders
ALTER TABLE communication_threads 
ADD CONSTRAINT fk_thread_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- ORDER HISTORY
CREATE TABLE order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- PURCHASE ORDERS
CREATE TABLE purchase_orders (
  id text PRIMARY KEY,
  original_order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id text NOT NULL REFERENCES vendors(id),
  status po_status DEFAULT 'Issued',
  eta date,
  delivery_proof_url text,
  carrier text,
  tracking_number text,
  vendor_confirmation_number text,
  invoice_number text,
  invoice_url text,
  created_at timestamptz DEFAULT now()
);

-- PO HISTORY
CREATE TABLE po_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id text NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    status po_status NOT NULL,
    date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- MESSAGES
-- CRITICAL: ON UPDATE CASCADE required for Demo User Account claiming logic
-- CRITICAL: ON DELETE CASCADE required for User Deletion to work without FK errors
CREATE TABLE messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES communication_threads(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES profiles(id) ON UPDATE CASCADE ON DELETE CASCADE,
  content text NOT NULL,
  tagged_user_ids text[],
  timestamp timestamptz DEFAULT now()
);

-- SETTINGS
CREATE TABLE approval_rules (
    id text PRIMARY KEY,
    name text NOT NULL,
    conditions jsonb,
    steps jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE notification_settings (
    id text PRIMARY KEY,
    label text NOT NULL,
    email boolean DEFAULT false,
    sms boolean DEFAULT false,
    push boolean DEFAULT false
);

-- PAYMENT SETTINGS
-- Stores Sola credentials per company.
-- xkey should ideally be encrypted, but for this implementation we rely on RLS.
CREATE TABLE company_payment_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_label text NOT NULL, -- e.g. "Operating Account", "Reserve Fund"
    sola_xkey text NOT NULL,     -- The Transaction Key (keep secure!)
    sola_ifields_key text NOT NULL, -- The iFields Key (public-ish)
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- INVOICE TYPE MAPPINGS
-- Maps specific invoice types to a Sola account.
CREATE TABLE invoice_type_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_type text NOT NULL, -- e.g. "Maintenance", "Utilities"
    payment_settings_id uuid NOT NULL REFERENCES company_payment_settings(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, invoice_type)
);

-- SAVED PAYMENT METHODS
-- Stores tokenized payment info (xTokens) for future use.
CREATE TABLE saved_payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id text, -- Generic ID (could be Profile ID, Unit ID, or external Tenant ID)
    payment_settings_id uuid REFERENCES company_payment_settings(id) ON DELETE SET NULL, 
    sola_xtoken text NOT NULL, -- The Vault Token from Sola
    card_last4 text,
    card_brand text,
    exp_month integer,
    exp_year integer,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 4. ENABLE RLS (Row Level Security)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_type_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create generic policy for all tables
CREATE POLICY "Enable all access for authenticated users" ON companies FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON roles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON properties FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON units FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON vendors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON vendor_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON carts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON cart_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON order_status_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON po_status_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON communication_threads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON approval_rules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON notification_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON company_payment_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON invoice_type_mappings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON saved_payment_methods FOR ALL USING (auth.role() = 'authenticated');

-- 5. AUTH TRIGGER
-- This trigger handles the "Claim Profile" logic for demo users.
-- It connects a newly created Supabase Auth User (UUID) to an existing seeded Profile (text ID)
-- by updating the Profile's ID to match the Auth UUID.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  old_profile_id text;
BEGIN
  -- Check if a profile exists with the new user's email
  SELECT id INTO old_profile_id FROM public.profiles WHERE email = new.email;
  
  IF old_profile_id IS NOT NULL THEN
    -- 1. Update Array references (since they don't cascade automatically)
    -- Replace the old ID with the new UUID in the participant_ids array
    UPDATE public.communication_threads
    SET participant_ids = array_replace(participant_ids, old_profile_id, new.id::text)
    WHERE old_profile_id = ANY(participant_ids);

    -- 2. Update the Profile ID
    -- Because we added ON UPDATE CASCADE to carts/orders/messages FKs, this will automatically update those tables!
    -- Explicitly casting new.id (uuid) to text to avoid ambiguity
    UPDATE public.profiles
    SET id = new.id::text,
        full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name)
    WHERE email = new.email;
  ELSE
    -- Create new profile if none exists
    INSERT INTO public.profiles (id, email, full_name, company_id, role_id, status, property_ids)
    VALUES (
      new.id::text,
      new.email,
      new.raw_user_meta_data->>'full_name',
      'comp-1', -- Default to comp-1
      'role-2', -- Default to Basic User
      'Active',
      ARRAY[]::text[]
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 6. SEED DATA

-- ROLES
INSERT INTO roles (id, name, description, permissions) VALUES
('role-0', 'Owner', 'Platform Owner: Full access to all companies and system settings.', ARRAY[
    'dashboard:view', 'carts:view', 'properties:view', 'communications:view', 'orders:view', 'approvals:view',
    'purchaseOrders:view', 'receiving:view', 'transactions:view', 'reports:view', 'suppliers:view',
    'integrations:view', 'settings:view', 'carts:create', 'carts:edit', 'carts:delete', 'carts:submit',
    'orders:procure', 'purchaseOrders:create', 'purchaseOrders:edit', 'receiving:edit', 'approvals:approve',
    'suppliers:create', 'suppliers:edit', 'users:view', 'users:create', 'users:edit', 'users:delete', 'users:impersonate',
    'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'workflows:view', 'workflows:edit',
    'notifications:view', 'notifications:edit', 'companyProperties:view', 'companyProperties:edit'
]),
('role-1', 'Master Admin', 'Do everything: Full access to all features, including order requests, approvals, and viewing all orders across all properties.', ARRAY[
    'dashboard:view', 'carts:view', 'properties:view', 'communications:view', 'orders:view', 'approvals:view',
    'purchaseOrders:view', 'receiving:view', 'transactions:view', 'reports:view', 'suppliers:view',
    'integrations:view', 'settings:view', 'carts:create', 'carts:edit', 'carts:delete', 'carts:submit',
    'orders:procure', 'purchaseOrders:create', 'purchaseOrders:edit', 'receiving:edit', 'approvals:approve',
    'suppliers:create', 'suppliers:edit', 'users:view', 'users:create', 'users:edit', 'users:delete', 'users:impersonate',
    'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'workflows:view', 'workflows:edit',
    'notifications:view', 'notifications:edit', 'companyProperties:view', 'companyProperties:edit'
]),
('role-2', 'Basic User', 'Order/request items: Can request items for various categories and view only their own orders.', ARRAY[
    'dashboard:view', 'carts:view-own', 'carts:create', 'carts:edit-own', 'carts:delete-own', 'carts:submit',
    'orders:view-own', 'communications:view'
]),
('role-3', 'Reviewer', 'Review basic user requests: Can review and suggest modifications to item requests but cannot finalize orders.', ARRAY[
    'dashboard:view', 'carts:view', 'carts:edit', 'approvals:view', 'orders:view', 'communications:view'
]),
('role-4', 'Approver', 'Final Approve: Can review and approve/reject requests submitted by Basic Users and Reviewers.', ARRAY[
    'dashboard:view', 'approvals:view', 'approvals:approve', 'orders:view', 'communications:view', 'carts:view'
]),
('role-5', 'Purchaser', 'Place Orders: Can finalize and place approved orders for all categories.', ARRAY[
    'dashboard:view', 'orders:view', 'orders:procure', 'purchaseOrders:view', 'purchaseOrders:create',
    'purchaseOrders:edit', 'receiving:view', 'receiving:edit', 'suppliers:view', 'communications:view'
])
ON CONFLICT (id) DO NOTHING;

-- COMPANIES
INSERT INTO companies (id, name) VALUES
('comp-1', 'Alpha Corp'),
('comp-2', 'Beta Industries')
ON CONFLICT (id) DO NOTHING;

-- PROFILES (Company 1: Alpha Corp)
INSERT INTO profiles (id, company_id, full_name, email, role_id, avatar_url, status, property_ids) VALUES
('user-c1-1', 'comp-1', 'Alexa Reserva', 'alexa.reserva.demo_v3@gmail.com', 'role-1', 'https://ui-avatars.com/api/?name=Alexa+Reserva&background=random', 'Active', ARRAY['prop-1', 'prop-2']),
('user-c1-2', 'comp-1', 'Miguel Santos', 'miguel.santos.demo_v3@gmail.com', 'role-2', 'https://ui-avatars.com/api/?name=Miguel+Santos&background=random', 'Active', ARRAY['prop-1']),
('user-c1-3', 'comp-1', 'Jasmine Torres', 'jasmine.torres.demo_v3@gmail.com', 'role-2', 'https://ui-avatars.com/api/?name=Jasmine+Torres&background=random', 'Active', ARRAY['prop-2']),
('user-c1-4', 'comp-1', 'Kevin Dela Cruz', 'kevin.delacruz.demo_v3@gmail.com', 'role-3', 'https://ui-avatars.com/api/?name=Kevin+Dela+Cruz&background=random', 'Active', ARRAY['prop-1', 'prop-2']),
('user-c1-5', 'comp-1', 'Ricardo Morales', 'ricardo.morales.demo_v3@gmail.com', 'role-3', 'https://ui-avatars.com/api/?name=Ricardo+Morales&background=random', 'Active', ARRAY['prop-1']),
('user-c1-6', 'comp-1', 'Sophia Lim', 'sophia.lim.demo_v3@gmail.com', 'role-4', 'https://ui-avatars.com/api/?name=Sophia+Lim&background=random', 'Active', ARRAY['prop-1', 'prop-2']),
('user-c1-7', 'comp-1', 'Daniel Reyes', 'daniel.reyes.demo_v3@gmail.com', 'role-4', 'https://ui-avatars.com/api/?name=Daniel+Reyes&background=random', 'Active', ARRAY['prop-2']);

-- PROFILES (Company 2: Beta Industries)
INSERT INTO profiles (id, company_id, full_name, email, role_id, avatar_url, status, property_ids) VALUES
('user-c2-1', 'comp-2', 'Amelia Cruz', 'amelia.cruz.demo_v3@gmail.com', 'role-1', 'https://ui-avatars.com/api/?name=Amelia+Cruz&background=random', 'Active', ARRAY['prop-3', 'prop-4']),
('user-c2-2', 'comp-2', 'Noah Velasco', 'noah.velasco.demo_v3@gmail.com', 'role-2', 'https://ui-avatars.com/api/?name=Noah+Velasco&background=random', 'Active', ARRAY['prop-3']),
('user-c2-3', 'comp-2', 'Patricia Rojas', 'patricia.rojas.demo_v3@gmail.com', 'role-2', 'https://ui-avatars.com/api/?name=Patricia+Rojas&background=random', 'Active', ARRAY['prop-4']),
('user-c2-4', 'comp-2', 'Carlos Garcia', 'carlos.garcia.demo_v3@gmail.com', 'role-3', 'https://ui-avatars.com/api/?name=Carlos+Garcia&background=random', 'Active', ARRAY['prop-3', 'prop-4']),
('user-c2-5', 'comp-2', 'Nicole Uy', 'nicole.uy.demo_v3@gmail.com', 'role-3', 'https://ui-avatars.com/api/?name=Nicole+Uy&background=random', 'Active', ARRAY['prop-3']),
('user-c2-6', 'comp-2', 'Andrew Mendoza', 'andrew.mendoza.demo_v3@gmail.com', 'role-4', 'https://ui-avatars.com/api/?name=Andrew+Mendoza&background=random', 'Active', ARRAY['prop-3', 'prop-4']),
('user-c2-7', 'comp-2', 'Francesca Rivera', 'francesca.rivera.demo_v3@gmail.com', 'role-4', 'https://ui-avatars.com/api/?name=Francesca+Rivera&background=random', 'Active', ARRAY['prop-4'])
ON CONFLICT (id) DO NOTHING;

-- PROPERTIES
INSERT INTO properties (id, company_id, name, address) VALUES
('prop-1', 'comp-1', 'Alpha Headquarters', '{"street": "123 Main St", "city": "Metropolis", "state": "NY", "zip": "10001"}'),
('prop-2', 'comp-1', 'Alpha Warehouse', '{"street": "456 Oak Ave", "city": "Smallville", "state": "KS", "zip": "66002"}'),
('prop-3', 'comp-2', 'Beta Factory', '{"street": "789 Pine Ln", "city": "Gotham", "state": "NJ", "zip": "07001"}'),
('prop-4', 'comp-2', 'Beta Sales Office', '{"street": "321 Elm St", "city": "Star City", "state": "CA", "zip": "90001"}')
ON CONFLICT (id) DO NOTHING;

-- UNITS
INSERT INTO units (id, property_id, name) VALUES
('unit-1', 'prop-1', 'Suite 100'), ('unit-2', 'prop-1', 'Suite 101'),
('unit-3', 'prop-1', 'Floor 2'), ('unit-4', 'prop-1', 'Lobby'),
('unit-5', 'prop-2', 'Unit A'), ('unit-6', 'prop-2', 'Unit B'),
('unit-7', 'prop-3', 'Factory Floor 1'), ('unit-8', 'prop-4', 'Sales Bullpen')
ON CONFLICT (id) DO NOTHING;

-- VENDORS
INSERT INTO vendors (id, company_id, name, phone, email) VALUES
('vendor-1', 'comp-1', 'Office Depot', '800-463-3768', 'support@officedepot.com'),
('vendor-2', 'comp-1', 'Grainger', '800-323-0620', 'info@grainger.com'),
('vendor-3', 'comp-1', 'CDW', '800-800-4239', 'sales@cdw.com'),
('vendor-4', 'comp-2', 'Beta Industrial Parts', '866-207-4955', 'support@beta-industrial.com')
ON CONFLICT (id) DO NOTHING;

-- VENDOR ACCOUNTS
INSERT INTO vendor_accounts (id, vendor_id, property_id, account_number) VALUES
('vacc-1-1', 'vendor-1', 'prop-1', 'ACCT-OD-DT987'),
('vacc-1-2', 'vendor-1', 'prop-2', 'ACCT-OD-SP123'),
('vacc-2-1', 'vendor-2', 'prop-1', 'GRG-DT-456')
ON CONFLICT (id) DO NOTHING;

-- PRODUCTS (Existing + Extras)
INSERT INTO products (id, company_id, name, sku, description, unit_price, image_url, vendor_id, primary_category, secondary_category, rating, tags) VALUES
('prod-01', 'comp-1', 'Ergonomic Office Chair', 'CHR-ERGO-01', 'High-back, adjustable lumbar support, mesh design.', 350.00, 'https://picsum.photos/seed/chair/400/300', 'vendor-2', 'Furniture', 'Chairs', 5, ARRAY['best-seller', 'premium']),
('prod-02', 'comp-1', 'Sit-Stand Electric Desk', 'DSK-SST-ELC', 'Motorized height adjustment, memory presets.', 550.00, 'https://picsum.photos/seed/desk/400/300', 'vendor-2', 'Furniture', 'Desks', 5, ARRAY['premium']),
('prod-03', 'comp-1', '32" 4K Monitor', 'MON-4K-32', 'Ultra-HD resolution with USB-C connectivity.', 400.00, 'https://picsum.photos/seed/monitor/400/300', 'vendor-3', 'Electronics', 'Monitors', 4, ARRAY['best-seller']),
('prod-04', 'comp-1', 'Wireless Keyboard & Mouse Combo', 'KBM-WL-COMBO', 'Silent keys, ergonomic mouse, long battery life.', 75.50, 'https://picsum.photos/seed/keyboard/400/300', 'vendor-3', 'Electronics', 'Computers', 4, NULL),
('prod-05', 'comp-1', 'A4 Paper Ream (500 sheets)', 'PAP-A4-500', 'High-quality 80gsm multipurpose paper.', 5.50, 'https://picsum.photos/seed/paper/400/300', 'vendor-1', 'Office Supplies', 'Paper Products', 4, ARRAY['eco-friendly', 'basic']),
('prod-06', 'comp-2', 'Beta Bolt', 'B-BLT', 'Heavy duty bolt', 0.50, 'https://picsum.photos/seed/bolt/400/300', 'vendor-4', 'Maintenance', 'Hardware', 5, ARRAY['basic']),
('prod-07', 'comp-2', 'Industrial Lubricant (5 Gal)', 'LUB-IND-5G', 'High performance machinery lubricant.', 120.00, 'https://picsum.photos/seed/lube/400/300', 'vendor-4', 'Maintenance', 'Fluids', 5, ARRAY['industrial']),
('prod-08', 'comp-2', 'Safety Goggles', 'SAF-GOG-01', 'Anti-fog, impact resistant.', 15.00, 'https://picsum.photos/seed/goggles/400/300', 'vendor-4', 'Safety', 'Eye Protection', 4, ARRAY['basic']),
('prod-09', 'comp-2', 'Steel Sheet 4x8', 'STL-SHT-4X8', 'Galvanized steel sheet.', 45.00, 'https://picsum.photos/seed/steel/400/300', 'vendor-4', 'Raw Materials', 'Metals', 5, NULL),
('prod-10', 'comp-2', 'Hydraulic Pump', 'HYD-PMP-01', 'Heavy duty hydraulic pump for press.', 1200.00, 'https://picsum.photos/seed/pump/400/300', 'vendor-4', 'Machinery', 'Hydraulics', 5, ARRAY['premium']),
('prod-11', 'comp-2', 'Circuit Breaker 20A', 'ELE-BRK-20A', 'Standard 20A circuit breaker.', 12.50, 'https://picsum.photos/seed/breaker/400/300', 'vendor-4', 'Electrical', 'Breakers', 4, ARRAY['basic']),
('prod-12', 'comp-2', 'Work Gloves (Leather)', 'GLV-LTH-L', 'Durable leather work gloves, size L.', 25.00, 'https://picsum.photos/seed/gloves/400/300', 'vendor-4', 'Safety', 'Hand Protection', 4, ARRAY['best-seller'])
ON CONFLICT (id) DO NOTHING;

-- ====== LARGE BATCH SEED DATA FOR STATS ======

-- Alpha Corp (comp-1): Need >10 Pending, >10 In Transit, >10 Completed, 6+ Draft Carts

-- 12 Pending Approvals (Alpha)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c1-pend-01', 'comp-1', 'Q3 Supplies 1', 'Standard', 'Submitted', 5, 150.00, 'prop-1', 'user-c1-2'),
('c1-pend-02', 'comp-1', 'Q3 Supplies 2', 'Standard', 'Submitted', 3, 75.50, 'prop-1', 'user-c1-2'),
('c1-pend-03', 'comp-1', 'Maintenance Fix', 'Standard', 'Submitted', 2, 220.00, 'prop-2', 'user-c1-4'),
('c1-pend-04', 'comp-1', 'Breakroom Restock', 'Standard', 'Submitted', 8, 90.00, 'prop-1', 'user-c1-2'),
('c1-pend-05', 'comp-1', 'Office Chairs', 'Standard', 'Submitted', 4, 1200.00, 'prop-1', 'user-c1-2'),
('c1-pend-06', 'comp-1', 'Lighting Update', 'Standard', 'Submitted', 6, 340.00, 'prop-2', 'user-c1-4'),
('c1-pend-07', 'comp-1', 'Safety Gear', 'Standard', 'Submitted', 10, 450.00, 'prop-2', 'user-c1-4'),
('c1-pend-08', 'comp-1', 'Cleaning Bulk', 'Standard', 'Submitted', 12, 180.00, 'prop-1', 'user-c1-2'),
('c1-pend-09', 'comp-1', 'IT Cables', 'Standard', 'Submitted', 15, 200.00, 'prop-1', 'user-c1-4'),
('c1-pend-10', 'comp-1', 'Printer Paper', 'Standard', 'Submitted', 20, 110.00, 'prop-1', 'user-c1-2'),
('c1-pend-11', 'comp-1', 'Coffee Supply', 'Standard', 'Submitted', 6, 85.00, 'prop-1', 'user-c1-2'),
('c1-pend-12', 'comp-1', 'Misc Hardware', 'Standard', 'Submitted', 5, 60.00, 'prop-2', 'user-c1-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o1-pend-01', 'comp-1', 'c1-pend-01', 'Q3 Supplies 1', 'user-c1-2', 'Pending My Approval', 150.00, 'prop-1', CURRENT_DATE),
('o1-pend-02', 'comp-1', 'c1-pend-02', 'Q3 Supplies 2', 'user-c1-2', 'Pending My Approval', 75.50, 'prop-1', CURRENT_DATE),
('o1-pend-03', 'comp-1', 'c1-pend-03', 'Maintenance Fix', 'user-c1-4', 'Pending My Approval', 220.00, 'prop-2', CURRENT_DATE),
('o1-pend-04', 'comp-1', 'c1-pend-04', 'Breakroom Restock', 'user-c1-2', 'Pending Others', 90.00, 'prop-1', CURRENT_DATE - 1),
('o1-pend-05', 'comp-1', 'c1-pend-05', 'Office Chairs', 'user-c1-2', 'Pending My Approval', 1200.00, 'prop-1', CURRENT_DATE - 1),
('o1-pend-06', 'comp-1', 'c1-pend-06', 'Lighting Update', 'user-c1-4', 'Pending Others', 340.00, 'prop-2', CURRENT_DATE - 2),
('o1-pend-07', 'comp-1', 'c1-pend-07', 'Safety Gear', 'user-c1-4', 'Pending My Approval', 450.00, 'prop-2', CURRENT_DATE - 2),
('o1-pend-08', 'comp-1', 'c1-pend-08', 'Cleaning Bulk', 'user-c1-2', 'Pending Others', 180.00, 'prop-1', CURRENT_DATE - 3),
('o1-pend-09', 'comp-1', 'c1-pend-09', 'IT Cables', 'user-c1-4', 'Pending My Approval', 200.00, 'prop-1', CURRENT_DATE - 3),
('o1-pend-10', 'comp-1', 'c1-pend-10', 'Printer Paper', 'user-c1-2', 'Pending My Approval', 110.00, 'prop-1', CURRENT_DATE - 4),
('o1-pend-11', 'comp-1', 'c1-pend-11', 'Coffee Supply', 'user-c1-2', 'Pending Others', 85.00, 'prop-1', CURRENT_DATE - 4),
('o1-pend-12', 'comp-1', 'c1-pend-12', 'Misc Hardware', 'user-c1-4', 'Pending My Approval', 60.00, 'prop-2', CURRENT_DATE - 5)
ON CONFLICT (id) DO NOTHING;

-- 12 In Transit (Alpha)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c1-tran-01', 'comp-1', 'Transit Order 1', 'Standard', 'Submitted', 2, 500.00, 'prop-1', 'user-c1-2'),
('c1-tran-02', 'comp-1', 'Transit Order 2', 'Standard', 'Submitted', 1, 1200.00, 'prop-1', 'user-c1-2'),
('c1-tran-03', 'comp-1', 'Transit Order 3', 'Standard', 'Submitted', 4, 300.00, 'prop-2', 'user-c1-2'),
('c1-tran-04', 'comp-1', 'Transit Order 4', 'Standard', 'Submitted', 2, 150.00, 'prop-2', 'user-c1-2'),
('c1-tran-05', 'comp-1', 'Transit Order 5', 'Standard', 'Submitted', 3, 400.00, 'prop-1', 'user-c1-4'),
('c1-tran-06', 'comp-1', 'Transit Order 6', 'Standard', 'Submitted', 5, 250.00, 'prop-1', 'user-c1-4'),
('c1-tran-07', 'comp-1', 'Transit Order 7', 'Standard', 'Submitted', 1, 800.00, 'prop-1', 'user-c1-4'),
('c1-tran-08', 'comp-1', 'Transit Order 8', 'Standard', 'Submitted', 2, 100.00, 'prop-2', 'user-c1-4'),
('c1-tran-09', 'comp-1', 'Transit Order 9', 'Standard', 'Submitted', 6, 350.00, 'prop-2', 'user-c1-4'),
('c1-tran-10', 'comp-1', 'Transit Order 10', 'Standard', 'Submitted', 3, 220.00, 'prop-1', 'user-c1-2'),
('c1-tran-11', 'comp-1', 'Transit Order 11', 'Standard', 'Submitted', 2, 180.00, 'prop-1', 'user-c1-2'),
('c1-tran-12', 'comp-1', 'Transit Order 12', 'Standard', 'Submitted', 4, 500.00, 'prop-2', 'user-c1-2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o1-tran-01', 'comp-1', 'c1-tran-01', 'Transit Order 1', 'user-c1-2', 'Processing', 500.00, 'prop-1', CURRENT_DATE - 2),
('o1-tran-02', 'comp-1', 'c1-tran-02', 'Transit Order 2', 'user-c1-2', 'Shipped', 1200.00, 'prop-1', CURRENT_DATE - 3),
('o1-tran-03', 'comp-1', 'c1-tran-03', 'Transit Order 3', 'user-c1-2', 'Processing', 300.00, 'prop-2', CURRENT_DATE - 3),
('o1-tran-04', 'comp-1', 'c1-tran-04', 'Transit Order 4', 'user-c1-2', 'Shipped', 150.00, 'prop-2', CURRENT_DATE - 4),
('o1-tran-05', 'comp-1', 'c1-tran-05', 'Transit Order 5', 'user-c1-4', 'Processing', 400.00, 'prop-1', CURRENT_DATE - 4),
('o1-tran-06', 'comp-1', 'c1-tran-06', 'Transit Order 6', 'user-c1-4', 'Shipped', 250.00, 'prop-1', CURRENT_DATE - 5),
('o1-tran-07', 'comp-1', 'c1-tran-07', 'Transit Order 7', 'user-c1-4', 'Processing', 800.00, 'prop-1', CURRENT_DATE - 5),
('o1-tran-08', 'comp-1', 'c1-tran-08', 'Transit Order 8', 'user-c1-4', 'Shipped', 100.00, 'prop-2', CURRENT_DATE - 6),
('o1-tran-09', 'comp-1', 'c1-tran-09', 'Transit Order 9', 'user-c1-4', 'Processing', 350.00, 'prop-2', CURRENT_DATE - 6),
('o1-tran-10', 'comp-1', 'c1-tran-10', 'Transit Order 10', 'user-c1-2', 'Shipped', 220.00, 'prop-1', CURRENT_DATE - 7),
('o1-tran-11', 'comp-1', 'c1-tran-11', 'Transit Order 11', 'user-c1-2', 'Processing', 180.00, 'prop-1', CURRENT_DATE - 7),
('o1-tran-12', 'comp-1', 'c1-tran-12', 'Transit Order 12', 'user-c1-2', 'Shipped', 500.00, 'prop-2', CURRENT_DATE - 8)
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_orders (id, original_order_id, vendor_id, status, carrier, tracking_number, eta) VALUES
('po-c1-01', 'o1-tran-01', 'vendor-1', 'In Transit', 'UPS', '1Z9999999999999999', CURRENT_DATE + 2),
('po-c1-02', 'o1-tran-02', 'vendor-2', 'In Transit', 'FedEx', '123456789012', CURRENT_DATE + 1),
('po-c1-03', 'o1-tran-03', 'vendor-3', 'In Transit', 'USPS', '9400100000000000000000', CURRENT_DATE + 3),
('po-c1-04', 'o1-tran-04', 'vendor-1', 'In Transit', 'UPS', '1Z8888888888888888', CURRENT_DATE + 2),
('po-c1-05', 'o1-tran-05', 'vendor-2', 'In Transit', 'DHL', '1234567890', CURRENT_DATE + 4),
('po-c1-06', 'o1-tran-06', 'vendor-3', 'In Transit', 'FedEx', '987654321098', CURRENT_DATE + 1),
('po-c1-07', 'o1-tran-07', 'vendor-1', 'In Transit', 'UPS', '1Z7777777777777777', CURRENT_DATE + 5),
('po-c1-08', 'o1-tran-08', 'vendor-2', 'In Transit', 'USPS', '9400100000000000000001', CURRENT_DATE + 2),
('po-c1-09', 'o1-tran-09', 'vendor-3', 'In Transit', 'DHL', '0987654321', CURRENT_DATE + 3),
('po-c1-10', 'o1-tran-10', 'vendor-1', 'In Transit', 'UPS', '1Z6666666666666666', CURRENT_DATE + 1),
('po-c1-11', 'o1-tran-11', 'vendor-2', 'In Transit', 'FedEx', '112233445566', CURRENT_DATE + 2),
('po-c1-12', 'o1-tran-12', 'vendor-3', 'In Transit', 'USPS', '9400100000000000000002', CURRENT_DATE + 4)
ON CONFLICT (id) DO NOTHING;


-- 15 Completed Orders (Alpha)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c1-comp-01', 'comp-1', 'Completed Supply 1', 'Standard', 'Submitted', 1, 50.00, 'prop-1', 'user-c1-2'),
('c1-comp-02', 'comp-1', 'Completed Supply 2', 'Standard', 'Submitted', 2, 100.00, 'prop-1', 'user-c1-2'),
('c1-comp-03', 'comp-1', 'Completed Supply 3', 'Standard', 'Submitted', 1, 30.00, 'prop-2', 'user-c1-2'),
('c1-comp-04', 'comp-1', 'Completed Supply 4', 'Standard', 'Submitted', 3, 120.00, 'prop-2', 'user-c1-2'),
('c1-comp-05', 'comp-1', 'Completed Supply 5', 'Standard', 'Submitted', 1, 40.00, 'prop-1', 'user-c1-4'),
('c1-comp-06', 'comp-1', 'Completed Supply 6', 'Standard', 'Submitted', 2, 80.00, 'prop-1', 'user-c1-4'),
('c1-comp-07', 'comp-1', 'Completed Supply 7', 'Standard', 'Submitted', 4, 160.00, 'prop-1', 'user-c1-4'),
('c1-comp-08', 'comp-1', 'Completed Supply 8', 'Standard', 'Submitted', 1, 25.00, 'prop-2', 'user-c1-4'),
('c1-comp-09', 'comp-1', 'Completed Supply 9', 'Standard', 'Submitted', 2, 60.00, 'prop-2', 'user-c1-4'),
('c1-comp-10', 'comp-1', 'Completed Supply 10', 'Standard', 'Submitted', 3, 90.00, 'prop-1', 'user-c1-2'),
('c1-comp-11', 'comp-1', 'Completed Supply 11', 'Standard', 'Submitted', 1, 45.00, 'prop-1', 'user-c1-2'),
('c1-comp-12', 'comp-1', 'Completed Supply 12', 'Standard', 'Submitted', 2, 70.00, 'prop-2', 'user-c1-2'),
('c1-comp-13', 'comp-1', 'Completed Supply 13', 'Standard', 'Submitted', 5, 200.00, 'prop-1', 'user-c1-4'),
('c1-comp-14', 'comp-1', 'Completed Supply 14', 'Standard', 'Submitted', 1, 35.00, 'prop-1', 'user-c1-4'),
('c1-comp-15', 'comp-1', 'Completed Supply 15', 'Standard', 'Submitted', 3, 110.00, 'prop-2', 'user-c1-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o1-comp-01', 'comp-1', 'c1-comp-01', 'Completed Supply 1', 'user-c1-2', 'Completed', 50.00, 'prop-1', CURRENT_DATE - 1),
('o1-comp-02', 'comp-1', 'c1-comp-02', 'Completed Supply 2', 'user-c1-2', 'Completed', 100.00, 'prop-1', CURRENT_DATE - 2),
('o1-comp-03', 'comp-1', 'c1-comp-03', 'Completed Supply 3', 'user-c1-2', 'Completed', 30.00, 'prop-2', CURRENT_DATE - 3),
('o1-comp-04', 'comp-1', 'c1-comp-04', 'Completed Supply 4', 'user-c1-2', 'Completed', 120.00, 'prop-2', CURRENT_DATE - 4),
('o1-comp-05', 'comp-1', 'c1-comp-05', 'Completed Supply 5', 'user-c1-4', 'Completed', 40.00, 'prop-1', CURRENT_DATE - 5),
('o1-comp-06', 'comp-1', 'c1-comp-06', 'Completed Supply 6', 'user-c1-4', 'Completed', 80.00, 'prop-1', CURRENT_DATE - 6),
('o1-comp-07', 'comp-1', 'c1-comp-07', 'Completed Supply 7', 'user-c1-4', 'Completed', 160.00, 'prop-1', CURRENT_DATE - 7),
('o1-comp-08', 'comp-1', 'c1-comp-08', 'Completed Supply 8', 'user-c1-4', 'Completed', 25.00, 'prop-2', CURRENT_DATE - 8),
('o1-comp-09', 'comp-1', 'c1-comp-09', 'Completed Supply 9', 'user-c1-4', 'Completed', 60.00, 'prop-2', CURRENT_DATE - 9),
('o1-comp-10', 'comp-1', 'c1-comp-10', 'Completed Supply 10', 'user-c1-2', 'Completed', 90.00, 'prop-1', CURRENT_DATE - 10),
('o1-comp-11', 'comp-1', 'c1-comp-11', 'Completed Supply 11', 'user-c1-2', 'Completed', 45.00, 'prop-1', CURRENT_DATE - 11),
('o1-comp-12', 'comp-1', 'c1-comp-12', 'Completed Supply 12', 'user-c1-2', 'Completed', 70.00, 'prop-2', CURRENT_DATE - 12),
('o1-comp-13', 'comp-1', 'c1-comp-13', 'Completed Supply 13', 'user-c1-4', 'Completed', 200.00, 'prop-1', CURRENT_DATE - 13),
('o1-comp-14', 'comp-1', 'c1-comp-14', 'Completed Supply 14', 'user-c1-4', 'Completed', 35.00, 'prop-1', CURRENT_DATE - 14),
('o1-comp-15', 'comp-1', 'c1-comp-15', 'Completed Supply 15', 'user-c1-4', 'Completed', 110.00, 'prop-2', CURRENT_DATE - 15)
ON CONFLICT (id) DO NOTHING;

-- 6 Carts to Submit (Alpha)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c1-draft-01', 'comp-1', 'Draft Cart 1', 'Standard', 'Draft', 2, 50.00, 'prop-1', 'user-c1-2'),
('c1-draft-02', 'comp-1', 'Draft Cart 2', 'Standard', 'Draft', 3, 75.00, 'prop-2', 'user-c1-2'),
('c1-draft-03', 'comp-1', 'Draft Cart 3', 'Recurring', 'Draft', 5, 125.00, 'prop-1', 'user-c1-4'),
('c1-draft-04', 'comp-1', 'Draft Cart 4', 'Standard', 'Ready for Review', 1, 25.00, 'prop-1', 'user-c1-4'),
('c1-draft-05', 'comp-1', 'Draft Cart 5', 'Standard', 'Draft', 4, 100.00, 'prop-2', 'user-c1-2'),
('c1-draft-06', 'comp-1', 'Draft Cart 6', 'Scheduled', 'Draft', 2, 60.00, 'prop-2', 'user-c1-4')
ON CONFLICT (id) DO NOTHING;


-- Beta Industries (comp-2): Need >10 Pending, >10 In Transit, >10 Completed

-- 11 Pending (Beta)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c2-pend-01', 'comp-2', 'Beta Pending 1', 'Standard', 'Submitted', 2, 100.00, 'prop-3', 'user-c2-2'),
('c2-pend-02', 'comp-2', 'Beta Pending 2', 'Standard', 'Submitted', 3, 150.00, 'prop-3', 'user-c2-2'),
('c2-pend-03', 'comp-2', 'Beta Pending 3', 'Standard', 'Submitted', 1, 50.00, 'prop-4', 'user-c2-4'),
('c2-pend-04', 'comp-2', 'Beta Pending 4', 'Standard', 'Submitted', 4, 200.00, 'prop-4', 'user-c2-4'),
('c2-pend-05', 'comp-2', 'Beta Pending 5', 'Standard', 'Submitted', 2, 80.00, 'prop-3', 'user-c2-2'),
('c2-pend-06', 'comp-2', 'Beta Pending 6', 'Standard', 'Submitted', 5, 250.00, 'prop-3', 'user-c2-2'),
('c2-pend-07', 'comp-2', 'Beta Pending 7', 'Standard', 'Submitted', 3, 120.00, 'prop-4', 'user-c2-4'),
('c2-pend-08', 'comp-2', 'Beta Pending 8', 'Standard', 'Submitted', 1, 40.00, 'prop-4', 'user-c2-4'),
('c2-pend-09', 'comp-2', 'Beta Pending 9', 'Standard', 'Submitted', 2, 90.00, 'prop-3', 'user-c2-2'),
('c2-pend-10', 'comp-2', 'Beta Pending 10', 'Standard', 'Submitted', 4, 180.00, 'prop-3', 'user-c2-2'),
('c2-pend-11', 'comp-2', 'Beta Pending 11', 'Standard', 'Submitted', 2, 70.00, 'prop-4', 'user-c2-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o2-pend-01', 'comp-2', 'c2-pend-01', 'Beta Pending 1', 'user-c2-2', 'Pending My Approval', 100.00, 'prop-3', CURRENT_DATE),
('o2-pend-02', 'comp-2', 'c2-pend-02', 'Beta Pending 2', 'user-c2-2', 'Pending Others', 150.00, 'prop-3', CURRENT_DATE),
('o2-pend-03', 'comp-2', 'c2-pend-03', 'Beta Pending 3', 'user-c2-4', 'Pending My Approval', 50.00, 'prop-4', CURRENT_DATE),
('o2-pend-04', 'comp-2', 'c2-pend-04', 'Beta Pending 4', 'user-c2-4', 'Pending Others', 200.00, 'prop-4', CURRENT_DATE - 1),
('o2-pend-05', 'comp-2', 'c2-pend-05', 'Beta Pending 5', 'user-c2-2', 'Pending My Approval', 80.00, 'prop-3', CURRENT_DATE - 1),
('o2-pend-06', 'comp-2', 'c2-pend-06', 'Beta Pending 6', 'user-c2-2', 'Pending Others', 250.00, 'prop-3', CURRENT_DATE - 2),
('o2-pend-07', 'comp-2', 'c2-pend-07', 'Beta Pending 7', 'user-c2-4', 'Pending My Approval', 120.00, 'prop-4', CURRENT_DATE - 2),
('o2-pend-08', 'comp-2', 'c2-pend-08', 'Beta Pending 8', 'user-c2-4', 'Pending Others', 40.00, 'prop-4', CURRENT_DATE - 3),
('o2-pend-09', 'comp-2', 'c2-pend-09', 'Beta Pending 9', 'user-c2-2', 'Pending My Approval', 90.00, 'prop-3', CURRENT_DATE - 3),
('o2-pend-10', 'comp-2', 'c2-pend-10', 'Beta Pending 10', 'user-c2-2', 'Pending Others', 180.00, 'prop-3', CURRENT_DATE - 4),
('o2-pend-11', 'comp-2', 'c2-pend-11', 'Beta Pending 11', 'user-c2-4', 'Pending My Approval', 70.00, 'prop-4', CURRENT_DATE - 4)
ON CONFLICT (id) DO NOTHING;

-- 11 In Transit (Beta)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c2-tran-01', 'comp-2', 'Beta Transit 1', 'Standard', 'Submitted', 3, 300.00, 'prop-3', 'user-c2-2'),
('c2-tran-02', 'comp-2', 'Beta Transit 2', 'Standard', 'Submitted', 2, 180.00, 'prop-3', 'user-c2-2'),
('c2-tran-03', 'comp-2', 'Beta Transit 3', 'Standard', 'Submitted', 1, 90.00, 'prop-4', 'user-c2-4'),
('c2-tran-04', 'comp-2', 'Beta Transit 4', 'Standard', 'Submitted', 4, 350.00, 'prop-4', 'user-c2-4'),
('c2-tran-05', 'comp-2', 'Beta Transit 5', 'Standard', 'Submitted', 2, 150.00, 'prop-3', 'user-c2-2'),
('c2-tran-06', 'comp-2', 'Beta Transit 6', 'Standard', 'Submitted', 5, 450.00, 'prop-3', 'user-c2-2'),
('c2-tran-07', 'comp-2', 'Beta Transit 7', 'Standard', 'Submitted', 3, 270.00, 'prop-4', 'user-c2-4'),
('c2-tran-08', 'comp-2', 'Beta Transit 8', 'Standard', 'Submitted', 1, 80.00, 'prop-4', 'user-c2-4'),
('c2-tran-09', 'comp-2', 'Beta Transit 9', 'Standard', 'Submitted', 2, 160.00, 'prop-3', 'user-c2-2'),
('c2-tran-10', 'comp-2', 'Beta Transit 10', 'Standard', 'Submitted', 4, 320.00, 'prop-3', 'user-c2-2'),
('c2-tran-11', 'comp-2', 'Beta Transit 11', 'Standard', 'Submitted', 2, 140.00, 'prop-4', 'user-c2-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o2-tran-01', 'comp-2', 'c2-tran-01', 'Beta Transit 1', 'user-c2-2', 'Processing', 300.00, 'prop-3', CURRENT_DATE - 2),
('o2-tran-02', 'comp-2', 'c2-tran-02', 'Beta Transit 2', 'user-c2-2', 'Shipped', 180.00, 'prop-3', CURRENT_DATE - 3),
('o2-tran-03', 'comp-2', 'c2-tran-03', 'Beta Transit 3', 'user-c2-4', 'Processing', 90.00, 'prop-4', CURRENT_DATE - 3),
('o2-tran-04', 'comp-2', 'c2-tran-04', 'Beta Transit 4', 'user-c2-4', 'Shipped', 350.00, 'prop-4', CURRENT_DATE - 4),
('o2-tran-05', 'comp-2', 'c2-tran-05', 'Beta Transit 5', 'user-c2-2', 'Processing', 150.00, 'prop-3', CURRENT_DATE - 4),
('o2-tran-06', 'comp-2', 'c2-tran-06', 'Beta Transit 6', 'user-c2-2', 'Shipped', 450.00, 'prop-3', CURRENT_DATE - 5),
('o2-tran-07', 'comp-2', 'c2-tran-07', 'Beta Transit 7', 'user-c2-4', 'Processing', 270.00, 'prop-4', CURRENT_DATE - 5),
('o2-tran-08', 'comp-2', 'c2-tran-08', 'Beta Transit 8', 'user-c2-4', 'Shipped', 80.00, 'prop-4', CURRENT_DATE - 6),
('o2-tran-09', 'comp-2', 'c2-tran-09', 'Beta Transit 9', 'user-c2-2', 'Processing', 160.00, 'prop-3', CURRENT_DATE - 6),
('o2-tran-10', 'comp-2', 'c2-tran-10', 'Beta Transit 10', 'user-c2-2', 'Shipped', 320.00, 'prop-3', CURRENT_DATE - 7),
('o2-tran-11', 'comp-2', 'c2-tran-11', 'Beta Transit 11', 'user-c2-4', 'Processing', 140.00, 'prop-4', CURRENT_DATE - 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_orders (id, original_order_id, vendor_id, status, carrier, tracking_number, eta) VALUES
('po-c2-01', 'o2-tran-01', 'vendor-4', 'In Transit', 'DHL', '1234567890', CURRENT_DATE + 2),
('po-c2-02', 'o2-tran-02', 'vendor-4', 'In Transit', 'UPS', '1Z1234567890123456', CURRENT_DATE + 1),
('po-c2-03', 'o2-tran-03', 'vendor-4', 'In Transit', 'FedEx', '123456789012', CURRENT_DATE + 3),
('po-c2-04', 'o2-tran-04', 'vendor-4', 'In Transit', 'USPS', '9400100000000000000003', CURRENT_DATE + 2),
('po-c2-05', 'o2-tran-05', 'vendor-4', 'In Transit', 'DHL', '0987654321', CURRENT_DATE + 4),
('po-c2-06', 'o2-tran-06', 'vendor-4', 'In Transit', 'UPS', '1Z0987654321098765', CURRENT_DATE + 1),
('po-c2-07', 'o2-tran-07', 'vendor-4', 'In Transit', 'FedEx', '210987654321', CURRENT_DATE + 5),
('po-c2-08', 'o2-tran-08', 'vendor-4', 'In Transit', 'USPS', '9400100000000000000004', CURRENT_DATE + 2),
('po-c2-09', 'o2-tran-09', 'vendor-4', 'In Transit', 'DHL', '1357924680', CURRENT_DATE + 3),
('po-c2-10', 'o2-tran-10', 'vendor-4', 'In Transit', 'UPS', '1Z1357924680135792', CURRENT_DATE + 1),
('po-c2-11', 'o2-tran-11', 'vendor-4', 'In Transit', 'FedEx', '321654987012', CURRENT_DATE + 2)
ON CONFLICT (id) DO NOTHING;


-- 12 Completed Orders (Beta)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c2-comp-01', 'comp-2', 'Beta Completed 1', 'Standard', 'Submitted', 2, 100.00, 'prop-3', 'user-c2-2'),
('c2-comp-02', 'comp-2', 'Beta Completed 2', 'Standard', 'Submitted', 3, 150.00, 'prop-3', 'user-c2-2'),
('c2-comp-03', 'comp-2', 'Beta Completed 3', 'Standard', 'Submitted', 1, 50.00, 'prop-4', 'user-c2-4'),
('c2-comp-04', 'comp-2', 'Beta Completed 4', 'Standard', 'Submitted', 4, 200.00, 'prop-4', 'user-c2-4'),
('c2-comp-05', 'comp-2', 'Beta Completed 5', 'Standard', 'Submitted', 2, 80.00, 'prop-3', 'user-c2-2'),
('c2-comp-06', 'comp-2', 'Beta Completed 6', 'Standard', 'Submitted', 5, 250.00, 'prop-3', 'user-c2-2'),
('c2-comp-07', 'comp-2', 'Beta Completed 7', 'Standard', 'Submitted', 3, 120.00, 'prop-4', 'user-c2-4'),
('c2-comp-08', 'comp-2', 'Beta Completed 8', 'Standard', 'Submitted', 1, 40.00, 'prop-4', 'user-c2-4'),
('c2-comp-09', 'comp-2', 'Beta Completed 9', 'Standard', 'Submitted', 2, 90.00, 'prop-3', 'user-c2-2'),
('c2-comp-10', 'comp-2', 'Beta Completed 10', 'Standard', 'Submitted', 4, 180.00, 'prop-3', 'user-c2-2'),
('c2-comp-11', 'comp-2', 'Beta Completed 11', 'Standard', 'Submitted', 2, 70.00, 'prop-4', 'user-c2-4'),
('c2-comp-12', 'comp-2', 'Beta Completed 12', 'Standard', 'Submitted', 3, 130.00, 'prop-4', 'user-c2-4')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, company_id, cart_id, cart_name, submitted_by, status, total_cost, property_id, submission_date) VALUES
('o2-comp-01', 'comp-2', 'c2-comp-01', 'Beta Completed 1', 'user-c2-2', 'Completed', 100.00, 'prop-3', CURRENT_DATE - 1),
('o2-comp-02', 'comp-2', 'c2-comp-02', 'Beta Completed 2', 'user-c2-2', 'Completed', 150.00, 'prop-3', CURRENT_DATE - 2),
('o2-comp-03', 'comp-2', 'c2-comp-03', 'Beta Completed 3', 'user-c2-4', 'Completed', 50.00, 'prop-4', CURRENT_DATE - 3),
('o2-comp-04', 'comp-2', 'c2-comp-04', 'Beta Completed 4', 'user-c2-4', 'Completed', 200.00, 'prop-4', CURRENT_DATE - 4),
('o2-comp-05', 'comp-2', 'c2-comp-05', 'Beta Completed 5', 'user-c2-2', 'Completed', 80.00, 'prop-3', CURRENT_DATE - 5),
('o2-comp-06', 'comp-2', 'c2-comp-06', 'Beta Completed 6', 'user-c2-2', 'Completed', 250.00, 'prop-3', CURRENT_DATE - 6),
('o2-comp-07', 'comp-2', 'c2-comp-07', 'Beta Completed 7', 'user-c2-4', 'Completed', 120.00, 'prop-4', CURRENT_DATE - 7),
('o2-comp-08', 'comp-2', 'c2-comp-08', 'Beta Completed 8', 'user-c2-4', 'Completed', 40.00, 'prop-4', CURRENT_DATE - 8),
('o2-comp-09', 'comp-2', 'c2-comp-09', 'Beta Completed 9', 'user-c2-2', 'Completed', 90.00, 'prop-3', CURRENT_DATE - 9),
('o2-comp-10', 'comp-2', 'c2-comp-10', 'Beta Completed 10', 'user-c2-2', 'Completed', 180.00, 'prop-3', CURRENT_DATE - 10),
('o2-comp-11', 'comp-2', 'c2-comp-11', 'Beta Completed 11', 'user-c2-4', 'Completed', 70.00, 'prop-4', CURRENT_DATE - 11),
('o2-comp-12', 'comp-2', 'c2-comp-12', 'Beta Completed 12', 'user-c2-4', 'Completed', 130.00, 'prop-4', CURRENT_DATE - 12)
ON CONFLICT (id) DO NOTHING;

-- 5 Carts to Submit (Beta)
INSERT INTO carts (id, company_id, name, type, status, item_count, total_cost, property_id, created_by) VALUES
('c2-draft-01', 'comp-2', 'Beta Draft 1', 'Standard', 'Draft', 2, 80.00, 'prop-3', 'user-c2-2'),
('c2-draft-02', 'comp-2', 'Beta Draft 2', 'Standard', 'Draft', 3, 120.00, 'prop-3', 'user-c2-2'),
('c2-draft-03', 'comp-2', 'Beta Draft 3', 'Recurring', 'Draft', 1, 40.00, 'prop-4', 'user-c2-4'),
('c2-draft-04', 'comp-2', 'Beta Draft 4', 'Standard', 'Ready for Review', 4, 160.00, 'prop-4', 'user-c2-4'),
('c2-draft-05', 'comp-2', 'Beta Draft 5', 'Scheduled', 'Draft', 2, 90.00, 'prop-3', 'user-c2-2')
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: Insert Items for ALL Seed Carts so totals and approvals work
INSERT INTO cart_items (cart_id, name, sku, quantity, unit_price) VALUES
-- Alpha Pending Items
('c1-pend-01', 'Office Chair', 'CHR-001', 1, 150.00),
('c1-pend-02', 'Pens', 'PEN-001', 10, 7.55),
('c1-pend-03', 'Desk', 'DSK-001', 1, 220.00),
('c1-pend-04', 'Coffee', 'COF-001', 5, 18.00),
('c1-pend-05', 'Conf Chair', 'CHR-002', 4, 300.00),
('c1-pend-06', 'LED Bulb', 'LGT-001', 20, 17.00),
('c1-pend-07', 'Gloves', 'GLV-001', 50, 9.00),
('c1-pend-08', 'Cleaner', 'CLN-001', 12, 15.00),
('c1-pend-09', 'HDMI Cable', 'CAB-001', 20, 10.00),
('c1-pend-10', 'Paper Ream', 'PAP-001', 20, 5.50),
('c1-pend-11', 'Filters', 'FIL-001', 10, 8.50),
('c1-pend-12', 'Screws', 'SCR-001', 100, 0.60),

-- Alpha Transit Items
('c1-tran-01', 'Monitor', 'MON-001', 2, 250.00),
('c1-tran-02', 'Laptop', 'LAP-001', 1, 1200.00),
('c1-tran-03', 'Keyboard', 'KBD-001', 4, 75.00),
('c1-tran-04', 'Mouse', 'MSE-001', 2, 75.00),
('c1-tran-05', 'Dock', 'DCK-001', 2, 200.00),
('c1-tran-06', 'Headset', 'HDS-001', 5, 50.00),
('c1-tran-07', 'Server', 'SRV-001', 1, 800.00),
('c1-tran-08', 'Cable', 'CAB-002', 10, 10.00),
('c1-tran-09', 'Switch', 'SWT-001', 1, 350.00),
('c1-tran-10', 'Router', 'RTR-001', 1, 220.00),
('c1-tran-11', 'Webcam', 'CAM-001', 2, 90.00),
('c1-tran-12', 'Speaker', 'SPK-001', 4, 125.00),

-- Alpha Completed Items
('c1-comp-01', 'Stapler', 'STP-001', 5, 10.00),
('c1-comp-02', 'Tape', 'TAP-001', 10, 10.00),
('c1-comp-03', 'Markers', 'MRK-001', 5, 6.00),
('c1-comp-04', 'Folders', 'FLD-001', 20, 6.00),
('c1-comp-05', 'Binders', 'BND-001', 10, 4.00),
('c1-comp-06', 'Tabs', 'TAB-001', 20, 4.00),
('c1-comp-07', 'Clips', 'CLP-001', 40, 4.00),
('c1-comp-08', 'Glue', 'GLU-001', 5, 5.00),
('c1-comp-09', 'Scissors', 'SCI-001', 4, 15.00),
('c1-comp-10', 'Punch', 'PCH-001', 3, 30.00),
('c1-comp-11', 'Ruler', 'RUL-001', 10, 4.50),
('c1-comp-12', 'Eraser', 'ERS-001', 20, 3.50),
('c1-comp-13', 'Whiteboard', 'WBD-001', 1, 200.00),
('c1-comp-14', 'Duster', 'DST-001', 5, 7.00),
('c1-comp-15', 'Mop', 'MOP-001', 2, 55.00),

-- Alpha Draft Items
('c1-draft-01', 'Soap', 'SOP-001', 10, 5.00),
('c1-draft-02', 'Towels', 'TWL-001', 5, 15.00),
('c1-draft-03', 'Sanitizer', 'SAN-001', 10, 12.50),
('c1-draft-04', 'Masks', 'MSK-001', 1, 25.00),
('c1-draft-05', 'Gloves', 'GLV-002', 5, 20.00),
('c1-draft-06', 'Bleach', 'BLC-001', 4, 15.00),

-- Beta Pending Items
('c2-pend-01', 'Beta Widget A', 'WID-A', 2, 50.00),
('c2-pend-02', 'Beta Widget B', 'WID-B', 3, 50.00),
('c2-pend-03', 'Beta Widget C', 'WID-C', 1, 50.00),
('c2-pend-04', 'Beta Widget D', 'WID-D', 4, 50.00),
('c2-pend-05', 'Beta Widget E', 'WID-E', 2, 40.00),
('c2-pend-06', 'Beta Widget F', 'WID-F', 5, 50.00),
('c2-pend-07', 'Beta Widget G', 'WID-G', 3, 40.00),
('c2-pend-08', 'Beta Widget H', 'WID-H', 1, 40.00),
('c2-pend-09', 'Beta Widget I', 'WID-I', 2, 45.00),
('c2-pend-10', 'Beta Widget J', 'WID-J', 4, 45.00),
('c2-pend-11', 'Beta Widget K', 'WID-K', 2, 35.00),

-- Beta Transit Items
('c2-tran-01', 'Beta Part 1', 'PRT-1', 3, 100.00),
('c2-tran-02', 'Beta Part 2', 'PRT-2', 2, 90.00),
('c2-tran-03', 'Beta Part 3', 'PRT-3', 1, 90.00),
('c2-tran-04', 'Beta Part 4', 'PRT-4', 4, 87.50),
('c2-tran-05', 'Beta Part 5', 'PRT-5', 2, 75.00),
('c2-tran-06', 'Beta Part 6', 'PRT-6', 5, 90.00),
('c2-tran-07', 'Beta Part 7', 'PRT-7', 3, 90.00),
('c2-tran-08', 'Beta Part 8', 'PRT-8', 1, 80.00),
('c2-tran-09', 'Beta Part 9', 'PRT-9', 2, 80.00),
('c2-tran-10', 'Beta Part 10', 'PRT-10', 4, 80.00),
('c2-tran-11', 'Beta Part 11', 'PRT-11', 2, 70.00),

-- Beta Completed Items
('c2-comp-01', 'Beta Supply 1', 'SUP-1', 2, 50.00),
('c2-comp-02', 'Beta Supply 2', 'SUP-2', 3, 50.00),
('c2-comp-03', 'Beta Supply 3', 'SUP-3', 1, 50.00),
('c2-comp-04', 'Beta Supply 4', 'SUP-4', 4, 50.00),
('c2-comp-05', 'Beta Supply 5', 'SUP-5', 2, 40.00),
('c2-comp-06', 'Beta Supply 6', 'SUP-6', 5, 50.00),
('c2-comp-07', 'Beta Supply 7', 'SUP-7', 3, 40.00),
('c2-comp-08', 'Beta Supply 8', 'SUP-8', 1, 40.00),
('c2-comp-09', 'Beta Supply 9', 'SUP-9', 2, 45.00),
('c2-comp-10', 'Beta Supply 10', 'SUP-10', 4, 45.00),
('c2-comp-11', 'Beta Supply 11', 'SUP-11', 2, 35.00),
('c2-comp-12', 'Beta Supply 12', 'SUP-12', 3, 43.33),

-- Beta Draft Items
('c2-draft-01', 'Beta Draft Item 1', 'DFT-1', 2, 40.00),
('c2-draft-02', 'Beta Draft Item 2', 'DFT-2', 3, 40.00),
('c2-draft-03', 'Beta Draft Item 3', 'DFT-3', 1, 40.00),
('c2-draft-04', 'Beta Draft Item 4', 'DFT-4', 4, 40.00),
('c2-draft-05', 'Beta Draft Item 5', 'DFT-5', 2, 45.00)
ON CONFLICT (id) DO NOTHING;

-- EMERGENCY FIX FOR EMAIL CONFIRMATION (Optional manual run)
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email LIKE '%@gmail.com';
