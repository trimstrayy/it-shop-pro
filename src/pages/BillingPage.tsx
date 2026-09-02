import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
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
import { Search, Plus, Trash2, Receipt, CreditCard, Banknote, Building, FileText, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Product, HardwareProduct, SoftwareProduct, InvoiceItem, Invoice, PaymentMode } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

type ProductFilter = 'all' | 'software' | 'hardware' | 'chargers' | 'covers' | 'laptops';
type InvoiceSortKey = 'clientName' | 'createdAt' | 'grandTotal';
type SortDirection = 'asc' | 'desc';
type InvoiceFilterStatus = 'all' | Invoice['status'];
type InvoiceFilterPayment = 'all' | Invoice['paymentMode'];

const BillingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quotationId = searchParams.get('quotation');
  const repairId = searchParams.get('repair');

  const { products, invoices, addInvoice, quotations, convertToInvoice, repairJobs, convertRepairToInvoice, customers } = useData();
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [fromQuotation, setFromQuotation] = useState<string | null>(null);
  const [fromRepair, setFromRepair] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState<InvoiceFilterPayment>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<InvoiceFilterStatus>('all');
  const [invoiceDateFrom, setInvoiceDateFrom] = useState('');
  const [invoiceDateTo, setInvoiceDateTo] = useState('');
  const [invoiceSortKey, setInvoiceSortKey] = useState<InvoiceSortKey>('createdAt');
  const [invoiceSortDirection, setInvoiceSortDirection] = useState<SortDirection>('desc');

  const resetPos = () => {
    setItems([]);
    setClientInfo({ name: '', email: '', phone: '', address: '' });
    setPaymentMode('cash');
    setSelectedCustomerId(null);
    setAmountPaid(0);
    setFromQuotation(null);
    setFromRepair(null);
    setShowProductSearch(false);
    setSearchTerm('');
    setSavedInvoice(null);
  };

  const handlePromptClose = () => {
    setShowPrintPrompt(false);
    setSavedInvoice(null);
  };

  const handleSkipPrint = () => {
    handlePromptClose();
    resetPos();
  };

  const handlePrintReceipt = () => {
    if (!savedInvoice) return;

    setShowPrintPrompt(false);
    navigate(`/billing/invoices/${savedInvoice.id}?autoprint=1&returnTo=/billing`);
  };

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
  const normalizedAmountPaid = paymentMode === 'credit' ? Math.min(Math.max(amountPaid, 0), grandTotal) : grandTotal;
  const amountDue = Math.max(0, grandTotal - normalizedAmountPaid);

  useEffect(() => {
    if (paymentMode !== 'credit') {
      setAmountPaid(0);
      return;
    }
    setAmountPaid(prev => Math.min(Math.max(prev, 0), grandTotal));
  }, [paymentMode, grandTotal]);

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

    if (paymentMode === 'credit' && !selectedCustomerId) {
      toast({
        title: 'Customer required for credit sales',
        description: 'Select a customer before completing a credit sale.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let invoice: Invoice;
      const creditPaidAmount = paymentMode === 'credit' ? normalizedAmountPaid : grandTotal;
      const invoiceStatus = paymentMode === 'credit'
        ? (creditPaidAmount >= grandTotal ? 'paid' : creditPaidAmount > 0 ? 'partial' : 'pending')
        : 'paid';

      if (fromQuotation) {
        invoice = convertToInvoice(fromQuotation, paymentMode, normalizedAmountPaid);
      } else if (fromRepair) {
        invoice = convertRepairToInvoice(fromRepair, paymentMode, normalizedAmountPaid);
      } else {
        invoice = addInvoice({
          customerId: selectedCustomerId,
          clientName: clientInfo.name,
          clientEmail: clientInfo.email,
          clientPhone: clientInfo.phone,
          clientAddress: clientInfo.address,
          items,
          subtotal,
          totalDiscount,
          totalTax,
          grandTotal,
          amountPaid: creditPaidAmount,
          amountDue: Math.max(0, grandTotal - creditPaidAmount),
          paymentMode,
          status: invoiceStatus,
          createdBy: user?.id || '',
          paidAt: invoiceStatus === 'paid' ? new Date() : undefined,
        });
      }

      setSavedInvoice(invoice);
      setShowPrintPrompt(true);

      if (paymentMode === 'credit' && invoice.amountDue > 0 && invoice.clientPhone) {
        void supabase.functions.invoke('send-sms', {
          body: {
            invoiceId: invoice.id,
            recipient: invoice.clientPhone,
            message: `Thank you for your purchase of NPR ${invoice.grandTotal.toFixed(2)}. Outstanding balance: NPR ${invoice.amountDue.toFixed(2)}. - ${import.meta.env.VITE_APP_NAME || 'IT Gadget'}`,
          },
        }).then(({ error }) => {
          if (error) toast({ title: 'Sale saved, SMS failed', description: error.message, variant: 'destructive' });
        });
      }

      toast({
        title: 'Sale Complete!',
        description: `Invoice ${invoice.invoiceNumber} has been saved successfully.`,
      });
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

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = invoiceSearchTerm.trim().toLowerCase();

    const matchesFilters = (invoice: Invoice) => {
      const matchesSearch = !normalizedSearch || [
        invoice.invoiceNumber,
        invoice.clientName,
        invoice.clientEmail,
        invoice.clientPhone,
      ].some(value => value.toLowerCase().includes(normalizedSearch));

      const matchesPayment = invoicePaymentFilter === 'all' || invoice.paymentMode === invoicePaymentFilter;
      const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter;
      const invoiceDate = new Date(invoice.createdAt);
      const matchesFromDate = !invoiceDateFrom || invoiceDate >= new Date(`${invoiceDateFrom}T00:00:00`);
      const matchesToDate = !invoiceDateTo || invoiceDate <= new Date(`${invoiceDateTo}T23:59:59.999`);

      return matchesSearch && matchesPayment && matchesStatus && matchesFromDate && matchesToDate;
    };

    const sortedInvoices = [...invoices.filter(matchesFilters)].sort((left, right) => {
      const direction = invoiceSortDirection === 'asc' ? 1 : -1;

      if (invoiceSortKey === 'clientName') {
        return left.clientName.localeCompare(right.clientName) * direction;
      }

      if (invoiceSortKey === 'grandTotal') {
        return (left.grandTotal - right.grandTotal) * direction;
      }

      return (new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()) * direction;
    });

    return sortedInvoices;
  }, [invoiceDateFrom, invoiceDateTo, invoicePaymentFilter, invoiceSearchTerm, invoiceSortDirection, invoiceSortKey, invoiceStatusFilter, invoices]);

  const hasActiveInvoiceFilters = Boolean(
    invoiceSearchTerm ||
    invoicePaymentFilter !== 'all' ||
    invoiceStatusFilter !== 'all' ||
    invoiceDateFrom ||
    invoiceDateTo
  );

  const clearInvoiceFilters = () => {
    setInvoiceSearchTerm('');
    setInvoicePaymentFilter('all');
    setInvoiceStatusFilter('all');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    setInvoiceSortKey('createdAt');
    setInvoiceSortDirection('desc');
  };

  const toggleInvoiceSort = (key: InvoiceSortKey) => {
    if (invoiceSortKey === key) {
      setInvoiceSortDirection(current => current === 'asc' ? 'desc' : 'asc');
      return;
    }

    setInvoiceSortKey(key);
    setInvoiceSortDirection(key === 'createdAt' ? 'desc' : 'asc');
  };

  const renderSortIcon = (key: InvoiceSortKey) => {
    if (invoiceSortKey !== key) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }

    return invoiceSortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  const handleInvoiceRowClick = (invoiceId: string) => {
    navigate(`/billing/invoices/${invoiceId}`);
  };

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
                    <div className="grid grid-cols-4 gap-2 mt-2">
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
                      <Button
                        type="button"
                        variant={paymentMode === 'credit' ? 'default' : 'outline'}
                        onClick={() => setPaymentMode('credit')}
                        className="flex-col gap-1 h-auto py-3"
                      >
                        <Receipt className="w-5 h-5" />
                        <span className="text-xs">Credit</span>
                      </Button>
                    </div>
                  </div>

                  {paymentMode === 'credit' && (
                    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="space-y-2">
                        <Label htmlFor="credit-customer-select">Customer</Label>
                        <Select value={selectedCustomerId ?? 'none'} onValueChange={(value) => setSelectedCustomerId(value === 'none' ? null : value)}>
                          <SelectTrigger id="credit-customer-select">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select a customer</SelectItem>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!selectedCustomerId && (
                          <p className="text-xs text-destructive">Credit sales require a customer to be selected.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Label htmlFor="credit-amount-paid">Amount paid now</Label>
                          <span className="text-muted-foreground">Up to NPR {grandTotal.toLocaleString()}</span>
                        </div>
                        <Input
                          id="credit-amount-paid"
                          type="number"
                          min={0}
                          max={grandTotal}
                          step="0.01"
                          value={amountPaid}
                          onChange={(event) => setAmountPaid(Number(event.target.value || 0))}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Amount due</span>
                          <span className="font-semibold text-primary">NPR {amountDue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

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
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                {hasActiveInvoiceFilters && (
                  <Button variant="ghost" size="sm" onClick={clearInvoiceFilters} className="self-start lg:self-auto">
                    <X className="mr-2 h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-1.5 xl:col-span-2">
                  <Label htmlFor="invoice-search" className="text-xs uppercase tracking-wide text-muted-foreground">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invoice-search"
                      value={invoiceSearchTerm}
                      onChange={(event) => setInvoiceSearchTerm(event.target.value)}
                      placeholder="Search invoice, client, email, or phone..."
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-filter" className="text-xs uppercase tracking-wide text-muted-foreground">Payment</Label>
                  <Select value={invoicePaymentFilter} onValueChange={(value: InvoiceFilterPayment) => setInvoicePaymentFilter(value)}>
                    <SelectTrigger id="payment-filter">
                      <SelectValue placeholder="All payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All payments</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="online">Card / Online</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status-filter" className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select value={invoiceStatusFilter} onValueChange={(value: InvoiceFilterStatus) => setInvoiceStatusFilter(value)}>
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date-from" className="text-xs uppercase tracking-wide text-muted-foreground">From</Label>
                  <Input id="date-from" type="date" value={invoiceDateFrom} onChange={(event) => setInvoiceDateFrom(event.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date-to" className="text-xs uppercase tracking-wide text-muted-foreground">To</Label>
                  <Input id="date-to" type="date" value={invoiceDateTo} onChange={(event) => setInvoiceDateTo(event.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Invoice #</th>
                        <th className="px-4 py-3 font-medium">
                          <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleInvoiceSort('clientName')}>
                            Client
                            {renderSortIcon('clientName')}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleInvoiceSort('grandTotal')}>
                            Total
                            {renderSortIcon('grandTotal')}
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">Payment</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">
                          <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleInvoiceSort('createdAt')}>
                            Date
                            {renderSortIcon('createdAt')}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                            {hasActiveInvoiceFilters ? 'No invoices match your filters.' : 'No invoices found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr
                            key={invoice.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleInvoiceRowClick(invoice.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleInvoiceRowClick(invoice.id);
                              }
                            }}
                            className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none"
                          >
                            <td className="px-4 py-3">
                              <Link
                                to={`/billing/invoices/${invoice.id}`}
                                className="font-mono text-sm font-medium text-primary hover:underline"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {invoice.invoiceNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3 font-medium">{invoice.clientName}</td>
                            <td className="px-4 py-3 font-medium">NPR {invoice.grandTotal.toLocaleString()}</td>
                            <td className="px-4 py-3"><StatusBadge status={invoice.paymentMode} variant="info" /></td>
                            <td className="px-4 py-3"><StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} /></td>
                            <td className="px-4 py-3 text-muted-foreground">{format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPrintPrompt} onOpenChange={(open) => {
        if (!open) {
          handlePromptClose();
        }
        setShowPrintPrompt(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale completed. Print receipt for the customer?</DialogTitle>
            <DialogDescription>
              Choose whether to open the saved receipt for printing or finish without printing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleSkipPrint}>Skip</Button>
            <Button onClick={handlePrintReceipt} disabled={!savedInvoice}>Print Receipt</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default BillingPage;
