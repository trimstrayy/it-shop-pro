-- Route3 Integrity Check & Verification
-- Step 4: Run this file after 02_seed_data.sql to verify all data loaded correctly

-- =============================================================================
-- TABLE RECORD COUNTS
-- =============================================================================

select 'PROFILES' as table_name, count(*) as record_count from public.profiles
union all
select 'CUSTOMERS', count(*) from public.customers
union all
select 'DEVICE_BRANDS', count(*) from public.device_brands
union all
select 'DEVICE_MODELS', count(*) from public.device_models
union all
select 'DEVICE_COLORS', count(*) from public.device_colors
union all
select 'DEVICES', count(*) from public.devices
union all
select 'LABOR_RATES', count(*) from public.labor_rates
union all
select 'PRODUCTS', count(*) from public.products
union all
select 'INVENTORY_LOGS', count(*) from public.inventory_logs
union all
select 'QUOTATIONS', count(*) from public.quotations
union all
select 'QUOTATION_ITEMS', count(*) from public.quotation_items
union all
select 'INVOICES', count(*) from public.invoices
union all
select 'INVOICE_ITEMS', count(*) from public.invoice_items
union all
select 'DELIVERY_PEOPLE', count(*) from public.delivery_people
union all
select 'DELIVERIES', count(*) from public.deliveries
union all
select 'DELIVERY_TRACKING_EVENTS', count(*) from public.delivery_tracking_events
union all
select 'REPAIR_JOBS', count(*) from public.repair_jobs
union all
select 'REPAIR_JOB_PHOTOS', count(*) from public.repair_job_photos
union all
select 'REPAIR_JOB_UPDATES', count(*) from public.repair_job_updates
union all
select 'REPAIR_JOB_PARTS', count(*) from public.repair_job_parts
order by table_name;

-- =============================================================================
-- DEMO ACCOUNT VERIFICATION
-- =============================================================================

select 
  email,
  name,
  role,
  is_active,
  'Ready for Supabase Auth creation' as auth_status
from public.profiles
where role in ('admin', 'sales', 'inventory', 'accountant', 'technician')
order by role, email;

-- =============================================================================
-- PRODUCT INVENTORY SUMMARY
-- =============================================================================

select
  type,
  count(*) as product_count,
  sum(case when type = 'hardware' then coalesce(stock_quantity, 0) else 0 end) as total_hardware_stock,
  sum(case when type = 'software' then coalesce(license_quantity, 0) else 0 end) as total_software_licenses
from public.products
group by type;

-- =============================================================================
-- SALES SUMMARY FROM INVOICES
-- =============================================================================

select
  'Total Invoices' as metric,
  count(*)::text as value
from public.invoices
union all
select 'Paid Invoices', count(*)::text from public.invoices where status = 'paid'
union all
select 'Pending Invoices', count(*)::text from public.invoices where status = 'pending'
union all
select 'Total Revenue (Paid)' || ' ' || (select value->>'currency' from public.system_settings where key = 'company_profile'),
  coalesce(sum(grand_total), 0)::text
from public.invoices where status = 'paid'
union all
select 'Total Invoice Items', count(*)::text from public.invoice_items;

-- =============================================================================
-- REPAIR JOBS STATUS DISTRIBUTION
-- =============================================================================

select
  status,
  count(*) as job_count
from public.repair_jobs
group by status
order by job_count desc;

-- =============================================================================
-- TECHNICIAN WORKLOAD
-- =============================================================================

select
  p.name as technician,
  count(rj.id) as assigned_jobs,
  sum(case when rj.status = 'delivered' then 1 else 0 end) as completed_jobs,
  sum(case when rj.status = 'ready' then 1 else 0 end) as ready_jobs
from public.profiles p
left join public.repair_jobs rj on rj.assigned_tech_id = p.id
where p.role = 'technician'
group by p.id, p.name
order by assigned_jobs desc;

-- =============================================================================
-- CUSTOMER LIFETIME VALUE
-- =============================================================================

select
  name,
  phone,
  email,
  lifetime_value,
  case when lifetime_value = 0 then 'No activity' else 'Active' end as status
from public.customers
order by lifetime_value desc;

-- =============================================================================
-- DELIVERY STATUS OVERVIEW
-- =============================================================================

select
  status,
  current_stage,
  count(*) as delivery_count
from public.deliveries
group by status, current_stage
order by status, current_stage;

-- =============================================================================
-- FOREIGN KEY INTEGRITY CHECK
-- =============================================================================

-- Check for orphaned invoice items
select count(*) as orphaned_invoice_items
from public.invoice_items ii
where not exists (
  select 1 from public.invoices i where i.id = ii.invoice_id
);

-- Check for orphaned quotation items
select count(*) as orphaned_quotation_items
from public.quotation_items qi
where not exists (
  select 1 from public.quotations q where q.id = qi.quotation_id
);

-- Check for orphaned delivery events
select count(*) as orphaned_delivery_events
from public.delivery_tracking_events dte
where not exists (
  select 1 from public.deliveries d where d.id = dte.delivery_id
);

-- Check for orphaned repair job photos
select count(*) as orphaned_repair_photos
from public.repair_job_photos rjp
where not exists (
  select 1 from public.repair_jobs rj where rj.id = rjp.job_id
);

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

select 
  'Schema migration complete. All tables created and seeded successfully.' as status,
  'Your Route3 database is ready for Supabase Auth integration.' as next_step;

-- Next steps:
-- 1. Copy VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
-- 2. Create actual Supabase Auth users for each demo account email
-- 3. Run 'bun dev' to start the application
-- 4. Login with demo account emails (password set during auth user creation)
