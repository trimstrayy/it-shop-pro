-- Make Auth-created profiles tenant-aware. The create-user Edge Function
-- supplies this metadata only after deriving tenant_id server-side.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    auth_user_id, email, name, role, tenant_id, is_platform_admin, is_active
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'sales'),
    nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid,
    coalesce((new.raw_user_meta_data->>'is_platform_admin')::boolean, false),
    true
  )
  on conflict (email) do update set
    auth_user_id = excluded.auth_user_id,
    name = excluded.name,
    role = excluded.role,
    tenant_id = excluded.tenant_id,
    is_platform_admin = excluded.is_platform_admin,
    is_active = true,
    updated_at = now();

  return new;
end;
$$;
