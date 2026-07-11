import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const root = process.cwd();
const sourcePath = path.join(root, 'src', 'data', 'mockData.ts');
const outputPath = path.join(root, 'supabase', '02_seed_data.sql');
const source = fs.readFileSync(sourcePath, 'utf8');

function extractArray(name) {
  const marker = `export const ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Missing array: ${name}`);

  const equalsIndex = source.indexOf('=', start);
  const arrayStart = source.indexOf('[', equalsIndex);
  if (arrayStart === -1) throw new Error(`Missing array start for: ${name}`);

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

  if (end === -1) throw new Error(`Missing array end for: ${name}`);

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

const mockUsers = extractArray('mockUsers');
const mockProducts = extractArray('mockProducts');
const mockQuotations = extractArray('mockQuotations');
const mockInvoices = extractArray('mockInvoices');
const mockDeliveries = extractArray('mockDeliveries');
const mockInventoryLogs = extractArray('mockInventoryLogs');

const uuidMap = new Map();
const uuidFor = (key) => {
  if (!uuidMap.has(key)) uuidMap.set(key, randomUUID());
  return uuidMap.get(key);
};

const sqlString = (value) => (value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`);
const sqlNumber = (value) => (value === null || value === undefined || value === '' ? 'null' : String(Number(value)));
const sqlDate = (value) => {
  if (!value) return 'null';
  const date = value instanceof Date ? value : new Date(value);
  return sqlString(date.toISOString());
};
const dateOnly = (value) => {
  if (!value) return 'null';
  const date = value instanceof Date ? value : new Date(value);
  return sqlString(date.toISOString().slice(0, 10));
};

const profileValues = mockUsers
  .map((user) => `(${['null', sqlString(user.email), sqlString(user.name), sqlString(user.role), 'true'].join(', ')})`)
  .join(',\n');

const productRows = mockProducts.map((product) => {
  const productId = uuidFor(`product:${product.id}`);
  if (product.type === 'hardware') {
    return `(${[
      sqlString(productId),
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
    sqlString(productId),
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

const quotationRows = mockQuotations.map((quotation) => `(${[
  sqlString(uuidFor(`quotation:${quotation.id}`)),
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

const quotationItemRows = mockQuotations.flatMap((quotation) => quotation.items.map((item) => `(${[
  sqlString(uuidFor(`quotationItem:${item.id}`)),
  sqlString(uuidFor(`quotation:${quotation.id}`)),
  sqlString(uuidFor(`product:${item.productId}`)),
  sqlString(item.productCode),
  sqlString(item.productName),
  sqlNumber(item.quantity),
  sqlNumber(item.unitPrice),
  sqlNumber(item.taxPercent),
  sqlNumber(item.discount),
  sqlNumber(item.lineTotal),
  sqlDate(quotation.createdAt),
].join(', ')})`));

const invoiceRows = mockInvoices.map((invoice) => `(${[
  sqlString(uuidFor(`invoice:${invoice.id}`)),
  sqlString(invoice.invoiceNumber),
  invoice.quotationId ? sqlString(uuidFor(`quotation:${invoice.quotationId}`)) : 'null',
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

const invoiceItemRows = mockInvoices.flatMap((invoice) => invoice.items.map((item) => `(${[
  sqlString(uuidFor(`invoiceItem:${item.id}`)),
  sqlString(uuidFor(`invoice:${invoice.id}`)),
  sqlString(uuidFor(`product:${item.productId}`)),
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

const deliveryPersonRows = [
  `('${uuidFor('deliveryPerson:dp-001')}', 'James Wilson', '+1 555-8001', 'NY-1234', now(), now())`,
  `('${uuidFor('deliveryPerson:dp-002')}', 'Mike Thompson', '+1 555-8002', 'CA-5678', now(), now())`,
];

const deliveryRows = mockDeliveries.map((delivery) => `(${[
  sqlString(uuidFor(`delivery:${delivery.id}`)),
  sqlString(uuidFor(`invoice:${delivery.invoiceId}`)),
  sqlString(delivery.invoiceNumber),
  sqlString(delivery.productCode),
  sqlString(delivery.productName),
  sqlNumber(delivery.quantity),
  sqlString(delivery.currentStage),
  sqlString(delivery.status),
  delivery.deliveryPerson ? sqlString(uuidFor(`deliveryPerson:${delivery.deliveryPerson.id}`)) : 'null',
  sqlString(delivery.recipientName ?? null),
  sqlString(delivery.recipientPhone ?? null),
  sqlString(delivery.deliveryAddress),
  delivery.estimatedDeliveryDate ? dateOnly(delivery.estimatedDeliveryDate) : 'null',
  delivery.actualDeliveryDate ? dateOnly(delivery.actualDeliveryDate) : 'null',
  sqlString(delivery.notes ?? null),
  sqlDate(delivery.createdAt),
  sqlDate(delivery.createdAt),
].join(', ')})`);

const trackingRows = mockDeliveries.flatMap((delivery) => delivery.trackingHistory.map((event) => `(${[
  sqlString(uuidFor(`tracking:${event.id}`)),
  sqlString(uuidFor(`delivery:${delivery.id}`)),
  sqlString(event.stage),
  sqlDate(event.timestamp),
  sqlString(event.notes ?? null),
  'null',
  sqlString(event.location ?? null),
].join(', ')})`));

const inventoryRows = mockInventoryLogs.map((log) => `(${[
  sqlString(uuidFor(`inventoryLog:${log.id}`)),
  sqlString(uuidFor(`product:${log.productId}`)),
  sqlString(log.productCode),
  sqlString(log.productName),
  sqlNumber(log.change),
  sqlString(log.reason),
  sqlString(log.userId),
  sqlString(log.userName),
  sqlDate(log.timestamp),
  sqlString(log.notes ?? null),
].join(', ')})`);

const repairJobRows = [
  `('${uuidFor('repairJob:rj-001')}', 'LAB-2026-001', (select id from public.customers where phone = '9841000001'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'to_do', 'high', 185.00, 0.00, 'Screen replacement', '2 intake photos attached, glass fracture around top-left corner.', 'Customer device received', gen_random_uuid(), null, null, now(), now())`,
  `('${uuidFor('repairJob:rj-002')}', 'LAB-2026-002', (select id from public.customers where phone = '9841000002'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'in_progress', 'normal', 145.00, 0.00, 'Battery swap', 'Battery health at 71%, device warms under camera load.', 'Inspection in progress', gen_random_uuid(), null, null, now(), now())`,
  `('${uuidFor('repairJob:rj-003')}', 'LAB-2026-003', (select id from public.customers where phone = '9841000003'), null, (select id from public.profiles where email = 'tech3@itshop.com'), 'waiting_for_parts', 'high', 240.00, 0.00, 'Water damage', 'Parts order placed for the USB-C daughterboard.', 'Awaiting part arrival', gen_random_uuid(), null, null, now(), now())`,
  `('${uuidFor('repairJob:rj-004')}', 'LAB-2026-004', (select id from public.customers where phone = '9841000004'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'quality_check', 'normal', 95.00, 0.00, 'Touch calibration', 'Public update ready; internal notes mention intermittent touch lag.', 'Final checks in progress', gen_random_uuid(), null, null, now(), now())`,
  `('${uuidFor('repairJob:rj-005')}', 'LAB-2026-005', (select id from public.customers where phone = '9841000005'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'ready', 'normal', 70.00, 0.00, 'Ready for pickup', 'SMS trigger sent after final QC pass.', 'Ready for pickup', gen_random_uuid(), now(), null, now(), now())`,
];

const repairUpdateRows = [
  `('${uuidFor('repairUpdate:rju-001')}', '${uuidFor('repairJob:rj-002')}', now() - interval '2 hours', 'Maya removed the back cover and verified battery cycle count.', 'internal', 'in_progress', (select id from public.profiles where email = 'tech2@itshop.com'))`,
  `('${uuidFor('repairUpdate:rju-002')}', '${uuidFor('repairJob:rj-003')}', now() - interval '90 minutes', 'Noah marked the USB-C board as required and updated the customer note.', 'internal', 'waiting_for_parts', (select id from public.profiles where email = 'tech3@itshop.com'))`,
  `('${uuidFor('repairUpdate:rju-003')}', '${uuidFor('repairJob:rj-005')}', now() - interval '30 minutes', 'Automation queue marked the job for SMS and email dispatch.', 'public', 'ready', (select id from public.profiles where email = 'tech2@itshop.com'))`,
];

const repairPhotoRows = [
  `('${uuidFor('repairPhoto:rjp-001')}', '${uuidFor('repairJob:rj-001')}', 'https://example.com/intake/lab-2026-001-front.jpg', 'Front intake photo', now())`,
  `('${uuidFor('repairPhoto:rjp-002')}', '${uuidFor('repairJob:rj-001')}', 'https://example.com/intake/lab-2026-001-back.jpg', 'Rear intake photo', now())`,
  `('${uuidFor('repairPhoto:rjp-003')}', '${uuidFor('repairJob:rj-003')}', 'https://example.com/intake/lab-2026-003-water.jpg', 'Water damage evidence', now())`,
];

const repairPartRows = [
  `('${uuidFor('repairPart:rjp-pt-001')}', '${uuidFor('repairJob:rj-002')}', (select id from public.products where product_code = 'HW-CHG-001'), 1, 1500.00, 1500.00, now(), now())`,
  `('${uuidFor('repairPart:rjp-pt-002')}', '${uuidFor('repairJob:rj-003')}', (select id from public.products where product_code = 'HW-ACC-003'), 1, 50.00, 50.00, now(), now())`,
];

const sql = `-- Route3 / IT Shop Manager demo seed data
-- Run after the schema migration.

insert into public.profiles (auth_user_id, email, name, role, is_active)
values
${profileValues}
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  is_active = true,
  updated_at = now();

insert into public.device_brands (name)
values
  ('Apple'), ('Samsung'), ('Google'), ('Xiaomi'), ('OnePlus')
on conflict (name) do nothing;

insert into public.device_colors (name)
values
  ('Black'), ('White'), ('Blue'), ('Silver'), ('Graphite'), ('Gold')
on conflict (name) do nothing;

insert into public.labor_rates (service_name, base_price, average_time_required_minutes, description)
values
  ('Screen Replacement', 120.00, 90, 'Common display and glass repair'),
  ('Battery Swap', 70.00, 45, 'Battery replacement and calibration'),
  ('Water Damage', 180.00, 180, 'Liquid damage diagnostics and cleaning'),
  ('Charging Port Repair', 85.00, 60, 'Port replacement or board-level cleaning'),
  ('Camera Replacement', 95.00, 75, 'Rear or front camera module replacement')
on conflict (service_name) do update set
  base_price = excluded.base_price,
  average_time_required_minutes = excluded.average_time_required_minutes,
  description = excluded.description,
  is_active = true,
  updated_at = now();

insert into public.customers (name, phone, email, notes)
values
  ('Aarav Shrestha', '9841000001', 'aarav@example.com', 'Returning customer'),
  ('Nisha Karki', '9841000002', 'nisha@example.com', 'Prefers SMS updates'),
  ('Ravi Gurung', '9841000003', 'ravi@example.com', 'Needs water damage diagnostics'),
  ('Sita Thapa', '9841000004', 'sita@example.com', 'Warranty eligible'),
  ('Prakash Lama', '9841000005', 'prakash@example.com', 'Pickup notification ready')
on conflict (phone) do update set
  name = excluded.name,
  email = excluded.email,
  notes = excluded.notes,
  updated_at = now();

insert into public.products (id, product_code, barcode, name, category, type, cost_price, selling_price, tax_percent, status, description, stock_quantity, supplier, warranty_period, license_type, license_quantity, expiry_date, created_at, updated_at)
values
${productRows.join(',\n')}
on conflict (id) do update set
  product_code = excluded.product_code,
  barcode = excluded.barcode,
  name = excluded.name,
  category = excluded.category,
  type = excluded.type,
  cost_price = excluded.cost_price,
  selling_price = excluded.selling_price,
  tax_percent = excluded.tax_percent,
  status = excluded.status,
  description = excluded.description,
  stock_quantity = excluded.stock_quantity,
  supplier = excluded.supplier,
  warranty_period = excluded.warranty_period,
  license_type = excluded.license_type,
  license_quantity = excluded.license_quantity,
  expiry_date = excluded.expiry_date,
  updated_at = now();

insert into public.quotations (id, quotation_number, customer_id, client_name, client_email, client_phone, client_address, subtotal, total_discount, total_tax, grand_total, status, valid_until, notes, created_by, created_at, updated_at)
values
${quotationRows.join(',\n')}
on conflict (id) do update set
  quotation_number = excluded.quotation_number,
  client_name = excluded.client_name,
  client_email = excluded.client_email,
  client_phone = excluded.client_phone,
  client_address = excluded.client_address,
  subtotal = excluded.subtotal,
  total_discount = excluded.total_discount,
  total_tax = excluded.total_tax,
  grand_total = excluded.grand_total,
  status = excluded.status,
  valid_until = excluded.valid_until,
  notes = excluded.notes,
  updated_at = now();

insert into public.quotation_items (id, quotation_id, product_id, product_code, product_name, quantity, unit_price, tax_percent, discount, line_total, created_at)
values
${quotationItemRows.join(',\n')}
on conflict (id) do nothing;

insert into public.invoices (id, invoice_number, quotation_id, customer_id, client_name, client_email, client_phone, client_address, subtotal, total_discount, total_tax, grand_total, payment_mode, status, created_by, created_at, paid_at, updated_at)
values
${invoiceRows.join(',\n')}
on conflict (id) do update set
  invoice_number = excluded.invoice_number,
  quotation_id = excluded.quotation_id,
  client_name = excluded.client_name,
  client_email = excluded.client_email,
  client_phone = excluded.client_phone,
  client_address = excluded.client_address,
  subtotal = excluded.subtotal,
  total_discount = excluded.total_discount,
  total_tax = excluded.total_tax,
  grand_total = excluded.grand_total,
  payment_mode = excluded.payment_mode,
  status = excluded.status,
  paid_at = excluded.paid_at,
  updated_at = now();

insert into public.invoice_items (id, invoice_id, product_id, product_code, product_name, quantity, unit_price, cost_price, tax_percent, discount, line_total, created_at)
values
${invoiceItemRows.join(',\n')}
on conflict (id) do nothing;

insert into public.delivery_people (id, name, phone, vehicle_number, created_at, updated_at)
values
${deliveryPersonRows.join(',\n')}
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  vehicle_number = excluded.vehicle_number,
  updated_at = now();

insert into public.deliveries (id, invoice_id, invoice_number, product_code, product_name, quantity, current_stage, status, delivery_person_id, recipient_name, recipient_phone, delivery_address, estimated_delivery_date, actual_delivery_date, notes, created_at, updated_at)
values
${deliveryRows.join(',\n')}
on conflict (id) do update set
  invoice_id = excluded.invoice_id,
  invoice_number = excluded.invoice_number,
  product_code = excluded.product_code,
  product_name = excluded.product_name,
  quantity = excluded.quantity,
  current_stage = excluded.current_stage,
  status = excluded.status,
  delivery_person_id = excluded.delivery_person_id,
  recipient_name = excluded.recipient_name,
  recipient_phone = excluded.recipient_phone,
  delivery_address = excluded.delivery_address,
  estimated_delivery_date = excluded.estimated_delivery_date,
  actual_delivery_date = excluded.actual_delivery_date,
  notes = excluded.notes,
  updated_at = now();

insert into public.delivery_tracking_events (id, delivery_id, stage, timestamp, notes, updated_by, location)
values
${trackingRows.join(',\n')}
on conflict (id) do nothing;

insert into public.inventory_logs (id, product_id, product_code, product_name, change, reason, user_id, user_name, timestamp, notes)
values
${inventoryRows.join(',\n')}
on conflict (id) do nothing;

insert into public.repair_jobs (id, job_id, customer_id, device_id, assigned_tech_id, status, priority, estimated_cost, deposit_paid, issue_summary, intake_notes, public_update, qr_token, ready_notified_at, completed_at, created_at, updated_at)
values
${repairJobRows.join(',\n')}
on conflict (id) do update set
  status = excluded.status,
  priority = excluded.priority,
  estimated_cost = excluded.estimated_cost,
  deposit_paid = excluded.deposit_paid,
  issue_summary = excluded.issue_summary,
  intake_notes = excluded.intake_notes,
  public_update = excluded.public_update,
  updated_at = now();

insert into public.repair_job_updates (id, job_id, logged_at, note, visibility, status_changed_to, created_by)
values
${repairUpdateRows.join(',\n')}
on conflict (id) do nothing;

insert into public.repair_job_photos (id, job_id, photo_url, caption, created_at)
values
${repairPhotoRows.join(',\n')}
on conflict (id) do nothing;

insert into public.repair_job_parts (id, job_id, product_id, quantity, unit_cost, total_cost, consumed_at, created_at)
values
${repairPartRows.join(',\n')}
on conflict (id) do nothing;

insert into public.system_settings (key, value)
values
  ('company_profile', '{"name":"IT Shop Manager","currency":"USD"}'::jsonb),
  ('notifications', '{"readyPickupSms": true, "readyPickupEmail": true}'::jsonb)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
`;

fs.writeFileSync(outputPath, sql);
console.log(`Wrote ${outputPath}`);
