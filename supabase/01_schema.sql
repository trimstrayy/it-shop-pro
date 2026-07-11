-- Route3 Complete Database Schema for Supabase
-- Step 1: Run 00_cleanup.sql (if resetting an existing database)
-- Step 2: Run this file (01_schema.sql)
-- Step 3: Run 02_seed_data.sql
-- Step 4: Run 03_integrity_check.sql to verify

create extension if not exists pgcrypto;

-- =============================================================================
-- TYPES
-- =============================================================================

do $$ begin
  create type user_role as enum ('admin', 'sales', 'inventory', 'accountant', 'technician');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type product_type as enum ('hardware', 'software');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type product_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type license_type as enum ('single', 'multi-user');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type inventory_change_reason as enum ('sale', 'return', 'manual', 'adjustment', 'purchase', 'repair_consumption');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type quotation_status as enum ('draft', 'sent', 'accepted', 'rejected', 'converted');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_mode as enum ('cash', 'online', 'bank');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type invoice_status as enum ('pending', 'paid', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type delivery_stage as enum (
    'in_inventory',
    'collected_by_driver',
    'in_transit',
    'arrived_at_location',
    'collected_by_receiver',
    'returned'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type delivery_status as enum ('pending', 'in_progress', 'completed', 'returned');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type repair_status as enum ('to_do', 'in_progress', 'waiting_for_parts', 'quality_check', 'ready', 'delivered', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type repair_priority as enum ('normal', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type note_visibility as enum ('internal', 'public');
exception
  when duplicate_object then null;
end $$;

-- =============================================================================
-- SEQUENCES
-- =============================================================================

create sequence if not exists public.customer_number_seq start 1;
create sequence if not exists public.product_number_seq start 1;
create sequence if not exists public.quotation_number_seq start 1;
create sequence if not exists public.invoice_number_seq start 1;
create sequence if not exists public.repair_job_number_seq start 1;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_customer_lifetime_value()
returns trigger
language plpgsql
as $$
begin
  if new.customer_id is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status = 'paid' then
      update public.customers
      set lifetime_value = coalesce(lifetime_value, 0) + coalesce(new.grand_total, 0),
          updated_at = now()
      where id = new.customer_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      if old.status <> 'paid' and new.status = 'paid' then
        update public.customers
        set lifetime_value = coalesce(lifetime_value, 0) + coalesce(new.grand_total, 0),
            updated_at = now()
        where id = new.customer_id;
      elsif old.status = 'paid' and new.status <> 'paid' then
        update public.customers
        set lifetime_value = greatest(coalesce(lifetime_value, 0) - coalesce(old.grand_total, 0), 0),
            updated_at = now()
        where id = new.customer_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'sales'),
    true
  )
  on conflict (email) do update set
    auth_user_id = excluded.auth_user_id,
    name = excluded.name,
    role = excluded.role,
    is_active = true,
    updated_at = now();

  return new;
end;
$$;

-- =============================================================================
-- CORE TABLES: Identity & Lookup
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  name text not null,
  role user_role not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_code text not null unique default ('CUST-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.customer_number_seq')::text, 4, '0')),
  name text not null,
  phone text not null unique,
  email text unique,
  lifetime_value numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.device_brands(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, name)
);

create table if not exists public.device_colors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  serial_imei text unique,
  brand_id uuid references public.device_brands(id) on delete set null,
  model_id uuid references public.device_models(id) on delete set null,
  color_id uuid references public.device_colors(id) on delete set null,
  device_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.labor_rates (
  id uuid primary key default gen_random_uuid(),
  service_name text not null unique,
  base_price numeric(12,2) not null default 0,
  average_time_required_minutes integer not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- PRODUCT & INVENTORY TABLES
-- =============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique default ('PRD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.product_number_seq')::text, 4, '0')),
  barcode text not null unique default gen_random_uuid()::text,
  name text not null,
  category text not null,
  type product_type not null,
  cost_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  tax_percent numeric(5,2) not null default 0,
  status product_status not null default 'active',
  description text,
  stock_quantity integer,
  supplier text,
  warranty_period integer,
  license_type license_type,
  license_quantity integer,
  expiry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_type_shape_check check (
    (type = 'hardware' and stock_quantity is not null and license_quantity is null)
    or
    (type = 'software' and license_quantity is not null and stock_quantity is null)
  )
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  product_code text not null,
  product_name text not null,
  change integer not null,
  reason inventory_change_reason not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  timestamp timestamptz not null default now(),
  notes text
);

-- =============================================================================
-- QUOTATION & BILLING TABLES
-- =============================================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique default ('QT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quotation_number_seq')::text, 4, '0')),
  customer_id uuid references public.customers(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  client_address text not null,
  subtotal numeric(12,2) not null default 0,
  total_discount numeric(12,2) not null default 0,
  total_tax numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  status quotation_status not null default 'draft',
  valid_until date not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text not null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  tax_percent numeric(5,2) not null default 0,
  discount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0')),
  quotation_id uuid references public.quotations(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  client_address text not null,
  subtotal numeric(12,2) not null default 0,
  total_discount numeric(12,2) not null default 0,
  total_tax numeric(12,2) not null default 0,
  grand_total numeric(12,2) not null default 0,
  payment_mode payment_mode not null,
  status invoice_status not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_code text not null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  cost_price numeric(12,2) not null default 0,
  tax_percent numeric(5,2) not null default 0,
  discount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- DELIVERY TABLES
-- =============================================================================

create table if not exists public.delivery_people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  vehicle_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  invoice_number text not null,
  product_code text not null,
  product_name text not null,
  quantity integer not null,
  current_stage delivery_stage not null default 'in_inventory',
  status delivery_status not null default 'pending',
  delivery_person_id uuid references public.delivery_people(id) on delete set null,
  recipient_name text,
  recipient_phone text,
  delivery_address text not null,
  estimated_delivery_date date,
  actual_delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_tracking_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  stage delivery_stage not null,
  timestamp timestamptz not null default now(),
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  location text
);

-- =============================================================================
-- REPAIR / LAB TABLES
-- =============================================================================

create table if not exists public.repair_jobs (
  id uuid primary key default gen_random_uuid(),
  job_id text not null unique default ('LAB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.repair_job_number_seq')::text, 3, '0')),
  customer_id uuid references public.customers(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  assigned_tech_id uuid references public.profiles(id) on delete set null,
  status repair_status not null default 'to_do',
  priority repair_priority not null default 'normal',
  estimated_cost numeric(12,2) not null default 0,
  deposit_paid numeric(12,2) not null default 0,
  issue_summary text,
  intake_notes text,
  public_update text,
  qr_token uuid not null unique default gen_random_uuid(),
  ready_notified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.repair_jobs(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.repair_job_updates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.repair_jobs(id) on delete cascade,
  logged_at timestamptz not null default now(),
  note text not null,
  visibility note_visibility not null default 'internal',
  status_changed_to repair_status,
  created_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.repair_job_parts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.repair_jobs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  unit_cost numeric(12,2) not null,
  total_cost numeric(12,2) not null,
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists touch_customers_updated_at on public.customers;
create trigger touch_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists touch_device_brands_updated_at on public.device_brands;
create trigger touch_device_brands_updated_at before update on public.device_brands for each row execute function public.set_updated_at();

drop trigger if exists touch_device_models_updated_at on public.device_models;
create trigger touch_device_models_updated_at before update on public.device_models for each row execute function public.set_updated_at();

drop trigger if exists touch_device_colors_updated_at on public.device_colors;
create trigger touch_device_colors_updated_at before update on public.device_colors for each row execute function public.set_updated_at();

drop trigger if exists touch_devices_updated_at on public.devices;
create trigger touch_devices_updated_at before update on public.devices for each row execute function public.set_updated_at();

drop trigger if exists touch_labor_rates_updated_at on public.labor_rates;
create trigger touch_labor_rates_updated_at before update on public.labor_rates for each row execute function public.set_updated_at();

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists touch_quotations_updated_at on public.quotations;
create trigger touch_quotations_updated_at before update on public.quotations for each row execute function public.set_updated_at();

drop trigger if exists touch_invoices_updated_at on public.invoices;
create trigger touch_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();

drop trigger if exists sync_customer_lifetime_value_after_invoice on public.invoices;
create trigger sync_customer_lifetime_value_after_invoice
after insert or update on public.invoices
for each row execute function public.sync_customer_lifetime_value();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists touch_delivery_people_updated_at on public.delivery_people;
create trigger touch_delivery_people_updated_at before update on public.delivery_people for each row execute function public.set_updated_at();

drop trigger if exists touch_deliveries_updated_at on public.deliveries;
create trigger touch_deliveries_updated_at before update on public.deliveries for each row execute function public.set_updated_at();

drop trigger if exists touch_repair_jobs_updated_at on public.repair_jobs;
create trigger touch_repair_jobs_updated_at before update on public.repair_jobs for each row execute function public.set_updated_at();

drop trigger if exists touch_system_settings_updated_at on public.system_settings;
create trigger touch_system_settings_updated_at before update on public.system_settings for each row execute function public.set_updated_at();

-- =============================================================================
-- INDEXES
-- =============================================================================

create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_devices_customer_id on public.devices(customer_id);
create index if not exists idx_devices_brand_model on public.devices(brand_id, model_id);
create index if not exists idx_products_type_status on public.products(type, status);
create index if not exists idx_inventory_logs_product_id on public.inventory_logs(product_id);
create index if not exists idx_quotations_status on public.quotations(status);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_deliveries_status on public.deliveries(status);
create index if not exists idx_repair_jobs_status on public.repair_jobs(status);
create index if not exists idx_repair_jobs_assigned_tech on public.repair_jobs(assigned_tech_id);
create index if not exists idx_repair_job_updates_job_id on public.repair_job_updates(job_id);

-- =============================================================================
-- PERMISSIONS
-- =============================================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;

-- =============================================================================
-- VIEWS (Analytics)
-- =============================================================================

create or replace view public.v_repair_job_board as
select
  rj.id,
  rj.job_id,
  c.name as customer_name,
  c.phone as customer_phone,
  db.name as brand,
  dm.name as model,
  dc.name as color,
  rj.status,
  rj.priority,
  rj.estimated_cost,
  rj.deposit_paid,
  rj.assigned_tech_id,
  p.name as technician_name,
  rj.public_update,
  latest_update.note as latest_note,
  latest_update.logged_at as latest_note_at,
  rj.created_at,
  rj.updated_at
from public.repair_jobs rj
left join public.customers c on c.id = rj.customer_id
left join public.devices d on d.id = rj.device_id
left join public.device_brands db on db.id = d.brand_id
left join public.device_models dm on dm.id = d.model_id
left join public.device_colors dc on dc.id = d.color_id
left join public.profiles p on p.id = rj.assigned_tech_id
left join lateral (
  select ru.note, ru.logged_at
  from public.repair_job_updates ru
  where ru.job_id = rj.id
  order by ru.logged_at desc
  limit 1
) latest_update on true;

create or replace view public.v_technician_performance as
select
  p.id as technician_id,
  p.name as technician_name,
  count(rj.id) filter (where rj.status = 'delivered') as jobs_completed,
  count(rj.id) filter (where rj.status = 'ready') as jobs_ready,
  avg(extract(epoch from (coalesce(rj.completed_at, now()) - rj.created_at)) / 3600.0) filter (where rj.completed_at is not null) as avg_turnaround_hours,
  count(rj.id) filter (where rj.updated_at < now() - interval '24 hours' and rj.status not in ('delivered', 'cancelled')) as stale_jobs
from public.profiles p
left join public.repair_jobs rj on rj.assigned_tech_id = p.id
where p.role = 'technician'
group by p.id, p.name;

create or replace view public.v_repair_sla_alerts as
select
  rj.id,
  rj.job_id,
  rj.status,
  rj.priority,
  rj.updated_at,
  now() - rj.updated_at as time_since_update,
  c.name as customer_name,
  p.name as technician_name
from public.repair_jobs rj
left join public.customers c on c.id = rj.customer_id
left join public.profiles p on p.id = rj.assigned_tech_id
where rj.status not in ('delivered', 'cancelled')
  and rj.updated_at < now() - interval '24 hours';

create or replace view public.v_service_profitability as
select
  lr.service_name,
  count(rj.id) as job_count,
  coalesce(sum(rj.estimated_cost), 0) as estimated_revenue,
  coalesce(avg(rj.estimated_cost), 0) as average_ticket,
  coalesce(avg(extract(epoch from (coalesce(rj.completed_at, now()) - rj.created_at)) / 3600.0), 0) as average_turnaround_hours
from public.labor_rates lr
left join public.repair_jobs rj
  on rj.issue_summary ilike '%' || lr.service_name || '%'
group by lr.service_name;

-- =============================================================================
-- SCHEMA COMPLETE - Ready for seeding
-- =============================================================================
select 'Schema created successfully. Run 02_seed_data.sql next.' as status;
