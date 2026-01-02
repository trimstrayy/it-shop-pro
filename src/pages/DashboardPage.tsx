import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  Receipt,
  Truck,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { HardwareProduct, SoftwareProduct } from '@/types';

const DashboardPage = () => {
  const { user } = useAuth();
  const { products, quotations, invoices, deliveries } = useData();

  // Calculate stats
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => {
    if (p.type === 'hardware') {
      return (p as HardwareProduct).stockQuantity > 0 && (p as HardwareProduct).stockQuantity <= 5;
    }
    return (p as SoftwareProduct).licenseQuantity > 0 && (p as SoftwareProduct).licenseQuantity <= 5;
  }).length;
  const outOfStockProducts = products.filter(p => {
    if (p.type === 'hardware') {
      return (p as HardwareProduct).stockQuantity === 0;
    }
    return (p as SoftwareProduct).licenseQuantity === 0;
  }).length;

  const pendingQuotations = quotations.filter(q => q.status === 'draft' || q.status === 'sent').length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.grandTotal, 0);
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'shipped').length;

  // Recent activity
  const recentInvoices = invoices.slice(0, 5);
  const recentQuotations = quotations.slice(0, 5);

  return (
    <AppLayout>
      <PageHeader 
        title={`Welcome back, ${user?.name?.split(' ')[0]}`}
        description="Here's an overview of your business today"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Products"
          value={activeProducts}
          subtitle={`${lowStockProducts} low stock`}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="Paid invoices"
          icon={DollarSign}
          variant="success"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Pending Invoices"
          value={pendingInvoices}
          subtitle={`$${invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.grandTotal, 0).toLocaleString()} outstanding`}
          icon={Receipt}
          variant="warning"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockProducts}
          subtitle="Need restock"
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/quotations/new">
              <Button variant="outline" className="w-full justify-start gap-3">
                <FileText className="w-4 h-4" />
                Create New Quotation
              </Button>
            </Link>
            <Link to="/billing">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Receipt className="w-4 h-4" />
                New Sale / Invoice
              </Button>
            </Link>
            <Link to="/products/new">
              <Button variant="outline" className="w-full justify-start gap-3">
                <Package className="w-4 h-4" />
                Add Product
              </Button>
            </Link>
            <Link to="/reports">
              <Button variant="outline" className="w-full justify-start gap-3">
                <BarChart3 className="w-4 h-4" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Quotations */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Quotations</CardTitle>
            <Link to="/quotations">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuotations.map((quotation) => (
                <div 
                  key={quotation.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{quotation.quotationNumber}</p>
                    <p className="text-xs text-muted-foreground">{quotation.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${quotation.grandTotal.toLocaleString()}</p>
                    <StatusBadge status={quotation.status} variant={getStatusVariant(quotation.status)} />
                  </div>
                </div>
              ))}
              {recentQuotations.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No quotations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Invoices</CardTitle>
            <Link to="/billing">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${invoice.grandTotal.toLocaleString()}</p>
                    <StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} />
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No invoices yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Deliveries */}
      {pendingDeliveries > 0 && (
        <Card className="border-border mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Truck className="w-5 h-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Deliveries</CardTitle>
                <p className="text-sm text-muted-foreground">{pendingDeliveries} items need attention</p>
              </div>
            </div>
            <Link to="/deliveries">
              <Button variant="outline">Manage Deliveries</Button>
            </Link>
          </CardHeader>
        </Card>
      )}
    </AppLayout>
  );
};

export default DashboardPage;
