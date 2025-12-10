-- Migration: 20251209_payment_routing
-- Description: Adds payment key columns and invoices table

-- 1. Update company_payment_settings
-- We add x_key (for encrypted private key), ifields_key (public), and account_name
alter table company_payment_settings
add column if not exists x_key text,
add column if not exists ifields_key text,
add column if not exists account_name text;

-- 2. Create invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id) not null,
  customer_id text, -- Flexible link to profile or external ID
  invoice_type text not null,
  amount numeric(10, 2) not null,
  status text check (status in ('pending', 'paid', 'failed', 'refunded')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for invoices
alter table invoices enable row level security;

-- Simple policies for invoices (Admins only for now)
create policy "Admins can view all invoices"
  on invoices for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = invoices.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can insert invoices"
  on invoices for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = invoices.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can update invoices"
  on invoices for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = invoices.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );
