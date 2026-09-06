-- Keep public.profiles.email in sync when the email is changed in Supabase Auth.
--
-- The public.profiles_user_self_update RLS policy intentionally forbids clients
-- from changing the email column of their own profile row (it locks role, email,
-- and is_active). Email changes therefore flow through supabase.auth.updateUser(),
-- and this trigger propagates the confirmed auth email back into public.profiles
-- so the app (which reads identity from profiles) stays consistent.
--
-- The trigger fires after auth.users.email is updated; when "Confirm email" is
-- enabled in the Supabase dashboard, that happens once the user clicks the link
-- sent to the new address.

create or replace function public.handle_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email = new.email,
         updated_at = now()
   where auth_user_id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row
execute function public.handle_auth_user_update();