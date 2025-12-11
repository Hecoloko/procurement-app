# Story: Stripe Integration Deep-Dive
**Epic**: Stripe Integration Deep-Dive
**Status**: Ready for Dev

## Description
Implement the core Stripe integration features required for AR automation. This includes handling webhooks for invoice payments and creating checkout sessions for billable items.

## Acceptance Criteria
- [ ] **Webhooks**: Implement `invoice.paid` handler to update `invoices` table and create `ar_ledger` entry.
- [ ] **Webhooks**: Implement `payment_intent.succeeded` handler to log to `stripe_payment_records`.
- [ ] **Checkout**: Create a Supabase Edge Function to generate a Stripe Checkout Session for a given Invoice ID.
- [ ] **Security**: Verify Stripe Webhook signatures.

## Technical Notes
- Use `stripe` npm package in Edge Functions.
- Store Stripe Secret Key in Supabase Vault (or env vars for now).
- Use `supabase-js` to interact with the database from Edge Functions.
