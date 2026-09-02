# Deployment Guide

This repository is designed to be deployed as a separate client app for each Supabase project. Do not share one Supabase project across multiple clients. Each deployment should have its own environment variables and its own database.

## 1. Create a new Supabase project

1. In the Supabase dashboard, create a new project for the client.
2. Copy the new project URL and anon key.
3. Keep the service role key only in the Supabase project secrets / Edge Function environment. Do not put it in the browser or in frontend env vars.
4. Enable Email Auth if you want invitation emails to work automatically for new user creation.

## 2. Run the SQL migrations in order

Run each file in this order from the `supabase/` folder:

1. `00_cleanup.sql`
2. `01_schema.sql`
3. `02_seed_data.sql`
4. `03_integrity_check.sql`
5. `04_rls_policies.sql`
6. `05_credit_management.sql`

This creates the base schema, triggers, seed data, integrity checks, auth/profile access policies, credit balances, payment history, and SMS logs.

## 3. Set environment values for the new deployment

Create a `.env` file at the project root with the following values:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_NAME=Your Business Name
```

Do not add service-role secrets to the frontend. The app intentionally fails at startup if these frontend variables are missing or blank.

## 4. Bootstrap the first admin account

Because the in-app user creation flow requires an existing admin user to be logged in, the first account must be created once manually.

1. Open the Supabase dashboard.
2. Go to Authentication → Users.
3. Create the first auth user with the admin email address you want to use.
4. Copy the created user UUID from `auth.users.id`.
5. Insert the matching `profiles` row:

```sql
INSERT INTO public.profiles (auth_user_id, email, name, role, is_active)
VALUES (
  '<auth-user-id-from-dashboard>',
  'admin@yourcompany.com',
  'Primary Admin',
  'admin',
  true
);
```

If the auth trigger is enabled, the profile row should also be created automatically on the first sign-up. The manual insert is the safe fallback for this one-time bootstrap step.

## 5. Verify login and then use the app for all remaining users

1. Start the app.
2. Sign in with the first admin account.
3. Open the User Management page.
4. Create additional staff accounts using the admin-only account creation flow.
5. Assign roles and toggle active/inactive state as needed.
6. Trigger password reset emails from the User Management screen whenever needed.

## 6. Deploy SMS notifications

```bash
npx supabase functions deploy send-sms
npx supabase secrets set SPARROW_SMS_TOKEN=<provider-token> SPARROW_SMS_FROM=ITGADGET
```

`SPARROW_SMS_TOKEN` is required. `SPARROW_SMS_FROM` is optional and defaults to `ITGADGET`.

## 7. Operational notes

- Each client deployment gets its own Supabase project and distinct `.env` configuration.
- The app does not use a shared multi-tenant `tenant_id` model.
- `profiles.is_active` is enforced server-side by the application logic and the session bootstrap flow so deactivated users are signed out immediately.
- The Edge Function used for user creation verifies the caller is an authenticated admin before it can create any user.
