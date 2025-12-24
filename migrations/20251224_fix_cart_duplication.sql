-- 1. Clean up existing duplicates, keeping the one with the latest creation time (or random if same)
DELETE FROM cart_items
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY cart_id, sku ORDER BY created_at DESC, id DESC) AS rnum
        FROM cart_items
    ) t
    WHERE t.rnum > 1
);

-- 2. Add Unique Constraint
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_cart_id_sku_key UNIQUE (cart_id, sku);
