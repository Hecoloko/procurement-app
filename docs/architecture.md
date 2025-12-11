# System Architecture

## Database Schema

### Accounts Payable
- `vendor_invoices`: Core invoice record.
- `vendor_invoice_items`: Line items linked to PO items.
- `ap_ledger`: Financial transaction history.

### Accounts Receivable
- `billable_items`: Items pending billing (Expense/WorkOrder).
- `ar_ledger`: Financial transaction history.
- `stripe_payment_records`: Track Stripe Payment Intents.

## Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS.
- **Backend**: Supabase (PostgreSQL, Edge Functions).
- **Integration**: Stripe API (Webhooks, Checkout).

## Integration Points

### Stripe Webhooks
- Endpoint: `/functions/v1/stripe-webhooks`
- Events handled:
    - `invoice.paid`: Mark invoice paid, update AR ledger.
    - `payment_intent.succeeded`: Log payment record.

### 3-Way Verification Logic
- **Frontend**: `VendorInvoiceModal` validates user input against PO data.
- **Backend**: (Future) Database triggers or Edge Functions to enforce validation rules.
