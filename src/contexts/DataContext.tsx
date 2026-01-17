import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Product, 
  Quotation, 
  Invoice, 
  Delivery,
  DeliveryStage,
  DeliveryTrackingEvent,
  DeliveryPerson,
  InventoryLog,
  InvoiceItem
} from '@/types';
import { 
  mockProducts, 
  mockQuotations, 
  mockInvoices, 
  mockDeliveries, 
  mockInventoryLogs,
  generateProductCode,
  generateBarcode,
  generateQuotationNumber,
  generateInvoiceNumber
} from '@/data/mockData';

interface DataContextType {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'productCode' | 'barcode' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  archiveProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getProductByCode: (code: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;

  // Inventory
  inventoryLogs: InventoryLog[];
  updateInventory: (productId: string, change: number, reason: InventoryLog['reason'], userId: string, userName: string, notes?: string) => void;

  // Quotations
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  convertToInvoice: (quotationId: string, paymentMode: Invoice['paymentMode']) => Invoice;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  cancelInvoice: (id: string) => void;

  // Deliveries
  deliveries: Delivery[];
  updateDeliveryStage: (id: string, stage: DeliveryStage, updatedBy: string, notes?: string, location?: string) => void;
  assignDeliveryPerson: (id: string, deliveryPerson: DeliveryPerson) => void;
  markDeliveryReturned: (id: string, updatedBy: string, notes?: string) => void;
  getDelivery: (id: string) => Delivery | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>(mockInventoryLogs);
  const [quotations, setQuotations] = useState<Quotation[]>(mockQuotations);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);

  // Product functions
  const addProduct = (productData: Omit<Product, 'id' | 'productCode' | 'barcode' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date();
    const newProduct: Product = {
      ...productData,
      id: `product-${Date.now()}`,
      productCode: generateProductCode(productData.type, productData.category),
      barcode: generateBarcode(),
      createdAt: now,
      updatedAt: now,
    } as Product;
    
    setProducts(prev => [...prev, newProduct] as Product[]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } as Product : p
    ));
  };

  const archiveProduct = (id: string) => {
    updateProduct(id, { status: 'inactive' });
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getProductByCode = (code: string) => products.find(p => p.productCode === code);
  const getProductByBarcode = (barcode: string) => products.find(p => p.barcode === barcode);

  // Inventory functions
  const updateInventory = (
    productId: string, 
    change: number, 
    reason: InventoryLog['reason'], 
    userId: string, 
    userName: string, 
    notes?: string
  ) => {
    const product = getProduct(productId);
    if (!product) return;

    // Update product stock
    if (product.type === 'hardware') {
      updateProduct(productId, { stockQuantity: (product as any).stockQuantity + change });
    } else {
      updateProduct(productId, { licenseQuantity: (product as any).licenseQuantity + change });
    }

    // Add log entry
    const log: InventoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productCode: product.productCode,
      productName: product.name,
      change,
      reason,
      userId,
      userName,
      timestamp: new Date(),
      notes,
    };
    setInventoryLogs(prev => [log, ...prev]);
  };

  // Quotation functions
  const addQuotation = (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Quotation => {
    const now = new Date();
    const newQuotation: Quotation = {
      ...quotationData,
      id: `qt-${Date.now()}`,
      quotationNumber: generateQuotationNumber(),
      createdAt: now,
      updatedAt: now,
    };
    
    setQuotations(prev => [...prev, newQuotation]);
    return newQuotation;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q
    ));
  };

  const convertToInvoice = (quotationId: string, paymentMode: Invoice['paymentMode']): Invoice => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found');

    const invoiceItems: InvoiceItem[] = quotation.items.map(item => {
      const product = getProduct(item.productId);
      return {
        ...item,
        costPrice: product?.costPrice || 0,
      };
    });

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      quotationId,
      clientName: quotation.clientName,
      clientEmail: quotation.clientEmail,
      clientPhone: quotation.clientPhone,
      clientAddress: quotation.clientAddress,
      items: invoiceItems,
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTax: quotation.totalTax,
      grandTotal: quotation.grandTotal,
      paymentMode,
      status: 'pending',
      createdBy: quotation.createdBy,
      createdAt: new Date(),
    };

    setInvoices(prev => [...prev, newInvoice]);
    updateQuotation(quotationId, { status: 'converted' });

    return newInvoice;
  };

  // Invoice functions
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date(),
    };
    
    setInvoices(prev => [...prev, newInvoice]);

    // Update inventory for each item
    invoiceData.items.forEach(item => {
      updateInventory(
        item.productId,
        -item.quantity,
        'sale',
        invoiceData.createdBy,
        'System',
        `Invoice ${newInvoice.invoiceNumber}`
      );
    });

    // Create delivery records
    const invoice = invoices.find(i => i.id === newInvoice.id) || newInvoice;
    invoiceData.items.forEach(item => {
      const now = new Date();
      const delivery: Delivery = {
        id: `del-${Date.now()}-${item.id}`,
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        currentStage: 'in_inventory',
        status: 'pending',
        deliveryAddress: invoiceData.clientAddress,
        recipientName: invoiceData.clientName,
        recipientPhone: invoiceData.clientPhone,
        createdAt: now,
        trackingHistory: [
          {
            id: `th-${Date.now()}`,
            stage: 'in_inventory',
            timestamp: now,
            updatedBy: 'System',
            notes: 'Order created, ready for dispatch',
          },
        ],
      };
      setDeliveries(prev => [...prev, delivery]);
    });

    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates } : i
    ));
  };

  const cancelInvoice = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return;

    // Restore inventory
    invoice.items.forEach(item => {
      updateInventory(
        item.productId,
        item.quantity,
        'return',
        invoice.createdBy,
        'System',
        `Invoice ${invoice.invoiceNumber} cancelled`
      );
    });

    updateInvoice(id, { status: 'cancelled' });
  };

  // Delivery functions
  const getDelivery = (id: string) => deliveries.find(d => d.id === id);

  const getDeliveryStatusFromStage = (stage: DeliveryStage): Delivery['status'] => {
    if (stage === 'in_inventory') return 'pending';
    if (stage === 'returned') return 'returned';
    if (stage === 'collected_by_receiver') return 'completed';
    return 'in_progress';
  };

  const updateDeliveryStage = (
    id: string, 
    stage: DeliveryStage, 
    updatedBy: string, 
    notes?: string, 
    location?: string
  ) => {
    const now = new Date();
    const newTrackingEvent: DeliveryTrackingEvent = {
      id: `th-${Date.now()}`,
      stage,
      timestamp: now,
      updatedBy,
      notes,
      location,
    };

    setDeliveries(prev => prev.map(d => {
      if (d.id !== id) return d;
      
      const newStatus = getDeliveryStatusFromStage(stage);
      const updates: Partial<Delivery> = {
        currentStage: stage,
        status: newStatus,
        trackingHistory: [...d.trackingHistory, newTrackingEvent],
      };

      if (stage === 'collected_by_receiver') {
        updates.actualDeliveryDate = now;
      }

      return { ...d, ...updates };
    }));
  };

  const assignDeliveryPerson = (id: string, deliveryPerson: DeliveryPerson) => {
    setDeliveries(prev => prev.map(d => 
      d.id === id ? { ...d, deliveryPerson } : d
    ));
  };

  const markDeliveryReturned = (id: string, updatedBy: string, notes?: string) => {
    updateDeliveryStage(id, 'returned', updatedBy, notes || 'Item returned to inventory');
  };

  return (
    <DataContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      archiveProduct,
      getProduct,
      getProductByCode,
      getProductByBarcode,
      inventoryLogs,
      updateInventory,
      quotations,
      addQuotation,
      updateQuotation,
      convertToInvoice,
      invoices,
      addInvoice,
      updateInvoice,
      cancelInvoice,
      deliveries,
      updateDeliveryStage,
      assignDeliveryPerson,
      markDeliveryReturned,
      getDelivery,
    }}>
      {children}
    </DataContext.Provider>
  );
};
