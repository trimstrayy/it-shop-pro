import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Trash2, Receipt, CreditCard, Banknote, Building, FileText, Loader2 } from 'lucide-react';
import { Product, HardwareProduct, SoftwareProduct, InvoiceItem, Invoice, PaymentMode } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ProductFilter = 'all' | 'software' | 'hardware' | 'chargers' | 'covers' | 'laptops';

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('quotation');
  const repairId = searchParams.get('repair');

  const { products, invoices, addInvoice, quotations, convertToInvoice, repairJobs, convertRepairToInvoice } = useData();
  const { user } = useAuth();

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [fromQuotation, setFromQuotation] = useState<string | null>(null);
  const [fromRepair, setFromRepair] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load quotation if converting
  useEffect(() => {
    if (quotationId) {
      const quotation = quotations.find(q => q.id === quotationId);
      if (quotation && quotation.status !== 'converted') {
        setClientInfo({
          name: quotation.clientName,
          email: quotation.clientEmail,
          phone: quotation.clientPhone,
          address: quotation.clientAddress,
        });

        const invoiceItems: InvoiceItem[] = quotation.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: item.id,
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: product?.costPrice || 0,
            taxPercent: item.taxPercent,
            discount: item.discount,
            lineTotal: item.lineTotal,
          };
        });

        setItems(invoiceItems);
        setFromQuotation(quotationId);
        setFromRepair(null);

        toast({
          title: 'Quotation Loaded',
          description: `Converting ${quotation.quotationNumber} to invoice`,
        });
      }
    }
  }, [quotationId, quotations, products]);

  useEffect(() => {
    if (repairId) {
      const repairJob = repairJobs.find(job => job.id === repairId);
      if (repairJob) {
        setClientInfo({
          name: repairJob.customer?.name || 'Repair Customer',
          email: repairJob.customer?.email || '',
          phone: repairJob.customer?.phone || '',
          address: '',
        });

        const repairItems: InvoiceItem[] = [
          {
            id: `repair-${repairJob.id}`,
            productId: `repair-service-${repairJob.id}`,
            productCode: 'REPAIR-SVC',
            productName: repairJob.issueSummary || 'Device Repair Service',
            quantity: 1,
            unitPrice: repairJob.estimatedCost,
            costPrice: 0,
            taxPercent: 0,
            discount: 0,
            lineTotal: repairJob.estimatedCost,
          },
          ...((repairJob.parts || []).map(part => ({
            id: `repair-part-${part.id}`,
            productId: part.productId,
            productCode: `PART-${part.productId.slice(-4)}`,
            productName: `Repair Part (${part.productId})`,
            quantity: part.quantity,
            unitPrice: part.unitCost,
            costPrice: part.unitCost,
            taxPercent: 0,
            discount: 0,
            lineTotal: part.totalCost,
          } as InvoiceItem)))
        ];

        setItems(repairItems);
        setFromRepair(repairId);
        setFromQuotation(null);

        toast({
          title: 'Repair Job Loaded',
          description: `Preparing invoice for ${repairJob.jobId}`,
        });
      }
    }
  }, [repairId, repairJobs]);

  const activeProducts = products.filter(p => p.status === 'active');
  const filteredProducts = activeProducts.filter(product => {
    const matchesFilter =
      productFilter === 'all' ||
      (productFilter === 'software' && product.type === 'software') ||
      (productFilter === 'hardware' && product.type === 'hardware') ||
      (productFilter === 'chargers' && product.type === 'hardware' && product.category === 'Chargers') ||
      (productFilter === 'covers' && product.type === 'hardware' && product.category === 'Mobile Covers') ||
      (productFilter === 'laptops' && product.type === 'hardware' && product.category === 'Laptops');

    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.productCode.toLowerCase().includes(normalizedSearch) ||
      product.barcode.includes(searchTerm);

    return matchesFilter && matchesSearch;
  });

  // Helper to get available stock for any product
  const getStock = (product: Product): number => {
    return product.type === 'hardware'
      ? (product as HardwareProduct).stockQuantity
      : (product as SoftwareProduct).licenseQuantity;
  };

  const addItem = (product: Product) => {
    const stock = getStock(product);

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
          title: 'Stock Limit Reached',
          description: `Only ${stock} unit${stock !== 1 ? 's' : ''} of "${product.name}" available.`,
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

        // Clamp quantity to available stock as a hard backstop
        if (updates.quantity !== undefined) {
          const product = products.find(p => p.id === item.productId);
          const stock = product ? getStock(product) : 0;
          updatedItem.quantity = Math.min(Math.max(1, updatedItem.quantity), stock);
        }

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

  const handleCheckout = async () => {
    if (!clientInfo.name) {
      toast({
        title: 'Client Name Required',
        description: 'Please enter the client name.',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Cart is Empty',
        description: 'Add at least one item before completing the sale.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // If converting from quotation, use the convertToInvoice function
      if (fromQuotation) {
        const invoice = convertToInvoice(fromQuotation, paymentMode);
        toast({
          title: 'Sale Complete!',
          description: `Invoice ${invoice.invoiceNumber} created from quotation. Inventory updated.`,
        });
      } else if (fromRepair) {
        const invoice = convertRepairToInvoice(fromRepair, paymentMode);
        toast({
          title: 'Repair Payment Complete!',
          description: `Invoice ${invoice.invoiceNumber} created for repair completion.`,
        });
      } else {
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
          description: `Invoice ${invoice.invoiceNumber} has been created. Inventory updated.`,
        });
      }

      setItems([]);
      setClientInfo({ name: '', email: '', phone: '', address: '' });
      setShowCheckout(false);
      setFromQuotation(null);
      setFromRepair(null);
    } catch (error) {
      console.error('Checkout failed:', error);
      toast({
        title: 'Checkout Failed',
        description: 'An error occurred while processing the sale. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
        <span className="font-medium">NPR {invoice.grandTotal.toLocaleString()}</span>
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
          {/* Quotation Banner */}
          {fromQuotation && (
            <Card className="mb-6 border-primary bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Converting from Quotation</p>
                    <p className="text-sm text-muted-foreground">
                      This sale will mark the quotation as converted and update inventory
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setFromQuotation(null);
                      setItems([]);
                      setClientInfo({ name: '', email: '', phone: '', address: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Repair Banner */}
          {fromRepair && (
            <Card className="mb-6 border-primary bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Converting from Repair Job</p>
                    <p className="text-sm text-muted-foreground">
                      This sale will complete the repair job and update inventory
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setFromRepair(null);
                      setItems([]);
                      setClientInfo({ name: '', email: '', phone: '', address: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                  {/* Product Search Panel */}
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
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Label htmlFor="pos-product-filter" className="shrink-0 text-sm">Category</Label>
                        <Select value={productFilter} onValueChange={(value: ProductFilter) => setProductFilter(value)}>
                          <SelectTrigger id="pos-product-filter" className="sm:max-w-xs">
                            <SelectValue placeholder="Filter products" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="software">S/W — All Software</SelectItem>
                            <SelectItem value="hardware">H/W — All Hardware</SelectItem>
                            <SelectItem value="chargers">H/W — Chargers</SelectItem>
                            <SelectItem value="covers">H/W — Covers</SelectItem>
                            <SelectItem value="laptops">H/W — Laptops</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {filteredProducts.slice(0, 15).map(product => {
                          const stock = getStock(product);
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
                                <span className="font-bold text-primary">NPR {product.sellingPrice.toLocaleString()}</span>
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
                      {items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const stock = product ? getStock(product) : 0;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.productCode}
                                <span className="ml-2 text-muted-foreground/70">
                                  ({stock} in stock)
                                </span>
                              </p>
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
                                  disabled={item.quantity >= stock}
                                  onClick={() => {
                                    if (item.quantity >= stock) {
                                      toast({
                                        title: 'Stock Limit Reached',
                                        description: `Only ${stock} unit${stock !== 1 ? 's' : ''} of "${item.productName}" available.`,
                                        variant: 'destructive',
                                      });
                                      return;
                                    }
                                    updateItem(item.id, { quantity: item.quantity + 1 });
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                              <span className="w-28 text-right font-medium">NPR {item.lineTotal.toFixed(0)}</span>
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
                        );
                      })}
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
                    <span>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (VAT 13%)</span>
                    <span>NPR {totalTax.toFixed(0)}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">NPR {grandTotal.toFixed(0)}</span>
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
                    type="button"
                    className="w-full mt-4"
                    size="lg"
                    disabled={items.length === 0 || isLoading}
                    onClick={handleCheckout}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Sale'
                    )}
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
