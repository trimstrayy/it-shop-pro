import { useState, useRef } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Search, Printer, Download, FileText } from 'lucide-react';
import { QuotationItem, Product, HardwareProduct, SoftwareProduct } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Company Information
const COMPANY_INFO = {
  name: 'IT Gadget Hub',
  address: 'Banepa',
  zipCode: '45210',
  phone: '9741740000',
  email: 'ayush11dahal@gmail.com',
};

const QuotationFormPage = () => {
  const navigate = useNavigate();
  const { products, addQuotation, quotations } = useData();
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);

  // Auto-generate quotation number
  const nextQuotationNumber = `QT-${String(quotations.length + 1).padStart(4, '0')}`;

  const [clientInfo, setClientInfo] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
  });

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [notes, setNotes] = useState('Payment Terms:\n• 50% advance payment required\n• Balance due upon delivery\n• Prices valid for 15 days from quotation date');
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

  const validUntilDate = new Date();
  validUntilDate.setDate(validUntilDate.getDate() + validDays);

  const handlePrint = () => {
    const printContent = previewRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Quotation ${nextQuotationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; }
            .quotation-preview { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-logo { width: 60px; height: 60px; background: #0f766e; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .title { color: #0f766e; font-size: 24px; font-weight: bold; text-align: right; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .info-section h4 { color: #0f766e; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; }
            .info-section p { margin: 4px 0; font-size: 14px; }
            .quote-number { background: #f0fdfa; padding: 15px; margin-bottom: 30px; border-left: 4px solid #0f766e; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #0f766e; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .totals-row.grand { background: #0f766e; color: white; padding: 12px; font-weight: bold; }
            .notes { background: #f9fafb; padding: 20px; margin-top: 30px; }
            .notes h4 { margin-bottom: 10px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid #000; width: 200px; padding-top: 5px; text-align: center; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

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

    const quotation = addQuotation({
      clientName: clientInfo.name,
      clientEmail: clientInfo.email,
      clientPhone: clientInfo.phone,
      clientAddress: `${clientInfo.address}${clientInfo.zipCode ? ', ' + clientInfo.zipCode : ''}`,
      items,
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal,
      status: 'draft',
      validUntil: validUntilDate,
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
        title="Sales Quotation Builder"
        description="Create a professional quotation with live preview"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint} disabled={items.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Print Preview
            </Button>
            <Button variant="outline" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Side - Form */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Client Information (To)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="clientName">Client / Company Name *</Label>
                  <Input
                    id="clientName"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    placeholder="Client or company name"
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
                  <Label htmlFor="clientPhone">Contact Number</Label>
                  <Input
                    id="clientPhone"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    placeholder="9800000000"
                  />
                </div>
                <div>
                  <Label htmlFor="clientZip">ZIP Code</Label>
                  <Input
                    id="clientZip"
                    value={clientInfo.zipCode}
                    onChange={(e) => setClientInfo({ ...clientInfo, zipCode: e.target.value })}
                    placeholder="45210"
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
                <div>
                  <Label htmlFor="validDays">Quotation Valid For (days)</Label>
                  <Input
                    id="validDays"
                    type="number"
                    min="1"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Quotation Items</CardTitle>
                <Button 
                  type="button"
                  onClick={() => setShowProductSearch(!showProductSearch)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
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
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredProducts.map(product => {
                        const stock = product.type === 'hardware' 
                          ? (product as HardwareProduct).stockQuantity
                          : (product as SoftwareProduct).licenseQuantity;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addItem(product)}
                            className="w-full flex items-center justify-between p-3 hover:bg-background rounded-lg transition-colors text-left border border-transparent hover:border-border"
                          >
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.productCode} • {product.type} • {stock} available</p>
                            </div>
                            <span className="font-semibold text-primary">Rs. {product.sellingPrice.toLocaleString()}</span>
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
                    No items added. Click "Add Product" to start building your quotation.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2 text-left font-medium">Product</th>
                          <th className="py-2 text-center font-medium w-20">Qty</th>
                          <th className="py-2 text-right font-medium w-28">Unit Price</th>
                          <th className="py-2 text-center font-medium w-20">Disc %</th>
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
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                                >
                                  +
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
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
                            <td className="py-3 text-right font-medium">Rs. {item.lineTotal.toFixed(2)}</td>
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
                  <Label htmlFor="notes">Terms & Conditions</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment terms, delivery terms, etc."
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="mt-6 flex gap-3">
                  <Button type="submit" className="flex-1" disabled={items.length === 0}>
                    Create Quotation
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="space-y-4">
            <Card className="sticky top-6">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg">Live Quotation Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  ref={previewRef}
                  className="quotation-preview bg-white text-slate-900 p-8 min-h-[600px]"
                  style={{ fontSize: '14px' }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-teal-700 rounded flex items-center justify-center text-white font-bold text-lg">
                        ITG
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-teal-700">{COMPANY_INFO.name}</h2>
                        <p className="text-gray-600 text-sm">Your IT Solutions Partner</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-bold text-teal-700">SALES QUOTATION</h1>
                      <p className="text-gray-500 text-sm mt-1">Professional Quote</p>
                    </div>
                  </div>

                  {/* From / To Section */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-xs font-semibold text-teal-700 uppercase mb-2 tracking-wider">From</h4>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{COMPANY_INFO.name}</p>
                        <p>{COMPANY_INFO.address}</p>
                        <p>ZIP: {COMPANY_INFO.zipCode}</p>
                        <p>Phone: {COMPANY_INFO.phone}</p>
                        <p>Email: {COMPANY_INFO.email}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-teal-700 uppercase mb-2 tracking-wider">To</h4>
                      <div className="text-sm space-y-1">
                        <p className="font-semibold">{clientInfo.name || '(Client Name)'}</p>
                        <p>{clientInfo.address || '(Address)'}</p>
                        {clientInfo.zipCode && <p>ZIP: {clientInfo.zipCode}</p>}
                        <p>Phone: {clientInfo.phone || '(Contact Number)'}</p>
                        <p>Email: {clientInfo.email || '(Email Address)'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quote Number & Date */}
                  <div className="bg-teal-50 border-l-4 border-teal-700 p-4 mb-6">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Quote Number</span>
                        <p className="font-bold text-teal-700">{nextQuotationNumber}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-500 uppercase">Date</span>
                        <p className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 uppercase">Valid Until</span>
                        <p className="font-medium">{format(validUntilDate, 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-6">
                    <thead>
                      <tr className="bg-teal-700 text-white">
                        <th className="py-3 px-4 text-left text-xs uppercase tracking-wider">Product Description</th>
                        <th className="py-3 px-4 text-center text-xs uppercase tracking-wider w-16">Qty</th>
                        <th className="py-3 px-4 text-right text-xs uppercase tracking-wider w-28">Unit Price</th>
                        <th className="py-3 px-4 text-right text-xs uppercase tracking-wider w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                            Add products to see them here...
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="py-3 px-4">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-gray-500">{item.productCode}</p>
                            </td>
                            <td className="py-3 px-4 text-center">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-medium">Rs. {item.lineTotal.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-72">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Subtotal</span>
                        <span>Rs. {subtotal.toLocaleString()}</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600">Discount</span>
                          <span className="text-red-600">- Rs. {totalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600">Tax (VAT)</span>
                        <span>Rs. {totalTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-teal-700 text-white px-4 mt-2 font-bold">
                        <span>GRAND TOTAL</span>
                        <span>Rs. {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  {notes && (
                    <div className="bg-gray-50 p-4 rounded mb-8">
                      <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
                      <div className="text-sm text-gray-600 whitespace-pre-line">{notes}</div>
                    </div>
                  )}

                  {/* Footer / Signatures */}
                  <div className="flex justify-between mt-12 pt-8">
                    <div className="text-center">
                      <div className="w-48 border-t border-gray-400 pt-2">
                        <p className="text-sm text-gray-600">Authorized By</p>
                        <p className="text-xs text-gray-400 mt-1">{COMPANY_INFO.name}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-48 border-t border-gray-400 pt-2">
                        <p className="text-sm text-gray-600">Accepted By</p>
                        <p className="text-xs text-gray-400 mt-1">{clientInfo.name || 'Client'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-400">
                      © {new Date().getFullYear()} {COMPANY_INFO.name}. Thank you for your business!
                    </p>
                  </div>
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
