/**
 * Pure aggregation layer for the Daily Records report.
 *
 * These functions are side-effect free and React-free so they can be unit
 * tested in isolation. The UI component (DailyRecordsTab) only calls them and
 * memoizes the results — it never re-implements the aggregation inline.
 *
 * CONFIRMED DEFINITIONS (agreed with product owner before building):
 *
 * - "Sales"        = Σ grandTotal of invoices with status `'paid'` in the
 *                    selected period. Matches every existing report
 *                    ("From paid invoices"). Cancelled invoices are excluded
 *                    from everything.
 * - "Credits"      = Σ grandTotal of invoices with status `'pending'` in the
 *                    selected period (i.e. outstanding/unpaid invoice amounts).
 *                    The app has no separate credit ledger / store-credit
 *                    table — `pending` invoice status IS the only "money owed"
 *                    concept in this schema. See src/types InvoiceStatus.
 * - "Customers"    = count of DISTINCT invoices by a stable per-invoice
 *                    "customer key": normalized phone → else normalized email →
 *                    else trimmed case-insensitive clientName. This is because
 *                    the frontend Invoice type carries no `customer_id`
 *                    (DataContext's row mapping drops it), so a walk-in can
 *                    only be keyed by the denormalized strings at checkout.
 *
 * TIMEZONE / DATE-BOUNDARY HANDLING (explicit, because this is a classic bug):
 *
 * - DB timestamps are `timestamptz` (UTC, Postgres `default now()`), surfaced
 *   as JS Date instances by DataContext.
 * - Day keys (`getLocalDayKey`) and period boundaries are computed in the
 *   BROWSER'S LOCAL timezone, exactly like the existing reports
 *   (ReportsPage buckets via `format(new Date(invoice.createdAt), 'yyyy-MM-dd')`).
 *   "Today" therefore behaves identically to every other report — we do NOT
 *   silently shift records across midnight due to a UTC/local mismatch.
 * - Periods use an inclusive start / exclusive end (`[start, end)`), so
 *   `createdAt >= start && createdAt < end` is unambiguous.
 * - The weekly view is a calendar week, Monday–Sunday (ISO) — controlled by
 *   the single `WEEK_STARTS_ON` constant below.
 *
 * SCALING NOTE FOR THE FUTURE: aggregation is O(invoices × items) and fully
 * client-side. If the dataset grows to tens of thousands of invoices and this
 * starts to strain, the authoritative fix is a Supabase-side daily-sales view
 * or RPC (`group by date_trunc('day', created_at at time zone 'Asia/Kathmandu')`)
 * rather than shipping more JavaScript — the current memoized client-side
 * approach is correct but won't scale forever.
 */

import type { Invoice, Product } from '../../types/index.ts';
import { addDays, format, startOfDay, startOfWeek } from 'date-fns';
import { calculateInvoiceProfit, calculateItemProfit } from './profit.ts';

// ============================================================================
// Types
// ============================================================================

export type ReportPeriodType = 'daily' | 'weekly';

/** Calendar weeks start on Monday (ISO). Change here if Sunday-start is wanted. */
export const WEEK_STARTS_ON = 1;

export interface ReportPeriod {
  type: ReportPeriodType;
  /** Inclusive start of the period, at local midnight. */
  start: Date;
  /** Exclusive end of the period (start + 1 day for daily, + 7 days for weekly). */
  end: Date;
}

export interface PaymentModeBreakdown {
  /** The app's payment-mode enum is `cash | online | bank`; "card" in the UI = `online`. */
  cash: number;
  online: number;
  bank: number;
}

export interface SoldProductSummary {
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  profit: number;
}

export interface CategorySummary {
  category: string;
  quantitySold: number;
  revenue: number;
}

export interface DailyRecordSummary {
  period: ReportPeriod;
  /** Σ grandTotal of paid invoices in the period. */
  totalSales: number;
  /** Number of paid invoices in the period. */
  invoiceCount: number;
  /** Σ item.quantity across paid invoices in the period. */
  itemsSold: number;
  /** Σ item profit (shared formula) across paid invoices in the period. */
  profit: number;
  /** profit / totalSales, or null when there were no sales (avoids NaN). */
  profitMargin: number | null;
  paymentBreakdown: PaymentModeBreakdown;
  /** Distinct "customers" — see customer-key definition at the top of this file. */
  distinctCustomers: number;
  /** Σ grandTotal of pending invoices in the period (outstanding credits). */
  outstandingCredits: number;
  pendingInvoiceCount: number;
  /** Top N products by units sold within the period. */
  topProducts: SoldProductSummary[];
  /** Top N categories by revenue within the period. */
  topCategories: CategorySummary[];
}

export interface SalesProfitTrendPoint {
  /** Local calendar-day key, `yyyy-MM-dd`. */
  date: string;
  totalSales: number;
  profit: number;
  invoiceCount: number;
}
// ============================================================================
// Date / period helpers
// ============================================================================

/** Local calendar-day key for a given date (`yyyy-MM-dd`, browser timezone). */
export const getLocalDayKey = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Reconstructs a Date from a `yyyy-MM-dd` day key anchored at LOCAL NOON.
 * Parsing the bare key with `new Date(key)` would resolve to UTC midnight,
 * which is the previous calendar day in negative-offset timezones — anchoring
 * at noon keeps charts, tooltips and labels consistent in every timezone.
 */
export const dayKeyToDate = (key: string): Date => new Date(`${key}T12:00:00`);

/** Single calendar day: local midnight → next local midnight (exclusive end). */
export const buildDailyPeriod = (date: Date): ReportPeriod => {
  const start = startOfDay(date);
  return { type: 'daily', start, end: addDays(start, 1) };
};

/** Calendar week (Mon–Sun) containing `date`: week-start midnight → +7 days (exclusive end). */
export const buildWeeklyPeriod = (date: Date): ReportPeriod => {
  const start = startOfDay(startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }));
  return { type: 'weekly', start, end: addDays(start, 7) };
};

/**
 * True when `createdAt` falls inside a period. Uses inclusive-start /
 * exclusive-end semantics so a timestamp exactly at the boundary only ever
 * belongs to one period. Accepts Date | string defensively (Supabase rows are
 * parsed to Date upstream, but this keeps the data layer robust to raw rows).
 */
export const isInPeriod = (createdAt: Date | string, period: ReportPeriod): boolean => {
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  return date >= period.start && date < period.end;
};

// ============================================================================
// Customer identity helpers
// ============================================================================

/**
 * Normalizes a phone number to a stable comparison key:
 * strips all non-digit characters and drops a leading `977` country-code
 * prefix when followed by a 10-digit local number (the standard Nepali
 * mobile format). Produces a plain digit string key.
 */
export const normalizePhone = (phone: string): string => {
  const digits = (phone || '').replace(/\D+/g, '');
  // 977 (3-digit country code) + 10-digit local number = 13 digits total.
  if (digits.length === 13 && digits.startsWith('977')) return digits.slice(3);
  return digits;
};

/**
 * Stable per-invoice "customer key": normalized phone → else normalized email →
 * else trimmed case-insensitive clientName. See the definition at the top.
 * Every invoice has a clientName (checkout requires it), so the name fallback
 * always yields *some* key — an anonymous walk-in still counts as one customer.
 */
export const getCustomerKey = (
  invoice: Pick<Invoice, 'clientPhone' | 'clientEmail' | 'clientName'>,
): string => {
  const phone = normalizePhone(invoice.clientPhone);
  if (phone) return `phone:${phone}`;

  const email = (invoice.clientEmail || '').trim().toLowerCase();
  if (email) return `email:${email}`;

  return `name:${(invoice.clientName || '').trim().toLowerCase()}`;
};

// ============================================================================
// Aggregation
// ============================================================================

/**
 * Builds the full summary for one day or one calendar week.
 * Single pass over invoices; O(invoices × items). Products are looked up via
 * a Map built once per call. Items without a matching product fall back to
 * their denormalized `productName`/`productCode` and the "Other" category
 * (e.g. synthetic repair-service line items).
 */
export const buildDailyRecordSummary = (
  invoices: readonly Invoice[],
  products: readonly Product[],
  period: ReportPeriod,
  topN = 5,
): DailyRecordSummary => {
  const productsById = new Map(products.map(product => [product.id, product]));

  const customerKeys = new Set<string>();
  const productAcc = new Map<
    string,
    SoldProductSummary
  >();
  const categoryAcc = new Map<string, CategorySummary>();

  let paidInvoiceCount = 0;
  let totalSales = 0;
  let itemsSold = 0;
  let profit = 0;
  let cash = 0;
  let online = 0;
  let bank = 0;
  let outstandingCredits = 0;
  let pendingInvoiceCount = 0;

  for (const invoice of invoices) {
    if (!isInPeriod(invoice.createdAt, period)) continue;

    if (invoice.status === 'paid') {
      paidInvoiceCount += 1;
      totalSales += invoice.grandTotal;
      profit += calculateInvoiceProfit(invoice.items);
      customerKeys.add(getCustomerKey(invoice));

      if (invoice.paymentMode === 'cash') cash += invoice.grandTotal;
      else if (invoice.paymentMode === 'online') online += invoice.grandTotal;
      else if (invoice.paymentMode === 'bank') bank += invoice.grandTotal;

      for (const item of invoice.items) {
        itemsSold += item.quantity;

        const product = productsById.get(item.productId);
        const category = product?.category || 'Other';
        const itemProfit = calculateItemProfit(item);

        let productSummary = productAcc.get(item.productId);
        if (!productSummary) {
          productSummary = {
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            category,
            quantitySold: 0,
            revenue: 0,
            profit: 0,
          };
          productAcc.set(item.productId, productSummary);
        }
        productSummary.quantitySold += item.quantity;
        productSummary.revenue += item.lineTotal;
        productSummary.profit += itemProfit;

        let categorySummary = categoryAcc.get(category);
        if (!categorySummary) {
          categorySummary = { category, quantitySold: 0, revenue: 0 };
          categoryAcc.set(category, categorySummary);
        }
        categorySummary.quantitySold += item.quantity;
        categorySummary.revenue += item.lineTotal;
      }
    } else if (invoice.status === 'pending') {
      pendingInvoiceCount += 1;
      outstandingCredits += invoice.grandTotal;
    }
    // 'cancelled' invoices contribute nothing anywhere.
  }

  const topProducts = [...productAcc.values()]
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
    .slice(0, topN);

  const topCategories = [...categoryAcc.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, topN);

  return {
    period,
    totalSales,
    invoiceCount: paidInvoiceCount,
    itemsSold,
    profit,
    profitMargin: totalSales > 0 ? profit / totalSales : null,
    paymentBreakdown: { cash, online, bank },
    distinctCustomers: customerKeys.size,
    outstandingCredits,
    pendingInvoiceCount,
    topProducts,
    topCategories,
  };
};

/**
 * Builds the last `days` calendar days (ending today, local timezone) of
 * Sales vs Profit for the comparison chart. Every day in the window gets a
 * data point (zero-filled), so the chart renders a continuous axis and a day
 * with no sales shows 0 rather than a missing bar — the caller owns the
 * "no sales in this span" empty state when every point is zero.
 */
export const buildSalesProfitTrend = (
  invoices: readonly Invoice[],
  days: number,
  endDate: Date = new Date(),
): SalesProfitTrendPoint[] => {
  const pointByDay = new Map<string, SalesProfitTrendPoint>();
  const orderedDays: SalesProfitTrendPoint[] = [];

  const today = startOfDay(endDate);
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = addDays(today, -offset);
    const point: SalesProfitTrendPoint = {
      date: getLocalDayKey(day),
      totalSales: 0,
      profit: 0,
      invoiceCount: 0,
    };
    orderedDays.push(point);
    pointByDay.set(point.date, point);
  }

  for (const invoice of invoices) {
    if (invoice.status !== 'paid') continue;
    const createdAt = invoice.createdAt instanceof Date ? invoice.createdAt : new Date(invoice.createdAt);
    const point = pointByDay.get(getLocalDayKey(createdAt));
    if (!point) continue;
    point.totalSales += invoice.grandTotal;
    point.profit += calculateInvoiceProfit(invoice.items);
    point.invoiceCount += 1;
  }

  return orderedDays;
};