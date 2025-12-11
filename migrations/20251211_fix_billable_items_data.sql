-- Backfill property_id and unit_id for existing Billable Items created from Purchase Orders
-- This joins billable_items -> purchase_orders -> orders to find the correct property/unit

UPDATE billable_items bi
SET 
  property_id = o.property_id,
  unit_id = o.unit_id
FROM 
  purchase_orders po
  JOIN orders o ON po.original_order_id = o.id
WHERE 
  bi.source_type = 'PurchaseOrder' 
  AND bi.source_id = po.id
  AND (bi.property_id IS NULL OR bi.unit_id IS NULL);

-- Also update based on Vendor Invoices if possible (though harder to link directly to Unit without PO)
-- For now, focused on PO-based items as requested
