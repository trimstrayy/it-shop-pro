# Development Updates — managER

**Last Updated:** September 6, 2026

---

## 📋 Project Overview

**managER** is a comprehensive Inventory & Business Management System designed for IT gadget and software retail businesses. The application supports dual operational workflows: Shop Management and Lab (Repair) Management.

**Tech Stack:**
- Frontend: React 18, TypeScript, Tailwind CSS, Shadcn/ui, Vite
- Backend: Supabase (PostgreSQL)
- State Management: React Context + TanStack Query
- Authentication: Supabase Auth
- Deployment: Staging environment with `VITE_APP_NAME="Staging Test"`

---

## 🎯 Current Development Stage

### Phase: **Supabase Migration & Multi-Tenant Setup**

The application is transitioning from hardcoded mock data to a Supabase-backed database with multi-tenant architecture and role-based access control.

---

## ✅ Completed Features

### Authentication & Authorization
- ✅ Email-based login with Supabase Auth
- ✅ Role-based access control (RBAC) with 6 user roles:
  - **Shop Roles:** Admin, Sales, Inventory, Accountant
  - **Lab Roles:** Admin, Technician
- ✅ Session persistence and automatic redirects
- ✅ Password reset functionality
- ✅ Auth email sync between auth.users and profiles table
- ✅ Multi-tenant auth triggers for proper tenant isolation

### Shop Management Module
- ✅ **Products** - Comprehensive product management with filters, search, and bulk label printing
  - Hardware/Software classification
  - Stock tracking with status badges (In Stock, Low Stock, Out of Stock)
  - Product archival (soft delete)
  - Barcode/QR code generation with JSBarcode

- ✅ **Inventory** - Real-time stock level management
  - Stock adjustment tracking
  - Inventory logs with audit trail

- ✅ **Quotations** - Complete quotation workflow
  - Draft, sent, and converted quotations
  - Line item management
  - PDF preview generation

- ✅ **Billing/Invoicing** - Invoice management and payment tracking
  - Multiple payment modes (Cash, Online, Bank)
  - Invoice status tracking (Draft, Sent, Paid, Overdue)
  - Payment history
  - Revenue analytics by payment mode

- ✅ **Dashboard** - Business analytics and KPIs
  - Active products count
  - Low stock alerts
  - Total revenue with trend indicators
  - Revenue breakdown by payment mode
  - Pending invoices and quotations
  - Recent activity feeds

- ✅ **Reports** - Business performance analysis
  - Daily records reporting
  - Revenue trends
  - Inventory movements

- ✅ **Credits System** - Customer credit management
  - Credit balance tracking
  - Payment status monitoring (Pending, Paid, Overdue)
  - Credit reminders and notifications
  - Modal gates for credit payment validation

### Lab Management Module
- ✅ **Lab Page** - Repair job dashboard (in development)
  - Technician-focused interface
  - Device repair workflows
  - Repair job tracking and photos
  - Parts management

### Settings & Administration
- ✅ **User Management** - Admin user CRUD operations
- ✅ **Settings Page** - Application settings
- ✅ **Category Management** - Product category administration
  - IT Shop-specific categories
  - Furniture categories (furniture business support)

### Delivery Management
- ⏳ **Deliveries** - Coming Soon
  - Delivery tracking
  - Order fulfillment pipeline

---

## 🔄 Recent Migrations (September 3-6, 2026)

| Date | Migration | Purpose |
|------|-----------|---------|
| 2026-09-03 | `20260903000000_multi_tenant_auth_trigger.sql` | Multi-tenant auth trigger setup for proper tenant isolation |
| 2026-09-05 | `20260905000000_it_shop_category_fields.sql` | Added IT Shop-specific product category fields |
| 2026-09-05 | `20260905020000_get_my_product_categories.sql` | Created function to fetch user's accessible categories |
| 2026-09-05 | `20260905030000_seed_empty_furniture_categories.sql` | Seeded furniture business category structure |
| 2026-09-06 | `20260906000000_sync_auth_email_to_profiles.sql` | Automated email sync from auth.users to profiles |
| 2026-09-06 | `20260906010000_credit_payment_status.sql` | Enhanced credit payment status tracking |

---

## 🗄️ Database Schema Highlights

### Core Tables
- **auth.users** - Supabase authentication (managed by Supabase)
- **profiles** - User profiles with roles and tenant association
- **products** - Product catalog with type (hardware/software)
- **product_categories** - Category taxonomy
- **quotations** - Sales quotations with status tracking
- **quotation_line_items** - Quotation line items
- **invoices** - Customer invoices
- **invoice_line_items** - Invoice line items
- **customers** - Customer information
- **inventory_logs** - Stock transaction audit trail
- **credit_balances** - Customer credit accounts
- **payment_history** - Credit payment tracking
- **repair_jobs** - Lab repair workflow items
- **repair_job_updates** - Activity logs for repairs
- **device_colors** - Device color options
- **device_brands** - Device brand catalog

### Row-Level Security (RLS)
- ✅ Implemented RLS policies for multi-tenant data isolation
- ✅ Auth-to-profile sync for proper user access control
- ✅ Role-based data filtering at database level

---

## 🚀 Current Features in Use

### Session Configuration
- **Environment:** Staging (`VITE_APP_NAME="Staging Test"`)
- **Supabase Project:** rqnkpgnsxljikhciojvi.supabase.co
- **Auth Mode:** Email/Password with Supabase Auth

### Role-Based Navigation
- **Admin & Technician** → Redirect to `/lab` on login
- **Sales, Inventory, Accountant** → Redirect to `/dashboard` on login
- **Sidebar Context Switching** → Admins can toggle between Shop and Lab sections

### Demo Accounts Available
- admin@itshop.com (Admin - Shop & Lab access)
- sales@itshop.com (Sales - Shop only)
- inventory@itshop.com (Inventory - Shop only)
- accountant@itshop.com (Accountant - Shop only)
- tech1@itshop.com, tech2@itshop.com, tech3@itshop.com (Technicians - Lab only)

---

## 📊 Application Routes & Access Control

| Route | Allowed Roles | Status |
|-------|---------------|--------|
| `/` | All | ✅ Index/Redirect |
| `/login` | All | ✅ Active |
| `/dashboard` | Shop roles | ✅ Active |
| `/products` | Shop roles | ✅ Active |
| `/inventory` | Shop roles | ✅ Active |
| `/quotations` | Shop roles | ✅ Active |
| `/billing` | Shop roles | ✅ Active |
| `/reports` | Shop roles | ✅ Active |
| `/credits` | Admin, Accountant | ✅ Active |
| `/categories` | Admin | ✅ Active |
| `/users` | Admin | ✅ Active |
| `/settings` | Shop roles | ✅ Active |
| `/lab` | Admin, Technician | ✅ Active |
| `/deliveries` | Shop roles | ⏳ Coming Soon |

---

## 🛠️ Technical Implementation Details

### State Management
- **AuthContext** - User authentication state and role management
- **DataContext** - Application-wide data fetching with React Query
- **Toast Notifications** - Radix UI toaster + Sonner sonner
- **Query Client** - TanStack Query for server state

### UI Components
- **Shadcn/ui** - Pre-built accessible component library
- **Radix UI** - Primitive components foundation
- **Lucide React** - Icon library
- **react-hook-form** - Form state management with validation
- **@hookform/resolvers** - Form validation resolvers

### Key Utilities
- **supabase.ts** - Supabase client initialization with config error handling
- **utils.ts** - Common utility functions
- **code-generators.ts** - Product code generation
- **creditReminders.ts** - Credit reminder logic
- **branding.ts** - Brand constants and theming

---

## 📦 Dependencies & Versions

**Core:**
- react@^18.3.1
- typescript (for type safety)
- vite (build tool)

**Supabase:**
- @supabase/supabase-js@^2.102.1
- @supabase/ssr@^0.10.0

**Data Management:**
- @tanstack/react-query@^5.83.0
- react-hook-form@^7.61.1

**UI & Styling:**
- tailwindcss
- @radix-ui/* (multiple packages)
- shadcn/ui
- lucide-react@^0.462.0
- embla-carousel-react@^8.6.0

**Utilities:**
- date-fns@^3.6.0
- jsbarcode@^3.12.3
- class-variance-authority@^0.7.1

---

## 🔮 Next Steps / Roadmap

### Immediate (In Progress)
- [ ] Complete Lab module implementation (repair job UI)
- [ ] Deliveries module development
- [ ] Enhanced credit reminder notifications

### Short Term (Next Sprint)
- [ ] Furniture business category full implementation
- [ ] Lab photo upload and storage
- [ ] Parts inventory for lab

### Medium Term
- [ ] SMS notifications integration (send-sms functions ready)
- [ ] Email notifications for invoices
- [ ] Advanced reporting and exports

### Long Term
- [ ] Multi-business deployment capability
- [ ] White-label customization
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)

---

## 📝 Deployment Notes

### Prerequisites
1. Supabase project created with proper environment variables
2. All SQL migrations run in order (00-05)
3. Frontend environment variables configured:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`

### Deployment Steps
1. Create Supabase project for each client
2. Run migrations in `supabase/` folder sequentially
3. Bootstrap first admin account via Supabase dashboard
4. Deploy frontend with environment variables
5. Test role-based access with demo accounts

### Build Commands
- **Development:** `bun run dev`
- **Production Build:** `bun run build`
- **Linting:** `bun run lint`
- **Smoke Tests:** `bun run test:reports`

---

## 🎨 UI/UX Features

- **Responsive Design** - Mobile-first Tailwind CSS
- **Dark/Light Theme** - Next-themes integration
- **Accessibility** - WCAG compliant with Radix primitives
- **Real-time Updates** - React Query with automatic refetching
- **Label Printing** - Barcode generation and print-ready layouts
- **Modal Workflows** - Dialog-based credit reminders and confirmations
- **Toast Notifications** - Non-intrusive user feedback

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Configuration Error on Startup** → Check `.env.local` for required variables
2. **RLS Policy Errors** → Verify Supabase RLS policies are enabled
3. **Auth Sync Issues** → Run `20260906000000_sync_auth_email_to_profiles.sql` migration
4. **Multi-tenant Issues** → Verify `20260903000000_multi_tenant_auth_trigger.sql` is applied

### Debug Mode
- Check browser console for API errors
- Enable Supabase real-time logging
- Review Network tab for failed requests

---

## 📚 Documentation Files

- **README.md** - Project overview and features
- **DEPLOYMENT.md** - Deployment instructions
- **functions.md** - Feature documentation by page
- **MIGRATION_GUIDE.md** - Database migration guide
- **skills-lock.json** - Copilot skill configurations

---

**Status:** 🟡 **In Active Development** — Core shop features complete, lab module and deliveries in progress.
