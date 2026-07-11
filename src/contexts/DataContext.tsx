import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Product, 
  Quotation, 
  Invoice, 
  Delivery,
  DeliveryStage,
  DeliveryTrackingEvent,
  DeliveryPerson,
  InventoryLog,
  InvoiceItem,
  HardwareProduct,
  SoftwareProduct,
  Customer,
  LaborRate,
  RepairJob,
  RepairJobUpdate,
  RepairJobPhoto,
  RepairJobPart,
  DeviceBrand,
  DeviceModel,
  DeviceColor
} from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { generateProductCode, generateBarcode, generateQuotationNumber, generateInvoiceNumber } from '@/lib/code-generators';

interface DataContextType {
  customers: Customer[];
  laborRates: LaborRate[];
  repairJobs: RepairJob[];
  brands: DeviceBrand[];
  models: DeviceModel[];
  colors: DeviceColor[];

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [repairJobs, setRepairJobs] = useState<RepairJob[]>([]);
  const [brands, setBrands] = useState<DeviceBrand[]>([]);
  const [models, setModels] = useState<DeviceModel[]>([]);
  const [colors, setColors] = useState<DeviceColor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [
        customersResult,
        brandsResult,
        modelsResult,
        colorsResult,
        laborRatesResult,
        productsResult,
        inventoryLogsResult,
        quotationsResult,
        quotationItemsResult,
        invoicesResult,
        invoiceItemsResult,
        deliveriesResult,
        deliveryPeopleResult,
        trackingEventsResult,
        repairJobsResult,
        repairPhotosResult,
        repairUpdatesResult,
        repairPartsResult,
      ] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('device_brands').select('*').order('name'),
        supabase.from('device_models').select('*').order('name'),
        supabase.from('device_colors').select('*').order('name'),
        supabase.from('labor_rates').select('*').order('service_name'),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory_logs').select('*').order('timestamp', { ascending: false }),
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        supabase.from('quotation_items').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('invoice_items').select('*').order('created_at', { ascending: false }),
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
        supabase.from('delivery_people').select('*'),
        supabase.from('delivery_tracking_events').select('*').order('timestamp', { ascending: false }),
        supabase.from('repair_jobs').select('*').order('created_at', { ascending: false }),
        supabase.from('repair_job_photos').select('*').order('created_at', { ascending: false }),
        supabase.from('repair_job_updates').select('*').order('logged_at', { ascending: false }),
        supabase.from('repair_job_parts').select('*').order('created_at', { ascending: false }),
      ]);

      if (customersResult.data) {
        setCustomers(customersResult.data.map(customer => ({
          id: customer.id,
          customerCode: customer.customer_code,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          lifetimeValue: Number(customer.lifetime_value ?? 0),
          notes: customer.notes,
          createdAt: new Date(customer.created_at),
          updatedAt: new Date(customer.updated_at),
        })));
      }

      if (brandsResult.data) {
        setBrands(brandsResult.data.map(brand => ({
          id: brand.id,
          name: brand.name,
          createdAt: new Date(brand.created_at),
          updatedAt: new Date(brand.updated_at),
        })));
      }

      if (modelsResult.data) {
        setModels(modelsResult.data.map(model => ({
          id: model.id,
          brandId: model.brand_id,
          name: model.name,
          createdAt: new Date(model.created_at),
          updatedAt: new Date(model.updated_at),
        })));
      }

      if (colorsResult.data) {
        setColors(colorsResult.data.map(color => ({
          id: color.id,
          name: color.name,
          createdAt: new Date(color.created_at),
          updatedAt: new Date(color.updated_at),
        })));
      }

      if (laborRatesResult.data) {
        setLaborRates(laborRatesResult.data.map(rate => ({
          id: rate.id,
          serviceName: rate.service_name,
          basePrice: Number(rate.base_price ?? 0),
          averageTimeRequiredMinutes: Number(rate.average_time_required_minutes ?? 0),
          description: rate.description,
          isActive: Boolean(rate.is_active),
          createdAt: new Date(rate.created_at),
          updatedAt: new Date(rate.updated_at),
        })));
      }

      if (productsResult.data) {
        setProducts(productsResult.data.map(product => product.type === 'hardware' ? ({
          id: product.id,
          productCode: product.product_code,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          type: 'hardware',
          costPrice: Number(product.cost_price ?? 0),
          sellingPrice: Number(product.selling_price ?? 0),
          taxPercent: Number(product.tax_percent ?? 0),
          status: product.status,
          description: product.description,
          stockQuantity: Number(product.stock_quantity ?? 0),
          supplier: product.supplier || '',
          warrantyPeriod: Number(product.warranty_period ?? 0),
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
        } as HardwareProduct) : ({
          id: product.id,
          productCode: product.product_code,
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          type: 'software',
          costPrice: Number(product.cost_price ?? 0),
          sellingPrice: Number(product.selling_price ?? 0),
          taxPercent: Number(product.tax_percent ?? 0),
          status: product.status,
          description: product.description,
          licenseType: product.license_type || 'single',
          licenseQuantity: Number(product.license_quantity ?? 0),
          expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
        } as SoftwareProduct)));
      }

      if (inventoryLogsResult.data) {
        setInventoryLogs(inventoryLogsResult.data.map(log => ({
          id: log.id,
          productId: log.product_id,
          productCode: log.product_code,
          productName: log.product_name,
          change: Number(log.change),
          reason: log.reason,
          userId: log.user_id || '',
          userName: log.user_name,
          timestamp: new Date(log.timestamp),
          notes: log.notes,
        })));
      }

      const quotationItemsByQuotationId = (quotationItemsResult.data || []).reduce<Record<string, any[]>>((acc, item) => {
        acc[item.quotation_id] = acc[item.quotation_id] || [];
        acc[item.quotation_id].push(item);
        return acc;
      }, {});

      if (quotationsResult.data) {
        setQuotations(quotationsResult.data.map(quotation => ({
          id: quotation.id,
          quotationNumber: quotation.quotation_number,
          clientName: quotation.client_name,
          clientEmail: quotation.client_email,
          clientPhone: quotation.client_phone,
          clientAddress: quotation.client_address,
          items: (quotationItemsByQuotationId[quotation.id] || []).map(item => ({
            id: item.id,
            productId: item.product_id,
            productCode: item.product_code,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price ?? 0),
            taxPercent: Number(item.tax_percent ?? 0),
            discount: Number(item.discount ?? 0),
            lineTotal: Number(item.line_total ?? 0),
          })),
          subtotal: Number(quotation.subtotal ?? 0),
          totalDiscount: Number(quotation.total_discount ?? 0),
          totalTax: Number(quotation.total_tax ?? 0),
          grandTotal: Number(quotation.grand_total ?? 0),
          status: quotation.status,
          validUntil: new Date(quotation.valid_until),
          notes: quotation.notes,
          createdBy: quotation.created_by || '',
          createdAt: new Date(quotation.created_at),
          updatedAt: new Date(quotation.updated_at),
        })));
      }

      const invoiceItemsByInvoiceId = (invoiceItemsResult.data || []).reduce<Record<string, any[]>>((acc, item) => {
        acc[item.invoice_id] = acc[item.invoice_id] || [];
        acc[item.invoice_id].push(item);
        return acc;
      }, {});

      if (invoicesResult.data) {
        setInvoices(invoicesResult.data.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          quotationId: invoice.quotation_id || undefined,
          clientName: invoice.client_name,
          clientEmail: invoice.client_email,
          clientPhone: invoice.client_phone,
          clientAddress: invoice.client_address,
          items: (invoiceItemsByInvoiceId[invoice.id] || []).map(item => ({
            id: item.id,
            productId: item.product_id,
            productCode: item.product_code,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: Number(item.unit_price ?? 0),
            costPrice: Number(item.cost_price ?? 0),
            taxPercent: Number(item.tax_percent ?? 0),
            discount: Number(item.discount ?? 0),
            lineTotal: Number(item.line_total ?? 0),
          })),
          subtotal: Number(invoice.subtotal ?? 0),
          totalDiscount: Number(invoice.total_discount ?? 0),
          totalTax: Number(invoice.total_tax ?? 0),
          grandTotal: Number(invoice.grand_total ?? 0),
          paymentMode: invoice.payment_mode,
          status: invoice.status,
          createdBy: invoice.created_by || '',
          createdAt: new Date(invoice.created_at),
          paidAt: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
        })));
      }

      const trackingByDeliveryId = (trackingEventsResult.data || []).reduce<Record<string, any[]>>((acc, event) => {
        acc[event.delivery_id] = acc[event.delivery_id] || [];
        acc[event.delivery_id].push(event);
        return acc;
      }, {});

      if (deliveriesResult.data) {
        setDeliveries(deliveriesResult.data.map(delivery => ({
          id: delivery.id,
          invoiceId: delivery.invoice_id,
          invoiceNumber: delivery.invoice_number,
          productCode: delivery.product_code,
          productName: delivery.product_name,
          quantity: delivery.quantity,
          currentStage: delivery.current_stage,
          status: delivery.status,
          deliveryPerson: delivery.delivery_person_id ? undefined : undefined,
          recipientName: delivery.recipient_name || undefined,
          recipientPhone: delivery.recipient_phone || undefined,
          deliveryAddress: delivery.delivery_address,
          estimatedDeliveryDate: delivery.estimated_delivery_date ? new Date(delivery.estimated_delivery_date) : undefined,
          actualDeliveryDate: delivery.actual_delivery_date ? new Date(delivery.actual_delivery_date) : undefined,
          createdAt: new Date(delivery.created_at),
          notes: delivery.notes,
          trackingHistory: (trackingByDeliveryId[delivery.id] || []).map(event => ({
            id: event.id,
            stage: event.stage,
            timestamp: new Date(event.timestamp),
            notes: event.notes,
            updatedBy: event.updated_by || 'System',
            location: event.location,
          })),
        })));
      }

      if (repairJobsResult.data) {
        const photosByJobId = (repairPhotosResult.data || []).reduce<Record<string, any[]>>((acc, photo) => {
          acc[photo.job_id] = acc[photo.job_id] || [];
          acc[photo.job_id].push(photo);
          return acc;
        }, {});

        const updatesByJobId = (repairUpdatesResult.data || []).reduce<Record<string, any[]>>((acc, update) => {
          acc[update.job_id] = acc[update.job_id] || [];
          acc[update.job_id].push(update);
          return acc;
        }, {});

        const partsByJobId = (repairPartsResult.data || []).reduce<Record<string, any[]>>((acc, part) => {
          acc[part.job_id] = acc[part.job_id] || [];
          acc[part.job_id].push(part);
          return acc;
        }, {});

        setRepairJobs(repairJobsResult.data.map(job => ({
          id: job.id,
          jobId: job.job_id,
          customerId: job.customer_id,
          deviceId: job.device_id,
          assignedTechId: job.assigned_tech_id,
          status: job.status,
          priority: job.priority,
          estimatedCost: Number(job.estimated_cost ?? 0),
          depositPaid: Number(job.deposit_paid ?? 0),
          issueSummary: job.issue_summary,
          intakeNotes: job.intake_notes,
          publicUpdate: job.public_update,
          qrToken: job.qr_token,
          readyNotifiedAt: job.ready_notified_at ? new Date(job.ready_notified_at) : undefined,
          completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
          createdAt: new Date(job.created_at),
          updatedAt: new Date(job.updated_at),
          photos: (photosByJobId[job.id] || []).map(photo => ({
            id: photo.id,
            jobId: photo.job_id,
            photoUrl: photo.photo_url,
            caption: photo.caption,
            createdAt: new Date(photo.created_at),
          })),
          updates: (updatesByJobId[job.id] || []).map(update => ({
            id: update.id,
            jobId: update.job_id,
            loggedAt: new Date(update.logged_at),
            note: update.note,
            visibility: update.visibility,
            statusChangedTo: update.status_changed_to,
            createdBy: update.created_by,
          })),
          parts: (partsByJobId[job.id] || []).map(part => ({
            id: part.id,
            jobId: part.job_id,
            productId: part.product_id,
            quantity: Number(part.quantity),
            unitCost: Number(part.unit_cost ?? 0),
            totalCost: Number(part.total_cost ?? 0),
            consumedAt: new Date(part.consumed_at),
            createdAt: new Date(part.created_at),
          })),
        })));
      }
    };

    void loadData();
  }, []);

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

  // Low-stock threshold
  const LOW_STOCK_THRESHOLD = 5;

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

    const currentQty = product.type === 'hardware'
      ? (product as HardwareProduct).stockQuantity
      : (product as SoftwareProduct).licenseQuantity;
    const newQty = currentQty + change;

    // Update product stock
    if (product.type === 'hardware') {
      updateProduct(productId, { stockQuantity: newQty });
    } else {
      updateProduct(productId, { licenseQuantity: newQty });
    }

    // Low-stock & out-of-stock alerts on any reduction
    if (change < 0) {
      const label = product.type === 'hardware' ? 'units' : 'licenses';
      if (newQty <= 0) {
        toast({
          title: '⚠️ Out of Stock!',
          description: `"${product.name}" (${product.productCode}) has reached 0 ${label}. Restock immediately.`,
          variant: 'destructive',
        });
      } else if (newQty <= LOW_STOCK_THRESHOLD) {
        toast({
          title: '⚠️ Low Stock Alert',
          description: `"${product.name}" (${product.productCode}) is running low — only ${newQty} ${label} remaining.`,
          variant: 'destructive',
        });
      }
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

    // Reduce inventory for each item in the quotation
    quotation.items.forEach(item => {
      updateInventory(
        item.productId,
        -item.quantity,
        'sale',
        quotation.createdBy,
        'System',
        `Invoice ${newInvoice.invoiceNumber} (from quotation ${quotation.quotationNumber})`
      );
    });

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
