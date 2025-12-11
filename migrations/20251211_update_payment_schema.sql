-- Migration: 20251211_update_payment_schema
-- Description: Updates companies and saved_payment_methods for Stripe integration

-- 1. Add stripe_customer_id to companies to link them to Stripe
alter table companies
add column if not exists stripe_customer_id text;

-- 2. Update saved_payment_methods to support multiple gateways
alter table saved_payment_methods
add column if not exists gateway text default 'sola',
add column if not exists stripe_payment_method_id text;

-- Make sola_xtoken nullable since Stripe methods won't have it
alter table saved_payment_methods
alter column sola_xtoken drop not null;
