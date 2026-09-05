-- Backfill the former IT-Shop-specific product fields as category schemas.
-- The IT tenant is identified by its existing Laptops category, so no rows are
-- created for furniture or other tenants.

do $$
declare
  it_tenant_id uuid;
begin
  select tenant_id into it_tenant_id
  from public.product_categories
  where lower(name) = 'laptops'
  limit 1;

  if it_tenant_id is null then
    return;
  end if;

  -- Support date-valued dynamic fields where the retrofit created a field_type check.
  begin
    alter table public.category_field_schemas drop constraint if exists category_field_schemas_field_type_check;
    alter table public.category_field_schemas
      add constraint category_field_schemas_field_type_check
      check (field_type in ('text', 'number', 'select', 'date'));
  exception when duplicate_object then null;
  end;

  insert into public.category_field_schemas
    (tenant_id, category_id, field_key, field_label, field_type, field_options, is_required, sort_order, is_active)
  select
    it_tenant_id, category.id, fields.field_key, fields.field_label, fields.field_type,
    '[]'::jsonb, false, fields.sort_order, true
  from public.product_categories category
  cross join (values
    ('supplier', 'Supplier', 'text', 10),
    ('warranty_months', 'Warranty (months)', 'number', 20)
  ) as fields(field_key, field_label, field_type, sort_order)
  where category.tenant_id = it_tenant_id
    and category.name in (
      'Laptops', 'Desktops', 'Monitors', 'Keyboards', 'Mice', 'Storage', 'RAM',
      'Graphics Cards', 'Networking', 'Accessories', 'Cables', 'Peripherals',
      'Mobile Covers', 'Chargers', 'Wraps & Skins', 'Ambient Lights',
      'Screen Protectors', 'Power Banks', 'Earphones & Headphones'
    )
    and not exists (
      select 1 from public.category_field_schemas existing
      where existing.tenant_id = it_tenant_id
        and existing.category_id = category.id
        and existing.field_key = fields.field_key
    );

  insert into public.category_field_schemas
    (tenant_id, category_id, field_key, field_label, field_type, field_options, is_required, sort_order, is_active)
  select
    it_tenant_id, category.id, fields.field_key, fields.field_label, fields.field_type,
    '[]'::jsonb, false, fields.sort_order, true
  from public.product_categories category
  cross join (values
    ('license_type', 'License Type', 'text', 10),
    ('expiry_date', 'Expiry Date', 'date', 20)
  ) as fields(field_key, field_label, field_type, sort_order)
  where category.tenant_id = it_tenant_id
    and category.name in ('Software Licenses', 'Antivirus', 'Office Suite', 'Operating Systems')
    and not exists (
      select 1 from public.category_field_schemas existing
      where existing.tenant_id = it_tenant_id
        and existing.category_id = category.id
        and existing.field_key = fields.field_key
    );
end;
$$;
