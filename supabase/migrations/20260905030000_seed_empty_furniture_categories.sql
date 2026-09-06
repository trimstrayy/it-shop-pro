-- Seed empty furniture tenants from the existing furniture category catalog.
-- This preserves tenant isolation: categories are copied only into tenants whose
-- business name is furniture and which currently have no category rows.

do $$
declare
  source_tenant_id uuid;
  target_tenant record;
  source_category record;
  target_category_id uuid;
begin
  select pc.tenant_id into source_tenant_id
  from public.product_categories pc
  where lower(pc.name) = 'pvc carpet'
  order by pc.created_at
  limit 1;

  if source_tenant_id is null then
    return;
  end if;

  for target_tenant in
    select t.id
    from public.tenants t
    where lower(t.business_name) like '%furniture%'
      and not exists (
        select 1 from public.product_categories existing where existing.tenant_id = t.id
      )
  loop
    for source_category in
      select *
      from public.product_categories
      where tenant_id = source_tenant_id
      order by sort_order, name
    loop
      target_category_id := gen_random_uuid();

      insert into public.product_categories (
        id, tenant_id, name, default_unit_of_measure, default_is_cut_to_order,
        sort_order, is_active
      ) values (
        target_category_id, target_tenant.id, source_category.name,
        source_category.default_unit_of_measure, source_category.default_is_cut_to_order,
        source_category.sort_order, source_category.is_active
      );

      insert into public.category_field_schemas (
        id, category_id, field_key, field_label, field_type, field_options,
        is_required, sort_order
      )
      select
        gen_random_uuid(), target_category_id, field_key, field_label, field_type,
        field_options, is_required, sort_order
      from public.category_field_schemas
      where category_id = source_category.id;
    end loop;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
