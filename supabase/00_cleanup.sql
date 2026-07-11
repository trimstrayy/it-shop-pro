-- Route3 Cleanup Script
-- Run this FIRST if you need to completely reset the database
-- WARNING: This will delete ALL data and drop all tables

-- Drop all views first
drop view if exists public.v_service_profitability cascade;
drop view if exists public.v_repair_sla_alerts cascade;
drop view if exists public.v_technician_performance cascade;
drop view if exists public.v_repair_job_board cascade;

-- Drop all triggers
drop trigger if exists touch_system_settings_updated_at on public.system_settings;
drop trigger if exists touch_repair_jobs_updated_at on public.repair_jobs;
drop trigger if exists touch_deliveries_updated_at on public.deliveries;
drop trigger if exists touch_delivery_people_updated_at on public.delivery_people;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists sync_customer_lifetime_value_after_invoice on public.invoices;
drop trigger if exists touch_invoices_updated_at on public.invoices;
drop trigger if exists touch_quotations_updated_at on public.quotations;
drop trigger if exists touch_products_updated_at on public.products;
drop trigger if exists touch_labor_rates_updated_at on public.labor_rates;
drop trigger if exists touch_devices_updated_at on public.devices;
drop trigger if exists touch_device_colors_updated_at on public.device_colors;
drop trigger if exists touch_device_models_updated_at on public.device_models;
drop trigger if exists touch_device_brands_updated_at on public.device_brands;
drop trigger if exists touch_customers_updated_at on public.customers;
drop trigger if exists touch_profiles_updated_at on public.profiles;

-- Drop all tables in reverse dependency order
drop table if exists public.system_settings;
drop table if exists public.repair_job_parts;
drop table if exists public.repair_job_updates;
drop table if exists public.repair_job_photos;
drop table if exists public.repair_jobs;
drop table if exists public.delivery_tracking_events;
drop table if exists public.deliveries;
drop table if exists public.delivery_people;
drop table if exists public.invoice_items;
drop table if exists public.invoices;
drop table if exists public.quotation_items;
drop table if exists public.quotations;
drop table if exists public.inventory_logs;
drop table if exists public.products;
drop table if exists public.devices;
drop table if exists public.labor_rates;
drop table if exists public.device_colors;
drop table if exists public.device_models;
drop table if exists public.device_brands;
drop table if exists public.customers;
drop table if exists public.profiles;

-- Drop all functions
drop function if exists public.handle_new_auth_user();
drop function if exists public.sync_customer_lifetime_value();
drop function if exists public.set_updated_at();

-- Drop all sequences
drop sequence if exists public.repair_job_number_seq;
drop sequence if exists public.invoice_number_seq;
drop sequence if exists public.quotation_number_seq;
drop sequence if exists public.product_number_seq;
drop sequence if exists public.customer_number_seq;

-- Drop all types
drop type if exists public.note_visibility;
drop type if exists public.repair_priority;
drop type if exists public.repair_status;
drop type if exists public.delivery_status;
drop type if exists public.delivery_stage;
drop type if exists public.invoice_status;
drop type if exists public.payment_mode;
drop type if exists public.quotation_status;
drop type if exists public.inventory_change_reason;
drop type if exists public.license_type;
drop type if exists public.product_status;
drop type if exists public.product_type;
drop type if exists public.user_role;

-- Drop extension
drop extension if exists pgcrypto;

-- Verify cleanup
select 'Cleanup complete. All tables, views, functions, types, and sequences removed.' as status;
