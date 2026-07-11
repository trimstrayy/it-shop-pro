-- Route3 / IT Shop Manager integrity checks for Supabase
-- Run this after the migration to verify the public schema is intact.

with expected_tables(table_name) as (
  values
    ('profiles'),
    ('customers'),
    ('device_brands'),
    ('device_models'),
    ('device_colors'),
    ('devices'),
    ('labor_rates'),
    ('products'),
    ('inventory_logs'),
    ('quotations'),
    ('quotation_items'),
    ('invoices'),
    ('invoice_items'),
    ('delivery_people'),
    ('deliveries'),
    ('delivery_tracking_events'),
    ('repair_jobs'),
    ('repair_job_photos'),
    ('repair_job_updates'),
    ('repair_job_parts'),
    ('system_settings')
)
select
  e.table_name,
  case when t.table_name is null then 'missing' else 'present' end as status
from expected_tables e
left join information_schema.tables t
  on t.table_schema = 'public'
 and t.table_name = e.table_name
order by e.table_name;

with expected_views(view_name) as (
  values
    ('v_repair_job_board'),
    ('v_technician_performance'),
    ('v_repair_sla_alerts'),
    ('v_service_profitability')
)
select
  e.view_name,
  case when v.table_name is null then 'missing' else 'present' end as status
from expected_views e
left join information_schema.views v
  on v.table_schema = 'public'
 and v.table_name = e.view_name
order by e.view_name;

select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'customers', count(*) from public.customers
union all
select 'device_brands', count(*) from public.device_brands
union all
select 'device_colors', count(*) from public.device_colors
union all
select 'labor_rates', count(*) from public.labor_rates
union all
select 'repair_jobs', count(*) from public.repair_jobs
union all
select 'products', count(*) from public.products
order by table_name;

select service_name, base_price, average_time_required_minutes
from public.labor_rates
order by service_name;

select name, role, is_active
from public.profiles
order by role, name;
