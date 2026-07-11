import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, AlertTriangle, CheckCircle, XCircle, History, Plus } from 'lucide-react';
import { HardwareProduct, SoftwareProduct, InventoryLog } from '@/types';
import { format } from 'date-fns';

const InventoryPage = () => {
  const { products, inventoryLogs, updateInventory } = useData();
  const { user } = useAuth();

  // Admin check — only users with the 'admin' role can update stock
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // State for the stock update dialog (admin only)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [stockChangeAmount, setStockChangeAmount] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateError, setUpdateError] = useState('');

  const handleOpenUpdateDialog = (product: typeof products[0]) => {
    if (!isAdmin) return; // Guard: should never be reachable for non-admins
    setSelectedProduct(product);
    setStockChangeAmount('');
    setUpdateNotes('');
    setUpdateError('');
    setUpdateDialogOpen(true);
  };

  const handleStockUpdate = () => {
    if (!isAdmin) return; // Guard: prevent any non-admin execution
    if (!selectedProduct) return;

    const amount = parseInt(stockChangeAmount, 10);
    if (isNaN(amount) || amount === 0) {
      setUpdateError('Please enter a valid non-zero quantity.');
      return;
    }

    const currentQty =
      selectedProduct.type === 'hardware'
        ? (selectedProduct as HardwareProduct).stockQuantity
        : (selectedProduct as SoftwareProduct).licenseQuantity;

    if (currentQty + amount < 0) {
      setUpdateError('Stock cannot go below zero.');
      return;
    }

    updateInventory(
      selectedProduct.id,
      amount,
      'purchase',
      user?.id ?? 'unknown',
      user?.name ?? 'Unknown User',
      updateNotes || undefined,
    );
    setUpdateDialogOpen(false);
    setSelectedProduct(null);
  };

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
        const qty =
          product.type === 'hardware'
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
        const qty =
          product.type === 'hardware'
            ? (product as HardwareProduct).stockQuantity
            : (product as SoftwareProduct).licenseQuantity;

        if (qty === 0) return <StatusBadge status="Out of Stock" variant="danger" />;
        if (qty <= 5) return <StatusBadge status="Low Stock" variant="warning" />;
        return <StatusBadge status="In Stock" variant="success" />;
      },
    },
    // Admin-only "Update Stock" action column
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Actions',
            cell: (product: typeof products[0]) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenUpdateDialog(product)}
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Update Stock
              </Button>
            ),
          },
        ]
      : []),
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-warning">
                        {product.type === 'hardware'
                          ? `${(product as HardwareProduct).stockQuantity} units`
                          : `${(product as SoftwareProduct).licenseQuantity} licenses`}
                      </span>
                      {/* Admin-only quick update button in alert card */}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleOpenUpdateDialog(product)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Restock
                        </Button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2">
                      <StatusBadge status="Out of Stock" variant="danger" />
                      {/* Admin-only quick restock button */}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleOpenUpdateDialog(product)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Restock
                        </Button>
                      )}
                    </div>
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

      {/* Admin-only: Stock Update Dialog — completely absent from DOM for non-admins */}
      {isAdmin && (
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Stock</DialogTitle>
            </DialogHeader>

            {selectedProduct && (
              <div className="space-y-4 py-2">
                <div>
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedProduct.productCode}</p>
                  <p className="text-sm mt-1">
                    Current stock:{' '}
                    <span className="font-semibold">
                      {selectedProduct.type === 'hardware'
                        ? `${(selectedProduct as HardwareProduct).stockQuantity} units`
                        : `${(selectedProduct as SoftwareProduct).licenseQuantity} licenses`}
                    </span>
                  </p>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="stockChange">
                    Quantity Change{' '}
                    <span className="text-muted-foreground font-normal">(use negative to reduce)</span>
                  </Label>
                  <Input
                    id="stockChange"
                    type="number"
                    placeholder="e.g. 50 or -10"
                    value={stockChangeAmount}
                    onChange={e => {
                      setStockChangeAmount(e.target.value);
                      setUpdateError('');
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="updateNotes">Notes (optional)</Label>
                  <Input
                    id="updateNotes"
                    placeholder="e.g. New batch received from supplier"
                    value={updateNotes}
                    onChange={e => setUpdateNotes(e.target.value)}
                  />
                </div>

                {updateError && (
                  <p className="text-sm text-destructive">{updateError}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStockUpdate}>Confirm Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
};

export default InventoryPage;