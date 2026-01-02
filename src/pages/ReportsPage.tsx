import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { DollarSign, TrendingUp, Package, Monitor, Database } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { mockSalesReports, mockProductReports } from '@/data/mockData';
import { Invoice, HardwareProduct, SoftwareProduct } from '@/types';
import { format } from 'date-fns';

const COLORS = ['hsl(226, 71%, 40%)', 'hsl(173, 58%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const ReportsPage = () => {
  const { invoices, products } = useData();

  // Calculate overall stats
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalProfit = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => {
      const invoiceProfit = invoice.items.reduce((itemSum, item) => {
        const profit = (item.unitPrice - item.costPrice) * item.quantity;
        return itemSum + profit;
      }, 0);
      return sum + invoiceProfit;
    }, 0);

  const hardwareRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => {
      const hwItems = invoice.items.filter(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.type === 'hardware';
      });
      return sum + hwItems.reduce((s, i) => s + i.lineTotal, 0);
    }, 0);

  const softwareRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, invoice) => {
      const swItems = invoice.items.filter(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.type === 'software';
      });
      return sum + swItems.reduce((s, i) => s + i.lineTotal, 0);
    }, 0);

  // Pie chart data
  const typeDistribution = [
    { name: 'Hardware', value: hardwareRevenue },
    { name: 'Software', value: softwareRevenue },
  ];

  // Invoice profit calculations
  const invoiceProfitData = invoices
    .filter(i => i.status === 'paid')
    .map(invoice => {
      const profit = invoice.items.reduce((sum, item) => {
        return sum + (item.unitPrice - item.costPrice) * item.quantity;
      }, 0);
      return {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        revenue: invoice.grandTotal,
        profit,
        margin: ((profit / invoice.grandTotal) * 100).toFixed(1),
        date: format(new Date(invoice.createdAt), 'MMM dd, yyyy'),
      };
    });

  const invoiceProfitColumns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      cell: (row: typeof invoiceProfitData[0]) => (
        <span className="font-mono text-sm text-primary">{row.invoiceNumber}</span>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      cell: (row: typeof invoiceProfitData[0]) => (
        <span className="font-medium">{row.clientName}</span>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      cell: (row: typeof invoiceProfitData[0]) => (
        <span>${row.revenue.toLocaleString()}</span>
      ),
    },
    {
      key: 'profit',
      header: 'Profit',
      cell: (row: typeof invoiceProfitData[0]) => (
        <span className="font-medium text-success">${row.profit.toLocaleString()}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      cell: (row: typeof invoiceProfitData[0]) => (
        <StatusBadge 
          status={`${row.margin}%`} 
          variant={parseFloat(row.margin) > 20 ? 'success' : 'warning'} 
        />
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (row: typeof invoiceProfitData[0]) => (
        <span className="text-sm text-muted-foreground">{row.date}</span>
      ),
    },
  ];

  const productReportColumns = [
    {
      key: 'productCode',
      header: 'Code',
      cell: (row: typeof mockProductReports[0]) => (
        <span className="font-mono text-sm text-primary">{row.productCode}</span>
      ),
    },
    {
      key: 'productName',
      header: 'Product',
      cell: (row: typeof mockProductReports[0]) => (
        <span className="font-medium">{row.productName}</span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (row: typeof mockProductReports[0]) => (
        <StatusBadge 
          status={row.type} 
          variant={row.type === 'hardware' ? 'info' : 'success'} 
        />
      ),
    },
    {
      key: 'totalSold',
      header: 'Units Sold',
      cell: (row: typeof mockProductReports[0]) => <span>{row.totalSold}</span>,
    },
    {
      key: 'totalRevenue',
      header: 'Revenue',
      cell: (row: typeof mockProductReports[0]) => (
        <span>${row.totalRevenue.toLocaleString()}</span>
      ),
    },
    {
      key: 'totalProfit',
      header: 'Profit',
      cell: (row: typeof mockProductReports[0]) => (
        <span className="font-medium text-success">${row.totalProfit.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Reports & Analytics"
        description="Monitor your business performance and profitability"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="From paid invoices"
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Total Profit"
          value={`$${totalProfit.toLocaleString()}`}
          subtitle={`${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Hardware Sales"
          value={`$${hardwareRevenue.toLocaleString()}`}
          subtitle={`${((hardwareRevenue / totalRevenue) * 100).toFixed(1)}% of total`}
          icon={Monitor}
          variant="default"
        />
        <StatCard
          title="Software Sales"
          value={`$${softwareRevenue.toLocaleString()}`}
          subtitle={`${((softwareRevenue / totalRevenue) * 100).toFixed(1)}% of total`}
          icon={Database}
          variant="default"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Profit</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockSalesReports}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => format(new Date(value), 'MMMM dd, yyyy')}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Bar dataKey="totalSales" fill="hsl(226, 71%, 40%)" radius={[4, 4, 0, 0]} name="Sales" />
                      <Bar dataKey="totalProfit" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} name="Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sales Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Hardware vs Software Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockSalesReports}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => format(new Date(value), 'MMMM dd, yyyy')}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="hardwareSales" 
                        stroke="hsl(226, 71%, 40%)" 
                        strokeWidth={2}
                        name="Hardware"
                        dot={{ fill: 'hsl(226, 71%, 40%)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="softwareSales" 
                        stroke="hsl(173, 58%, 39%)" 
                        strokeWidth={2}
                        name="Software"
                        dot={{ fill: 'hsl(173, 58%, 39%)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice-wise Profit Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={invoiceProfitData}
                columns={invoiceProfitColumns}
                searchable
                searchPlaceholder="Search invoices..."
                searchKeys={['invoiceNumber', 'clientName']}
                pageSize={10}
                emptyMessage="No paid invoices found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={mockProductReports}
                columns={productReportColumns}
                searchable
                searchPlaceholder="Search products..."
                searchKeys={['productCode', 'productName']}
                pageSize={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ReportsPage;
