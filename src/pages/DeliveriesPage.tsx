import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  RotateCcw, 
  Filter, 
  Eye, 
  MapPin,
  User,
  Phone,
  Clock,
  ArrowRight,
  PackageCheck,
  Navigation,
  UserCheck,
  Warehouse
} from 'lucide-react';
import { Delivery, DeliveryStage, DeliveryPerson } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const DELIVERY_STAGES: { stage: DeliveryStage; label: string; icon: React.ElementType; description: string }[] = [
  { stage: 'in_inventory', label: 'In Inventory', icon: Warehouse, description: 'Ready for dispatch' },
  { stage: 'collected_by_driver', label: 'Collected by Driver', icon: PackageCheck, description: 'Picked up by delivery person' },
  { stage: 'in_transit', label: 'In Transit', icon: Navigation, description: 'On the way to destination' },
  { stage: 'arrived_at_location', label: 'Arrived at Location', icon: MapPin, description: 'Arrived at delivery address' },
  { stage: 'collected_by_receiver', label: 'Collected by Receiver', icon: UserCheck, description: 'Delivered to customer' },
];

const getStageIndex = (stage: DeliveryStage): number => {
  if (stage === 'returned') return -1;
  return DELIVERY_STAGES.findIndex(s => s.stage === stage);
};

const getNextStage = (currentStage: DeliveryStage): DeliveryStage | null => {
  const currentIndex = getStageIndex(currentStage);
  if (currentIndex === -1 || currentIndex >= DELIVERY_STAGES.length - 1) return null;
  return DELIVERY_STAGES[currentIndex + 1].stage;
};

const DeliveriesPage = () => {
  const { deliveries, updateDeliveryStage, assignDeliveryPerson, markDeliveryReturned } = useData();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showTrackingSheet, setShowTrackingSheet] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateLocation, setUpdateLocation] = useState('');
  const [deliveryPersonForm, setDeliveryPersonForm] = useState<DeliveryPerson>({
    id: '',
    name: '',
    phone: '',
    vehicleNumber: '',
  });

  const filteredDeliveries = statusFilter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === statusFilter);

  const pendingCount = deliveries.filter(d => d.status === 'pending').length;
  const inProgressCount = deliveries.filter(d => d.status === 'in_progress').length;
  const completedCount = deliveries.filter(d => d.status === 'completed').length;
  const returnedCount = deliveries.filter(d => d.status === 'returned').length;

  const handleStageUpdate = (delivery: Delivery, newStage: DeliveryStage) => {
    updateDeliveryStage(
      delivery.id, 
      newStage, 
      user?.name || 'Unknown',
      updateNotes || undefined,
      updateLocation || undefined
    );
    toast({
      title: 'Stage Updated',
      description: `Delivery for ${delivery.productName} moved to "${DELIVERY_STAGES.find(s => s.stage === newStage)?.label || newStage}".`,
    });
    setShowUpdateDialog(false);
    setSelectedDelivery(null);
    setUpdateNotes('');
    setUpdateLocation('');
  };

  const handleReturn = (delivery: Delivery) => {
    markDeliveryReturned(delivery.id, user?.name || 'Unknown', updateNotes || 'Item returned');
    toast({
      title: 'Marked as Returned',
      description: `Delivery for ${delivery.productName} has been marked as returned.`,
      variant: 'destructive',
    });
    setShowUpdateDialog(false);
    setSelectedDelivery(null);
    setUpdateNotes('');
  };

  const handleAssignDeliveryPerson = () => {
    if (!selectedDelivery || !deliveryPersonForm.name || !deliveryPersonForm.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in the delivery person name and phone.',
        variant: 'destructive',
      });
      return;
    }
    
    assignDeliveryPerson(selectedDelivery.id, {
      ...deliveryPersonForm,
      id: `dp-${Date.now()}`,
    });
    toast({
      title: 'Delivery Person Assigned',
      description: `${deliveryPersonForm.name} has been assigned to this delivery.`,
    });
    setShowAssignDialog(false);
    setDeliveryPersonForm({ id: '', name: '', phone: '', vehicleNumber: '' });
    setSelectedDelivery(null);
  };

  const getStageStatusColor = (stage: DeliveryStage, currentStage: DeliveryStage) => {
    if (currentStage === 'returned') return 'bg-destructive/20 text-destructive border-destructive/30';
    const stageIndex = getStageIndex(stage);
    const currentIndex = getStageIndex(currentStage);
    if (stageIndex < currentIndex) return 'bg-success/20 text-success border-success/30';
    if (stageIndex === currentIndex) return 'bg-primary/20 text-primary border-primary/30';
    return 'bg-muted text-muted-foreground border-border';
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
      key: 'recipient',
      header: 'Recipient',
      cell: (delivery: Delivery) => (
        <div>
          <p className="font-medium text-sm">{delivery.recipientName}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{delivery.deliveryAddress}</p>
        </div>
      ),
    },
    {
      key: 'currentStage',
      header: 'Current Stage',
      cell: (delivery: Delivery) => {
        const stageInfo = delivery.currentStage === 'returned' 
          ? { label: 'Returned', icon: RotateCcw }
          : DELIVERY_STAGES.find(s => s.stage === delivery.currentStage);
        const Icon = stageInfo?.icon || Package;
        return (
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{stageInfo?.label || delivery.currentStage}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (delivery: Delivery) => (
        <StatusBadge status={delivery.status} variant={getStatusVariant(delivery.status)} />
      ),
    },
    {
      key: 'deliveryPerson',
      header: 'Driver',
      cell: (delivery: Delivery) => (
        <div>
          {delivery.deliveryPerson ? (
            <div className="text-sm">
              <p className="font-medium">{delivery.deliveryPerson.name}</p>
              <p className="text-xs text-muted-foreground">{delivery.deliveryPerson.vehicleNumber}</p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Not assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (delivery: Delivery) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDelivery(delivery);
              setShowTrackingSheet(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {delivery.status !== 'completed' && delivery.status !== 'returned' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDelivery(delivery);
                setShowUpdateDialog(true);
              }}
            >
              Update
            </Button>
          )}
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Delivery Tracking"
        description="Track and manage product deliveries through all stages"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
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
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-destructive/10">
                <RotateCcw className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{returnedCount}</p>
                <p className="text-sm text-muted-foreground">Returned</p>
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
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
            searchKeys={['invoiceNumber', 'productName', 'productCode', 'recipientName']}
            pageSize={10}
            emptyMessage="No deliveries found"
          />
        </CardContent>
      </Card>

      {/* Tracking Details Sheet */}
      <Sheet open={showTrackingSheet} onOpenChange={setShowTrackingSheet}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Delivery Tracking Details</SheetTitle>
            <SheetDescription>
              {selectedDelivery && (
                <>Tracking for {selectedDelivery.productName}</>
              )}
            </SheetDescription>
          </SheetHeader>

          {selectedDelivery && (
            <ScrollArea className="h-[calc(100vh-200px)] pr-4 mt-6">
              {/* Delivery Info */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-mono text-sm text-primary">{selectedDelivery.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Product Code</p>
                    <p className="font-mono text-sm">{selectedDelivery.productCode}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedDelivery.productName}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {selectedDelivery.quantity}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedDelivery.recipientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedDelivery.recipientPhone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{selectedDelivery.deliveryAddress}</span>
                  </div>
                </div>

                {selectedDelivery.deliveryPerson && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Delivery Person</p>
                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <p className="font-medium">{selectedDelivery.deliveryPerson.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedDelivery.deliveryPerson.phone}</p>
                        {selectedDelivery.deliveryPerson.vehicleNumber && (
                          <p className="text-sm text-muted-foreground">Vehicle: {selectedDelivery.deliveryPerson.vehicleNumber}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Separator className="my-4" />

              {/* Tracking Timeline */}
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Delivery Progress</h4>
                
                {/* Stage Progress */}
                <div className="space-y-3 mb-6">
                  {DELIVERY_STAGES.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = selectedDelivery.currentStage === stage.stage;
                    const isPassed = getStageIndex(selectedDelivery.currentStage) > index;
                    const isReturned = selectedDelivery.currentStage === 'returned';
                    
                    return (
                      <div 
                        key={stage.stage}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isReturned 
                            ? 'bg-muted/30 border-muted' 
                            : getStageStatusColor(stage.stage, selectedDelivery.currentStage)
                        }`}
                      >
                        <div className={`p-2 rounded-full ${isPassed || isActive ? 'bg-background' : ''}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stage.label}</p>
                          <p className="text-xs opacity-70">{stage.description}</p>
                        </div>
                        {isPassed && <CheckCircle className="w-4 h-4 text-success" />}
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                    );
                  })}
                  
                  {selectedDelivery.currentStage === 'returned' && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-destructive/20 text-destructive border-destructive/30">
                      <div className="p-2 rounded-full bg-background">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Returned</p>
                        <p className="text-xs opacity-70">Item returned to inventory</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Tracking History */}
              <div>
                <h4 className="font-semibold mb-4">Tracking History</h4>
                <div className="space-y-4">
                  {selectedDelivery.trackingHistory.slice().reverse().map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {index < selectedDelivery.trackingHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-muted-foreground/20 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-sm">
                          {event.stage === 'returned' 
                            ? 'Returned' 
                            : DELIVERY_STAGES.find(s => s.stage === event.stage)?.label || event.stage}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
                        </p>
                        <p className="text-xs text-muted-foreground">by {event.updatedBy}</p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-muted-foreground mt-1 italic">"{event.notes}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selectedDelivery.status !== 'completed' && selectedDelivery.status !== 'returned' && (
                <div className="mt-6 space-y-2">
                  <Separator className="mb-4" />
                  <div className="flex gap-2">
                    {!selectedDelivery.deliveryPerson && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowTrackingSheet(false);
                          setShowAssignDialog(true);
                        }}
                      >
                        Assign Driver
                      </Button>
                    )}
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setShowTrackingSheet(false);
                        setShowUpdateDialog(true);
                      }}
                    >
                      Update Stage
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Stage Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Stage</DialogTitle>
            <DialogDescription>
              {selectedDelivery && (
                <>Move delivery for {selectedDelivery.productName} to the next stage</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDelivery && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Stage</p>
                <p className="font-medium">
                  {selectedDelivery.currentStage === 'returned' 
                    ? 'Returned' 
                    : DELIVERY_STAGES.find(s => s.stage === selectedDelivery.currentStage)?.label}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add any notes about this update..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  value={updateLocation}
                  onChange={(e) => setUpdateLocation(e.target.value)}
                  placeholder="Current location..."
                />
              </div>

              <Separator />

              <div className="space-y-2">
                {getNextStage(selectedDelivery.currentStage) && (
                  <Button
                    onClick={() => handleStageUpdate(selectedDelivery, getNextStage(selectedDelivery.currentStage)!)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Move to: {DELIVERY_STAGES.find(s => s.stage === getNextStage(selectedDelivery.currentStage))?.label}
                    </span>
                  </Button>
                )}

                {selectedDelivery.currentStage !== 'returned' && selectedDelivery.currentStage !== 'collected_by_receiver' && (
                  <Button
                    onClick={() => handleReturn(selectedDelivery)}
                    variant="destructive"
                    className="w-full justify-start gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Mark as Returned
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUpdateDialog(false);
              setUpdateNotes('');
              setUpdateLocation('');
            }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Person Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Person</DialogTitle>
            <DialogDescription>
              Assign a driver to this delivery
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name *</Label>
              <Input
                id="driverName"
                value={deliveryPersonForm.name}
                onChange={(e) => setDeliveryPersonForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter driver name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverPhone">Phone Number *</Label>
              <Input
                id="driverPhone"
                value={deliveryPersonForm.phone}
                onChange={(e) => setDeliveryPersonForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number (optional)</Label>
              <Input
                id="vehicleNumber"
                value={deliveryPersonForm.vehicleNumber}
                onChange={(e) => setDeliveryPersonForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                placeholder="Enter vehicle number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDialog(false);
              setDeliveryPersonForm({ id: '', name: '', phone: '', vehicleNumber: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleAssignDeliveryPerson}>
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DeliveriesPage;