-- 20251211_auto_bill_trigger.sql
-- Automate Billable Item Creation on Vendor Invoice Payment

-- Function to process paid invoice items
CREATE OR REPLACE FUNCTION process_paid_invoice_items()
RETURNS TRIGGER AS $$
DECLARE
    v_item RECORD;
    v_customer_id UUID;
    v_markup_percentage DECIMAL := 0.20; -- 20% Markup
BEGIN
    -- Only proceed if status changed to 'Paid' (and wasn't already paid)
    IF NEW.status = 'Paid' AND OLD.status != 'Paid' THEN
        
        -- Loop through invoice items for this invoice
        FOR v_item IN SELECT * FROM vendor_invoice_items WHERE vendor_invoice_id = NEW.id LOOP
            
            -- Attempt to find a customer linked to this property
            -- We assume customers have billing_address->'propertyId' matching the item's property_id
            v_customer_id := NULL;
            IF v_item.property_id IS NOT NULL THEN
                SELECT id INTO v_customer_id 
                FROM customers 
                WHERE company_id = NEW.company_id 
                AND billing_address->>'propertyId' = v_item.property_id 
                LIMIT 1;
            END IF;

            -- Insert into billable_items
            INSERT INTO billable_items (
                company_id,
                source_type,
                source_id,
                property_id,
                unit_id,
                customer_id,
                description,
                cost_amount,
                markup_amount,
                total_amount,
                status
            )
            VALUES (
                NEW.company_id,
                'Expense',
                v_item.id, -- Valid UUID from vendor_invoice_items
                v_item.property_id,
                v_item.unit_id,
                v_customer_id, -- Might be NULL if no customer found for property yet
                v_item.description,
                v_item.total_price,
                v_item.total_price * v_markup_percentage,
                v_item.total_price + (v_item.total_price * v_markup_percentage), -- Total = Cost + Markup
                'Pending'
            );
                
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger definition
DROP TRIGGER IF EXISTS on_invoice_paid ON vendor_invoices;
CREATE TRIGGER on_invoice_paid
AFTER UPDATE ON vendor_invoices
FOR EACH ROW
EXECUTE FUNCTION process_paid_invoice_items();
