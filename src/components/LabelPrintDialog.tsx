import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Printer, Package } from 'lucide-react';
import { Product, HardwareProduct, SoftwareProduct } from '@/types';

interface LabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

export const LabelPrintDialog = ({ open, onOpenChange, products }: LabelPrintDialogProps) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const toggleProduct = (product: Product) => {
    const exists = selectedProducts.find(sp => sp.product.id === product.id);
    if (exists) {
      setSelectedProducts(prev => prev.filter(sp => sp.product.id !== product.id));
    } else {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => prev.map(sp => 
      sp.product.id === productId ? { ...sp, quantity: Math.max(1, quantity) } : sp
    ));
  };

  const isSelected = (productId: string) => {
    return selectedProducts.some(sp => sp.product.id === productId);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Product Labels</title>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
            }
            .labels-container {
              display: flex;
              flex-wrap: wrap;
              gap: 2mm;
              padding: 5mm;
            }
            .label {
              width: 50mm;
              height: 30mm;
              border: 1px dashed #ccc;
              padding: 2mm;
              box-sizing: border-box;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .label-header {
              text-align: center;
              font-size: 6pt;
              font-weight: bold;
              color: #0f766e;
              border-bottom: 1px solid #0f766e;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
            }
            .product-name {
              font-size: 7pt;
              font-weight: bold;
              text-align: center;
              line-height: 1.2;
              margin-bottom: 1mm;
            }
            .product-code {
              font-size: 6pt;
              text-align: center;
              color: #666;
            }
            .barcode {
              text-align: center;
              font-family: 'Libre Barcode 128', 'Libre Barcode 39', monospace;
              font-size: 24pt;
              letter-spacing: 2px;
              margin: 1mm 0;
            }
            .barcode-number {
              font-size: 6pt;
              text-align: center;
              font-family: monospace;
              letter-spacing: 1px;
            }
            .price {
              font-size: 9pt;
              font-weight: bold;
              text-align: center;
              color: #0f766e;
              margin-top: 1mm;
            }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
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

  const generateBarcodeDisplay = (barcode: string) => {
    // Simple barcode representation using characters
    return '*' + barcode + '*';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Product Labels
          </DialogTitle>
          <DialogDescription>
            Select products and quantity of labels to print on sticky paper
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Selection */}
          <div>
            <h4 className="font-medium mb-3">Select Products</h4>
            <ScrollArea className="h-[400px] border rounded-lg p-3">
              <div className="space-y-2">
                {products.filter(p => p.status === 'active').map(product => {
                  const stock = product.type === 'hardware' 
                    ? (product as HardwareProduct).stockQuantity
                    : (product as SoftwareProduct).licenseQuantity;
                  const selected = isSelected(product.id);
                  const selectedProduct = selectedProducts.find(sp => sp.product.id === product.id);

                  return (
                    <div 
                      key={product.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleProduct(product)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.productCode} • NPR {product.sellingPrice.toLocaleString()}
                        </p>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Labels:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={selectedProduct?.quantity || 1}
                            onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Label Preview */}
          <div>
            <h4 className="font-medium mb-3">Label Preview</h4>
            <div className="border rounded-lg p-4 bg-muted/30 min-h-[400px]">
              {selectedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Package className="w-12 h-12 mb-2 opacity-50" />
                  <p>Select products to preview labels</p>
                </div>
              ) : (
                <ScrollArea className="h-[360px]">
                  <div ref={printRef} className="labels-container space-y-4">
                    {selectedProducts.map(({ product, quantity }) => (
                      Array.from({ length: Math.min(quantity, 5) }).map((_, idx) => (
                        <div 
                          key={`${product.id}-${idx}`}
                          className="label bg-white border-2 border-dashed border-gray-300 rounded p-3"
                          style={{ width: '200px', height: '120px' }}
                        >
                          <div className="label-header text-xs font-bold text-teal-700 border-b border-teal-700 pb-1 mb-1 text-center">
                            IT GADGET HUB
                          </div>
                          <div className="product-name text-xs font-bold text-center leading-tight line-clamp-2">
                            {product.name}
                          </div>
                          <div className="product-code text-[10px] text-center text-gray-500">
                            {product.productCode}
                          </div>
                          <div className="barcode text-center font-mono text-lg tracking-wider my-1">
                            {generateBarcodeDisplay(product.barcode)}
                          </div>
                          <div className="barcode-number text-[9px] text-center font-mono">
                            {product.barcode}
                          </div>
                          <div className="price text-sm font-bold text-center text-teal-700">
                            NPR {product.sellingPrice.toLocaleString()}
                          </div>
                        </div>
                      ))
                    ))}
                    {selectedProducts.some(sp => sp.quantity > 5) && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        (Preview shows max 5 labels per product. All selected labels will be printed.)
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedProducts.length} product(s) selected, {selectedProducts.reduce((sum, sp) => sum + sp.quantity, 0)} label(s) total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint} disabled={selectedProducts.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Print Labels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
