import { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Banknote, Building, CreditCard, Package, Receipt, TrendingUp, Users, CalendarDays, AlertCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Invoice, Product } from '@/types';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/reports/format';
import {
  buildDailyPeriod,
  buildDailyRecordSummary,
  buildSalesProfitTrend,
  buildWeeklyPeriod,
  dayKeyToDate,
  type CategorySummary,
  type DailyRecordSummary,
  type PaymentModeBreakdown,
  type ReportPeriodType,
  type SalesProfitTrendPoint,
  type SoldProductSummary,
} from '@/lib/reports/dailyRecords';

interface DailyRecordsTabProps {
  invoices: Invoice[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Small presentational cards (kept in this file — page-agnostic, data-driven)
// ============================================================================

function PaymentBreakdownCard({
  breakdown,
  totalSales,
}: {
  breakdown: PaymentModeBreakdown;
  totalSales: number;
}) {
  const rows = [
    { key: 'cash', label: 'Cash', icon: Banknote, color: 'hsl(38, 92%, 50%)', amount: breakdown.cash },
    { key: 'online', label: 'Card', icon: CreditCard, color: 'hsl(226, 71%, 40%)', amount: breakdown.online },
    { key: 'bank', label: 'Bank Transfer', icon: Building, color: 'hsl(173, 58%, 39%)', amount: breakdown.bank },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales by Payment Method</CardTitle>
        <CardDescription>Share of paid sales in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map(row => {
          const percent = totalSales > 0 ? (row.amount / totalSales) * 100 : 0;
          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <row.icon className="h-4 w-4 text-muted-foreground" />
                  {row.label}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(row.amount)} · {formatPercent(percent / 100, 0)}
                </span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          “Card” is the app’s online payment mode.
        </p>
      </CardContent>
    </Card>
  );
}

function OutstandingCreditsCard({ summary }: { summary: DailyRecordSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Credits</CardTitle>
        <CardDescription>Pending / unpaid invoice amounts in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
          <span className="text-sm text-muted-foreground">Pending invoices</span>
          <span className="text-lg font-semibold">{formatNumber(summary.pendingInvoiceCount)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
          <span className="text-sm text-muted-foreground">Outstanding total</span>
          <span className="text-lg font-semibold">{formatCurrency(summary.outstandingCredits)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on invoices with status “pending”. No separate credit ledger exists in the schema.
        </p>
      </CardContent>
    </Card>
  );
}

function SalesProfitChart({
  trend,
  trendDays,
  onTrendDaysChange,
}: {
  trend: SalesProfitTrendPoint[];
  trendDays: 7 | 30;
  onTrendDaysChange: (days: 7 | 30) => void;
}) {
  const hasSales = trend.some(point => point.totalSales > 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Sales vs Profit</CardTitle>
          <CardDescription>Daily comparison across the last {trendDays} days</CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={String(trendDays)}
          onValueChange={(value) => {
            if (value === '30' || value === '7') onTrendDaysChange(value === '30' ? 30 : 7);
          }}
        >
          <ToggleGroupItem value="7" className="px-3">7 days</ToggleGroupItem>
          <ToggleGroupItem value="30" className="px-3">30 days</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {hasSales ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => format(dayKeyToDate(value), 'MMM d')}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => format(dayKeyToDate(value), 'MMMM d, yyyy')}
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                />
                <Legend />
                <Bar dataKey="totalSales" fill="hsl(226, 71%, 40%)" radius={[4, 4, 0, 0]} name="Sales" />
                <Bar dataKey="profit" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="text-lg font-semibold">No sales recorded for this period</p>
            <p className="mt-1 text-sm text-muted-foreground">No paid invoices in the last {trendDays} days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function TopProductsCard({ products }: { products: SoldProductSummary[] }) {
  const columns = [
    {
      key: 'productName',
      header: 'Product',
      cell: (row: SoldProductSummary) => <span className="font-medium">{row.productName}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (row: SoldProductSummary) => <span className="text-sm text-muted-foreground">{row.category}</span>,
    },
    {
      key: 'quantitySold',
      header: 'Units',
      cell: (row: SoldProductSummary) => <span>{formatNumber(row.quantitySold)}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      cell: (row: SoldProductSummary) => <span>{formatCurrency(row.revenue)}</span>,
    },
    {
      key: 'profit',
      header: 'Profit',
      cell: (row: SoldProductSummary) => (
        <span className="font-medium text-success">{formatCurrency(row.profit)}</span>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Sold Items</CardTitle>
        <CardDescription>Ranked by units sold in the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={products}
          columns={columns}
          searchable
          searchPlaceholder="Search products..."
          searchKeys={['productName', 'productCode', 'category']}
          pageSize={5}
          emptyMessage="No items sold in this period"
        />
      </CardContent>
    </Card>
  );
}

function TopCategoriesCard({ categories }: { categories: CategorySummary[] }) {
  const maxRevenue = categories.reduce((max, category) => Math.max(max, category.revenue), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>By revenue in the selected period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No items sold in this period.</p>
        )}
        {categories.map(category => (
          <div key={category.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{category.category}</span>
              <span className="text-muted-foreground">
                {formatNumber(category.quantitySold)} units · {formatCurrency(category.revenue)}
              </span>
            </div>
            <Progress
              value={maxRevenue > 0 ? (category.revenue / maxRevenue) * 100 : 0}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main tab
// ============================================================================

export const DailyRecordsTab = ({ invoices, products, isLoading, error }: DailyRecordsTabProps) => {
  const [view, setView] = useState<ReportPeriodType>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  // Period is derived from the view + selected date. Because it is itself
  // memoized, the ReportPeriod object identity only changes when the view or
  // date actually change, so the aggregation below is not recomputed on every
  // render (e.g. toggling the chart's 7/30-day window).
  const period = useMemo(
    () => (view === 'daily' ? buildDailyPeriod(selectedDate) : buildWeeklyPeriod(selectedDate)),
    [view, selectedDate],
  );

  // Aggregation results keyed on the underlying data + the resolved period.
  const summary = useMemo(
    () => buildDailyRecordSummary(invoices, products, period),
    [invoices, products, period],
  );

  const trend = useMemo(() => buildSalesProfitTrend(invoices, trendDays), [invoices, trendDays]);

  const periodLabel = useMemo(
    () =>
      view === 'daily'
        ? format(selectedDate, 'EEEE, MMMM d, yyyy')
        : `${format(period.start, 'MMM d')} – ${format(addDays(period.end, -1), 'MMM d, yyyy')}`,
    [view, selectedDate, period],
  );

  const handleViewChange = (value: string) => {
    if (value === 'daily' || value === 'weekly') setView(value);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) setSelectedDate(date);
  };

  const resetToCurrentPeriod = () => setSelectedDate(new Date());

  // ------------------------------------------------------------------ states

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to load report data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
// ------------------------------------------------------------------ content

  return (
    <div className="space-y-6">
      {/* Period controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <ToggleGroup type="single" value={view} onValueChange={handleViewChange}>
            <ToggleGroupItem value="daily" className="px-4">Daily</ToggleGroupItem>
            <ToggleGroupItem value="weekly" className="px-4">Weekly</ToggleGroupItem>
          </ToggleGroup>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToCurrentPeriod}
            className="text-muted-foreground"
          >
            {view === 'daily' ? 'Today' : 'This week'}
          </Button>

          <p className="ml-auto text-xs text-muted-foreground">
            {view === 'weekly'
              ? 'Picking any day selects that Monday–Sunday week'
              : 'Sales & profit from paid invoices; credits from pending invoices'}
          </p>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(summary.totalSales)}
          subtitle={`${formatNumber(summary.invoiceCount)} paid invoice${summary.invoiceCount === 1 ? '' : 's'}`}
          icon={Banknote}
          variant="primary"
        />
        <StatCard
          title="Profit"
          value={formatCurrency(summary.profit)}
          subtitle={
            summary.profitMargin !== null
              ? `${formatPercent(summary.profitMargin, 1)} margin`
              : 'No sales to measure margin'
          }
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Items Sold"
          value={formatNumber(summary.itemsSold)}
          subtitle="Units across paid invoices"
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Customers"
          value={formatNumber(summary.distinctCustomers)}
          subtitle="Distinct by phone / email / name"
          icon={Users}
          variant="default"
        />
      </div>
      {/* Empty state — no paid invoices in the selected period */}
      {summary.invoiceCount === 0 ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Package className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <p className="text-lg font-semibold">No sales recorded for this period</p>
              <p className="mt-1 text-sm text-muted-foreground">{periodLabel}</p>
            </CardContent>
          </Card>
          {summary.pendingInvoiceCount > 0 && <OutstandingCreditsCard summary={summary} />}
        </div>
      ) : (
        <>
          {/* Sales vs Profit trend (comparison chart) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SalesProfitChart trend={trend} trendDays={trendDays} onTrendDaysChange={setTrendDays} />
          </div>

          {/* Payment breakdown + outstanding credits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PaymentBreakdownCard breakdown={summary.paymentBreakdown} totalSales={summary.totalSales} />
            <OutstandingCreditsCard summary={summary} />
          </div>

          {/* Top products + categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsCard products={summary.topProducts} />
            <TopCategoriesCard categories={summary.topCategories} />
          </div>

          {/* Period summary at a glance */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-slate-50 p-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              {summary.invoiceCount} paid · {summary.pendingInvoiceCount} pending ·{' '}
              {formatNumber(summary.itemsSold)} items sold
            </span>
            <span>Period: {periodLabel}</span>
          </div>
        </>
      )}
    </div>
  );
};