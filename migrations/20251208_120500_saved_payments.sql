-- Create saved_payment_methods table
create table if not exists saved_payment_methods (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id) not null,
  payment_settings_id uuid references company_payment_settings(id), -- Optional link to which account key was used
  customer_id text, -- Flexible customer identifier
  sola_xtoken text not null, -- The token returned by Sola (or mock)
  card_last4 text,
  card_brand text,
  exp_month int,
  exp_year int,
  created_at timestamptz default now()
);

-- Enable RLS
alter table saved_payment_methods enable row level security;

-- Policies
create policy "Admins can view saved payments"
  on saved_payment_methods for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = saved_payment_methods.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can insert saved payments"
  on saved_payment_methods for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = saved_payment_methods.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can delete saved payments"
  on saved_payment_methods for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = saved_payment_methods.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );
