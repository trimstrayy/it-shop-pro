import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Truck, Package, CheckCircle, RotateCcw, Filter } from 'lucide-react';
import { Delivery, DeliveryStatus } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const DeliveriesPage = () => {
  const { deliveries, updateDeliveryStatus } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const filteredDeliveries = statusFilter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === statusFilter);

  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const shippedCount = deliveries.filter(d => d.status === 'shipped').length;
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length;

  const handleStatusUpdate = (delivery: Delivery, newStatus: DeliveryStatus) => {
    updateDeliveryStatus(delivery.id, newStatus);
    toast({
      title: 'Status Updated',
      description: `Delivery for ${delivery.productName} marked as ${newStatus}.`,
    });
    setShowUpdateDialog(false);
    setSelectedDelivery(null);
  };

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      cell: (delivery: Delivery) => (
        <span className="font-mono text-sm text-primary">{delivery.invoiceNumber}</span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (delivery: Delivery) => (
        <div>
          <p className="font-medium">{delivery.productName}</p>
          <p className="text-xs text-muted-foreground">{delivery.productCode}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      cell: (delivery: Delivery) => (
        <span>{delivery.quantity}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (delivery: Delivery) => (
        <StatusBadge status={delivery.status} variant={getStatusVariant(delivery.status)} />
      ),
    },
    {
      key: 'shippedAt',
      header: 'Shipped',
      cell: (delivery: Delivery) => (
        <span className="text-sm text-muted-foreground">
          {delivery.shippedAt ? format(new Date(delivery.shippedAt), 'MMM dd, yyyy') : '-'}
        </span>
      ),
    },
    {
      key: 'deliveredAt',
      header: 'Delivered',
      cell: (delivery: Delivery) => (
        <span className="text-sm text-muted-foreground">
          {delivery.deliveredAt ? format(new Date(delivery.deliveredAt), 'MMM dd, yyyy') : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (delivery: Delivery) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedDelivery(delivery);
            setShowUpdateDialog(true);
          }}
        >
          Update Status
        </Button>
      ),
      className: 'w-32',
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Deliveries"
        description="Track and manage product deliveries"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Package className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shippedCount}</p>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-success/10">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deliveredCount}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-card rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            Clear Filter
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTable
            data={filteredDeliveries}
            columns={columns}
            searchable
            searchPlaceholder="Search deliveries..."
            searchKeys={['invoiceNumber', 'productName', 'productCode']}
            pageSize={10}
            emptyMessage="No deliveries found"
          />
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              {selectedDelivery && (
                <>Update status for {selectedDelivery.productName} ({selectedDelivery.quantity} units)</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="grid gap-3 py-4">
              {selectedDelivery.status === 'pending' && (
                <Button
                  onClick={() => handleStatusUpdate(selectedDelivery, 'shipped')}
                  className="w-full justify-start gap-3"
                >
                  <Truck className="w-4 h-4" />
                  Mark as Shipped
                </Button>
              )}
              {(selectedDelivery.status === 'pending' || selectedDelivery.status === 'shipped') && (
                <Button
                  onClick={() => handleStatusUpdate(selectedDelivery, 'delivered')}
                  variant="outline"
                  className="w-full justify-start gap-3"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Delivered
                </Button>
              )}
              {selectedDelivery.status !== 'returned' && (
                <Button
                  onClick={() => handleStatusUpdate(selectedDelivery, 'returned')}
                  variant="destructive"
                  className="w-full justify-start gap-3"
                >
                  <RotateCcw className="w-4 h-4" />
                  Mark as Returned
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DeliveriesPage;
