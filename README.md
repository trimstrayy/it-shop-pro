<div align="center">

# 📦 managER — IT Shop Management System

**A comprehensive Inventory & Business Management System designed for IT gadget and software retail businesses.**

Built with **React 18** · **TypeScript** · **Tailwind CSS** · **Shadcn/ui** · **Vite**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [User Roles & Permissions](#user-roles--permissions)
- [Application Pages](#application-pages)
  - [Login](#-login-page)
  - [Dashboard](#-dashboard)
  - [Products](#-products)
  - [Product Form](#-product-form)
  - [Inventory](#-inventory)
  - [Quotations](#-quotations)
  - [Quotation Form](#-quotation-form)
  - [Quotation Preview](#-quotation-preview)
  - [Billing / Invoicing](#-billing--invoicing)
  - [Deliveries](#-deliveries)
  - [Reports](#-reports)
  - [Settings](#%EF%B8%8F-settings)
- [Business Workflows](#business-workflows)
- [Data Models](#data-models)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)

---

## Overview

**managER** is a single-page application that covers the entire lifecycle of an IT retail operation — from cataloguing hardware/software products and managing stock, through generating quotations and invoices, to tracking deliveries and analysing business performance via reports.

The application uses **role-based access control** with four distinct user roles (Admin, Sales, Inventory, Accountant), each seeing only the sidebar links and features relevant to their responsibilities.

All data is currently managed via an in-memory mock data layer with React Context, making it easy to swap in a real API backend in the future.

---

## Key Features

| Area | Highlights |
|---|---|
| **Products** | Hardware & software product catalogue, auto-generated product codes & barcodes, bulk sticky-label printing (50 mm × 30 mm, CODE128) |
| **Inventory** | Real-time stock tracking, low-stock & out-of-stock alerts, full inventory audit log with change reasons |
| **Quotations** | Create, preview, and send quotations; one-click conversion to invoice; PDF-ready print layout |
| **Billing** | Invoice creation with product search, per-item discount & tax, multiple payment modes (Cash / Online / Bank), profit calculation |
| **Deliveries** | 6-stage delivery tracking pipeline, driver assignment, return management, delivery tracking sheet |
| **Reports** | Revenue & profit dashboards, sales charts (Recharts), product performance, hardware vs software revenue split |
| **Settings** | Company info, user profile, notification preferences, system preferences, backup & security options |
| **Auth** | Email/password login, persistent sessions via `localStorage`, role-based navigation filtering |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) |
| Build Tool | [Vite 5](https://vitejs.dev/) (SWC plugin) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate) |
| UI Components | [Shadcn/ui](https://ui.shadcn.com/) (Radix primitives under the hood) |
| Routing | [React Router DOM 6](https://reactrouter.com/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation |
| Charts | [Recharts 2](https://recharts.org/) |
| Barcode Gen | [JsBarcode](https://github.com/lindell/JsBarcode) (CODE128) |
| Data Fetching | [TanStack React Query 5](https://tanstack.com/query) |
| Date Utilities | [date-fns 3](https://date-fns.org/) |
| Toasts | [Sonner](https://sonner.emilkowal.ski/) + Radix Toast |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Getting Started

### Prerequisites

- **Node.js ≥ 18** (recommended) — or use [Bun](https://bun.sh/) (a `bun.lockb` is included)
- **npm**, **yarn**, or **bun** package manager

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd managER

# 2. Install dependencies
npm install        # or: bun install

# 3. Start the development server
npm run dev        # or: bun dev
```

The app will be available at **http://localhost:5173** (default Vite port).

### Production Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

---

## Demo Accounts

All demo accounts share the same password: **`password`**

| Email | Role | Access |
|---|---|---|
| `admin@itshop.com` | **Admin** | Full access to every module |
| `sales@itshop.com` | **Sales** | Dashboard, Quotations, Billing, Deliveries |
| `inventory@itshop.com` | **Inventory** | Dashboard, Products, Inventory, Deliveries |
| `accountant@itshop.com` | **Accountant** | Dashboard, Reports |

The login page shows clickable demo account cards for quick access.

---

## User Roles & Permissions

| Module | Admin | Sales | Inventory | Accountant |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | — | ✅ | — |
| Inventory | ✅ | — | ✅ | — |
| Quotations | ✅ | ✅ | — | — |
| Billing | ✅ | ✅ | — | — |
| Deliveries | ✅ | ✅ | ✅ | — |
| Reports | ✅ | — | — | ✅ |
| Settings | ✅ | — | — | — |

The sidebar dynamically shows only the links a user's role is permitted to see. Admin always has full access.

---

## Application Pages

### 🔐 Login Page

**Route:** `/login`

- Email + password authentication form
- Persistent session stored in `localStorage`
- Error feedback for invalid credentials
- Demo account quick-select cards with role descriptions
- Redirects to `/dashboard` on successful login

---

### 📊 Dashboard

**Route:** `/dashboard`

The central overview of the business with live stat cards and recent activity.

#### Stat Cards
| Card | Description |
|---|---|
| **Active Products** | Total number of active products in the catalogue |
| **Low Stock Alert** | Count of products whose stock ≤ 5 units |
| **Total Revenue** | Sum of all **paid** invoices, with a clickable breakdown by payment mode (Cash / Online / Bank) |
| **Pending Invoices** | Count and total value of unpaid invoices |
| **Pending Quotations** | Count of quotations in `draft` or `sent` status |
| **Pending Deliveries** | Count of deliveries currently in progress |

#### Revenue Breakdown Dialog
Clicking the Total Revenue card opens a modal showing:
- Cash payments — count + total amount
- Online payments — count + total amount
- Bank transfers — count + total amount
- Combined total with icons

#### Recent Activity Tables
- **Recent Invoices** — last 5 invoices with status badges and quick-view actions
- **Recent Quotations** — last 5 quotations with quick actions

---

### 📦 Products

**Route:** `/products`

Complete product catalogue management for both **hardware** and **software** items.

#### Filtering & Search
- **Type filter** — Hardware / Software / All
- **Category filter** — 23 predefined categories (Laptops, Desktops, Monitors, Keyboards, Mice, Storage, RAM, Graphics Cards, Networking, Software Licenses, Antivirus, Office Suite, Operating Systems, Accessories, Cables, Peripherals, Mobile Covers, Chargers, Wraps & Skins, Ambient Lights, Screen Protectors, Power Banks, Earphones & Headphones)
- **Status filter** — Active / Inactive
- **Text search** — matches product name, product code, barcode, or category
- **Clear all filters** button

#### Product Table Columns
| Column | Details |
|---|---|
| Product Code | Auto-generated unique ID (e.g. `HW-LAP-001`, `SW-ANT-002`), displayed in monospace |
| Product Name | Name with category subtitle |
| Type | Hardware / Software badge |
| Price | Selling price (NPR) with cost price shown below |
| Stock / Licenses | Quantity with colour-coded badge — 🟢 In Stock, 🟡 Low Stock (≤ 5), 🔴 Out of Stock |
| Status | Active / Inactive badge |

#### Per-Row Actions
- **View Details** — full product information dialog
- **Edit Product** — navigate to product edit form
- **Archive Product** — soft-delete (sets status to `inactive`)

#### Bulk Label Printing
1. Click **Print Labels**
2. Select one or more active products via checkboxes
3. Set the number of labels to print per product
4. Live preview of the label design:
   - Company header ("IT GADGET HUB")
   - Product name
   - Product code
   - CODE128 barcode + barcode number
   - Price in NPR
5. Output formatted for **50 mm × 30 mm** sticky labels
6. Print via browser print dialog

---

### 📝 Product Form

**Routes:** `/products/new` (create) · `/products/:id/edit` (edit)

#### Common Fields
| Field | Type | Notes |
|---|---|---|
| Product Name | Text | Required |
| Category | Dropdown | 23 predefined categories |
| Product Type | Toggle | Hardware / Software — determines which extra fields appear |
| Cost Price | Number | Required |
| Selling Price | Number | Required |
| Tax Percentage | Number | Default 18 % |
| Description | Textarea | Optional |
| Status | Toggle | Active / Inactive |

#### Hardware-Specific Fields
| Field | Notes |
|---|---|
| Stock Quantity | Current inventory count |
| Supplier | Supplier name |
| Warranty Period | Duration in months |

#### Software-Specific Fields
| Field | Notes |
|---|---|
| License Type | Single / Multi-user |
| License Quantity | Number of available licenses |
| Expiry Date | Optional license expiration |

#### Auto-Generated on Save
- **Product Code** — pattern based on type + category (e.g. `HW-LAP-003`)
- **Barcode** — unique 12-digit number

---

### 📋 Inventory

**Route:** `/inventory`

Two-tab view for monitoring stock health and reviewing the audit trail.

#### Stat Cards
| Stat | Description |
|---|---|
| In Stock | Products with quantity > 5 |
| Low Stock | Products with 1–5 units/licenses |
| Out of Stock | Products with 0 quantity |
| Total Software Licenses | Sum of all software license counts |

#### Tab 1 — Stock Status
Table showing every product with:
- Product code, name, category
- Type (Hardware / Software)
- Current stock or license count with colour-coded status badge

#### Tab 2 — Inventory Logs
Full audit trail of every stock movement:
| Column | Details |
|---|---|
| Date | Timestamp of the transaction |
| Product | Name of the affected product |
| Action | Reason — `sale`, `return`, `manual`, `adjustment`, `purchase` |
| Quantity | Positive (restock) or negative (sale) change |
| User | Who performed the action |
| Notes | Additional context (e.g. invoice number) |

Stock is **automatically updated** when invoices are created or cancelled.

---

### 💰 Quotations

**Route:** `/quotations`

#### Quotation List
Table of all quotations with columns:
- Quotation Number (auto-generated `QT-XXXX`)
- Client name & email
- Number of line items
- Grand total (NPR)
- Valid-until date
- Status badge — `Draft` / `Sent` / `Accepted` / `Rejected` / `Converted`
- Created date

#### Filtering
- Status filter dropdown
- Free-text search across quotation details

#### Per-Row Actions
- **View Preview** — formatted quotation document
- **Convert to Invoice** — one-click conversion (pre-fills billing form with client info & items)
- **Edit** — returns to the quotation form
- **Download / Print** — PDF-ready output

---

### 📝 Quotation Form

**Route:** `/quotations/new`

Side-by-side form + live preview layout.

#### Client Information Fields
- Client Name (required)
- Company Name (optional)
- Email (required)
- Phone (required)
- Address (required)
- Zip Code (optional)

#### Quotation Details
- Auto-generated quotation number (`QT-XXXX`)
- Default validity: 15 days
- Auto-populated creation date

#### Product Selection
- Search products by name, code, or barcode
- Browse all active products
- Click to add to quotation

#### Line Item Management
Each line item shows:
- Product name & code
- Editable quantity
- Editable unit price
- Tax percentage
- Discount percentage
- Auto-calculated line total
- Remove button

#### Calculations (live)
- Subtotal (sum before tax & discount)
- Total discount amount
- Total tax amount
- **Grand Total**

#### Additional
- Terms & notes textarea with a pre-filled payment-terms template
- **Save as Draft**, **Send Quotation**, **Print Preview**, **Download PDF**, **Cancel**

#### Live Preview Panel
- Real-time professional document preview
- Company branding header
- All client details, itemised table, totals, and terms
- Print-ready design

---

### 🔍 Quotation Preview

**Route:** `/quotations/:id`

Full-page, print-ready preview of an existing quotation showing all details — company header, client info, itemised table, totals, notes, and validity date.

---

### 🧾 Billing / Invoicing

**Route:** `/billing`

#### Invoice Creation Flow
1. **Enter client information** — name, email, phone, billing address
2. **Add products** — search by name, code, or barcode; browse and click to add
3. **Manage line items**:
   - Adjust quantity
   - Modify unit price
   - Set per-item discount (%)
   - Set per-item tax (%)
   - Remove items
   - Real-time line total calculation
4. **Review totals** — subtotal, discount, tax, grand total (NPR), live profit calculation
5. **Select payment mode** — Cash / Online Transfer / Bank Transfer
6. **Checkout** — confirmation dialog, then generates invoice (`INV-XXXX`)

#### Automatic Side-Effects on Invoice Creation
- **Inventory deducted** — stock/license quantity reduced per item
- **Inventory log entries** created for each product
- **Delivery records** created (one per line item), starting at `in_inventory` stage

#### Quotation → Invoice Conversion
- Select a quotation to convert
- Client info and all items are pre-populated
- Stock availability is validated in real time
- One-click conversion marks the quotation as `converted`

#### Invoice List
- Table of all invoices with status filter and search
- Status badges — `Pending` / `Paid` / `Cancelled`
- Per-row actions: **View**, **Print**, **Mark as Paid**, **Cancel**
- Cancelling an invoice **restores inventory** and logs the return

---

### 🚚 Deliveries

**Route:** `/deliveries`

#### Stat Cards
| Stat | Description |
|---|---|
| Pending | Deliveries awaiting dispatch |
| In Progress | Currently being delivered |
| Completed | Successfully delivered |

#### Delivery Table Columns
- Delivery ID
- Invoice number (linked)
- Client name & phone
- Delivery address
- Items / quantity
- Current stage (with icon)
- Assigned delivery person
- Status badge — `Pending` / `In Progress` / `Completed` / `Returned`
- Created date

#### Filtering
- Status filter dropdown
- Text search by delivery ID, client name, or invoice number

#### Delivery Stages Pipeline
| # | Stage | Meaning |
|---|---|---|
| 1 | `in_inventory` | Product ready for dispatch |
| 2 | `collected_by_driver` | Picked up by delivery person |
| 3 | `in_transit` | On the way to the destination |
| 4 | `arrived_at_location` | Arrived at the delivery address |
| 5 | `collected_by_receiver` | Handed over to customer (delivery complete) |
| 6 | `returned` | Returned to inventory |

#### Per-Row Actions
- **View Tracking Sheet** — visual timeline of all stages, delivery person details, client info, package details, timestamps, location updates, notes
- **Update Stage** — advance to the next stage with optional location & notes
- **Assign Driver** — dialog to enter driver name, phone, vehicle number
- **Mark Returned** — captures return reason, auto-restores inventory
- **Complete Delivery** — finalise and record actual delivery date

---

### 📈 Reports

**Route:** `/reports`

#### Overview Stat Cards
- Total Revenue
- Total Profit
- Hardware Revenue
- Software Revenue

#### Tab 1 — Sales Reports
- Monthly sales bar chart
- Revenue trend line chart
- Sales breakdown by product category
- Top-selling products table

#### Tab 2 — Profit Analysis
- Invoice-level profit table: invoice number, client, revenue, profit amount, profit margin %, date
- Profit margin trends
- Cost vs revenue comparative view

#### Tab 3 — Product Reports
- Inventory valuation (total value of all stock)
- Stock movement analysis (sold vs restocked)
- Product performance — top sellers, slow movers, out-of-stock analysis
- Category distribution of revenue

#### Charts & Visualisations (Recharts)
- Pie charts — Hardware vs Software revenue split
- Bar charts — monthly sales comparison
- Line charts — revenue trends over time
- Colour-coded data points for quick visual distinction

#### Export Options
- Print reports (print-friendly format)
- Export to PDF
- Date range filter
- Category filter

---

### ⚙️ Settings

**Route:** `/settings` *(Admin only)*

#### Company Information
- Company Name, Tax ID / VAT Number, Business Email, Phone, Address
- Save changes

#### User Profile
- Full name, email (read-only)
- Change password (current + new)
- Update profile

#### Notification Preferences
- Email notifications toggle
- Low-stock alerts
- Invoice reminders
- Delivery update notifications
- System update notifications

#### System Preferences
- Default tax rate
- Default payment terms
- Quotation validity period
- Currency (NPR)
- Date format
- Language

#### Backup & Data
- Export all data
- Import data from backup
- Clear cache
- Database status

#### Security
- Two-factor authentication toggle
- Active sessions management
- Password policy display
- Activity log

---

## Business Workflows

### 1. Product → Sale → Delivery (End-to-End)
```
Add Product ➜ Appears in Inventory ➜ Create Quotation (optional)
    ➜ Generate Invoice ➜ Payment Recorded ➜ Inventory Auto-Deducted
    ➜ Delivery Created ➜ Track Stages ➜ Delivery Completed
```

### 2. Quotation → Invoice Conversion
```
Create Quotation ➜ Send to Client ➜ Client Approves
    ➜ Convert to Invoice (one click) ➜ Process Payment
    ➜ Delivery Created ➜ Complete Transaction
```

### 3. Inventory Management Cycle
```
Monitor Stock (Inventory Page) ➜ Low-Stock Alert
    ➜ Edit Product to Add Stock ➜ Inventory Log Recorded
    ➜ View Audit Trail ➜ Generate Reports
```

### 4. Delivery Lifecycle
```
Invoice Created ➜ Delivery Record Auto-Generated
    ➜ Assign Driver ➜ Update: Collected by Driver
    ➜ In Transit ➜ Arrived at Location
    ➜ Collected by Receiver (complete)
    — or — Mark Returned ➜ Stock Restored
```

---

## Data Models

### Product
- **Common fields:** id, productCode, barcode, name, category, type (`hardware` | `software`), costPrice, sellingPrice, taxPercent, status, description, timestamps
- **Hardware extras:** stockQuantity, supplier, warrantyPeriod (months)
- **Software extras:** licenseType (`single` | `multi-user`), licenseQuantity, expiryDate

### Quotation
- quotationNumber (`QT-XXXX`), client info, line items (product, qty, price, tax, discount, lineTotal), subtotal, totalDiscount, totalTax, grandTotal, status (`draft` | `sent` | `accepted` | `rejected` | `converted`), validUntil, notes, timestamps

### Invoice
- invoiceNumber (`INV-XXXX`), optional quotationId, client info, line items (includes costPrice for profit calc), payment mode (`cash` | `online` | `bank`), status (`pending` | `paid` | `cancelled`), timestamps

### Delivery
- invoiceId, invoiceNumber, productCode, productName, quantity, currentStage, status, trackingHistory (array of stage events with timestamps, notes, location), deliveryPerson, recipient info, addresses, estimated/actual delivery dates

### Inventory Log
- productId, productCode, productName, change (±), reason (`sale` | `return` | `manual` | `adjustment` | `purchase`), userId, userName, timestamp, notes

### User
- id, email, name, role (`admin` | `sales` | `inventory` | `accountant`), avatar, createdAt

---

## Project Structure

```
managER/
├── public/                    # Static assets
│   └── robots.txt
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Route definitions & providers
│   ├── index.css              # Global Tailwind styles
│   ├── components/
│   │   ├── LabelPrintDialog.tsx   # Bulk product label printing
│   │   ├── NavLink.tsx            # Navigation link component
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Authenticated page layout wrapper
│   │   │   └── AppSidebar.tsx     # Collapsible sidebar with role filtering
│   │   └── ui/                    # 50+ Shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Authentication & role-based permissions
│   │   └── DataContext.tsx     # Central data store (CRUD for all entities)
│   ├── data/
│   │   └── mockData.ts        # Mock data + ID/code generators
│   ├── hooks/
│   │   ├── use-mobile.tsx     # Responsive breakpoint hook
│   │   └── use-toast.ts       # Toast notification hook
│   ├── lib/
│   │   └── utils.ts           # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProductFormPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── QuotationsPage.tsx
│   │   ├── QuotationFormPage.tsx
│   │   ├── QuotationPreviewPage.tsx
│   │   ├── BillingPage.tsx
│   │   ├── DeliveriesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   └── types/
│       └── index.ts           # All TypeScript interfaces & enums
├── components.json            # Shadcn/ui config
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Common UI Patterns

### Status Badges (Colour-Coded)
- 🟢 **Green** — Active, Paid, Completed, In Stock
- 🟡 **Yellow** — Pending, Low Stock, Draft
- 🔴 **Red** — Cancelled, Out of Stock, Rejected
- 🔵 **Blue** — In Progress, Sent, Info

### Data Tables
- Pagination (configurable items per page)
- Column header sorting
- Responsive horizontal scroll on mobile
- Empty-state messages when no data matches filters

### Forms
- Real-time validation (Zod schemas via React Hook Form)
- Required-field indicators
- Inline error messages
- Cancel confirmation to prevent accidental data loss

### Notifications
- Success / error / warning toasts (auto-dismiss after ~5 seconds)
- Action buttons within notifications where applicable

### Document Generation
- **Quotation document** — company header, client info, itemised table, totals, terms, validity
- **Invoice document** — company header, invoice number, client billing, itemised list, tax/discount, payment mode, grand total
- **Product labels** — company name, product name, code, CODE128 barcode, price (optimised for 50 mm × 30 mm stickers)

### Responsive Design
- Fully responsive layouts for desktop, tablet, and mobile
- Collapsible sidebar on small screens
- Touch-optimised buttons and form controls
- Stacked forms on mobile, side-by-side on desktop

---

## Smart Auto-Generation

| Item | Pattern |
|---|---|
| Product Code | `HW-{CATEGORY}-{SEQ}` or `SW-{CATEGORY}-{SEQ}` |
| Barcode | Unique 12-digit number |
| Invoice Number | `INV-{SEQ}` (e.g. `INV-0042`) |
| Quotation Number | `QT-{SEQ}` (e.g. `QT-0015`) |
| Delivery ID | Auto-generated unique ID |

---

## Currency

All monetary values are displayed in **NPR (Nepalese Rupee)**.

---

*Built with React, TypeScript, Tailwind CSS, and Shadcn/ui.*  
**Version:** 1.0
