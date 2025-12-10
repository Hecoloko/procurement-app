-- Enable the Vault extension if not already enabled
create extension if not exists "supabase_vault" with schema "vault";

-- Create company_payment_settings table
create table if not exists company_payment_settings (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id) not null,
  account_label text not null,
  sola_xkey_id uuid references vault.secrets(id), -- Stored securely in Vault
  sola_ifields_key text not null, -- Public key, can be plain text
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table company_payment_settings enable row level security;

-- Policies
create policy "Admins can view payment settings"
  on company_payment_settings for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = company_payment_settings.company_id
      and profiles.role_id in ('role-0', 'role-1') -- Owner/Admin
    )
  );

create policy "Admins can insert payment settings"
  on company_payment_settings for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = company_payment_settings.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can update payment settings"
  on company_payment_settings for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = company_payment_settings.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

create policy "Admins can delete payment settings"
  on company_payment_settings for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = company_payment_settings.company_id
      and profiles.role_id in ('role-0', 'role-1')
    )
  );

-- Function to manage secrets
create or replace function manage_sola_secret(
  p_company_id text,
  p_label text,
  p_xkey text,
  p_ifields_key text,
  p_existing_id uuid default null
) returns void as $$
declare
  v_secret_id uuid;
begin
  -- Check permissions (server-side check or rely on RLS if called via RPC but secrets logic is elevated)
  if not exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()::text
      and profiles.company_id = p_company_id
      and profiles.role_id in ('role-0', 'role-1')
  ) then
      raise exception 'Unauthorized';
  end if;

  if p_existing_id is not null then
    -- Get the existing secret ID
    select sola_xkey_id into v_secret_id from company_payment_settings where id = p_existing_id;
    
    -- Update secret in vault (assuming we replace it)
    -- Note: Vault doesn't always support direct update easily, often better to create new and delete old.
    -- For simplicity in this migration/function, we will create a new secret and update the reference.
    
    -- Insert new secret
    insert into vault.secrets (secret) values (p_xkey) returning id into v_secret_id;
    
    -- Update settings
    update company_payment_settings
    set account_label = p_label,
        sola_xkey_id = v_secret_id,
        sola_ifields_key = p_ifields_key,
        updated_at = now()
    where id = p_existing_id;

  else
    -- New record
    insert into vault.secrets (secret) values (p_xkey) returning id into v_secret_id;
    
    insert into company_payment_settings (company_id, account_label, sola_xkey_id, sola_ifields_key)
    values (p_company_id, p_label, v_secret_id, p_ifields_key);
  end if;
end;
$$ language plpgsql security definer;
