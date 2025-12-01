-- Create global_products table
CREATE TABLE IF NOT EXISTS global_products (
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

-- Add global_product_id to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS global_product_id text REFERENCES global_products(id) ON DELETE SET NULL;

-- Enable RLS for global_products
ALTER TABLE global_products ENABLE ROW LEVEL SECURITY;

-- Create policy for global_products (viewable by all authenticated users)
CREATE POLICY "Enable read access for authenticated users" ON global_products FOR SELECT USING (auth.role() = 'authenticated');
