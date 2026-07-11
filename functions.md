# managER - Application Features Documentation

## Overview
managER is a comprehensive Inventory and Business Management System designed for IT gadget and software businesses. This document outlines all features available in each page/module of the application.

---

## 🔐 Authentication

### Login Page (`/login`)
- **User Authentication**: Secure login with email and password
- **Session Management**: Persistent login sessions
- **Error Handling**: Invalid credentials feedback

---

## 📊 Dashboard Page (`/dashboard`)

### Overview Statistics
- **Active Products Count**: Total number of active products in inventory
- **Low Stock Alert**: Number of products with stock ≤ 5 units
- **Total Revenue**: Sum of all paid invoices with trend indicator
- **Revenue Breakdown**: Click-to-view payment mode breakdown (Cash/Online/Bank)
- **Pending Invoices**: Count and total value of unpaid invoices
- **Pending Quotations**: Count of draft and sent quotations
- **Pending Deliveries**: Count of deliveries in progress

### Recent Activity
- **Recent Invoices Table**: Last 5 invoices with status badges
- **Recent Quotations Table**: Last 5 quotations with quick actions
- **Quick Actions**: View details for each item

### Revenue Breakdown Dialog
- **Payment Mode Analysis**: 
  - Cash payments (count + total amount)
  - Online payments (count + total amount)
  - Bank transfers (count + total amount)
  - Visual breakdown with icons
- **Total Revenue Summary**: Combined revenue from all payment modes

---

## 📦 Products Page (`/products`)

### Product Management
- **Product Listing**: Comprehensive table with all product details
- **Add New Product**: Button to create hardware or software products
- **Print Labels**: Bulk label printing for selected products

### Filtering & Search
- **Type Filter**: Filter by Hardware/Software/All
- **Category Filter**: Filter by product categories (Computers, Accessories, Software, etc.)
- **Status Filter**: Filter by Active/Inactive status
- **Search Functionality**: Search by name, product code, barcode, or category
- **Clear Filters**: Reset all filters with one click

### Product Table Columns
- **Product Code**: Unique identifier with monospace font
- **Product Name**: Name with category subtitle
- **Type**: Hardware/Software badge
- **Price**: Selling price with cost price subtitle
- **Stock**: Real-time stock/license quantity with status badges
  - Out of Stock (red)
  - Low Stock (yellow, ≤5 units)
  - In Stock (green)
- **Status**: Active/Inactive badge

### Product Actions (Per Row)
- **View Details**: See complete product information
- **Edit Product**: Modify product details
- **Archive Product**: Soft delete product from active list

### Label Printing Feature
- **Product Selection**: Checkbox selection from active products
- **Quantity Control**: Set number of labels per product
- **Live Preview**: Real-time preview of label design
- **Label Design**:
  - Company header (IT GADGET HUB)
  - Product name
  - Product code
  - Barcode (CODE128 format)
  - Barcode number
  - Price in NPR
- **Print Output**: Formatted for 50mm x 30mm sticky labels
- **Bulk Printing**: Print multiple labels for multiple products

---

## 📝 Product Form Page (`/products/new` or `/products/:id/edit`)

### Basic Information
- **Product Name**: Text input (required)
- **Category**: Dropdown selection from predefined categories
- **Product Type**: Toggle between Hardware/Software
- **Cost Price**: Numeric input (required)
- **Selling Price**: Numeric input (required)
- **Tax Percentage**: Default 18%, adjustable
- **Description**: Multi-line text area
- **Status**: Active/Inactive toggle

### Hardware-Specific Fields
- **Stock Quantity**: Current inventory count
- **Supplier**: Supplier name/information
- **Warranty Period**: Warranty duration in months

### Software-Specific Fields
- **License Type**: Single/Subscription/Perpetual
- **License Quantity**: Number of available licenses
- **Expiry Date**: Optional expiration date for licenses

### Form Actions
- **Save Product**: Validate and save to inventory
- **Cancel**: Return to products list
- **Auto-generation**: Automatic product code and barcode generation

---

## 📋 Inventory Page (`/inventory`)

### Inventory Statistics
- **In Stock Products**: Products with quantity > 5
- **Low Stock Products**: Products with 1-5 units/licenses
- **Out of Stock Products**: Products with 0 quantity
- **Total Software Licenses**: Sum of all software licenses

### Stock Status Table
- **Product Code**: Unique identifier
- **Product Name**: With category
- **Type**: Hardware/Software
- **Stock/Licenses**: Current quantity with status badge
- **Status**: Visual indicator (In Stock/Low Stock/Out of Stock)

### Inventory Logs
- **Date**: Transaction timestamp
- **Product**: Product involved in transaction
- **Action**: Type of inventory movement (Sale/Restock/Adjustment)
- **Quantity**: Amount changed
- **User**: Who performed the action
- **Notes**: Additional transaction details

### Features
- **Real-time Updates**: Automatic refresh on inventory changes
- **Historical Tracking**: Complete audit trail of inventory movements
- **Multi-view**: Separate tabs for stock status and logs

---

## 💰 Billing/Invoicing Page (`/billing`)

### Invoice Creation
- **Client Information Form**:
  - Client Name (required)
  - Email address
  - Phone number
  - Billing address
- **Product Selection**:
  - Search bar for products (by name, code, or barcode)
  - Product browser with filtering
  - Add products to invoice
- **Line Item Management**:
  - Adjust quantity
  - Modify unit price
  - Apply item-level discount (%)
  - Set tax percentage per item
  - Remove items
  - Real-time line total calculation

### Invoice Calculations
- **Subtotal**: Sum of all line items before tax/discount
- **Discount**: Applied percentage with amount display
- **Tax Amount**: Calculated based on taxable amount
- **Grand Total**: Final payable amount in NPR
- **Profit Calculation**: Real-time profit based on cost vs selling price

### Payment Processing
- **Payment Mode Selection**:
  - Cash
  - Online Transfer
  - Bank Transfer
- **Checkout Dialog**: Final review before creating invoice
- **Invoice Generation**: Auto-generated invoice number (INV-XXXX)
- **Status Management**: Draft/Pending/Paid/Overdue

### Invoice Management
- **Invoice List**: All invoices with filtering
- **Status Filter**: Filter by payment status
- **Quick Actions**: View, Print, Mark as Paid, Delete
- **PDF Generation**: Print-ready invoice format

### Quotation to Invoice Conversion
- **Import from Quotation**: Pre-fill invoice from approved quotation
- **Data Transfer**: Client info and items automatically populated
- **Stock Validation**: Real-time stock availability check
- **One-click Conversion**: Convert quotation to invoice

---

## 📄 Quotations Page (`/quotations`)

### Quotation Management
- **Create New Quotation**: Button to quotation form
- **Quotation Listing**: All quotations with details

### Quotation Table Columns
- **Quotation Number**: Auto-generated (QT-XXXX)
- **Client**: Name and email
- **Items**: Count of line items
- **Total**: Grand total in NPR
- **Valid Until**: Expiration date
- **Status**: Draft/Sent/Accepted/Declined/Converted
- **Created Date**: Quotation creation timestamp

### Filtering
- **Status Filter**: Filter by quotation status
- **Search**: Search across quotation details

### Quotation Actions (Per Row)
- **View Preview**: See formatted quotation
- **Convert to Invoice**: Quick conversion to billing
- **Download PDF**: Export quotation document
- **Edit**: Modify quotation details
- **Send to Client**: Email quotation (if integrated)

---

## 📝 Quotation Form Page (`/quotations/new`)

### Client Information
- **Client Name** (required)
- **Company Name** (optional)
- **Email** (required)
- **Phone** (required)
- **Address** (required)
- **Zip Code** (optional)

### Quotation Details
- **Auto-generated Number**: Sequential quotation numbering (QT-XXXX)
- **Valid For**: Days until expiration (default 15 days)
- **Creation Date**: Auto-populated current date

### Product Selection
- **Search Interface**: Find products by name, code, or barcode
- **Product Browser**: View all active products
- **Add to Quotation**: Click to add products

### Line Item Management
- **Product Details**: Name, code display
- **Quantity**: Adjustable quantity field
- **Unit Price**: Editable price
- **Tax Percentage**: Per-item tax
- **Discount**: Percentage discount per item
- **Line Total**: Auto-calculated
- **Remove Item**: Delete line from quotation

### Calculations
- **Subtotal**: Sum before tax and discount
- **Discount Amount**: Total discount applied
- **Tax Amount**: Total tax applied
- **Grand Total**: Final quotation amount

### Additional Information
- **Terms & Notes**: Multi-line text area for payment terms and conditions
- **Pre-filled Template**: Default payment terms template

### Actions
- **Save as Draft**: Save without finalizing
- **Send Quotation**: Mark as sent (requires client email)
- **Print Preview**: View formatted quotation
- **Download PDF**: Export to PDF document
- **Cancel**: Return to quotations list

### Live Preview
- **Real-time Preview**: Side-by-side form and preview
- **Company Branding**: Company information header
- **Professional Layout**: Business-ready format
- **Print-ready Design**: Optimized for printing

---

## 🚚 Deliveries Page (`/deliveries`)

### Delivery Statistics
- **Pending Deliveries**: Count awaiting dispatch
- **In Progress**: Currently being delivered
- **Completed**: Successfully delivered count

### Delivery Management
- **Delivery Listing**: All deliveries with tracking info
- **Create New Delivery**: Link from invoice or manual creation

### Delivery Table Columns
- **Delivery ID**: Unique identifier
- **Invoice Number**: Associated invoice
- **Client**: Customer name and contact
- **Address**: Delivery location
- **Items**: Number of products
- **Stage**: Current delivery stage with icon
- **Delivery Person**: Assigned driver/courier
- **Status**: Pending/In Progress/Completed/Returned
- **Created Date**: Delivery request date

### Filtering
- **Status Filter**: Filter by delivery status
- **Search**: Find deliveries by ID, client, or invoice

### Delivery Actions (Per Row)
- **View Tracking**: Detailed tracking information
- **Update Stage**: Progress delivery to next stage
- **Assign Driver**: Assign delivery person
- **Mark Returned**: Handle returns
- **Complete Delivery**: Finalize delivery

### Delivery Stages
1. **In Inventory**: Ready for dispatch
2. **Collected by Driver**: Picked up by delivery person
3. **In Transit**: On the way to destination
4. **Arrived at Location**: At delivery address
5. **Collected by Receiver**: Delivered to customer

### Tracking Sheet
- **Stage Timeline**: Visual progress indicator
- **Current Status**: Highlighted current stage
- **Delivery Person Details**:
  - Name
  - Phone number
  - Vehicle number
- **Client Information**: Name, phone, address
- **Package Details**: Items being delivered
- **Stage History**: Timestamps for each stage
- **Location Updates**: GPS/manual location entries
- **Notes**: Stage-specific notes

### Delivery Assignment
- **Assign Driver Dialog**: Select or add delivery person
- **Driver Information**:
  - Full name
  - Contact number
  - Vehicle registration
- **Quick Assignment**: One-click assignment

### Stage Update
- **Next Stage Progression**: Automatic stage advancement
- **Location Entry**: Optional location tracking
- **Notes Field**: Add delivery notes
- **Timestamp**: Auto-recorded update time

### Return Management
- **Mark as Returned**: Handle failed deliveries
- **Return Reason**: Capture reason for return
- **Inventory Update**: Auto-restore stock

---

## 📈 Reports Page (`/reports`)

### Overview Statistics
- **Total Revenue**: Sum of all paid invoices
- **Total Profit**: Revenue minus cost of goods sold
- **Hardware Revenue**: Revenue from hardware sales
- **Software Revenue**: Revenue from software sales

### Sales Reports Tab
- **Monthly Sales Chart**: Bar chart of sales by month
- **Revenue Trends**: Line chart showing revenue over time
- **Sales by Category**: Breakdown by product category
- **Top Products**: Best-selling products table

### Profit Analysis Tab
- **Invoice Profit Table**:
  - Invoice Number
  - Client Name
  - Revenue
  - Profit Amount
  - Profit Margin (%)
  - Date
- **Profit Margin Trends**: Visual representation
- **Cost vs Revenue**: Comparative analysis

### Product Reports Tab
- **Inventory Valuation**: Total inventory value
- **Stock Movement**: Products sold vs restocked
- **Product Performance**:
  - Top selling products
  - Slow-moving inventory
  - Out-of-stock analysis
- **Category Distribution**: Revenue by category

### Charts & Visualizations
- **Pie Charts**: Revenue distribution (Hardware vs Software)
- **Bar Charts**: Monthly sales comparison
- **Line Charts**: Revenue trends over time
- **Color-coded Data**: Visual distinction for different metrics

### Export Options
- **Print Reports**: Print-friendly format
- **Export to PDF**: Download reports as PDF
- **Date Range Filter**: Custom date range selection
- **Category Filter**: Filter reports by product category

---

## ⚙️ Settings Page (`/settings`)

### Company Information
- **Company Name**: Business name for documents
- **Tax ID/VAT Number**: Tax registration details
- **Business Email**: Primary contact email
- **Phone Number**: Business phone
- **Address**: Complete business address
- **Save Changes**: Update company information

### User Profile
- **Full Name**: User's display name
- **Email**: Login email (read-only)
- **Change Password**:
  - Current password verification
  - New password entry
- **Update Profile**: Save profile changes

### Notifications Settings
- **Email Notifications**: Toggle email alerts
- **Low Stock Alerts**: Warning for low inventory
- **Invoice Reminders**: Payment due reminders
- **Delivery Updates**: Delivery status notifications
- **System Updates**: App update notifications

### System Preferences
- **Default Tax Rate**: Global tax percentage
- **Default Payment Terms**: Standard payment terms
- **Quotation Validity**: Default validity period
- **Currency Settings**: Base currency (NPR)
- **Date Format**: Date display format
- **Language**: Interface language (if multilingual)

### Backup & Data
- **Export Data**: Download all data as backup
- **Import Data**: Restore from backup
- **Clear Cache**: Clear application cache
- **Database Status**: Connection and health info

### Security
- **Two-Factor Authentication**: Enable 2FA (if available)
- **Active Sessions**: View and manage login sessions
- **Password Policy**: Password requirements display
- **Activity Log**: Recent account activities

---

## 🔍 Common Features Across Pages

### Search & Filtering
- **Global Search**: Available on most list pages
- **Multi-criteria Search**: Search across multiple fields
- **Real-time Filtering**: Instant results as you type
- **Advanced Filters**: Dropdown filters for specific criteria

### Data Tables
- **Pagination**: Navigate through large datasets (10/25/50 items per page)
- **Sorting**: Click column headers to sort
- **Column Resizing**: Adjustable column widths
- **Responsive Design**: Mobile-friendly tables
- **Empty States**: Helpful messages when no data

### Status Badges
- **Color-coded**: Visual distinction for different statuses
  - Green: Success/Active/Paid/Completed
  - Yellow: Warning/Low Stock/Pending
  - Red: Danger/Out of Stock/Overdue
  - Blue: Info/Draft/In Progress

### Navigation
- **Sidebar Menu**: Persistent navigation across all pages
- **Active Page Indicator**: Highlight current page
- **Breadcrumbs**: Show current location (where applicable)
- **Quick Actions**: Floating action buttons
- **Back Buttons**: Easy navigation to previous pages

### Forms
- **Validation**: Real-time input validation
- **Error Messages**: Clear error feedback
- **Required Field Indicators**: Asterisk or label
- **Auto-save**: Draft saving (where applicable)
- **Cancel Confirmation**: Prevent accidental data loss

### Notifications/Toasts
- **Success Messages**: Confirm successful actions
- **Error Alerts**: Display error information
- **Warning Notices**: Important information
- **Auto-dismiss**: Notifications fade after 5 seconds
- **Action Buttons**: Quick actions in notifications

### Print & Export
- **Print Preview**: See before printing
- **PDF Generation**: Export to PDF format
- **Formatted Output**: Professional document styling
- **Custom Headers**: Company branding on documents

### Responsive Design
- **Mobile Friendly**: Works on phones and tablets
- **Adaptive Layouts**: Adjusts to screen size
- **Touch Optimized**: Touch-friendly interface
- **Sidebar Toggle**: Collapsible navigation on small screens

---

## 🔐 User Roles & Permissions (If Implemented)

### Admin
- Full access to all features
- User management
- System settings
- Data backup/restore

### Manager
- Product management
- Invoice and quotation creation
- Delivery management
- Reports viewing

### Staff
- Create invoices
- View products
- Update delivery status
- Limited settings access

---

## 🛠️ Technical Features

### Performance
- **Lazy Loading**: Load data as needed
- **Caching**: Store frequently accessed data
- **Optimized Queries**: Fast database operations
- **Debounced Search**: Reduce unnecessary searches

### Data Management
- **Auto-save Drafts**: Prevent data loss
- **Transaction Logging**: Audit trail for all operations
- **Data Validation**: Ensure data integrity
- **Conflict Resolution**: Handle concurrent edits

### Integration Points
- **Barcode Generation**: CODE128 format
- **Date Formatting**: Using date-fns library
- **Chart Rendering**: Recharts library
- **PDF Generation**: HTML to PDF conversion

---

## 📱 App Layout Components

### App Sidebar
- **Dashboard**: Home/overview
- **Products**: Product management
- **Inventory**: Stock tracking
- **Quotations**: Quote management
- **Billing**: Invoice creation
- **Deliveries**: Delivery tracking
- **Reports**: Analytics and reports
- **Settings**: System configuration
- **Logout**: Sign out option

### Page Header
- **Page Title**: Current page name
- **Description**: Brief page description
- **Action Buttons**: Primary page actions
- **Breadcrumbs**: Navigation trail (where applicable)

### User Profile
- **User Avatar**: Display picture or initials
- **User Name**: Current logged-in user
- **Role Badge**: User role indicator
- **Quick Settings**: Profile dropdown menu

---

## 🎯 Key Business Workflows

### 1. Product to Sale Flow
1. Add product (Products page)
2. Product appears in inventory
3. Create quotation or go directly to billing
4. Generate invoice
5. Create delivery
6. Track delivery stages
7. Complete delivery
8. Inventory auto-updates

### 2. Quotation to Invoice Flow
1. Create quotation (Quotations page)
2. Send to client
3. Client approves
4. Convert to invoice (one click)
5. Process payment
6. Create delivery
7. Complete transaction

### 3. Inventory Management Flow
1. Monitor inventory (Inventory page)
2. Receive low stock alert
3. Add stock (Product edit)
4. Log inventory transaction
5. View inventory logs
6. Generate inventory reports

### 4. Delivery Management Flow
1. Invoice created and paid
2. Create delivery
3. Assign delivery person
4. Update stages progressively
5. Track in real-time
6. Complete delivery
7. Update invoice status

---

## 📊 Dashboard Widgets Summary

- Welcome message with user name
- Active products count with low stock indicator
- Total revenue with payment breakdown
- Pending invoices with outstanding amount
- Pending quotations count
- Pending deliveries count
- Recent invoices table (last 5)
- Recent quotations table (last 5)
- Revenue breakdown modal (Cash/Online/Bank)

---

## 💡 Smart Features

### Auto-calculations
- Line totals in invoices and quotations
- Tax calculations
- Discount applications
- Profit margins
- Grand totals

### Auto-generation
- Product codes (HW-XXX, SW-XXX)
- Barcodes (unique 12-digit)
- Invoice numbers (INV-XXXX)
- Quotation numbers (QT-XXXX)
- Delivery IDs

### Real-time Updates
- Stock quantities after sales
- Invoice statuses
- Delivery tracking
- Dashboard statistics
- Inventory logs

### Validation & Checks
- Stock availability before adding to invoice
- Email format validation
- Price validation (selling price > cost price)
- Required field checks
- Duplicate prevention

---

## 📝 Document Generation

### Quotation Document
- Company header with logo/name
- Client information
- Quotation number and date
- Itemized product list
- Subtotal, tax, discount breakdown
- Grand total
- Terms and conditions
- Valid until date
- Company contact footer

### Invoice Document
- Company header
- Invoice number and date
- Client billing information
- Itemized product list with codes
- Tax calculations
- Discount applied
- Payment mode indicator
- Grand total due
- Payment terms
- Company stamp/signature area

### Delivery Note
- Delivery ID
- Invoice reference
- Client delivery address
- Item list with quantities
- Delivery person details
- Signature fields
- Date and time

### Product Label
- Company name (IT GADGET HUB)
- Product name
- Product code
- Barcode (CODE128)
- Barcode number
- Price (NPR)
- Optimized for 50mm x 30mm sticky paper

---

## 🎨 UI/UX Features

### Design System
- **Shadcn/ui Components**: Modern, accessible components
- **Tailwind CSS**: Utility-first styling
- **Dark Mode Ready**: Theme support
- **Consistent Colors**: Brand color palette
- **Typography**: Clear hierarchy with proper font sizes

### Interactive Elements
- **Hover Effects**: Visual feedback on interactive elements
- **Loading States**: Spinners and skeletons
- **Animations**: Smooth transitions
- **Icons**: Lucide icons throughout
- **Tooltips**: Helpful hints on hover

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: ARIA labels
- **Focus Indicators**: Clear focus states
- **Color Contrast**: WCAG compliant
- **Error Messages**: Clear and descriptive

---

## 🔒 Security Features

### Authentication
- Secure login
- Password hashing
- Session management
- Auto-logout on inactivity
- Protected routes

### Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure API calls
- Encrypted storage (if applicable)

### Audit Trail
- User action logging
- Timestamp all transactions
- Track inventory changes
- Monitor system access
- Export audit logs

---

## 📱 Mobile Responsiveness

- Responsive layouts for all pages
- Touch-optimized buttons and forms
- Mobile-friendly tables with horizontal scroll
- Collapsible sidebar for small screens
- Stacked forms on mobile devices
- Bottom navigation option (if implemented)
- Mobile-optimized dialogs and modals

---

## 🚀 Performance Optimizations

- Code splitting
- Lazy loading of routes
- Debounced search inputs
- Memoized calculations
- Optimized re-renders
- Efficient state management
- Cached API responses

---

## 📦 Data Models

### Product
- Hardware: stockQuantity, supplier, warrantyPeriod
- Software: licenseType, licenseQuantity, expiryDate
- Common: name, category, prices, tax, barcode, productCode

### Invoice
- Client information
- Line items with products
- Payment mode
- Status tracking
- Totals and calculations

### Quotation
- Client information
- Line items
- Validity period
- Status workflow
- Conversion to invoice

### Delivery
- Invoice reference
- Client details
- Delivery stages
- Delivery person
- Tracking history

### User
- Authentication credentials
- Profile information
- Role/permissions
- Activity history

---

*This application is built with React, TypeScript, Tailwind CSS, and Shadcn/ui components.*

**Version:** 1.0  
**Last Updated:** February 6, 2026
