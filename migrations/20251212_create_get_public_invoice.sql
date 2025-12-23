-- Function to fetch a single invoice publicly (bypassing RLS)
-- This is used for the public payment page
CREATE OR REPLACE FUNCTION public.get_public_invoice(invoice_uuid uuid)
RETURNS json
SECURITY DEFINER -- Runs with privileges of the creator (postgres)
SET search_path = public -- Secure search path
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', i.id,
    'invoice_number', i.invoice_number,
    'issue_date', i.issue_date,
    'due_date', i.due_date,
    'status', i.status,
    'amount', i.amount,
    'total_amount', i.amount,
    'tax_total', i.tax_total,
    'company_id', i.company_id,
    'customer_id', i.customer_id,
    'customer', (SELECT json_build_object('name', c.name, 'email', c.email) FROM customers c WHERE c.id = i.customer_id),
    'items', (
        SELECT json_agg(json_build_object(
            'id', ii.id,
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total_price', ii.total_price
        ))
        FROM invoice_items ii
        WHERE ii.invoice_id = i.id
    )
  ) INTO result
  FROM invoices i
  WHERE i.id = invoice_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant access to anon (public) role
GRANT EXECUTE ON FUNCTION public.get_public_invoice(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_invoice(uuid) TO authenticated;
