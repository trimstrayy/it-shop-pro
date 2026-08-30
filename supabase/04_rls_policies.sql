-- Enable Row Level Security for all application tables
-- For this app, we want authenticated users to be able to read/write the business data.
-- This is the correct setup for a browser app using Supabase Auth with the anon key + logged-in session.

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "profiles_authenticated_all" on public.profiles;
create policy "profiles_authenticated_all"
on public.profiles
for all
to authenticated
using (true)
with check (true);

-- Customers
alter table public.customers enable row level security;
drop policy if exists "customers_authenticated_all" on public.customers;
create policy "customers_authenticated_all"
on public.customers
for all
to authenticated
using (true)
with check (true);

-- Device lookups
alter table public.device_brands enable row level security;
drop policy if exists "device_brands_authenticated_all" on public.device_brands;
create policy "device_brands_authenticated_all"
on public.device_brands
for all
to authenticated
using (true)
with check (true);

alter table public.device_models enable row level security;
drop policy if exists "device_models_authenticated_all" on public.device_models;
create policy "device_models_authenticated_all"
on public.device_models
for all
to authenticated
using (true)
with check (true);

alter table public.device_colors enable row level security;
drop policy if exists "device_colors_authenticated_all" on public.device_colors;
create policy "device_colors_authenticated_all"
on public.device_colors
for all
to authenticated
using (true)
with check (true);

alter table public.devices enable row level security;
drop policy if exists "devices_authenticated_all" on public.devices;
create policy "devices_authenticated_all"
on public.devices
for all
to authenticated
using (true)
with check (true);

-- Labor rates
alter table public.labor_rates enable row level security;
drop policy if exists "labor_rates_authenticated_all" on public.labor_rates;
create policy "labor_rates_authenticated_all"
on public.labor_rates
for all
to authenticated
using (true)
with check (true);

-- Product and inventory
alter table public.products enable row level security;
drop policy if exists "products_authenticated_all" on public.products;
create policy "products_authenticated_all"
on public.products
for all
to authenticated
using (true)
with check (true);

alter table public.inventory_logs enable row level security;
drop policy if exists "inventory_logs_authenticated_all" on public.inventory_logs;
create policy "inventory_logs_authenticated_all"
on public.inventory_logs
for all
to authenticated
using (true)
with check (true);

-- Quotations and billing
alter table public.quotations enable row level security;
drop policy if exists "quotations_authenticated_all" on public.quotations;
create policy "quotations_authenticated_all"
on public.quotations
for all
to authenticated
using (true)
with check (true);

alter table public.quotation_items enable row level security;
drop policy if exists "quotation_items_authenticated_all" on public.quotation_items;
create policy "quotation_items_authenticated_all"
on public.quotation_items
for all
to authenticated
using (true)
with check (true);

alter table public.invoices enable row level security;
drop policy if exists "invoices_authenticated_all" on public.invoices;
create policy "invoices_authenticated_all"
on public.invoices
for all
to authenticated
using (true)
with check (true);

alter table public.invoice_items enable row level security;
drop policy if exists "invoice_items_authenticated_all" on public.invoice_items;
create policy "invoice_items_authenticated_all"
on public.invoice_items
for all
to authenticated
using (true)
with check (true);

-- Deliveries
alter table public.delivery_people enable row level security;
drop policy if exists "delivery_people_authenticated_all" on public.delivery_people;
create policy "delivery_people_authenticated_all"
on public.delivery_people
for all
to authenticated
using (true)
with check (true);

alter table public.deliveries enable row level security;
drop policy if exists "deliveries_authenticated_all" on public.deliveries;
create policy "deliveries_authenticated_all"
on public.deliveries
for all
to authenticated
using (true)
with check (true);

alter table public.delivery_tracking_events enable row level security;
drop policy if exists "delivery_tracking_events_authenticated_all" on public.delivery_tracking_events;
create policy "delivery_tracking_events_authenticated_all"
on public.delivery_tracking_events
for all
to authenticated
using (true)
with check (true);

-- Repair / Lab tables
alter table public.repair_jobs enable row level security;
drop policy if exists "repair_jobs_authenticated_all" on public.repair_jobs;
create policy "repair_jobs_authenticated_all"
on public.repair_jobs
for all
to authenticated
using (true)
with check (true);

alter table public.repair_job_photos enable row level security;
drop policy if exists "repair_job_photos_authenticated_all" on public.repair_job_photos;
create policy "repair_job_photos_authenticated_all"
on public.repair_job_photos
for all
to authenticated
using (true)
with check (true);

alter table public.repair_job_updates enable row level security;
drop policy if exists "repair_job_updates_authenticated_all" on public.repair_job_updates;
create policy "repair_job_updates_authenticated_all"
on public.repair_job_updates
for all
to authenticated
using (true)
with check (true);

alter table public.repair_job_parts enable row level security;
drop policy if exists "repair_job_parts_authenticated_all" on public.repair_job_parts;
create policy "repair_job_parts_authenticated_all"
on public.repair_job_parts
for all
to authenticated
using (true)
with check (true);

-- Settings
alter table public.system_settings enable row level security;
drop policy if exists "system_settings_authenticated_all" on public.system_settings;
create policy "system_settings_authenticated_all"
on public.system_settings
for all
to authenticated
using (true)
with check (true);

-- Optional: allow anonymous read-only access if you intentionally want the demo site to work without auth.
-- Uncomment the block below ONLY for a local demo or a deliberately public database.
--
-- alter table public.products enable row level security;
-- drop policy if exists "products_anon_read" on public.products;
-- create policy "products_anon_read" on public.products for select to anon using (true);
--
-- alter table public.categories enable row level security;
--
-- Note: do not leave anon write policies enabled in production.
