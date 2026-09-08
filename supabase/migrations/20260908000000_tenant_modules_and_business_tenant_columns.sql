-- Keep module availability and all new business writes tenant-scoped.
alter table public.tenants
  add column if not exists enabled_modules jsonb not null default jsonb_build_object(
    'repair_lab', true,
    'deliveries', true,
    'quotations', true,
    'parties', true,
    'credit_management', true
  );

alter table public.quotations add column if not exists tenant_id uuid references public.tenants(id);
alter table public.quotation_items add column if not exists tenant_id uuid references public.tenants(id);
alter table public.invoices add column if not exists tenant_id uuid references public.tenants(id);
alter table public.invoice_items add column if not exists tenant_id uuid references public.tenants(id);
alter table public.delivery_people add column if not exists tenant_id uuid references public.tenants(id);
alter table public.deliveries add column if not exists tenant_id uuid references public.tenants(id);
alter table public.delivery_tracking_events add column if not exists tenant_id uuid references public.tenants(id);
alter table public.repair_jobs add column if not exists tenant_id uuid references public.tenants(id);
alter table public.inventory_logs add column if not exists tenant_id uuid references public.tenants(id);

create index if not exists quotations_tenant_id_idx on public.quotations(tenant_id);
create index if not exists quotation_items_tenant_id_idx on public.quotation_items(tenant_id);
create index if not exists invoices_tenant_id_idx on public.invoices(tenant_id);
create index if not exists invoice_items_tenant_id_idx on public.invoice_items(tenant_id);
create index if not exists delivery_people_tenant_id_idx on public.delivery_people(tenant_id);
create index if not exists deliveries_tenant_id_idx on public.deliveries(tenant_id);
create index if not exists delivery_tracking_events_tenant_id_idx on public.delivery_tracking_events(tenant_id);
create index if not exists repair_jobs_tenant_id_idx on public.repair_jobs(tenant_id);
create index if not exists inventory_logs_tenant_id_idx on public.inventory_logs(tenant_id);
