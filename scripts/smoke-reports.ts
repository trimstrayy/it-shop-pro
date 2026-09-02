/**
 * Smoke test for the Daily Records aggregation layer (src/lib/reports).
 * Pure-function, no React needed.
 *
 * Run with:  npm run test:reports
 * (requires Node >= 22.6 for --experimental-strip-types)
 */
import assert from 'node:assert/strict';
import { addDays } from 'date-fns';
import {
  buildDailyPeriod,
  buildWeeklyPeriod,
  buildDailyRecordSummary,
  buildSalesProfitTrend,
  getLocalDayKey,
  isInPeriod,
  normalizePhone,
  getCustomerKey,
} from '../src/lib/reports/dailyRecords.ts';

interface TestInvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  taxPercent: number;
  discount: number;
  lineTotal: number;
}

interface TestInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMode: 'cash' | 'online' | 'bank';
  grandTotal: number;
  createdAt: Date;
  items: TestInvoiceItem[];
}

interface TestProduct {
  id: string;
  productCode: string;
  name: string;
  category: string;
}

const DEFAULT_INVOICE: TestInvoice = {
  id: 'i-1',
  invoiceNumber: 'INV-1',
  clientName: 'Test Client',
  clientEmail: '',
  clientPhone: '',
  items: [],
  grandTotal: 0,
  paymentMode: 'cash',
  status: 'paid',
  createdAt: new Date(),
};

const makeInvoice = (overrides: Partial<TestInvoice>): TestInvoice => ({
  ...DEFAULT_INVOICE,
  ...overrides,
});

// --- normalizePhone
assert.equal(normalizePhone('+977 9812 3456 78'), '9812345678');
assert.equal(normalizePhone('98-1234-5678'), '9812345678');
assert.equal(normalizePhone('+1 (555) 123-4567'), '15551234567');
assert.equal(normalizePhone(''), '');

// --- getCustomerKey: phone formatting / email case / name case
assert.equal(
  getCustomerKey({ clientName: 'Walk-in', clientEmail: '', clientPhone: '+977 9812345678' }),
  getCustomerKey({ clientName: 'Someone Else', clientEmail: '', clientPhone: '98-1234-5678' }),
);
assert.equal(
  getCustomerKey({ clientName: 'A', clientEmail: 'A@B.COM', clientPhone: '' }),
  getCustomerKey({ clientName: 'B', clientEmail: 'a@b.com', clientPhone: '' }),
);
assert.equal(
  getCustomerKey({ clientName: '  Walk In  ', clientEmail: '', clientPhone: '' }),
  getCustomerKey({ clientName: 'walk in', clientEmail: '', clientPhone: '' }),
);
assert.equal(getCustomerKey({ clientName: 'X', clientEmail: 'e@e.com', clientPhone: '123' }), 'phone:123');

// --- period boundaries (local timezone)
const day = new Date(2026, 0, 15, 0, 0, 0);
const daily = buildDailyPeriod(day);
assert.equal(getLocalDayKey(daily.start), '2026-01-15');
assert.equal(getLocalDayKey(daily.end), '2026-01-16');
assert.equal(isInPeriod(new Date(2026, 0, 15, 23, 59, 59), daily), true);
assert.equal(isInPeriod(new Date(2026, 0, 16, 0, 0, 0), daily), false);

// calendar week: Thu Jan 15 2026 -> Mon Jan 12 - Sun Jan 18
const weekly = buildWeeklyPeriod(new Date(2026, 0, 15, 12, 0));
assert.equal(getLocalDayKey(weekly.start), '2026-01-12');
assert.equal(getLocalDayKey(addDays(weekly.end, -1)), '2026-01-18');
assert.equal(isInPeriod(new Date(2026, 0, 18, 23, 59, 59), weekly), true);
assert.equal(isInPeriod(new Date(2026, 0, 19, 0, 0, 0), weekly), false);
assert.equal(
  buildWeeklyPeriod(new Date(2026, 0, 18, 9, 0)).start.getTime(),
  buildWeeklyPeriod(new Date(2026, 0, 12, 23, 0)).start.getTime(),
);

// --- buildDailyRecordSummary
const products: TestProduct[] = [{ id: 'p1', productCode: 'HW-1', name: 'Laptop', category: 'Laptops' }];

const paidAlice = makeInvoice({
  id: 'paid-1', clientName: 'Alice', clientPhone: '9812345678', status: 'paid',
  paymentMode: 'cash', grandTotal: 200, createdAt: new Date(2026, 0, 15, 10, 0),
  items: [{ id: 'li1', productId: 'p1', productCode: 'HW-1', productName: 'Laptop', quantity: 2, unitPrice: 100, costPrice: 60, taxPercent: 0, discount: 0, lineTotal: 200 }],
});
const paidSameCustomer = makeInvoice({
  id: 'paid-2', clientName: 'Ali C.', clientPhone: '+977 98-1234-5678', status: 'paid',
  paymentMode: 'bank', grandTotal: 100, createdAt: new Date(2026, 0, 15, 12, 0),
  items: [{ id: 'li2', productId: 'p1', productCode: 'HW-1', productName: 'Laptop', quantity: 1, unitPrice: 100, costPrice: 60, taxPercent: 0, discount: 0, lineTotal: 100 }],
});
const pendingToday = makeInvoice({
  id: 'pend-1', clientName: 'Bob', clientEmail: 'bob@x.com', status: 'pending',
  paymentMode: 'online', grandTotal: 500, createdAt: new Date(2026, 0, 15, 15, 0), items: [],
});
const cancelledToday = makeInvoice({
  id: 'canc-1', clientName: 'Dan', status: 'cancelled', paymentMode: 'cash',
  grandTotal: 9999, createdAt: new Date(2026, 0, 15, 16, 0), items: [],
});
const yesterdayPaid = makeInvoice({
  id: 'paid-3', clientName: 'Carol', clientEmail: 'carol@x.com', status: 'paid',
  paymentMode: 'cash', grandTotal: 50, createdAt: new Date(2026, 0, 14, 23, 0),
  items: [{ id: 'li3', productId: 'p2', productCode: 'OTHER', productName: 'Unknown Widget', quantity: 1, unitPrice: 50, costPrice: 20, taxPercent: 0, discount: 0, lineTotal: 50 }],
});

const summary = buildDailyRecordSummary(
  [paidAlice, paidSameCustomer, pendingToday, cancelledToday, yesterdayPaid],
  products,
  daily,
);
assert.equal(summary.totalSales, 300);
assert.equal(summary.invoiceCount, 2);
assert.equal(summary.itemsSold, 3);
assert.equal(summary.paymentBreakdown.cash, 200);
assert.equal(summary.paymentBreakdown.bank, 100);
assert.equal(summary.paymentBreakdown.online, 0);
assert.equal(summary.profit, 120);
assert.equal(summary.profitMargin, 120 / 300);
assert.equal(summary.distinctCustomers, 1);
assert.equal(summary.pendingInvoiceCount, 1);
assert.equal(summary.outstandingCredits, 500);
assert.equal(summary.topProducts.length, 1);
assert.equal(summary.topProducts[0].quantitySold, 3);
assert.equal(summary.topProducts[0].category, 'Laptops');
assert.equal(summary.topCategories[0].revenue, 300);

// zero-sale period -> null margin, no NaN
const empty = buildDailyRecordSummary([], products, buildDailyPeriod(new Date(2026, 0, 20)));
assert.equal(empty.totalSales, 0);
assert.equal(empty.profitMargin, null);
assert.equal(empty.invoiceCount, 0);
assert.equal(Number.isNaN(empty.profit), false);

// weekly: Jan 14 is inside the week, Jan 15 invoices inside too
const weeklySummary = buildDailyRecordSummary(
  [paidAlice, yesterdayPaid],
  products,
  weekly,
);
assert.equal(weeklySummary.totalSales, 250);

console.log('\nAll Daily Records smoke-test assertions passed');
