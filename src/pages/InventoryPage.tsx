import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, CheckCircle, XCircle, History } from 'lucide-react';
import { HardwareProduct, SoftwareProduct, InventoryLog } from '@/types';
import { format } from 'date-fns';

const InventoryPage = () => {
  const { products, inventoryLogs } = useData();

  // Calculate inventory stats
  const inStockProducts = products.filter(p => {
    if (p.type === 'hardware') return (p as HardwareProduct).stockQuantity > 5;
    return (p as SoftwareProduct).licenseQuantity > 5;
  }).length;

  const lowStockProducts = products.filter(p => {
    if (p.type === 'hardware') {
      const qty = (p as HardwareProduct).stockQuantity;
      return qty > 0 && qty <= 5;
    }
    const qty = (p as SoftwareProduct).licenseQuantity;
    return qty > 0 && qty <= 5;
  });

  const outOfStockProducts = products.filter(p => {
    if (p.type === 'hardware') return (p as HardwareProduct).stockQuantity === 0;
    return (p as SoftwareProduct).licenseQuantity === 0;
  });

  const totalSoftwareLicenses = products
    .filter(p => p.type === 'software')
    .reduce((sum, p) => sum + (p as SoftwareProduct).licenseQuantity, 0);

  const stockColumns = [
    {
      key: 'productCode',
      header: 'Code',
      cell: (product: typeof products[0]) => (
        <span className="font-mono text-sm text-primary">{product.productCode}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product',
      cell: (product: typeof products[0]) => (
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (product: typeof products[0]) => (
        <StatusBadge 
          status={product.type} 
          variant={product.type === 'hardware' ? 'info' : 'success'} 
        />
      ),
    },
    {
      key: 'stock',
      header: 'Stock/Licenses',
      cell: (product: typeof products[0]) => {
        const qty = product.type === 'hardware' 
          ? (product as HardwareProduct).stockQuantity 
          : (product as SoftwareProduct).licenseQuantity;
        
        const label = product.type === 'hardware' ? 'units' : 'licenses';
        
        if (qty === 0) return <StatusBadge status="Out of Stock" variant="danger" />;
        if (qty <= 5) return <StatusBadge status={`${qty} ${label} - Low`} variant="warning" />;
        return <span className="font-medium">{qty} {label}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (product: typeof products[0]) => {
        const qty = product.type === 'hardware' 
          ? (product as HardwareProduct).stockQuantity 
          : (product as SoftwareProduct).licenseQuantity;
        
        if (qty === 0) return <StatusBadge status="Out of Stock" variant="danger" />;
        if (qty <= 5) return <StatusBadge status="Low Stock" variant="warning" />;
        return <StatusBadge status="In Stock" variant="success" />;
      },
    },
  ];

  const logColumns = [
    {
      key: 'timestamp',
      header: 'Date',
      cell: (log: InventoryLog) => (
        <span className="text-sm">{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}</span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (log: InventoryLog) => (
        <div>
          <p className="font-medium">{log.productName}</p>
          <p className="text-xs text-muted-foreground font-mono">{log.productCode}</p>
        </div>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      cell: (log: InventoryLog) => (
        <span className={`font-medium ${log.change > 0 ? 'text-success' : 'text-destructive'}`}>
          {log.change > 0 ? '+' : ''}{log.change}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      cell: (log: InventoryLog) => (
        <StatusBadge status={log.reason} variant={getStatusVariant(log.reason)} />
      ),
    },
    {
      key: 'user',
      header: 'User',
      cell: (log: InventoryLog) => <span className="text-sm">{log.userName}</span>,
    },
    {
      key: 'notes',
      header: 'Notes',
      cell: (log: InventoryLog) => (
        <span className="text-sm text-muted-foreground">{log.notes || '-'}</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Inventory"
        description="Monitor stock levels and inventory changes"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="In Stock"
          value={inStockProducts}
          subtitle="Products with good stock"
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title="Low Stock"
          value={lowStockProducts.length}
          subtitle="Need attention"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockProducts.length}
          subtitle="Need reorder"
          icon={XCircle}
          variant="danger"
        />
        <StatCard
          title="Software Licenses"
          value={totalSoftwareLicenses}
          subtitle="Total available"
          icon={Package}
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.productCode}</p>
                    </div>
                    <span className="text-sm font-medium text-warning">
                      {product.type === 'hardware' 
                        ? `${(product as HardwareProduct).stockQuantity} units`
                        : `${(product as SoftwareProduct).licenseQuantity} licenses`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Out of Stock Alert */}
        {outOfStockProducts.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" />
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outOfStockProducts.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-card rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.productCode}</p>
                    </div>
                    <StatusBadge status="Out of Stock" variant="danger" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All Products Stock */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Stock Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products}
            columns={stockColumns}
            searchable
            searchPlaceholder="Search products..."
            searchKeys={['name', 'productCode', 'category']}
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Inventory Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Inventory History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={inventoryLogs}
            columns={logColumns}
            searchable
            searchPlaceholder="Search logs..."
            searchKeys={['productName', 'productCode', 'reason', 'userName']}
            pageSize={10}
            emptyMessage="No inventory changes recorded"
          />
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default InventoryPage;
