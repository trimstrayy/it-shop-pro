import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { QuotationItem, Product, HardwareProduct, SoftwareProduct } from '@/types';
import { toast } from '@/hooks/use-toast';

const QuotationFormPage = () => {
  const navigate = useNavigate();
  const { products, addQuotation } = useData();
  const { user } = useAuth();

  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
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
    const existingItem = items.find(i => i.productId === product.id);
    
    if (existingItem) {
      setItems(items.map(i => 
        i.productId === product.id 
          ? { ...i, quantity: i.quantity + 1, lineTotal: calculateLineTotal(i.quantity + 1, i.unitPrice, i.taxPercent, i.discount) }
          : i
      ));
    } else {
      const newItem: QuotationItem = {
        id: `qti-${Date.now()}`,
        productId: product.id,
        productCode: product.productCode,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        taxPercent: product.taxPercent,
        discount: 0,
        lineTotal: calculateLineTotal(1, product.sellingPrice, product.taxPercent, 0),
      };
      setItems([...items, newItem]);
    }
    
    setSearchTerm('');
    setShowProductSearch(false);
  };

  const calculateLineTotal = (quantity: number, unitPrice: number, taxPercent: number, discount: number) => {
    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    return taxableAmount + taxAmount;
  };

  const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientInfo.name || !clientInfo.email || items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in client details and add at least one item.',
        variant: 'destructive',
      });
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quotation = addQuotation({
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientAddress: clientInfo.address,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      status: 'draft',
      validUntil,
      notes,
      createdBy: user?.id || '',
    });

    toast({
      title: 'Quotation Created',
      description: `Quotation ${quotation.quotationNumber} has been created.`,
    });
    navigate('/quotations');
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Create Quotation"
        description="Build a new quotation for your customer"
        actions={
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotations
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    placeholder="Company or individual name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    placeholder="client@company.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    placeholder="+1 555-0123"
                  />
                </div>
                <div>
                  <Label htmlFor="validDays">Valid For (days)</Label>
                  <Input
                    id="validDays"
                    type="number"
                    min="1"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quotation Items</CardTitle>
                <div className="relative">
                  <Button 
                    type="button"
                    onClick={() => setShowProductSearch(!showProductSearch)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Product Search */}
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
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredProducts.slice(0, 10).map(product => {
                        const stock = product.type === 'hardware' 
                          ? (product as HardwareProduct).stockQuantity
                          : (product as SoftwareProduct).licenseQuantity;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addItem(product)}
                            className="w-full flex items-center justify-between p-2 hover:bg-background rounded transition-colors text-left"
                          >
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.productCode} • {stock} available</p>
                            </div>
                            <span className="font-medium">${product.sellingPrice}</span>
                          </button>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No products found</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                {items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No items added. Click "Add Product" to start.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-medium">Product</th>
                          <th className="py-2 text-center font-medium w-20">Qty</th>
                          <th className="py-2 text-right font-medium w-24">Price</th>
                          <th className="py-2 text-center font-medium w-20">Disc %</th>
                          <th className="py-2 text-center font-medium w-16">Tax %</th>
                          <th className="py-2 text-right font-medium w-28">Total</th>
                          <th className="py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="py-3">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">{item.productCode}</p>
                            </td>
                            <td className="py-3">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-16 text-center h-8"
                              />
                            </td>
                            <td className="py-3 text-right">${item.unitPrice.toLocaleString()}</td>
                            <td className="py-3">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                                className="w-16 text-center h-8"
                              />
                            </td>
                            <td className="py-3 text-center">{item.taxPercent}%</td>
                            <td className="py-3 text-right font-medium">${item.lineTotal.toFixed(2)}</td>
                            <td className="py-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes or terms..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Quotation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-destructive">-${totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${totalTax.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Grand Total</span>
                    <span className="text-xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full" disabled={items.length === 0}>
                    Create Quotation
                  </Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/quotations')}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AppLayout>
  );
};

export default QuotationFormPage;
