import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Trash2, Receipt, CreditCard, Banknote, Building } from 'lucide-react';
import { Product, HardwareProduct, SoftwareProduct, InvoiceItem, Invoice, PaymentMode } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const BillingPage = () => {
  const { products, invoices, addInvoice, updateInvoice } = useData();
  const { user } = useAuth();

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  const activeProducts = products.filter(p => p.status === 'active');
  const filteredProducts = searchTerm 
    ? activeProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm)
      )
    : activeProducts;

  const addItem = (product: Product) => {
    const stock = product.type === 'hardware' 
      ? (product as HardwareProduct).stockQuantity
      : (product as SoftwareProduct).licenseQuantity;

    if (stock === 0) {
      toast({
        title: 'Out of Stock',
        description: `${product.name} is out of stock.`,
        variant: 'destructive',
      });
      return;
    }

    const existingItem = items.find(i => i.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= stock) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${stock} units available.`,
          variant: 'destructive',
        });
        return;
      }
      
      setItems(items.map(i => 
        i.productId === product.id 
          ? { ...i, quantity: i.quantity + 1, lineTotal: calculateLineTotal(i.quantity + 1, i.unitPrice, i.taxPercent, i.discount) }
          : i
      ));
    } else {
      const newItem: InvoiceItem = {
        id: `invi-${Date.now()}`,
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        taxPercent: product.taxPercent,
        discount: 0,
        lineTotal: calculateLineTotal(1, product.sellingPrice, product.taxPercent, 0),
      };
      setItems([...items, newItem]);
    }
    
    setSearchTerm('');
  };

  const calculateLineTotal = (quantity: number, unitPrice: number, taxPercent: number, discount: number) => {
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    return taxableAmount + taxAmount;
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        updatedItem.lineTotal = calculateLineTotal(
          updatedItem.quantity, 
          updatedItem.unitPrice, 
          updatedItem.taxPercent, 
          updatedItem.discount
        );
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalDiscount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * item.discount / 100);
  }, 0);
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const discountAmount = itemSubtotal * (item.discount / 100);
    const taxableAmount = itemSubtotal - discountAmount;
    return sum + (taxableAmount * item.taxPercent / 100);
  }, 0);
  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleCheckout = () => {
    if (!clientInfo.name) {
      toast({
        title: 'Client Name Required',
        description: 'Please enter the client name.',
        variant: 'destructive',
      });
      return;
    }

    const invoice = addInvoice({
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientAddress: clientInfo.address,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      paymentMode,
      status: 'paid',
      createdBy: user?.id || '',
      paidAt: new Date(),
    });

    toast({
      title: 'Sale Complete!',
      description: `Invoice ${invoice.invoiceNumber} has been created.`,
    });

    // Reset form
    setItems([]);
    setClientInfo({ name: '', email: '', phone: '', address: '' });
    setShowCheckout(false);
  };

  const recentInvoices = invoices.slice(0, 10);

  const invoiceColumns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      cell: (invoice: Invoice) => (
        <span className="font-mono text-sm text-primary">{invoice.invoiceNumber}</span>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      cell: (invoice: Invoice) => (
        <span className="font-medium">{invoice.clientName}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      cell: (invoice: Invoice) => (
        <span className="font-medium">${invoice.grandTotal.toLocaleString()}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (invoice: Invoice) => (
        <StatusBadge status={invoice.paymentMode} variant="info" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (invoice: Invoice) => (
        <StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} />
      ),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (invoice: Invoice) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Billing"
        description="Process sales and manage invoices"
      />

      <Tabs defaultValue="pos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Search & Cart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Add Products
                  </CardTitle>
                  <Button 
                    type="button"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Product Search Panel - Like Quotation Form */}
                  {showProductSearch && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, code, or barcode..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredProducts.slice(0, 15).map(product => {
                          const stock = product.type === 'hardware' 
                            ? (product as HardwareProduct).stockQuantity
                            : (product as SoftwareProduct).licenseQuantity;
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                addItem(product);
                                setShowProductSearch(false);
                              }}
                              className="w-full flex items-center justify-between p-3 hover:bg-background rounded-lg transition-colors text-left"
                              disabled={stock === 0}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.productCode} • {stock > 0 ? `${stock} available` : 'Out of stock'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-primary">${product.sellingPrice}</span>
                                <p className="text-xs text-muted-foreground">{product.type}</p>
                              </div>
                            </button>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">No products found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!showProductSearch && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click "Add Product" to browse and add items to cart
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Cart ({items.length} items)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Cart is empty. Search and add products above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.productCode}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                              >
                                +
                              </Button>
                            </div>
                            <span className="w-24 text-right font-medium">${item.lineTotal.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Checkout */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                      placeholder="Walk-in Customer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${totalTax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        type="button"
                        variant={paymentMode === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMode('cash')}
                        className="flex-col gap-1 h-auto py-3"
                      >
                        <Banknote className="w-5 h-5" />
                        <span className="text-xs">Cash</span>
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMode === 'online' ? 'default' : 'outline'}
                        onClick={() => setPaymentMode('online')}
                        className="flex-col gap-1 h-auto py-3"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-xs">Card</span>
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMode === 'bank' ? 'default' : 'outline'}
                        onClick={() => setPaymentMode('bank')}
                        className="flex-col gap-1 h-auto py-3"
                      >
                        <Building className="w-5 h-5" />
                        <span className="text-xs">Bank</span>
                      </Button>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    disabled={items.length === 0}
                    onClick={handleCheckout}
                  >
                    Complete Sale
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={recentInvoices}
                columns={invoiceColumns}
                searchable
                searchPlaceholder="Search invoices..."
                searchKeys={['invoiceNumber', 'clientName']}
                pageSize={10}
                emptyMessage="No invoices found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default BillingPage;
