# Route3 Supabase Migration Guide

Complete step-by-step instructions for migrating Route3 from hardcoded mock data to a Supabase-backed database.

## Migration Files Overview

This migration uses 4 SQL files (run in order):

| File | Purpose | Action |
|------|---------|--------|
| **00_cleanup.sql** | Remove existing schema | Run ONLY if you need to reset an existing database |
| **01_schema.sql** | Create all tables, functions, triggers | ALWAYS run first (or after cleanup) |
| **02_seed_data.sql** | Populate demo data | ALWAYS run second |
| **03_integrity_check.sql** | Verify all data loaded | ALWAYS run third |

---

## Step 1: Reset Database (Optional)

**Only run this if you have an existing schema to clean up:**

```
File: 00_cleanup.sql
Purpose: Drops all tables, functions, types, and sequences
```

⚠️ **WARNING**: This will delete ALL existing data. Only use if you need to start fresh.

Copy the contents of `00_cleanup.sql` and paste it into Supabase SQL Editor, then click **Run**.

---

## Step 2: Create Schema

**Always run this first (or after cleanup):**

```
File: 01_schema.sql
Purpose: Creates all database tables, functions, triggers, indexes, and views
```

This file contains:
- PostgreSQL enums (user_role, product_type, etc.)
- 5 sequences for auto-incrementing IDs
- 21 main tables
- 3 utility functions
- 14 triggers (for updated_at tracking, customer lifetime value sync, auth sync)
- 11 indexes (for common lookups)
- 4 analytics views
- Public grants for anon/authenticated Supabase roles

**Copy the entire contents of `01_schema.sql` into Supabase SQL Editor and click Run.**

Expected output: "Schema created successfully. Run 02_seed_data.sql next."

---

## Step 3: Seed Demo Data

**Run this after schema creation:**

```
File: 02_seed_data.sql
Purpose: Loads demo data for development/testing
```

This file uses `\gset` to generate consistent UUIDs across all tables and inserts:

**Profiles (7 users):**
- admin@itshop.com (admin)
- sales@itshop.com (sales)
- inventory@itshop.com (inventory)
- accountant@itshop.com (accountant)
- tech1@itshop.com, tech2@itshop.com, tech3@itshop.com (technicians)

**Inventory:**
- 5 device brands (Apple, Samsung, Google, Xiaomi, OnePlus)
- 6 device colors (Black, White, Blue, Silver, Graphite, Gold)
- 5 labor rates (Screen Replacement, Battery Swap, Water Damage, Charging Port, Camera)
- 29 hardware products (laptops, accessories, cables, chargers, etc.)
- 4 software products (Office 365, Antivirus, Creative Cloud, Windows 11)

**Transactions:**
- 5 customers with contact info
- 2 quotations with line items
- 2 invoices (one paid, one pending) with line items
- 3 deliveries with 9 tracking events
- 4 inventory logs

**Repair Workflow:**
- 5 repair jobs with various statuses (to_do, in_progress, waiting, quality_check, ready)
- 3 repair job updates (activity log)
- 3 repair job photos
- 2 repair job parts consumed

**Copy the entire contents of `02_seed_data.sql` into Supabase SQL Editor and click Run.**

Expected output: "Seed data inserted successfully. Run 03_integrity_check.sql to verify."

---

## Step 4: Verify Data

**Run this to confirm everything loaded correctly:**

```
File: 03_integrity_check.sql
Purpose: Runs verification queries and reports record counts
```

This file generates:
- ✓ Record count for all 21 tables
- ✓ Demo account list (ready for Supabase Auth)
- ✓ Product inventory summary
- ✓ Sales summary from invoices
- ✓ Repair job status distribution
- ✓ Technician workload breakdown
- ✓ Customer lifetime value
- ✓ Delivery status overview
- ✓ Foreign key integrity checks (orphaned records)

**Copy the entire contents of `03_integrity_check.sql` into Supabase SQL Editor and click Run.**

Expected output: Tables populated with zero orphaned records, all foreign keys intact.

---

## Step 5: Set Environment Variables

After schema migration, configure your app to connect to Supabase:

1. Create `.env` in the Route3 project root:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Get these values from Supabase:
   - Log into Supabase Dashboard → Project Settings → API
   - Copy **Project URL** and **Anon Key**

---

## Step 6: Create Supabase Auth Users

The schema creates demo profiles, but **Supabase Auth users must be created separately**.

### Option A: Supabase Dashboard (Manual)

1. Go to Supabase Dashboard → Authentication → Users
2. Click **Add user**
3. For each email below, create the auth user with the exact same email address as the profile row:
   - `admin@itshop.com`
   - `sales@itshop.com`
   - `inventory@itshop.com`
   - `accountant@itshop.com`
   - `tech1@itshop.com`
   - `tech2@itshop.com`
   - `tech3@itshop.com`
   - Password: Set a test password
   - Click **Create user**

Demo accounts:

Password map:
- `admin@itshop.com` / `admin`
- `sales@itshop.com` / `sales`
- `inventory@itshop.com` / `inventory`
- `accountant@itshop.com` / `accountant`
- `tech1@itshop.com` / `tech1`
- `tech2@itshop.com` / `tech2`
- `tech3@itshop.com` / `tech3`

**ℹ️ NOTE**: The `handle_new_auth_user` trigger will automatically create a profiles table entry with the matching email once you create auth users.

**Important**: If you create an auth user with the wrong email, the profiles table will show that wrong email too. Delete the bad auth user and recreate it with the exact email above. For example, do not use `tech2@gmail.com` if the profile row is `tech2@itshop.com`.

### Option B: Supabase SQL (Automated)

Use Supabase's Auth Admin API (requires bearer token):

```bash
curl -X POST 'https://your-project-id.supabase.co/auth/v1/admin/users' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@itshop.com",
    "password": "SecurePassword123!",
    "user_metadata": {
      "name": "John Admin",
      "role": "admin"
    }
  }'
```

---

## Step 7: Verify Database Connection from App

1. Start the development server:
   ```bash
   bun dev
   ```

2. Login page should now load demo accounts dynamically from the profiles table

3. Click on any demo account, then enter password (from Step 6)

4. After login:
   - Dashboard should display real invoice/quotation data
   - Inventory page should show real products from database
   - Lab page should display repair jobs with technician assignments
   - Reports should derive analytics from live transaction history

---

## Troubleshooting

### "Column 'name' does not exist" Error

**Cause**: Schema not migrated yet.

**Fix**:
1. Ensure `01_schema.sql` ran successfully
2. Check Supabase SQL Editor for error messages
3. Run `01_schema.sql` again

### "UUIDs don't match" Error on Seed

**Cause**: Using old `02_seed_data.sql` format.

**Fix**:
1. Delete the old seed file
2. Use the new seed file from this guide
3. The new seed uses `\gset` variable substitution for consistent UUIDs

### Auth Users Not Syncing to Profiles

**Cause**: `handle_new_auth_user` trigger either not created or not firing.

**Fix**:
1. Verify trigger exists: `select * from information_schema.triggers where trigger_name = 'on_auth_user_created';`
2. Check trigger is on `auth.users` table (not `public.profiles`)
3. Manually sync a user: Insert into `profiles` with matching auth_user_id

### Can't Login with Demo Accounts

**Cause**: Auth users not created yet.

**Fix**:
1. Go to Supabase Dashboard → Authentication → Users
2. Create auth users for each demo email (see Step 6)
3. Try login again

### Profile Table Shows Wrong Emails

**Cause**: Auth users were created with a different email than the seeded profile row.

**Fix**:
1. Delete the incorrect auth users in Supabase Authentication
2. Delete the incorrect profile rows if they already exist
3. Recreate the auth users with the exact demo emails listed in Step 6
4. Confirm the profile table now shows only the `@itshop.com` addresses

---

## Database Schema Highlights

### New Columns in Existing Tables

Profiles table now has:
- `auth_user_id uuid unique` — Links to Supabase Auth users
- Automatically populated by `handle_new_auth_user()` trigger

### Referential Integrity

All foreign keys cascade on delete:
- Delete customer → Devices, Quotations, Invoices, Repair Jobs deleted
- Delete invoice → Invoice Items, Deliveries deleted
- Delete repair job → Photos, Updates, Parts deleted

### Automatic Timestamps

All tables have:
- `created_at` — Set once, never updated
- `updated_at` — Auto-updated by trigger on every row modification
- `paid_at` — Set when invoice marked as paid

### Customer Lifetime Value Auto-Sync

When invoice status changes to 'paid':
- Trigger automatically adds `grand_total` to customer's `lifetime_value`
- Prevents stale/inconsistent customer metrics

---

## Next Steps After Migration

1. **RLS Policies** (Row-Level Security):
   - Currently all anon/authenticated can read+write all tables
   - Recommend adding policies for production (users can only see own records)

2. **Wire Data Mutations**:
   - Create/update operations still use in-memory state
   - Connect forms to Supabase inserts/updates

3. **Implement Backup Strategy**:
   - Set up scheduled Supabase backups
   - Test recovery procedures

4. **API Key Rotation**:
   - Store SUPABASE_ANON_KEY in environment variables, not committed to git
   - Service role key never exposed to frontend

---

## SQL File Locations

```
d:\PROJECTS\ROUTE3\supabase\
  ├── 00_cleanup.sql           (Drop everything)
  ├── 01_schema.sql            (Create tables/functions/triggers)
  ├── 02_seed_data.sql         (Load demo data)
  ├── 03_integrity_check.sql   (Verify all data)
  └── route3_full_system_schema.sql  (Backup of 01_schema)
```

---

## Support

If you encounter issues:

1. **Check Supabase Logs**: Dashboard → Logs → Database
2. **Verify Credentials**: Dashboard → Settings → API
3. **Review Error Messages**: Copy exact error message and search Supabase docs
4. **Database Status**: Dashboard → Databases → Check for alerts
5. **Foreign Key Errors**: Ensure parent records exist before inserting children

---

## Success Criteria

After completing all steps, Route3 should:

✅ Load demo accounts dynamically from profiles table  
✅ Display real products in inventory  
✅ Show real invoices/quotations in dashboard  
✅ Calculate reports from live transaction data  
✅ Display repair jobs with technician assignments  
✅ All data persists across app restarts  
✅ Login and logout work with Supabase Auth  
✅ No mock data hardcoded in app  

**Date Completed**: [Your date]  
**Migrator**: [Your name]  
**Supabase Project**: [Your project URL]
