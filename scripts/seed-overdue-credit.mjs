#!/usr/bin/env node
/**
 * Temporary developer seed script.
 *
 * Injects a dummy overdue credit invoice (8 days old) into the Supabase
 * database so the login-time overdue credit reminder popup can be tested.
 * The in-app equivalent (Settings -> Database & Infrastructure, dev builds)
 * lives in src/components/credits/CreditReminderDevSeed.tsx.
 *
 * Usage:
 *   node scripts/seed-overdue-credit.mjs
 *
 * The script needs write access to the invoices / invoice_items tables and
 * resolves credentials in this order:
 *   1. SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEYS JSON) env var
 *   2. VITE_ADMIN_EMAIL + VITE_ADMIN_PASSWORD (signs in with an active staff
 *      account; the invoices RLS policy permits authenticated writes)
 *
 * Values are read from .env.local (git-ignored) merged with process env.
 */
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Minimal .env parser — one KEY=VALUE per line, optional quotes. */
function loadEnvFile(filename) {
  const file = path.join(root, filename);
  if (!existsSync(file)) return {};
  const env = {};
  for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim().replace(/^export\s+/, '');
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** Supabase supports legacy plain keys and new JSON-object keys. */
function resolveKey(env, legacyName, newName) {
  if (env[legacyName]) return env[legacyName];
  const raw = env[newName];
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    const value = parsed.default ?? Object.values(parsed)[0];
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

const env = { ...loadEnvFile('.env.local'), ...process.env };

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = resolveKey(env, 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS');

if (!supabaseUrl || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const OVERDUE_SEED_INVOICE_ID = '10000000-0000-4000-8000-000000000001';
const OVERDUE_SEED_INVOICE_NUMBER = 'INV-DEV-OVD-001';
const createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

const invoiceRow = {
  id: OVERDUE_SEED_INVOICE_ID,
  invoice_number: OVERDUE_SEED_INVOICE_NUMBER,
  quotation_id: null,
  customer_id: null,
  client_name: 'Test Client (Overdue)',
  client_email: 'overdue-test@example.com',
  client_phone: '+9779812345678',
  client_address: 'Dev seed address, Kathmandu',
  subtotal: 4500,
  total_discount: 0,
  total_tax: 0,
  grand_total: 4500,
  amount_paid: 0,
  amount_due: 4500,
  payment_mode: 'credit',
  status: 'pending',
  created_by: null,
  created_at: createdAt,
  paid_at: null,
  updated_at: createdAt,
  payment_status: 'pending',
};

const itemRow = {
  invoice_id: OVERDUE_SEED_INVOICE_ID,
  product_id: null,
  product_code: 'DEV-OVD-001',
  product_name: '12 mm PVC Carpet',
  quantity: 1,
  unit_price: 4500,
  cost_price: 3000,
  tax_percent: 0,
  discount: 0,
  line_total: 4500,
  created_at: createdAt,
};

async function run() {
  let client;

  if (serviceRoleKey) {
    client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    console.log('Using service-role client (bypasses RLS).');
  } else {
    const email = env.VITE_ADMIN_EMAIL;
    const password = env.VITE_ADMIN_PASSWORD;
    if (!email || !password) {
      console.error(
        '\nNo write-capable client configured.\n' +
          '  - Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEYS JSON), or\n' +
          '  - Set VITE_ADMIN_EMAIL + VITE_ADMIN_PASSWORD to an active staff account\n' +
          '    (the invoices RLS policy allows authenticated inserts).\n',
      );
      process.exit(1);
    }
    client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) {
      console.error(`Sign-in failed: ${signInError.message}`);
      process.exit(1);
    }
    console.log(`Signed in as ${email}.`);
  }

  console.log(`Seeding overdue credit (${OVERDUE_SEED_INVOICE_NUMBER}, created ${createdAt})...\n`);

  // Reset the previous seed row — invoice delete cascades to invoice_items,
  // so re-running the script refreshes the 8-day-old date.
  await client.from('invoices').delete().eq('invoice_number', OVERDUE_SEED_INVOICE_NUMBER);

  const { data: invoice, error: invoiceError } = await client
    .from('invoices')
    .insert(invoiceRow)
    .select('id')
    .single();

  if (invoiceError) {
    console.error(`Invoice insert failed: ${invoiceError.message}`);
    process.exit(1);
  }

  const { error: itemError } = await client.from('invoice_items').insert(itemRow);
  if (itemError) {
    console.error(`Invoice item insert failed: ${itemError.message}`);
    await client.from('invoices').delete().eq('id', invoice.id);
    process.exit(1);
  }

  console.log('✓ Seeded ' + OVERDUE_SEED_INVOICE_NUMBER);
  console.log('  Client : Test Client (Overdue)   +9779812345678');
  console.log('  Product: 12 mm PVC Carpet  x1');
  console.log('  Due    : NPR 4500  (dated 8 days ago -> meets the >= 7-day rule)');
  console.log('');
  console.log('To test the login reminder popup:');
  console.log('  1. Log out and log back in — the reminder gate evaluates on login, or');
  console.log('  2. While logged in, open Settings -> Database & Infrastructure (dev');
  console.log('     mode) and click "Seed Dummy Overdue Credit" / "Remove Seeded Credit".');
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});