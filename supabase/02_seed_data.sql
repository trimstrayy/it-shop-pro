-- Route3 / IT Shop Manager demo seed data
-- Run after the schema migration.

insert into public.profiles (auth_user_id, email, name, role, is_active)
values
(null, 'admin@itshop.com', 'John Admin', 'admin', true),
(null, 'sales@itshop.com', 'Sarah Sales', 'sales', true),
(null, 'inventory@itshop.com', 'Mike Inventory', 'inventory', true),
(null, 'accountant@itshop.com', 'Lisa Accounts', 'accountant', true),
(null, 'tech1@itshop.com', 'Alex Technician', 'technician', true),
(null, 'tech2@itshop.com', 'Maya Technician', 'technician', true),
(null, 'tech3@itshop.com', 'Noah Technician', 'technician', true)
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
('ffc59952-9d8e-4c58-a6e2-1c2f4ca091e7', 'HW-LPT-001', '8901234567890', 'Dell Latitude 5540 Laptop', 'Laptops', 'hardware', 85000, 119900, 13, 'active', '15.6" FHD, Intel Core i7, 16GB RAM, 512GB SSD', 25, 'Dell Technologies', 24, null, null, null, '2024-01-15T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('288ad001-c1c9-4f56-bb9c-d80c37e97530', 'HW-LPT-002', '8901234567891', 'HP EliteBook 840 G10', 'Laptops', 'hardware', 92000, 134900, 13, 'active', '14" FHD, Intel Core i7, 32GB RAM, 1TB SSD', 15, 'HP Inc.', 36, null, null, null, '2024-02-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('1753c7eb-03f7-41c4-9e8b-a2bbc5ef5393', 'HW-MON-001', '8901234567892', 'LG UltraWide 34" Monitor', 'Monitors', 'hardware', 38000, 54900, 13, 'active', '34" IPS, 3440x1440, 75Hz, USB-C', 8, 'LG Electronics', 36, null, null, null, '2024-03-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('57a9d4e9-79b7-4c46-9544-aae50dd6807b', 'HW-KBD-001', '8901234567893', 'Logitech MX Keys Wireless', 'Keyboards', 'hardware', 6500, 9900, 13, 'active', 'Wireless Keyboard, Backlit, Multi-device', 45, 'Logitech', 12, null, null, null, '2024-04-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('24449291-ad06-4691-ae5b-9381f21c27c1', 'HW-MOU-001', '8901234567894', 'Logitech MX Master 3S', 'Mice', 'hardware', 5500, 8900, 13, 'active', 'Wireless Mouse, 8000 DPI, Ergonomic', 3, 'Logitech', 12, null, null, null, '2024-04-15T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('507cbe36-e6e7-4f07-a22b-432efa45e2f2', 'HW-GPU-001', '8901234567895', 'NVIDIA RTX 4070', 'Graphics Cards', 'hardware', 48000, 64900, 13, 'active', '12GB GDDR6X, Ray Tracing, DLSS 3', 0, 'NVIDIA', 36, null, null, null, '2024-05-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('d7672b47-3340-4078-a183-9d1dd427f70a', 'HW-CVR-001', '8901234567910', 'iPhone 15 Pro Max Silicone Case', 'Accessories', 'hardware', 250, 450, 13, 'active', 'Premium silicone case for iPhone 15 Pro Max', 100, 'Mobile Accessories Ltd', 3, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('652eeed7-9851-4c57-8c05-e2df383fc456', 'HW-CVR-002', '8901234567911', 'Samsung S24 Ultra Tough Case', 'Accessories', 'hardware', 350, 650, 13, 'active', 'Military-grade protection case for Samsung S24 Ultra', 75, 'Mobile Accessories Ltd', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('93f0d681-82ba-4f25-a0b0-d144f4451ff3', 'HW-CVR-003', '8901234567912', 'Universal Phone Back Cover Clear', 'Accessories', 'hardware', 100, 199, 13, 'active', 'Crystal clear TPU case - Universal fit', 200, 'Mobile Accessories Ltd', 1, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('ad1e9f2a-8da3-49ae-977f-71d53f1a4827', 'HW-CBL-001', '8901234567920', 'USB-C to USB-C Fast Charging Cable 1m', 'Cables', 'hardware', 150, 350, 13, 'active', '100W PD Fast Charging, Data Transfer 480Mbps', 150, 'Cable World', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('559b5e87-c686-4bdb-9dd8-75e036b3b8f8', 'HW-CBL-002', '8901234567921', 'Lightning to USB-C Cable 2m', 'Cables', 'hardware', 200, 450, 13, 'active', 'MFi Certified, Fast Charging for iPhone/iPad', 100, 'Cable World', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('c8b550cf-307c-4fb2-b4c9-3c60c07f828a', 'HW-CBL-003', '8901234567922', 'HDMI 2.1 Cable 3m', 'Cables', 'hardware', 400, 850, 13, 'active', '8K@60Hz, 4K@120Hz, eARC, HDR Support', 50, 'Cable World', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('d3e4974f-0fb0-4f5b-9116-d9d9c08515c1', 'HW-CHG-001', '8901234567930', 'Dell 65W USB-C Laptop Charger', 'Peripherals', 'hardware', 1500, 2500, 13, 'active', 'Original Dell 65W Type-C Power Adapter', 30, 'Dell Technologies', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('8690ef9f-1362-4bf7-b5a3-1a5579f02e2a', 'HW-CHG-002', '8901234567931', 'HP 90W Smart AC Adapter', 'Peripherals', 'hardware', 1800, 3200, 13, 'active', 'HP 90W Barrel Pin Laptop Charger', 25, 'HP Inc.', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('c788b15c-d57f-4fd7-a092-73d7e227b9f5', 'HW-CHG-003', '8901234567932', 'Universal 100W GaN Charger', 'Peripherals', 'hardware', 2000, 3500, 13, 'active', '4-Port GaN Charger (2x USB-C, 2x USB-A)', 40, 'Power Solutions', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('266450de-4a61-42ee-8e0a-e2486173d7b5', 'HW-WRP-001', '8901234567940', 'iPhone 15 Carbon Fiber Skin', 'Accessories', 'hardware', 150, 350, 13, 'active', 'Premium 3M vinyl carbon fiber wrap for iPhone 15', 80, 'SkinMaster Nepal', 0, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('d0b38707-a2e5-461a-b574-311822b80034', 'HW-WRP-002', '8901234567941', 'MacBook Pro 14" Matte Skin', 'Accessories', 'hardware', 400, 850, 13, 'active', 'Full body matte vinyl wrap for MacBook Pro 14"', 40, 'SkinMaster Nepal', 0, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('e3c726a3-cb5f-41fb-8ae2-ee13079a259d', 'HW-WRP-003', '8901234567942', 'Laptop Keyboard Skin Universal', 'Accessories', 'hardware', 80, 199, 13, 'active', 'Silicone keyboard protector - 15.6" laptops', 100, 'SkinMaster Nepal', 1, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('5cb40805-8dd2-499f-936a-10de1ed33f10', 'HW-LED-001', '8901234567950', 'RGB LED Strip 5m Smart', 'Peripherals', 'hardware', 800, 1500, 13, 'active', 'WiFi RGB LED Strip, App Control, Music Sync', 60, 'LightUp Nepal', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('0d0c4654-768d-4c07-90e1-97561f0c852c', 'HW-LED-002', '8901234567951', 'Monitor Ambient Light Bar', 'Peripherals', 'hardware', 1200, 2200, 13, 'active', 'USB-powered monitor light bar, adjustable brightness', 35, 'LightUp Nepal', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('75d0fa7d-5d97-44d2-b547-5e6b323511f2', 'HW-LED-003', '8901234567952', 'RGB Gaming Desk Lamp', 'Peripherals', 'hardware', 1500, 2800, 13, 'active', 'RGB desk lamp with wireless charger base', 20, 'LightUp Nepal', 12, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('05254688-f22a-4b15-95b3-3af375038fd6', 'HW-ACC-001', '8901234567960', 'Phone Stand Aluminum', 'Accessories', 'hardware', 200, 450, 13, 'active', 'Adjustable aluminum phone/tablet stand', 70, 'Mobile Accessories Ltd', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('f53fe6b1-7853-48ad-97bb-80809d7b6ce8', 'HW-ACC-002', '8901234567961', 'Laptop Cooling Pad', 'Accessories', 'hardware', 600, 1200, 13, 'active', 'Dual fan cooling pad with adjustable height', 45, 'TechGear Nepal', 6, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('2be5b14d-b043-4586-8a3b-96f4c88f6281', 'HW-ACC-003', '8901234567962', 'Webcam Cover Slide 3-Pack', 'Accessories', 'hardware', 50, 150, 13, 'active', 'Privacy webcam cover for laptops - Pack of 3', 200, 'TechGear Nepal', 0, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('eb69d412-4257-42cd-a532-f7ebd108a117', 'HW-ACC-004', '8901234567963', 'Screen Cleaning Kit', 'Accessories', 'hardware', 100, 250, 13, 'active', 'Microfiber cloth + cleaning solution spray', 150, 'TechGear Nepal', 0, null, null, null, '2024-06-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('4ae96fb6-5e5f-478b-9a47-3c0579140fca', 'SW-OFF-001', '8901234567900', 'Microsoft 365 Business', 'Office Suite', 'software', 8500, 14900, 13, 'active', 'Word, Excel, PowerPoint, Outlook - Annual License', null, null, null, 'multi-user', 50, '2025-12-31', '2024-01-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('d4fd06ca-6712-4a06-a560-d37e20e9129f', 'SW-ANT-001', '8901234567901', 'Norton 360 Premium', 'Antivirus', 'software', 3500, 7900, 13, 'active', 'Antivirus, VPN, Cloud Backup - 1 Year', null, null, null, 'single', 100, '2025-06-30', '2024-02-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('262232a9-567d-4c55-8042-ab608009cc0a', 'SW-OS-001', '8901234567902', 'Windows 11 Pro', 'Operating Systems', 'software', 12000, 19900, 13, 'active', 'Windows 11 Professional License', null, null, null, 'single', 30, null, '2024-03-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('90f81452-236c-4ed0-9fb8-53850b6b719e', 'SW-ADB-001', '8901234567903', 'Adobe Creative Cloud', 'Software Licenses', 'software', 35000, 59900, 13, 'active', 'Full Creative Suite - Annual Subscription', null, null, null, 'single', 5, '2025-03-31', '2024-04-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z')
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
('18d13252-d302-4718-b960-f8c72b10e580', 'QT-0001', null, 'Tech Solutions Pvt. Ltd.', 'procurement@techsolutions.com.np', '+977 9801234567', '123 Durbar Marg, Kathmandu 44600', 1347000, 59950, 167515, 1451500, 'sent', '2025-01-15', 'Bulk order discount applied. Installation included.', null, '2024-12-01T00:00:00.000Z', '2024-12-01T00:00:00.000Z'),
('c0f7dad5-a118-436e-96f5-854d9265ff7f', 'QT-0002', null, 'StartUp Labs Nepal', 'office@startuplabs.com.np', '+977 9812345678', 'Pulchowk, Lalitpur 44700', 674500, 0, 87685, 762185, 'draft', '2025-01-20', null, null, '2024-12-15T00:00:00.000Z', '2024-12-15T00:00:00.000Z')
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
('7bd33ebe-9233-4f11-b797-e0665923ad94', '18d13252-d302-4718-b960-f8c72b10e580', 'ffc59952-9d8e-4c58-a6e2-1c2f4ca091e7', 'HW-LPT-001', 'Dell Latitude 5540 Laptop', 10, 119900, 13, 5, 1283130, '2024-12-01T00:00:00.000Z'),
('f194adf6-a0df-407a-afd0-3c6a35d15d9c', '18d13252-d302-4718-b960-f8c72b10e580', '4ae96fb6-5e5f-478b-9a47-3c0579140fca', 'SW-OFF-001', 'Microsoft 365 Business', 10, 14900, 13, 0, 168370, '2024-12-01T00:00:00.000Z'),
('58c715d7-3998-41db-be03-85c54a0a6edf', 'c0f7dad5-a118-436e-96f5-854d9265ff7f', '288ad001-c1c9-4f56-bb9c-d80c37e97530', 'HW-LPT-002', 'HP EliteBook 840 G10', 5, 134900, 13, 0, 762185, '2024-12-15T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.invoices (id, invoice_number, quotation_id, customer_id, client_name, client_email, client_phone, client_address, subtotal, total_discount, total_tax, grand_total, payment_mode, status, created_by, created_at, paid_at, updated_at)
values
('a0e6b7ad-fe08-49c9-9c8e-f217f3692b34', 'INV-2024-001', '18d13252-d302-4718-b960-f8c72b10e580', null, 'Tech Solutions Pvt. Ltd.', 'procurement@techsolutions.com.np', '+977 9801234567', '123 Durbar Marg, Kathmandu 44600', 1347000, 59950, 167515, 1451500, 'bank', 'paid', null, '2024-12-05T00:00:00.000Z', '2024-12-07T00:00:00.000Z', '2024-12-05T00:00:00.000Z'),
('cae831be-d539-49cf-9746-a7d93f5ef742', 'INV-2024-002', null, null, 'Digital Agency Nepal', 'admin@digitalagency.com.np', '+977 9823456789', 'Thamel, Kathmandu 44600', 459200, 23960, 56581, 491781, 'online', 'pending', null, '2024-12-20T00:00:00.000Z', null, '2024-12-20T00:00:00.000Z')
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
('22e12dcf-7483-43ae-89ae-fdd709d02d4f', 'a0e6b7ad-fe08-49c9-9c8e-f217f3692b34', 'ffc59952-9d8e-4c58-a6e2-1c2f4ca091e7', 'HW-LPT-001', 'Dell Latitude 5540 Laptop', 10, 119900, 85000, 13, 5, 1283130, '2024-12-05T00:00:00.000Z'),
('20a67384-5a4b-451d-8473-9f634e26538a', 'a0e6b7ad-fe08-49c9-9c8e-f217f3692b34', '4ae96fb6-5e5f-478b-9a47-3c0579140fca', 'SW-OFF-001', 'Microsoft 365 Business', 10, 14900, 8500, 13, 0, 168370, '2024-12-05T00:00:00.000Z'),
('1f2ccc04-19f1-447f-bba5-90fbe95b4aec', 'cae831be-d539-49cf-9746-a7d93f5ef742', '1753c7eb-03f7-41c4-9e8b-a2bbc5ef5393', 'HW-MON-001', 'LG UltraWide 34" Monitor', 4, 54900, 38000, 13, 0, 248148, '2024-12-20T00:00:00.000Z'),
('19d7f475-7803-4dca-b9ff-9d37ab3a7c16', 'cae831be-d539-49cf-9746-a7d93f5ef742', '90f81452-236c-4ed0-9fb8-53850b6b719e', 'SW-ADB-001', 'Adobe Creative Cloud', 4, 59900, 35000, 13, 10, 243633, '2024-12-20T00:00:00.000Z')
on conflict (id) do nothing;

insert into public.delivery_people (id, name, phone, vehicle_number, created_at, updated_at)
values
('8f91a10a-aa76-405f-b648-c6ec201174e5', 'James Wilson', '+1 555-8001', 'NY-1234', now(), now()),
('0d42854f-df73-4a1c-b753-29ba0a1c218d', 'Mike Thompson', '+1 555-8002', 'CA-5678', now(), now())
on conflict (id) do update set
  name = excluded.name,
  phone = excluded.phone,
  vehicle_number = excluded.vehicle_number,
  updated_at = now();

insert into public.deliveries (id, invoice_id, invoice_number, product_code, product_name, quantity, current_stage, status, delivery_person_id, recipient_name, recipient_phone, delivery_address, estimated_delivery_date, actual_delivery_date, notes, created_at, updated_at)
values
('1a62476f-8c3c-4676-bd47-1d7e19c11094', 'a0e6b7ad-fe08-49c9-9c8e-f217f3692b34', 'INV-2024-001', 'HW-LPT-001', 'Dell Latitude 5540 Laptop', 10, 'collected_by_receiver', 'completed', '8f91a10a-aa76-405f-b648-c6ec201174e5', 'Tech Solutions Inc.', '+1 555-0123', '123 Business Park, Suite 100, New York, NY 10001', '2024-12-08', '2024-12-08', null, '2024-12-05T00:00:00.000Z', '2024-12-05T00:00:00.000Z'),
('8372d870-681d-4c68-9db3-f1c92b29e087', 'cae831be-d539-49cf-9746-a7d93f5ef742', 'INV-2024-002', 'HW-MON-001', 'LG UltraWide 34" Monitor', 4, 'in_transit', 'in_progress', '0d42854f-df73-4a1c-b753-29ba0a1c218d', 'Digital Agency Co.', '+1 555-0789', '789 Creative Blvd, Los Angeles, CA 90001', '2024-12-23', null, null, '2024-12-20T00:00:00.000Z', '2024-12-20T00:00:00.000Z'),
('9d4f20c7-1dac-4467-8d3e-c9c861d2332f', 'cae831be-d539-49cf-9746-a7d93f5ef742', 'INV-2024-002', 'SW-ADB-001', 'Adobe Creative Cloud', 4, 'in_inventory', 'pending', null, 'Digital Agency Co.', '+1 555-0789', '789 Creative Blvd, Los Angeles, CA 90001', null, null, null, '2024-12-20T00:00:00.000Z', '2024-12-20T00:00:00.000Z')
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
('0f55d655-a1cf-4751-98ce-70b6d551e508', '1a62476f-8c3c-4676-bd47-1d7e19c11094', 'in_inventory', '2024-12-05T03:15:00.000Z', 'Order created, ready for dispatch', null, null),
('24ee3362-187e-4684-8415-ff336ab0244a', '1a62476f-8c3c-4676-bd47-1d7e19c11094', 'collected_by_driver', '2024-12-06T04:45:00.000Z', 'Picked up from warehouse', null, null),
('72d64f81-2db9-47ae-82bb-5177a4bded30', '1a62476f-8c3c-4676-bd47-1d7e19c11094', 'in_transit', '2024-12-06T05:15:00.000Z', null, null, 'En route to New York'),
('4c5edca9-5151-4a8d-9302-f0817e64b0f0', '1a62476f-8c3c-4676-bd47-1d7e19c11094', 'arrived_at_location', '2024-12-08T08:15:00.000Z', null, null, '123 Business Park'),
('827edef7-85df-44ad-8f5a-17299938fe50', '1a62476f-8c3c-4676-bd47-1d7e19c11094', 'collected_by_receiver', '2024-12-08T08:45:00.000Z', 'Signed by John from Tech Solutions', null, null),
('fe8c7b79-375a-431e-a34e-1e7100fcdef0', '8372d870-681d-4c68-9db3-f1c92b29e087', 'in_inventory', '2024-12-20T04:15:00.000Z', 'Order created', null, null),
('1854ddb3-ce2c-44da-95da-884e1843f875', '8372d870-681d-4c68-9db3-f1c92b29e087', 'collected_by_driver', '2024-12-21T03:15:00.000Z', 'Collected from warehouse', null, null),
('907d12ae-b0cc-48db-9dd6-cc37c6093599', '8372d870-681d-4c68-9db3-f1c92b29e087', 'in_transit', '2024-12-21T03:45:00.000Z', null, null, 'Heading to Los Angeles'),
('9668fc7f-0550-43e1-9164-3bb90853c733', '9d4f20c7-1dac-4467-8d3e-c9c861d2332f', 'in_inventory', '2024-12-20T04:15:00.000Z', 'Digital license - pending activation', null, null)
on conflict (id) do nothing;

insert into public.inventory_logs (id, product_id, product_code, product_name, change, reason, user_id, user_name, timestamp, notes)
values
('bb6c579d-1af8-4ca9-a82f-0e79d654fd69', 'ffc59952-9d8e-4c58-a6e2-1c2f4ca091e7', 'HW-LPT-001', 'Dell Latitude 5540 Laptop', -10, 'sale', (select id from public.profiles where email = 'sales@itshop.com'), 'Sarah Sales', '2024-12-05T00:00:00.000Z', 'Invoice INV-2024-001'),
('09c2063a-a2ad-4dfe-977e-b152e04eece3', '1753c7eb-03f7-41c4-9e8b-a2bbc5ef5393', 'HW-MON-001', 'LG UltraWide 34" Monitor', -4, 'sale', (select id from public.profiles where email = 'sales@itshop.com'), 'Sarah Sales', '2024-12-20T00:00:00.000Z', 'Invoice INV-2024-002'),
('6cdbb1cd-5a06-4637-9802-bbce4c3262bc', '24449291-ad06-4691-ae5b-9381f21c27c1', 'HW-MOU-001', 'Logitech MX Master 3S', 20, 'purchase', (select id from public.profiles where email = 'inventory@itshop.com'), 'Mike Inventory', '2024-12-18T00:00:00.000Z', 'Stock replenishment from supplier'),
('5df44da3-9f11-4785-8e4c-d22f71bf0fb5', '4ae96fb6-5e5f-478b-9a47-3c0579140fca', 'SW-OFF-001', 'Microsoft 365 Business', -10, 'sale', (select id from public.profiles where email = 'sales@itshop.com'), 'Sarah Sales', '2024-12-05T00:00:00.000Z', 'Invoice INV-2024-001')
on conflict (id) do nothing;

insert into public.repair_jobs (id, job_id, customer_id, device_id, assigned_tech_id, status, priority, estimated_cost, deposit_paid, issue_summary, intake_notes, public_update, qr_token, ready_notified_at, completed_at, created_at, updated_at)
values
('5bf84ad6-8821-41ca-8b07-e647c894c68f', 'LAB-2026-001', (select id from public.customers where phone = '9841000001'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'to_do', 'high', 185.00, 0.00, 'Screen replacement', '2 intake photos attached, glass fracture around top-left corner.', 'Customer device received', gen_random_uuid(), null, null, now(), now()),
('1da16f19-9973-4ed1-bd32-049c07890925', 'LAB-2026-002', (select id from public.customers where phone = '9841000002'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'in_progress', 'normal', 145.00, 0.00, 'Battery swap', 'Battery health at 71%, device warms under camera load.', 'Inspection in progress', gen_random_uuid(), null, null, now(), now()),
('1f64fcf1-3a57-472b-ae3a-6b1bc2710241', 'LAB-2026-003', (select id from public.customers where phone = '9841000003'), null, (select id from public.profiles where email = 'tech3@itshop.com'), 'waiting_for_parts', 'high', 240.00, 0.00, 'Water damage', 'Parts order placed for the USB-C daughterboard.', 'Awaiting part arrival', gen_random_uuid(), null, null, now(), now()),
('1e400fca-cd15-46b1-a4ee-7a3fdb55b9f0', 'LAB-2026-004', (select id from public.customers where phone = '9841000004'), null, (select id from public.profiles where email = 'tech1@itshop.com'), 'quality_check', 'normal', 95.00, 0.00, 'Touch calibration', 'Public update ready; internal notes mention intermittent touch lag.', 'Final checks in progress', gen_random_uuid(), null, null, now(), now()),
('736a3ce7-5c49-4cd1-8296-30994e6e215b', 'LAB-2026-005', (select id from public.customers where phone = '9841000005'), null, (select id from public.profiles where email = 'tech2@itshop.com'), 'ready', 'normal', 70.00, 0.00, 'Ready for pickup', 'SMS trigger sent after final QC pass.', 'Ready for pickup', gen_random_uuid(), now(), null, now(), now())
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
('2c924494-1a4f-49f9-8b49-340a94d7ac54', '1da16f19-9973-4ed1-bd32-049c07890925', now() - interval '2 hours', 'Maya removed the back cover and verified battery cycle count.', 'internal', 'in_progress', (select id from public.profiles where email = 'tech2@itshop.com')),
('4378884d-193f-406b-83b9-8703cfe99cb1', '1f64fcf1-3a57-472b-ae3a-6b1bc2710241', now() - interval '90 minutes', 'Noah marked the USB-C board as required and updated the customer note.', 'internal', 'waiting_for_parts', (select id from public.profiles where email = 'tech3@itshop.com')),
('060dee88-0f2f-44e1-88f8-85fd9bb55cef', '736a3ce7-5c49-4cd1-8296-30994e6e215b', now() - interval '30 minutes', 'Automation queue marked the job for SMS and email dispatch.', 'public', 'ready', (select id from public.profiles where email = 'tech2@itshop.com'))
on conflict (id) do nothing;

insert into public.repair_job_photos (id, job_id, photo_url, caption, created_at)
values
('48fe3003-e4b6-4b35-a975-3441bc9c215c', '5bf84ad6-8821-41ca-8b07-e647c894c68f', 'https://example.com/intake/lab-2026-001-front.jpg', 'Front intake photo', now()),
('7053ec62-ecd1-4fb0-bf04-8070e0690528', '5bf84ad6-8821-41ca-8b07-e647c894c68f', 'https://example.com/intake/lab-2026-001-back.jpg', 'Rear intake photo', now()),
('cb97a998-bff3-40f0-81fb-4d7ee0bb7c68', '1f64fcf1-3a57-472b-ae3a-6b1bc2710241', 'https://example.com/intake/lab-2026-003-water.jpg', 'Water damage evidence', now())
on conflict (id) do nothing;

insert into public.repair_job_parts (id, job_id, product_id, quantity, unit_cost, total_cost, consumed_at, created_at)
values
('919e5cbf-5fb4-43b2-9938-a74720196a68', '1da16f19-9973-4ed1-bd32-049c07890925', (select id from public.products where product_code = 'HW-CHG-001'), 1, 1500.00, 1500.00, now(), now()),
('17b15e89-5009-4d0d-b8d9-d84ad690f393', '1f64fcf1-3a57-472b-ae3a-6b1bc2710241', (select id from public.products where product_code = 'HW-ACC-003'), 1, 50.00, 50.00, now(), now())
on conflict (id) do nothing;

insert into public.system_settings (key, value)
values
  ('company_profile', '{"name":"IT Shop Manager","currency":"USD"}'::jsonb),
  ('notifications', '{"readyPickupSms": true, "readyPickupEmail": true}'::jsonb)
on conflict (key) do update set
  value = excluded.value,
  updated_at = now();
