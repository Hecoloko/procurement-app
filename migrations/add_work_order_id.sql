-- Migration: Add work_order_id column to carts table
-- Date: 2025-11-28
-- Description: Adds globally unique work_order_id column for immutable cart identification

-- Step 1: Add work_order_id column
ALTER TABLE carts ADD COLUMN IF NOT EXISTS work_order_id TEXT;

-- Step 2: Create unique index for global uniqueness across all companies
CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_work_order_unique ON carts(work_order_id);

-- Step 3: Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_carts_work_order_id ON carts(work_order_id);

-- Step 4: Update existing carts to have work_order_ids (fallback to cart ID)
UPDATE carts 
SET work_order_id = 'WO-' || LPAD(SUBSTRING(id FROM 6 FOR 4), 4, '0') || '-' || LPAD((RANDOM() * 10000)::INT::TEXT, 4, '0')
WHERE work_order_id IS NULL;

-- Verification: Check that all carts now have work_order_ids
SELECT COUNT(*) as total_carts, 
       COUNT(work_order_id) as carts_with_wo_id,
       COUNT(*) - COUNT(work_order_id) as carts_missing_wo_id
FROM carts;
