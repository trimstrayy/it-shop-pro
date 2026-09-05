-- Return categories for the authenticated user's tenant.
-- The tenant is derived from auth.uid() inside the database; the browser
-- cannot choose or override it.

create or replace function public.get_my_product_categories()
returns setof public.product_categories
language sql
security definer
stable
set search_path = public
as $$
  select category.*
  from public.product_categories category
  join public.profiles profile on profile.tenant_id = category.tenant_id
  where profile.auth_user_id = auth.uid()
    and profile.is_active = true
    and category.is_active = true
  order by category.sort_order, category.name;
$$;

grant execute on function public.get_my_product_categories() to authenticated;

notify pgrst, 'reload schema';
