/**
 * Shared profit-calculation helpers — the single source of truth for the
 * profit formula used across the app's reports.
 *
 * The formula `(unitPrice - costPrice) * quantity` is extracted VERBATIM from
 * ReportsPage.tsx, where it was previously inlined in four places (daily sales
 * trend grouping, product performance, the Total Profit stat, and the
 * Invoice-wise Profit table). Keep it in this file and call these helpers from
 * anywhere else that needs profit — do NOT write a second, slightly-different
 * formula.
 *
 * NOTE: This intentionally does NOT subtract per-item discounts or tax — it
 * mirrors the existing app-wide convention (gross margin on unit-price-vs-cost
 * per unit). If that convention ever changes, change it here once.
 */

/** Minimal structural shape of an invoice line item — enough to compute profit. */
export interface ItemProfitInput {
  unitPrice: number;
  costPrice: number;
  quantity: number;
}

/** Profit for a single invoice line item: (unitPrice - costPrice) * quantity. */
export const calculateItemProfit = (item: ItemProfitInput): number =>
  (item.unitPrice - item.costPrice) * item.quantity;

/** Profit for a whole invoice = sum of its line-item profits. */
export const calculateInvoiceProfit = (items: readonly ItemProfitInput[]): number =>
  items.reduce((sum, item) => sum + calculateItemProfit(item), 0);