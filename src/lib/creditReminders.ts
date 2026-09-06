import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

/**
 * Credit payment reminder helpers.
 *
 * The overdue-credit payload is served by the `get_overdue_credits` Postgres
 * RPC (see supabase/migrations/20260906010000_credit_payment_status.sql):
 *   - payment_status = 'pending'
 *   - created_at >= 7 days old
 *   - amount_due > 0 and payment_mode = 'credit'
 */

export interface OverdueCreditItem {
  productName: string;
  quantity: number;
  lineTotal: number;
}

export interface OverdueCredit {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientPhone: string;
  createdAt: string;
  amountDue: number;
  grandTotal: number;
  items: OverdueCreditItem[];
}

const CREDIT_REMINDER_STORAGE_KEY = 'itShopPro.creditReminderShown';

// ---------------------------------------------------------------------------
// Formatting & device detection
// ---------------------------------------------------------------------------

export const formatNpr = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 });

/**
 * Mobile detection used to decide between a native SMS redirect and the
 * desktop fallback notice. A tablet-sized viewport counts as mobile too.
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgentMatch = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const narrowViewport =
    typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches;
  return userAgentMatch || narrowViewport;
};

/**
 * Loose validation for international phone numbers (digits, leading +,
 * spaces, dashes and parentheses). Example: +977 9801234567.
 */
export const isValidPhoneNumber = (phone: string): boolean =>
  /^\+?[0-9\s()-]{7,16}$/.test(phone.trim());

/** Reduce a phone number to the digits/non-sign used by the sms: URI scheme. */
export const normalizePhoneNumber = (phone: string): string =>
  phone.trim().replace(/[\s()-]/g, '');

export const buildCreditReminderMessage = (credit: OverdueCredit): string => {
  const purchaseDate = format(new Date(credit.createdAt), 'MMM dd, yyyy');
  return [
    `Hello ${credit.clientName},`,
    `this is a reminder that your credit payment of NPR ${formatNpr(credit.amountDue)}`,
    `for purchase on ${purchaseDate} is overdue.`,
    'Please settle the payment at your earliest convenience.',
  ].join(' ');
};

/**
 * Native SMS deep link. Format: sms:<phone>?body=<encoded_message>
 * Setting window.location.href hands off to the device's SMS app with the
 * recipient and message pre-filled.
 */
export const buildSmsUri = (phone: string, message: string): string =>
  `sms:${normalizePhoneNumber(phone)}?body=${encodeURIComponent(message)}`;

// ---------------------------------------------------------------------------
// Session flag — show the reminder at most once per login session.
// ---------------------------------------------------------------------------

export const hasCreditReminderBeenShown = (): boolean =>
  typeof window !== 'undefined' && window.sessionStorage.getItem(CREDIT_REMINDER_STORAGE_KEY) === '1';

export const markCreditReminderShown = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CREDIT_REMINDER_STORAGE_KEY, '1');
};

export const clearCreditReminderShown = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CREDIT_REMINDER_STORAGE_KEY);
};

// ---------------------------------------------------------------------------
// Supabase queries
// ---------------------------------------------------------------------------

interface OverdueCreditRow {
  id: string;
  invoice_number: string;
  client_name: string;
  client_phone: string;
  created_at: string;
  amount_due: number;
  grand_total: number;
  items: OverdueCreditItem[] | null;
}

/** GET /alerts/overdue-credits — fetch pending credit invoices >= 7 days old. */
export const fetchOverdueCredits = async (): Promise<OverdueCredit[]> => {
  const { data, error } = await supabase.rpc('get_overdue_credits');
  if (error) throw new Error(error.message);

  return ((data ?? []) as OverdueCreditRow[]).map(row => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    createdAt: row.created_at,
    amountDue: Number(row.amount_due ?? 0),
    grandTotal: Number(row.grand_total ?? 0),
    items: Array.isArray(row.items) ? row.items : [],
  }));
};

/** Mark an overdue credit invoice as paid so it leaves the reminder queue. */
export const markOverdueCreditPaid = async (invoiceId: string): Promise<void> => {
  const { error } = await supabase.rpc('mark_overdue_credit_paid', { p_invoice_id: invoiceId });
  if (error) throw new Error(error.message);
};

// ---------------------------------------------------------------------------
// Temporary developer seed helpers
//
// Inject a dummy overdue credit (dated 8 days ago) so the login-time reminder
// popup can be tested without waiting for real 7-day-old credit sales.
// The script lives at scripts/seed-overdue-credit.mjs; the in-app button
// (Settings -> Database & Infrastructure, dev builds only) uses the helpers
// below and immediately re-opens the popup through the dev trigger events.
// ---------------------------------------------------------------------------

/** Deterministic invoice id/number used by the seed so it stays idempotent. */
export const OVERDUE_SEED_INVOICE_ID = '10000000-0000-4000-8000-000000000001';
export const OVERDUE_SEED_INVOICE_NUMBER = 'INV-DEV-OVD-001';

/** Dummy overdue credit — the exact working data used by seed + popup testing. */
export const DUMMY_OVERDUE_CREDIT: OverdueCredit = {
  id: 'credit-test-001',
  invoiceNumber: OVERDUE_SEED_INVOICE_NUMBER,
  clientName: 'Test Client (Overdue)',
  clientPhone: '+9779812345678',
  // Set date to 8 days ago to trigger the >= 7-day rule.
  createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  amountDue: 4500,
  grandTotal: 4500,
  items: [{ productName: '12 mm PVC Carpet', quantity: 1, lineTotal: 4500 }],
};

/** @returns an ISO timestamp 8 days before now (same used by the seed + fallback). */
const overdueSeedCreatedAt = (): string =>
  new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

/**
 * Insert the dummy overdue credit into the database (idempotent — previous
 * seed rows are removed first). Runs through the signed-in session: the
 * invoices / invoice_items RLS policies allow authenticated writes.
 *
 * Returns whether the database insert succeeded. When it fails (e.g. missing
 * profile, RLS, or the payment_status migration not applied), callers can fall
 * back to local state using the returned credit.
 */
export const seedDummyOverdueCredit = async (): Promise<{ dbInserted: boolean; credit: OverdueCredit }> => {
  const createdAt = overdueSeedCreatedAt();
  let dbInserted = false;

  try {
    // Reset the previous seed row (invoice delete cascades to invoice_items).
    await supabase.from('invoices').delete().eq('invoice_number', OVERDUE_SEED_INVOICE_NUMBER);

    const { error: invoiceError } = await supabase.from('invoices').insert({
      id: OVERDUE_SEED_INVOICE_ID,
      invoice_number: OVERDUE_SEED_INVOICE_NUMBER,
      quotation_id: null,
      customer_id: null,
      client_name: DUMMY_OVERDUE_CREDIT.clientName,
      client_email: 'overdue-test@example.com',
      client_phone: DUMMY_OVERDUE_CREDIT.clientPhone,
      client_address: 'Dev seed address, Kathmandu',
      subtotal: DUMMY_OVERDUE_CREDIT.amountDue,
      total_discount: 0,
      total_tax: 0,
      grand_total: DUMMY_OVERDUE_CREDIT.amountDue,
      amount_paid: 0,
      amount_due: DUMMY_OVERDUE_CREDIT.amountDue,
      payment_mode: 'credit',
      status: 'pending',
      created_by: null,
      created_at: createdAt,
      paid_at: null,
      updated_at: createdAt,
      payment_status: 'pending',
    });

    if (invoiceError) throw invoiceError;

    const { error: itemError } = await supabase.from('invoice_items').insert({
      invoice_id: OVERDUE_SEED_INVOICE_ID,
      product_id: null,
      product_code: 'DEV-OVD-001',
      product_name: DUMMY_OVERDUE_CREDIT.items[0].productName,
      quantity: DUMMY_OVERDUE_CREDIT.items[0].quantity,
      unit_price: DUMMY_OVERDUE_CREDIT.amountDue,
      cost_price: 3000,
      tax_percent: 0,
      discount: 0,
      line_total: DUMMY_OVERDUE_CREDIT.items[0].lineTotal,
      created_at: createdAt,
    });

    if (itemError) throw itemError;
    dbInserted = true;
  } catch (error) {
    console.warn('[creditReminders] DB seed failed; falling back to local state:', error);
  }

  return { dbInserted, credit: { ...DUMMY_OVERDUE_CREDIT, createdAt } };
};

/** Remove the seeded overdue credit invoice again (dev cleanup). */
export const removeSeededOverdueCredit = async (): Promise<boolean> => {
  const { error } = await supabase.from('invoices').delete().eq('invoice_number', OVERDUE_SEED_INVOICE_NUMBER);
  if (error) {
    console.warn('[creditReminders] Unable to remove seeded credit:', error);
    return false;
  }
  return true;
};

/**
 * Dev-only trigger events: let the already-logged-in developer immediately
 * re-open the reminder popup without logging out/in again.
 *  - dev-check => re-run the database query (bypassing the session flag)
 *  - dev-local => inject in-memory credits for pure UI testing
 */
export const CREDIT_REMINDER_DEV_CHECK_EVENT = 'it-shop-pro:credit-reminder:dev-check';
export const CREDIT_REMINDER_DEV_LOCAL_EVENT = 'it-shop-pro:credit-reminder:dev-local';

export const triggerCreditReminderDevCheck = (): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CREDIT_REMINDER_DEV_CHECK_EVENT));
};

export const triggerCreditReminderDevLocal = (credits: OverdueCredit[]): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<OverdueCredit[]>(CREDIT_REMINDER_DEV_LOCAL_EVENT, { detail: credits }));
};