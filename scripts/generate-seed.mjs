import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'data', 'mockData.ts');
const outputPath = path.join(root, 'supabase', '02_seed_data.sql');

const source = fs.readFileSync(sourcePath, 'utf8');

function extractArray(name) {
  const marker = `export const ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Missing array: ${name}`);
  }

  const equalsIndex = source.indexOf('=', start);
  const arrayStart = source.indexOf('[', equalsIndex);
  if (arrayStart === -1) {
    throw new Error(`Missing array start for: ${name}`);
  }

  let depth = 0;
  let end = -1;
  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth === 0) {
      end = index;
      break;
    }
  }

  if (end === -1) {
    throw new Error(`Missing array end for: ${name}`);
  }

  const raw = source.slice(arrayStart, end + 1)
    .replace(/\s+as\s+HardwareProduct/g, '')
    .replace(/\s+as\s+SoftwareProduct/g, '')
    .replace(/\s+as\s+Product/g, '')
    .replace(/\s+as\s+Quotation/g, '')
    .replace(/\s+as\s+Invoice/g, '')
    .replace(/\s+as\s+Delivery/g, '')
    .replace(/\s+as\s+InventoryLog/g, '');

  return Function(`"use strict"; return (${raw});`)();
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === '') return 'null';
  return Number(value).toString();
}

function sqlDate(value) {
  if (!value) return 'null';
  const date = value instanceof Date ? value : new Date(value);
  return sqlString(date.toISOString());
}

function dateOnly(value) {
  if (!value) return 'null';
  const date = value instanceof Date ? value : new Date(value);
  return sqlString(date.toISOString().slice(0, 10));
}

function makeInsert(table, rows) {
  if (!rows.length) return '';
  const columns = Object.keys(rows[0]);
  const values = rows.map(row => `(${columns.map(column => row[column]).join(', ')})`).join(',\n');
  return `insert into public.${table} (${columns.join(', ')})\nvalues\n${values}\non conflict do nothing;\n\n`;
}

const mockUsers = extractArray('mockUsers');
const mockProducts = extractArray('mockProducts');
const mockQuotations = extractArray('mockQuotations');
const mockInvoices = extractArray('mockInvoices');
const mockDeliveries = extractArray('mockDeliveries');
const mockInventoryLogs = extractArray('mockInventoryLogs');

const sql = [];

sql.push(`-- Route3 / IT Shop Manager demo seed data\n-- Run after the schema migration.\n\n`);

sql.push(`insert into public.profiles (auth_user_id, email, name, role, is_active)\nvalues\n` + mockUsers.map((user, index) => `(${['null', sqlString(user.email), sqlString(user.name), sqlString(user.role), 'true'].join(', ')})`).join(',\n') + `\non conflict (email) do update set\n  name = excluded.name,\n  role = excluded.role,\n  is_active = true,\n  updated_at = now();\n\n`);

sql.push(`insert into public.device_brands (name)\nvalues\n  ('Apple'), ('Samsung'), ('Google'), ('Xiaomi'), ('OnePlus')\non conflict (name) do nothing;\n\n`);

sql.push(`insert into public.device_colors (name)\nvalues\n  ('Black'), ('White'), ('Blue'), ('Silver'), ('Graphite'), ('Gold')\non conflict (name) do nothing;\n\n`);

sql.push(`insert into public.labor_rates (service_name, base_price, average_time_required_minutes, description)\nvalues\n  ('Screen Replacement', 120.00, 90, 'Common display and glass repair'),\n  ('Battery Swap', 70.00, 45, 'Battery replacement and calibration'),\n  ('Water Damage', 180.00, 180, 'Liquid damage diagnostics and cleaning'),\n  ('Charging Port Repair', 85.00, 60, 'Port replacement or board-level cleaning'),\n  ('Camera Replacement', 95.00, 75, 'Rear or front camera module replacement')\non conflict (service_name) do update set\n  base_price = excluded.base_price,\n  average_time_required_minutes = excluded.average_time_required_minutes,\n  description = excluded.description,\n  is_active = true,\n  updated_at = now();\n\n`);

sql.push(`insert into public.customers (name, phone, email, notes)\nvalues\n  ('Aarav Shrestha', '9841000001', 'aarav@example.com', 'Returning customer'),\n  ('Nisha Karki', '9841000002', 'nisha@example.com', 'Prefers SMS updates'),\n  ('Ravi Gurung', '9841000003', 'ravi@example.com', 'Needs water damage diagnostics'),\n  ('Sita Thapa', '9841000004', 'sita@example.com', 'Warranty eligible'),\n  ('Prakash Lama', '9841000005', 'prakash@example.com', 'Pickup notification ready')\non conflict (phone) do update set\n  name = excluded.name,\n  email = excluded.email,\n  notes = excluded.notes,\n  updated_at = now();\n\n`);

sql.push(`insert into public.products (id, product_code, barcode, name, category, type, cost_price, selling_price, tax_percent, status, description, stock_quantity, supplier, warranty_period, license_type, license_quantity, expiry_date, created_at, updated_at)\nvalues\n`);

const productRows = mockProducts.map((product) => {
  if (product.type === 'hardware') {
    return `(${[
      sqlString(product.id),
      sqlString(product.productCode),
      sqlString(product.barcode),
      sqlString(product.name),
      sqlString(product.category),
      sqlString(product.type),
      sqlNumber(product.costPrice),
      sqlNumber(product.sellingPrice),
      sqlNumber(product.taxPercent),
      sqlString(product.status),
      sqlString(product.description ?? null),
      sqlNumber(product.stockQuantity),
      sqlString(product.supplier),
      sqlNumber(product.warrantyPeriod),
      'null',
      'null',
      'null',
      sqlDate(product.createdAt),
      sqlDate(product.updatedAt),
    ].join(', ')})`;
  }

  return `(${[
    sqlString(product.id),
    sqlString(product.productCode),
    sqlString(product.barcode),
    sqlString(product.name),
    sqlString(product.category),
    sqlString(product.type),
    sqlNumber(product.costPrice),
    sqlNumber(product.sellingPrice),
    sqlNumber(product.taxPercent),
    sqlString(product.status),
    sqlString(product.description ?? null),
    'null',
    'null',
    'null',
    sqlString(product.licenseType),
    sqlNumber(product.licenseQuantity),
    dateOnly(product.expiryDate),
    sqlDate(product.createdAt),
    sqlDate(product.updatedAt),
  ].join(', ')})`;
});

sql.push(productRows.join(',\n') + `\non conflict (id) do update set\n  product_code = excluded.product_code,\n  barcode = excluded.barcode,\n  name = excluded.name,\n  category = excluded.category,\n  type = excluded.type,\n  cost_price = excluded.cost_price,\n  selling_price = excluded.selling_price,\n  tax_percent = excluded.tax_percent,\n  status = excluded.status,\n  description = excluded.description,\n  stock_quantity = excluded.stock_quantity,\n  supplier = excluded.supplier,\n  warranty_period = excluded.warranty_period,\n  license_type = excluded.license_type,\n  license_quantity = excluded.license_quantity,\n  expiry_date = excluded.expiry_date,\n  updated_at = now();\n\n`);

sql.push(`insert into public.quotations (id, quotation_number, customer_id, client_name, client_email, client_phone, client_address, subtotal, total_discount, total_tax, grand_total, status, valid_until, notes, created_by, created_at, updated_at)\nvalues\n`);

const quotationRows = mockQuotations.map((quotation) => `(${[
  sqlString(quotation.id),
  sqlString(quotation.quotationNumber),
  'null',
  sqlString(quotation.clientName),
  sqlString(quotation.clientEmail),
  sqlString(quotation.clientPhone),
  sqlString(quotation.clientAddress),
  sqlNumber(quotation.subtotal),
  sqlNumber(quotation.totalDiscount),
  sqlNumber(quotation.totalTax),
  sqlNumber(quotation.grandTotal),
  sqlString(quotation.status),
  dateOnly(quotation.validUntil),
  sqlString(quotation.notes ?? null),
  'null',
  sqlDate(quotation.createdAt),
  sqlDate(quotation.updatedAt),
].join(', ')})`);
sql.push(quotationRows.join(',\n') + `\non conflict (id) do update set\n  quotation_number = excluded.quotation_number,\n  client_name = excluded.client_name,\n  client_email = excluded.client_email,\n  client_phone = excluded.client_phone,\n  client_address = excluded.client_address,\n  subtotal = excluded.subtotal,\n  total_discount = excluded.total_discount,\n  total_tax = excluded.total_tax,\n  grand_total = excluded.grand_total,\n  status = excluded.status,\n  valid_until = excluded.valid_until,\n  notes = excluded.notes,\n  updated_at = now();\n\n`);

const quotationItemRows = mockQuotations.flatMap((quotation) => quotation.items.map((item) => `(${[
  sqlString(item.id),
  sqlString(quotation.id),
  sqlString(item.productId),
  sqlString(item.productCode),
  sqlString(item.productName),
  sqlNumber(item.quantity),
  sqlNumber(item.unitPrice),
  sqlNumber(item.taxPercent),
  sqlNumber(item.discount),
  sqlNumber(item.lineTotal),
  sqlDate(quotation.createdAt),
].join(', ')})`));
sql.push(`insert into public.quotation_items (id, quotation_id, product_id, product_code, product_name, quantity, unit_price, tax_percent, discount, line_total, created_at)\nvalues\n${quotationItemRows.join(',\n')}\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.invoices (id, invoice_number, quotation_id, customer_id, client_name, client_email, client_phone, client_address, subtotal, total_discount, total_tax, grand_total, payment_mode, status, created_by, created_at, paid_at, updated_at)\nvalues\n`);

const invoiceRows = mockInvoices.map((invoice) => `(${[
  sqlString(invoice.id),
  sqlString(invoice.invoiceNumber),
  invoice.quotationId ? sqlString(invoice.quotationId) : 'null',
  'null',
  sqlString(invoice.clientName),
  sqlString(invoice.clientEmail),
  sqlString(invoice.clientPhone),
  sqlString(invoice.clientAddress),
  sqlNumber(invoice.subtotal),
  sqlNumber(invoice.totalDiscount),
  sqlNumber(invoice.totalTax),
  sqlNumber(invoice.grandTotal),
  sqlString(invoice.paymentMode),
  sqlString(invoice.status),
  'null',
  sqlDate(invoice.createdAt),
  invoice.paidAt ? sqlDate(invoice.paidAt) : 'null',
  sqlDate(invoice.createdAt),
].join(', ')})`);
sql.push(invoiceRows.join(',\n') + `\non conflict (id) do update set\n  invoice_number = excluded.invoice_number,\n  quotation_id = excluded.quotation_id,\n  client_name = excluded.client_name,\n  client_email = excluded.client_email,\n  client_phone = excluded.client_phone,\n  client_address = excluded.client_address,\n  subtotal = excluded.subtotal,\n  total_discount = excluded.total_discount,\n  total_tax = excluded.total_tax,\n  grand_total = excluded.grand_total,\n  payment_mode = excluded.payment_mode,\n  status = excluded.status,\n  paid_at = excluded.paid_at,\n  updated_at = now();\n\n`);

const invoiceItemRows = mockInvoices.flatMap((invoice) => invoice.items.map((item) => `(${[
  sqlString(item.id),
  sqlString(invoice.id),
  sqlString(item.productId),
  sqlString(item.productCode),
  sqlString(item.productName),
  sqlNumber(item.quantity),
  sqlNumber(item.unitPrice),
  sqlNumber(item.costPrice),
  sqlNumber(item.taxPercent),
  sqlNumber(item.discount),
  sqlNumber(item.lineTotal),
  sqlDate(invoice.createdAt),
].join(', ')})`));
sql.push(`insert into public.invoice_items (id, invoice_id, product_id, product_code, product_name, quantity, unit_price, cost_price, tax_percent, discount, line_total, created_at)\nvalues\n${invoiceItemRows.join(',\n')}\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.delivery_people (id, name, phone, vehicle_number, created_at, updated_at)\nvalues\n  ('dp-001', 'James Wilson', '+1 555-8001', 'NY-1234', now(), now()),\n  ('dp-002', 'Mike Thompson', '+1 555-8002', 'CA-5678', now(), now())\non conflict (id) do update set\n  name = excluded.name,\n  phone = excluded.phone,\n  vehicle_number = excluded.vehicle_number,\n  updated_at = now();\n\n`);

sql.push(`insert into public.deliveries (id, invoice_id, invoice_number, product_code, product_name, quantity, current_stage, status, delivery_person_id, recipient_name, recipient_phone, delivery_address, estimated_delivery_date, actual_delivery_date, notes, created_at, updated_at)\nvalues\n`);

const deliveryRows = mockDeliveries.map((delivery) => `(${[
  sqlString(delivery.id),
  sqlString(delivery.invoiceId),
  sqlString(delivery.invoiceNumber),
  sqlString(delivery.productCode),
  sqlString(delivery.productName),
  sqlNumber(delivery.quantity),
  sqlString(delivery.currentStage),
  sqlString(delivery.status),
  delivery.deliveryPerson ? sqlString(delivery.deliveryPerson.id) : 'null',
  sqlString(delivery.recipientName ?? null),
  sqlString(delivery.recipientPhone ?? null),
  sqlString(delivery.deliveryAddress),
  delivery.estimatedDeliveryDate ? dateOnly(delivery.estimatedDeliveryDate) : 'null',
  delivery.actualDeliveryDate ? dateOnly(delivery.actualDeliveryDate) : 'null',
  sqlString(delivery.notes ?? null),
  sqlDate(delivery.createdAt),
  sqlDate(delivery.createdAt),
].join(', ')})`);
sql.push(deliveryRows.join(',\n') + `\non conflict (id) do update set\n  invoice_id = excluded.invoice_id,\n  invoice_number = excluded.invoice_number,\n  product_code = excluded.product_code,\n  product_name = excluded.product_name,\n  quantity = excluded.quantity,\n  current_stage = excluded.current_stage,\n  status = excluded.status,\n  delivery_person_id = excluded.delivery_person_id,\n  recipient_name = excluded.recipient_name,\n  recipient_phone = excluded.recipient_phone,\n  delivery_address = excluded.delivery_address,\n  estimated_delivery_date = excluded.estimated_delivery_date,\n  actual_delivery_date = excluded.actual_delivery_date,\n  notes = excluded.notes,\n  updated_at = now();\n\n`);

const trackingRows = mockDeliveries.flatMap((delivery) => delivery.trackingHistory.map((event) => `(${[
  sqlString(event.id),
  sqlString(delivery.id),
  sqlString(event.stage),
  sqlDate(event.timestamp),
  sqlString(event.notes ?? null),
  'null',
  sqlString(event.location ?? null),
].join(', ')})`));
sql.push(`insert into public.delivery_tracking_events (id, delivery_id, stage, timestamp, notes, updated_by, location)\nvalues\n${trackingRows.join(',\n')}\non conflict (id) do nothing;\n\n`);

const inventoryRows = mockInventoryLogs.map((log) => `(${[
  sqlString(log.id),
  sqlString(log.productId),
  sqlString(log.productCode),
  sqlString(log.productName),
  sqlNumber(log.change),
  sqlString(log.reason),
  sqlString(log.userId),
  sqlString(log.userName),
  sqlDate(log.timestamp),
  sqlString(log.notes ?? null),
].join(', ')})`);
sql.push(`insert into public.inventory_logs (id, product_id, product_code, product_name, change, reason, user_id, user_name, timestamp, notes)\nvalues\n${inventoryRows.join(',\n')}\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.repair_jobs (id, job_id, customer_id, device_id, assigned_tech_id, status, priority, estimated_cost, deposit_paid, issue_summary, intake_notes, public_update, qr_token, ready_notified_at, completed_at, created_at, updated_at)\nvalues\n  ('rj-001', 'LAB-2026-001', (select id from public.customers where phone = '9841000001'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'to_do', 'high', 185.00, 0.00, 'Screen replacement', '2 intake photos attached, glass fracture around top-left corner.', 'Customer device received', gen_random_uuid(), null, null, now(), now()),\n  ('rj-002', 'LAB-2026-002', (select id from public.customers where phone = '9841000002'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'in_progress', 'normal', 145.00, 0.00, 'Battery swap', 'Battery health at 71%, device warms under camera load.', 'Inspection in progress', gen_random_uuid(), null, null, now(), now()),\n  ('rj-003', 'LAB-2026-003', (select id from public.customers where phone = '9841000003'), null, (select id from public.profiles where email = 'tech3@itshop.com'), 'waiting_for_parts', 'high', 240.00, 0.00, 'Water damage', 'Parts order placed for the USB-C daughterboard.', 'Awaiting part arrival', gen_random_uuid(), null, null, now(), now()),\n  ('rj-004', 'LAB-2026-004', (select id from public.customers where phone = '9841000004'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'quality_check', 'normal', 95.00, 0.00, 'Touch calibration', 'Public update ready; internal notes mention intermittent touch lag.', 'Final checks in progress', gen_random_uuid(), null, null, now(), now()),\n  ('rj-005', 'LAB-2026-005', (select id from public.customers where phone = '9841000005'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'ready', 'normal', 70.00, 0.00, 'Ready for pickup', 'SMS trigger sent after final QC pass.', 'Ready for pickup', gen_random_uuid(), now(), null, now(), now())\non conflict (id) do update set\n  status = excluded.status,\n  priority = excluded.priority,\n  estimated_cost = excluded.estimated_cost,\n  deposit_paid = excluded.deposit_paid,\n  issue_summary = excluded.issue_summary,\n  intake_notes = excluded.intake_notes,\n  public_update = excluded.public_update,\n  updated_at = now();\n\n`);

sql.push(`insert into public.repair_job_updates (id, job_id, logged_at, note, visibility, status_changed_to, created_by)\nvalues\n  ('rju-001', 'rj-002', now() - interval '2 hours', 'Maya removed the back cover and verified battery cycle count.', 'internal', 'in_progress', (select id from public.profiles where email = 'tech2@itshop.com')),\n  ('rju-002', 'rj-003', now() - interval '90 minutes', 'Noah marked the USB-C board as required and updated the customer note.', 'internal', 'waiting_for_parts', (select id from public.profiles where email = 'tech3@itshop.com')),\n  ('rju-003', 'rj-005', now() - interval '30 minutes', 'Automation queue marked the job for SMS and email dispatch.', 'public', 'ready', (select id from public.profiles where email = 'tech2@itshop.com'))\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.repair_job_photos (id, job_id, photo_url, caption, created_at)\nvalues\n  ('rjp-001', 'rj-001', 'https://example.com/intake/lab-2026-001-front.jpg', 'Front intake photo', now()),\n  ('rjp-002', 'rj-001', 'https://example.com/intake/lab-2026-001-back.jpg', 'Rear intake photo', now()),\n  ('rjp-003', 'rj-003', 'https://example.com/intake/lab-2026-003-water.jpg', 'Water damage evidence', now())\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.repair_job_parts (id, job_id, product_id, quantity, unit_cost, total_cost, consumed_at, created_at)\nvalues\n  ('rjp-pt-001', 'rj-002', (select id from public.products where product_code = 'HW-CHG-001'), 1, 1500.00, 1500.00, now(), now()),\n  ('rjp-pt-002', 'rj-003', (select id from public.products where product_code = 'HW-ACC-003'), 1, 50.00, 50.00, now(), now())\non conflict (id) do nothing;\n\n`);

sql.push(`insert into public.system_settings (key, value)\nvalues\n  ('company_profile', '{"name":"IT Shop Manager","currency":"USD"}'::jsonb),\n  ('notifications', '{"readyPickupSms": true, "readyPickupEmail": true}'::jsonb)\non conflict (key) do update set\n  value = excluded.value,\n  updated_at = now();\n\n`);

fs.writeFileSync(outputPath, sql.join(''));
console.log(`Wrote ${outputPath}`);
