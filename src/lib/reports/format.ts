/**
 * Shared number/currency formatting for reports.
 *
 * Mirrors the `formatCurrency` Intl configuration that previously lived
 * inline in ReportsPage.tsx (en-NP locale, NPR currency, no decimals) so every
 * report renders amounts identically.
 */

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(value);

/**
 * Renders a fraction (0–1) as a percentage string, e.g. `0.125` → `"12.5%"`.
 * Pass a value already scaled to 0–100 to get whole-percent output.
 */
export const formatPercent = (fraction: number, digits = 1) =>
  `${(fraction * 100).toFixed(digits)}%`;