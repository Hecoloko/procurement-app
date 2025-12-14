ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS purchase_order_id text REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS vendor_id text REFERENCES vendors(id) ON DELETE SET NULL;
