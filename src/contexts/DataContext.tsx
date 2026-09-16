//datacontext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  Product, 
  Quotation, 
  Invoice,
  InvoicePayment,
  SmsLog,
  Delivery,
  DeliveryStage,
  DeliveryTrackingEvent,
  DeliveryPerson,
  InventoryLog,
  InvoiceItem,
  HardwareProduct,
  SoftwareProduct,
  GenericProduct,
  Customer,
  LaborRate,
  RepairJob,
  RepairJobUpdate,
  RepairJobPhoto,
  RepairJobPart,
  DeviceBrand,
  DeviceModel,
  DeviceColor
  ,ProductCategory
  ,CategoryFieldSchema
} from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateProductCode, generateBarcode, generateQuotationNumber, generateInvoiceNumber } from '@/lib/code-generators';

interface DataContextType {
  categories: ProductCategory[];
  categoryFieldSchemas: CategoryFieldSchema[];
  customers: Customer[];
  laborRates: LaborRate[];
  repairJobs: RepairJob[];
  brands: DeviceBrand[];
  models: DeviceModel[];
  colors: DeviceColor[];

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'productCode' | 'barcode' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  archiveProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getProductByCode: (code: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;

  // Inventory
  inventoryLogs: InventoryLog[];
  updateInventory: (productId: string, change: number, reason: InventoryLog['reason'], userId: string, userName: string, notes?: string) => Promise<boolean>;

  // Repair jobs
  addRepairJob: (repairJob: Omit<RepairJob, 'id' | 'jobId' | 'qrToken' | 'createdAt' | 'updatedAt'>) => Promise<RepairJob>;
  updateRepairJob: (id: string, updates: Partial<RepairJob>) => Promise<boolean>;
  convertRepairToInvoice: (repairJobId: string, paymentMode: Invoice['paymentMode'], amountPaid?: number) => Promise<Invoice>;

  // Quotations
  quotations: Quotation[];
  addQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>) => Promise<Quotation>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<boolean>;
  convertToInvoice: (quotationId: string, paymentMode: Invoice['paymentMode'], amountPaid?: number) => Promise<Invoice>;

  // Invoices
  invoices: Invoice[];
  invoicePayments: InvoicePayment[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<boolean>;
  cancelInvoice: (id: string) => Promise<boolean>;
  recordInvoicePayment: (invoiceId: string, amount: number, recordedBy: string) => Promise<InvoicePayment | undefined>;

  // Data loading state
  isLoading: boolean;
  error: string | null;

  // Deliveries
  deliveries: Delivery[];
  updateDeliveryStage: (id: string, stage: DeliveryStage, updatedBy: string, notes?: string, location?: string) => Promise<boolean>;
  assignDeliveryPerson: (id: string, deliveryPerson: DeliveryPerson) => Promise<boolean>;
  markDeliveryReturned: (id: string, updatedBy: string, notes?: string) => Promise<boolean>;
  getDelivery: (id: string) => Delivery | undefined;
  deliveryPeople: DeliveryPerson[];
  addDeliveryPerson: (deliveryPerson: Omit<DeliveryPerson, 'id'>) => Promise<DeliveryPerson | undefined>;
  assignDeliveryPeople: (ids: string[], deliveryPerson: DeliveryPerson) => Promise<boolean>;
  unassignDeliveryPerson: (id: string) => Promise<boolean>;
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
  const { user } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryFieldSchemas, setCategoryFieldSchemas] = useState<CategoryFieldSchema[]>([]);
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
  const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || user.isPlatformAdmin) {
      setCategories([]);
      setCategoryFieldSchemas([]);
      return;
    }

    const loadCategories = async () => {
      const { data: categoryRows, error: categoryError } = await supabase.rpc('get_my_product_categories');

      if (categoryError) {
        setError(`Unable to load product categories: ${categoryError.message}`);
        setCategories([]);
        return;
      }

      console.info('[DataContext] loaded tenant categories', {
        profileId: user.id,
        count: categoryRows?.length ?? 0,
      });

      const categoryIds = (categoryRows ?? []).map(category => category.id);
      const { data: fieldRows, error: fieldError } = categoryIds.length
        ? await supabase.from('category_field_schemas').select('*').in('category_id', categoryIds).order('sort_order')
        : { data: [], error: null };

      if (fieldError) {
        setError(`Unable to load category fields: ${fieldError.message}`);
        setCategoryFieldSchemas([]);
      } else {
        setCategoryFieldSchemas((fieldRows ?? []).map(field => ({
          id: field.id,
          categoryId: field.category_id,
          fieldKey: field.field_key,
          fieldLabel: field.field_label,
          fieldType: field.field_type,
          fieldOptions: Array.isArray(field.field_options) ? field.field_options : [],
          isRequired: Boolean(field.is_required),
          sortOrder: Number(field.sort_order ?? 0),
          isActive: field.is_active === undefined ? true : Boolean(field.is_active),
        })));
      }

      setCategories((categoryRows ?? []).map(category => ({
        id: category.id,
        name: category.name,
        defaultUnitOfMeasure: category.default_unit_of_measure || 'unit',
        defaultIsCutToOrder: Boolean(category.default_is_cut_to_order),
        sortOrder: Number(category.sort_order ?? 0),
        isActive: Boolean(category.is_active),
      })));
    };

    void loadCategories();
  }, [user?.id, user?.isPlatformAdmin]);

  useEffect(() => {
    if (!user?.id || !user.tenantId || user.isPlatformAdmin) {
      setCategories([]);
      setCategoryFieldSchemas([]);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);

      try {
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
          invoicePaymentsResult,
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
          supabase.from('invoice_payments').select('*').order('paid_at', { ascending: false }),
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

      if (productsResult.error) {
        setError(`Unable to load products: ${productsResult.error.message}`);
      } else if (productsResult.data) {
        setProducts(productsResult.data.map(product => {
          if (product.type === 'hardware') return ({
          id: product.id ?? product.product_id,
          productCode: product.product_code,
          barcode: product.barcode,
          name: product.name ?? product.product_name,
          category: product.category ?? product.category_name,
          categoryId: product.category_id || null,
          attributes: {
            ...(product.attributes || {}),
            ...(product.supplier && product.attributes?.supplier === undefined ? { supplier: product.supplier } : {}),
            ...(product.attributes?.warranty_months === undefined && (product.attributes?.warranty_period !== undefined || product.warranty_period !== null) ? { warranty_months: product.attributes?.warranty_period ?? product.warranty_period } : {}),
          },
          unitOfMeasure: product.unit_of_measure || 'unit',
          isCutToOrder: Boolean(product.is_cut_to_order),
          type: 'hardware',
          costPrice: Number(product.cost_price ?? product.costPrice ?? 0),
          sellingPrice: Number(product.selling_price ?? product.sellingPrice ?? 0),
          taxPercent: Number(product.tax_percent ?? 0),
          status: product.status,
          description: product.description,
          stockQuantity: Number(product.stock_quantity ?? 0),
          supplier: product.supplier || '',
          warrantyPeriod: Number(product.warranty_period ?? 0),
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
          } as HardwareProduct);
          if (product.type === 'software') return ({
          id: product.id ?? product.product_id,
          productCode: product.product_code,
          barcode: product.barcode,
          name: product.name ?? product.product_name,
          category: product.category ?? product.category_name,
          categoryId: product.category_id || null,
          attributes: {
            ...(product.attributes || {}),
            ...(product.license_type && product.attributes?.license_type === undefined ? { license_type: product.license_type } : {}),
            ...(product.expiry_date && product.attributes?.expiry_date === undefined ? { expiry_date: product.expiry_date } : {}),
          },
          unitOfMeasure: product.unit_of_measure || 'unit',
          isCutToOrder: Boolean(product.is_cut_to_order),
          type: 'software',
          costPrice: Number(product.cost_price ?? product.costPrice ?? 0),
          sellingPrice: Number(product.selling_price ?? product.sellingPrice ?? 0),
          taxPercent: Number(product.tax_percent ?? 0),
          status: product.status,
          description: product.description,
          licenseType: product.license_type || 'single',
          licenseQuantity: Number(product.license_quantity ?? 0),
          expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
          createdAt: new Date(product.created_at),
          updatedAt: new Date(product.updated_at),
          } as SoftwareProduct);
          return {
            id: product.id ?? product.product_id,
            productCode: product.product_code,
            barcode: product.barcode,
            name: product.name ?? product.product_name,
            category: product.category ?? product.category_name,
            categoryId: product.category_id || null,
            attributes: product.attributes || {},
            unitOfMeasure: product.unit_of_measure || 'unit',
            isCutToOrder: Boolean(product.is_cut_to_order),
            type: null,
            costPrice: Number(product.cost_price ?? product.costPrice ?? 0),
            sellingPrice: Number(product.selling_price ?? product.sellingPrice ?? 0),
            taxPercent: Number(product.tax_percent ?? 0),
            status: product.status,
            description: product.description,
            stockQuantity: Number(product.stock_quantity ?? 0),
            createdAt: new Date(product.created_at),
            updatedAt: new Date(product.updated_at),
          } as GenericProduct;
        }));
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
          customerId: invoice.customer_id || null,
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
          amountPaid: Number(invoice.amount_paid ?? 0),
          amountDue: Number(invoice.amount_due ?? 0),
          paymentStatus: invoice.payment_status,
          paymentMode: invoice.payment_mode,
          status: invoice.status,
          createdBy: invoice.created_by || '',
          createdAt: new Date(invoice.created_at),
          paidAt: invoice.paid_at ? new Date(invoice.paid_at) : undefined,
        })));
      }

      if (invoicePaymentsResult.data) {
        setInvoicePayments(invoicePaymentsResult.data.map(payment => ({
          id: payment.id,
          invoiceId: payment.invoice_id,
          amount: Number(payment.amount ?? 0),
          paidAt: new Date(payment.paid_at),
          recordedBy: payment.recorded_by || '',
        })));
      }

      const trackingByDeliveryId = (trackingEventsResult.data || []).reduce<Record<string, any[]>>((acc, event) => {
        acc[event.delivery_id] = acc[event.delivery_id] || [];
        acc[event.delivery_id].push(event);
        return acc;
      }, {});

      const deliveryPeopleById = (deliveryPeopleResult.data || []).reduce<Record<string, DeliveryPerson>>((acc, person) => {
        acc[person.id] = {
          id: person.id,
          name: person.name,
          phone: person.phone,
          vehicleNumber: person.vehicle_number || undefined,
        };
        return acc;
      }, {});

      if (deliveryPeopleResult.data) {
        setDeliveryPeople(deliveryPeopleResult.data.map(person => ({
          id: person.id,
          name: person.name,
          phone: person.phone,
          vehicleNumber: person.vehicle_number || undefined,
        })));
      }

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
          deliveryPerson: delivery.delivery_person_id ? deliveryPeopleById[delivery.delivery_person_id] : undefined,
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
      } catch (loadError) {
        console.error('Failed to load data:', loadError);
        setError(current => current || 'Unable to load application data. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [user?.id, user?.tenantId, user?.isPlatformAdmin]);

  // Product functions
  const addProduct = async (productData: Omit<Product, 'id' | 'productCode' | 'barcode' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const now = new Date();
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      productCode: generateProductCode(productData.type, productData.category),
      barcode: generateBarcode(),
      createdAt: now,
      updatedAt: now,
    } as Product;
    
    setProducts(prev => [...prev, newProduct] as Product[]);
    const { error: insertError } = await supabase.from('products').insert({
      tenant_id: user?.tenantId,
      product_code: newProduct.productCode,
      barcode: newProduct.barcode,
      name: newProduct.name,
      category: newProduct.category,
      category_id: newProduct.categoryId || null,
      type: newProduct.type,
      cost_price: newProduct.costPrice,
      selling_price: newProduct.sellingPrice,
      tax_percent: newProduct.taxPercent,
      status: newProduct.status,
      description: newProduct.description || null,
      attributes: newProduct.attributes || {},
      unit_of_measure: newProduct.unitOfMeasure || 'unit',
      is_cut_to_order: Boolean(newProduct.isCutToOrder),
      stock_quantity: 'licenseQuantity' in newProduct ? 0 : newProduct.stockQuantity,
      supplier: 'supplier' in newProduct ? newProduct.supplier : null,
      warranty_period: 'warrantyPeriod' in newProduct ? newProduct.warrantyPeriod : null,
      license_type: 'licenseQuantity' in newProduct ? newProduct.licenseType : null,
      license_quantity: 'licenseQuantity' in newProduct ? newProduct.licenseQuantity : null,
      expiry_date: 'licenseQuantity' in newProduct ? newProduct.expiryDate?.toISOString() || null : null,
    });
    if (insertError) toast({ title: 'Product save failed', description: insertError.message, variant: 'destructive' });
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
    const previousProducts = products;
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } as Product : p
    ));
    const { data, error } = await supabase.from('products').update({
      ...('category' in updates ? { category: updates.category } : {}),
      ...('categoryId' in updates ? { category_id: updates.categoryId } : {}),
      ...('attributes' in updates ? { attributes: updates.attributes } : {}),
      ...('unitOfMeasure' in updates ? { unit_of_measure: updates.unitOfMeasure } : {}),
      ...('isCutToOrder' in updates ? { is_cut_to_order: updates.isCutToOrder } : {}),
      ...('name' in updates ? { name: updates.name } : {}),
      ...('costPrice' in updates ? { cost_price: updates.costPrice } : {}),
      ...('sellingPrice' in updates ? { selling_price: updates.sellingPrice } : {}),
      ...('taxPercent' in updates ? { tax_percent: updates.taxPercent } : {}),
      ...('description' in updates ? { description: updates.description } : {}),
      ...('status' in updates ? { status: updates.status } : {}),
      ...('stockQuantity' in updates ? { stock_quantity: updates.stockQuantity } : {}),
      ...('licenseQuantity' in updates ? { license_quantity: updates.licenseQuantity } : {}),
      ...('supplier' in updates ? { supplier: updates.supplier } : {}),
      ...('warrantyPeriod' in updates ? { warranty_period: updates.warrantyPeriod } : {}),
    }).eq('id', id).select();
    if (error) {
      toast({ title: 'Product update failed', description: error.message, variant: 'destructive' });
      setProducts(previousProducts);
      return false;
    }
    if (!data || data.length === 0) {
      toast({ title: 'Product update failed', description: 'The update did not apply — this product may not belong to your account, or you may not have permission to change it.', variant: 'destructive' });
      setProducts(previousProducts);
      return false;
    }
    return true;
  };

  const archiveProduct = async (id: string) => {
    await updateProduct(id, { status: 'inactive' });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getProductByCode = (code: string) => products.find(p => p.productCode === code);
  const getProductByBarcode = (barcode: string) => products.find(p => p.barcode === barcode);

  // Low-stock threshold
  const LOW_STOCK_THRESHOLD = 5;

  // Inventory functions
  const updateInventory = async (
    productId: string, 
    change: number, 
    reason: InventoryLog['reason'], 
    userId: string, 
    userName: string, 
    notes?: string
  ): Promise<boolean> => {
    const product = getProduct(productId);
    if (!product) return;

    const currentQty = 'licenseQuantity' in product ? product.licenseQuantity : product.stockQuantity;
    const newQty = currentQty + change;

    // Update product stock
    const saved = 'licenseQuantity' in product
      ? await updateProduct(productId, { licenseQuantity: newQty })
      : await updateProduct(productId, { stockQuantity: newQty });
    if (!saved) return false;

    // Low-stock & out-of-stock alerts on any reduction
    if (change < 0) {
      const label = product.type === 'software' ? 'licenses' : 'units';
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
      id: crypto.randomUUID(),
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
    const { data: logData, error: logError } = await supabase.from('inventory_logs').insert({
      id: log.id,
      tenant_id: user?.tenantId,
      product_id: log.productId,
      product_code: log.productCode,
      product_name: log.productName,
      change: log.change,
      reason: log.reason,
      user_id: log.userId || null,
      user_name: log.userName,
      timestamp: log.timestamp.toISOString(),
      notes: log.notes || null,
    }).select();
    if (logError || !logData?.length) {
      setInventoryLogs(prev => prev.filter(item => item.id !== log.id));
      toast({ title: 'Inventory log save failed', description: logError?.message || 'The inventory change was not logged.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // Repair job functions
  const addRepairJob = async (repairJobData: Omit<RepairJob, 'id' | 'jobId' | 'qrToken' | 'createdAt' | 'updatedAt'>): Promise<RepairJob> => {
    const now = new Date();
    const newRepairJob: RepairJob = {
      ...repairJobData,
      id: crypto.randomUUID(),
      jobId: `RJ-${String(Date.now()).slice(-6)}`,
      qrToken: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: repairJobData.status || 'to_do',
    };

    setRepairJobs(prev => [newRepairJob, ...prev]);
    const { data, error } = await supabase.from('repair_jobs').insert({
      id: newRepairJob.id,
      tenant_id: user?.tenantId,
      job_id: newRepairJob.jobId,
      customer_id: newRepairJob.customerId || null,
      device_id: newRepairJob.deviceId || null,
      assigned_tech_id: newRepairJob.assignedTechId || null,
      status: newRepairJob.status,
      priority: newRepairJob.priority,
      estimated_cost: newRepairJob.estimatedCost,
      deposit_paid: newRepairJob.depositPaid,
      issue_summary: newRepairJob.issueSummary || null,
      intake_notes: newRepairJob.intakeNotes || null,
      public_update: newRepairJob.publicUpdate || null,
      qr_token: newRepairJob.qrToken,
      ready_notified_at: newRepairJob.readyNotifiedAt?.toISOString() || null,
      completed_at: newRepairJob.completedAt?.toISOString() || null,
    }).select();
    if (error || !data?.length) {
      setRepairJobs(prev => prev.filter(job => job.id !== newRepairJob.id));
      toast({ title: 'Repair job save failed', description: error?.message || 'The repair job was not saved.', variant: 'destructive' });
      throw new Error(error?.message || 'The repair job was not saved.');
    }
    return newRepairJob;
  };

  const updateRepairJob = async (id: string, updates: Partial<RepairJob>): Promise<boolean> => {
    const previousRepairJobs = repairJobs;
    setRepairJobs(prev => prev.map(job =>
      job.id === id ? { ...job, ...updates, updatedAt: new Date() } : job
    ));
    const { data, error } = await supabase.from('repair_jobs').update({
      ...('customerId' in updates ? { customer_id: updates.customerId } : {}),
      ...('deviceId' in updates ? { device_id: updates.deviceId } : {}),
      ...('assignedTechId' in updates ? { assigned_tech_id: updates.assignedTechId } : {}),
      ...('status' in updates ? { status: updates.status } : {}),
      ...('priority' in updates ? { priority: updates.priority } : {}),
      ...('estimatedCost' in updates ? { estimated_cost: updates.estimatedCost } : {}),
      ...('depositPaid' in updates ? { deposit_paid: updates.depositPaid } : {}),
      ...('issueSummary' in updates ? { issue_summary: updates.issueSummary } : {}),
      ...('intakeNotes' in updates ? { intake_notes: updates.intakeNotes } : {}),
      ...('publicUpdate' in updates ? { public_update: updates.publicUpdate } : {}),
      ...('completedAt' in updates ? { completed_at: updates.completedAt?.toISOString() || null } : {}),
    }).eq('id', id).select();
    if (error || !data?.length) {
      setRepairJobs(previousRepairJobs);
      toast({ title: 'Repair job update failed', description: error?.message || 'The update did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const convertRepairToInvoice = async (repairJobId: string, paymentMode: Invoice['paymentMode'], requestedAmountPaid = 0): Promise<Invoice> => {
    const repairJob = repairJobs.find(job => job.id === repairJobId);
    if (!repairJob) throw new Error('Repair job not found');

    const invoiceItems: InvoiceItem[] = [
      {
        id: crypto.randomUUID(),
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
      ...((repairJob.parts || []).map((part) => ({
        id: crypto.randomUUID(),
        productId: part.productId,
        productCode: `PART-${part.productId.slice(-4)}`,
        productName: `Repair Part: ${part.productId}`,
        quantity: part.quantity,
        unitPrice: part.unitCost,
        costPrice: part.unitCost,
        taxPercent: 0,
        discount: 0,
        lineTotal: part.totalCost,
      } as InvoiceItem)))
    ];

    const grandTotalValue = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const resolvedAmountPaid = paymentMode === 'credit' ? Math.min(Math.max(requestedAmountPaid, 0), grandTotalValue) : grandTotalValue;
    const invoice = await addInvoice({
      customerId: repairJob.customerId || null,
      clientName: repairJob.customer?.name || 'Repair Customer',
      clientEmail: repairJob.customer?.email || 'repair@example.com',
      clientPhone: repairJob.customer?.phone || 'N/A',
      clientAddress: 'Repair intake',
      items: invoiceItems,
      subtotal: invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      totalDiscount: 0,
      totalTax: 0,
      grandTotal: grandTotalValue,
      amountPaid: resolvedAmountPaid,
      amountDue: paymentMode === 'credit' ? grandTotalValue : 0,
      paymentMode,
      status: resolveInvoiceStatus(paymentMode, resolvedAmountPaid, grandTotalValue),
      createdBy: repairJob.assignedTechId || user?.id || null,
      paidAt: paymentMode === 'credit' ? undefined : new Date(),
    });

    if (!await updateRepairJob(repairJobId, { status: 'delivered', completedAt: new Date() })) {
      throw new Error('The repair job status could not be saved.');
    }
    return invoice;
  };

  // Quotation functions
  const addQuotation = async (quotationData: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<Quotation> => {
    const now = new Date();
    const newQuotation: Quotation = {
      ...quotationData,
      id: crypto.randomUUID(),
      quotationNumber: generateQuotationNumber(),
      createdAt: now,
      updatedAt: now,
    };
    
    setQuotations(prev => [...prev, newQuotation]);
    const { data, error } = await supabase.from('quotations').insert({
      id: newQuotation.id,
      tenant_id: user?.tenantId,
      quotation_number: newQuotation.quotationNumber,
      customer_id: newQuotation.customerId || null,
      client_name: newQuotation.clientName,
      client_email: newQuotation.clientEmail,
      client_phone: newQuotation.clientPhone,
      client_address: newQuotation.clientAddress,
      subtotal: newQuotation.subtotal,
      total_discount: newQuotation.totalDiscount,
      total_tax: newQuotation.totalTax,
      grand_total: newQuotation.grandTotal,
      status: newQuotation.status,
      valid_until: newQuotation.validUntil.toISOString().slice(0, 10),
      notes: newQuotation.notes || null,
      created_by: newQuotation.createdBy || null,
    }).select();
    if (error || !data?.length) {
      setQuotations(prev => prev.filter(quotation => quotation.id !== newQuotation.id));
      toast({ title: 'Quotation save failed', description: error?.message || 'The quotation was not saved.', variant: 'destructive' });
      throw new Error(error?.message || 'The quotation was not saved.');
    }
    const { data: itemData, error: itemError } = await supabase.from('quotation_items').insert(newQuotation.items.map(item => ({
      id: item.id,
      tenant_id: user?.tenantId,
      quotation_id: newQuotation.id,
      product_id: item.productId,
      product_code: item.productCode,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_percent: item.taxPercent,
      discount: item.discount,
      line_total: item.lineTotal,
    }))).select();
    if (itemError || !itemData?.length || itemData.length !== newQuotation.items.length) {
      await supabase.from('quotations').delete().eq('id', newQuotation.id);
      setQuotations(prev => prev.filter(quotation => quotation.id !== newQuotation.id));
      toast({ title: 'Quotation items save failed', description: itemError?.message || 'The quotation items were not saved.', variant: 'destructive' });
      throw new Error(itemError?.message || 'The quotation items were not saved.');
    }
    return newQuotation;
  };

  const updateQuotation = async (id: string, updates: Partial<Quotation>): Promise<boolean> => {
    const previousQuotations = quotations;
    setQuotations(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q
    ));
    const { data, error } = await supabase.from('quotations').update({
      ...('customerId' in updates ? { customer_id: updates.customerId } : {}),
      ...('clientName' in updates ? { client_name: updates.clientName } : {}),
      ...('clientEmail' in updates ? { client_email: updates.clientEmail } : {}),
      ...('clientPhone' in updates ? { client_phone: updates.clientPhone } : {}),
      ...('clientAddress' in updates ? { client_address: updates.clientAddress } : {}),
      ...('subtotal' in updates ? { subtotal: updates.subtotal } : {}),
      ...('totalDiscount' in updates ? { total_discount: updates.totalDiscount } : {}),
      ...('totalTax' in updates ? { total_tax: updates.totalTax } : {}),
      ...('grandTotal' in updates ? { grand_total: updates.grandTotal } : {}),
      ...('status' in updates ? { status: updates.status } : {}),
      ...('validUntil' in updates ? { valid_until: updates.validUntil?.toISOString().slice(0, 10) } : {}),
      ...('notes' in updates ? { notes: updates.notes } : {}),
    }).eq('id', id).select();
    if (error || !data?.length) {
      setQuotations(previousQuotations);
      toast({ title: 'Quotation update failed', description: error?.message || 'The update did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const convertToInvoice = async (quotationId: string, paymentMode: Invoice['paymentMode'], requestedAmountPaid = 0): Promise<Invoice> => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) throw new Error('Quotation not found');

    const invoiceItems: InvoiceItem[] = quotation.items.map(item => {
      const product = getProduct(item.productId);
      return {
        ...item,
        costPrice: product?.costPrice || 0,
      };
    });

    const amountPaid = paymentMode === 'credit' ? Math.min(Math.max(requestedAmountPaid, 0), quotation.grandTotal) : quotation.grandTotal;
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      quotationId,
      customerId: quotation.customerId || null,
      clientName: quotation.clientName,
      clientEmail: quotation.clientEmail,
      clientPhone: quotation.clientPhone,
      clientAddress: quotation.clientAddress,
      items: invoiceItems,
      subtotal: quotation.subtotal,
      totalDiscount: quotation.totalDiscount,
      totalTax: quotation.totalTax,
      grandTotal: quotation.grandTotal,
      amountPaid,
      amountDue: paymentMode === 'credit' ? quotation.grandTotal : 0,
      paymentMode,
      status: resolveInvoiceStatus(paymentMode, amountPaid, quotation.grandTotal),
      createdBy: quotation.createdBy,
      createdAt: new Date(),
      paidAt: paymentMode === 'credit' ? undefined : new Date(),
    };

    const invoice = await addInvoice(newInvoice);
    if (!await updateQuotation(quotationId, { status: 'converted' })) throw new Error('The quotation status could not be saved.');

    // Reduce inventory for each item in the quotation
    return invoice;
  };

  // Builds one delivery record per invoice line item. Used by both addInvoice and
  // convertToInvoice so every completed sale (direct POS, quotation conversion, or
  // repair conversion) automatically creates delivery records — independent of
  // whether the customer later chooses "Print Receipt" or "Skip".
  //
  const buildDeliveriesForInvoice = (invoice: Invoice): Delivery[] => {
    const now = new Date();
    return invoice.items.map((item, index) => ({
      id: crypto.randomUUID(),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      currentStage: 'in_inventory',
      status: 'pending',
      deliveryAddress: invoice.clientAddress,
      recipientName: invoice.clientName,
      recipientPhone: invoice.clientPhone,
      createdAt: now,
      trackingHistory: [
        {
          id: crypto.randomUUID(),
          stage: 'in_inventory',
          timestamp: now,
          updatedBy: 'System',
          notes: 'Order created, ready for dispatch',
        },
      ],
    }));
  };

  const resolveInvoiceStatus = (paymentMode: Invoice['paymentMode'], amountPaid: number, grandTotal: number): Invoice['status'] => {
    if (paymentMode === 'credit') {
      if (amountPaid >= grandTotal) return 'paid';
      if (amountPaid > 0) return 'partial';
      return 'pending';
    }

    return amountPaid >= grandTotal ? 'paid' : 'pending';
  };

  // Invoice functions
  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Promise<Invoice> => {
    const paymentMode = invoiceData.paymentMode ?? 'cash';
    const paidAmount = paymentMode === 'credit'
      ? Number(invoiceData.amountPaid ?? 0)
      : Number(invoiceData.grandTotal ?? 0);
    const dueAmount = Math.max(0, Number(invoiceData.grandTotal ?? 0) - paidAmount);
    const resolvedStatus = resolveInvoiceStatus(paymentMode, paidAmount, Number(invoiceData.grandTotal ?? 0));

    const newInvoice: Invoice = {
      ...invoiceData,
      amountPaid: paidAmount,
      amountDue: dueAmount,
      paymentStatus: resolvedStatus === 'paid' ? 'paid' : 'pending',
      status: resolvedStatus,
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date(),
      paidAt: resolvedStatus === 'paid' ? new Date() : undefined,
    };

    const newDeliveries = buildDeliveriesForInvoice(newInvoice);

    setInvoices(prev => [...prev, newInvoice]);
    setDeliveries(prev => [...prev, ...newDeliveries]);

    const { data, error } = await supabase.from('invoices').insert({
      id: newInvoice.id,
      tenant_id: user?.tenantId,
      invoice_number: newInvoice.invoiceNumber,
      quotation_id: newInvoice.quotationId || null,
      customer_id: newInvoice.customerId || null,
      client_name: newInvoice.clientName,
      client_email: newInvoice.clientEmail,
      client_phone: newInvoice.clientPhone,
      client_address: newInvoice.clientAddress,
      subtotal: newInvoice.subtotal,
      total_discount: newInvoice.totalDiscount,
      total_tax: newInvoice.totalTax,
      grand_total: newInvoice.grandTotal,
      amount_paid: newInvoice.amountPaid,
      amount_due: newInvoice.amountDue,
      payment_mode: newInvoice.paymentMode,
      status: newInvoice.status,
      created_by: newInvoice.createdBy || null,
      paid_at: newInvoice.paidAt?.toISOString() || null,
    }).select();
    if (error || !data?.length) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== newInvoice.id));
      setDeliveries(prev => prev.filter(delivery => delivery.invoiceId !== newInvoice.id));
      toast({ title: 'Invoice save failed', description: error?.message || 'The invoice was not saved.', variant: 'destructive' });
      throw new Error(error?.message || 'The invoice was not saved.');
    }
    const { data: itemData, error: itemError } = await supabase.from('invoice_items').insert(newInvoice.items.map(item => ({
      id: item.id,
      tenant_id: user?.tenantId,
      invoice_id: newInvoice.id,
      product_id: item.productId.startsWith('repair-service-') ? null : item.productId,
      product_code: item.productCode,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice,
      tax_percent: item.taxPercent,
      discount: item.discount,
      line_total: item.lineTotal,
    }))).select();
    if (itemError || !itemData?.length || itemData.length !== newInvoice.items.length) {
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== newInvoice.id));
      setDeliveries(prev => prev.filter(delivery => delivery.invoiceId !== newInvoice.id));
      toast({ title: 'Invoice items save failed', description: itemError?.message || 'The invoice items were not saved.', variant: 'destructive' });
      throw new Error(itemError?.message || 'The invoice items were not saved.');
    }

    const deliveryRows = newDeliveries.map(delivery => ({
      id: delivery.id,
      tenant_id: user?.tenantId,
      invoice_id: delivery.invoiceId,
      invoice_number: delivery.invoiceNumber,
      product_code: delivery.productCode,
      product_name: delivery.productName,
      quantity: delivery.quantity,
      current_stage: delivery.currentStage,
      status: delivery.status,
      recipient_name: delivery.recipientName,
      recipient_phone: delivery.recipientPhone,
      delivery_address: delivery.deliveryAddress,
      notes: delivery.notes || null,
    }));
    const { data: deliveryData, error: deliveryError } = await supabase.from('deliveries').insert(deliveryRows).select();
    if (deliveryError || !deliveryData?.length || deliveryData.length !== deliveryRows.length) {
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== newInvoice.id));
      setDeliveries(prev => prev.filter(delivery => delivery.invoiceId !== newInvoice.id));
      toast({ title: 'Delivery records save failed', description: deliveryError?.message || 'The delivery records were not saved.', variant: 'destructive' });
      throw new Error(deliveryError?.message || 'The delivery records were not saved.');
    }
    const initialEvents = newDeliveries.map(delivery => ({
      id: delivery.trackingHistory[0].id,
      tenant_id: user?.tenantId,
      delivery_id: delivery.id,
      stage: delivery.trackingHistory[0].stage,
      timestamp: delivery.trackingHistory[0].timestamp.toISOString(),
      notes: delivery.trackingHistory[0].notes || null,
      updated_by: user?.id || null,
    }));
    const { data: initialEventData, error: initialEventError } = await supabase.from('delivery_tracking_events').insert(initialEvents).select();
    if (initialEventError || !initialEventData?.length || initialEventData.length !== initialEvents.length) {
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== newInvoice.id));
      setDeliveries(prev => prev.filter(delivery => delivery.invoiceId !== newInvoice.id));
      toast({ title: 'Delivery history save failed', description: initialEventError?.message || 'The initial tracking events were not saved.', variant: 'destructive' });
      throw new Error(initialEventError?.message || 'The initial tracking events were not saved.');
    }

    for (const item of invoiceData.items) {
      if (!getProduct(item.productId)) continue;
      const saved = await updateInventory(
        item.productId,
        -item.quantity,
        'sale',
        invoiceData.createdBy,
        'System',
        `Invoice ${newInvoice.invoiceNumber}`
      );
      if (!saved) {
        await supabase.from('invoices').delete().eq('id', newInvoice.id);
        setInvoices(prev => prev.filter(invoice => invoice.id !== newInvoice.id));
        setDeliveries(prev => prev.filter(delivery => delivery.invoiceId !== newInvoice.id));
        toast({ title: 'Invoice inventory update failed', description: 'The invoice was rolled back because stock could not be updated.', variant: 'destructive' });
        throw new Error('Invoice inventory update failed.');
      }
    }

    return newInvoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<boolean> => {
    const previousInvoices = invoices;
    setInvoices(prev => prev.map(i => 
      i.id === id ? { ...i, ...updates } : i
    ));
    const { data, error } = await supabase.from('invoices').update({
      ...('quotationId' in updates ? { quotation_id: updates.quotationId } : {}),
      ...('customerId' in updates ? { customer_id: updates.customerId } : {}),
      ...('clientName' in updates ? { client_name: updates.clientName } : {}),
      ...('clientEmail' in updates ? { client_email: updates.clientEmail } : {}),
      ...('clientPhone' in updates ? { client_phone: updates.clientPhone } : {}),
      ...('clientAddress' in updates ? { client_address: updates.clientAddress } : {}),
      ...('subtotal' in updates ? { subtotal: updates.subtotal } : {}),
      ...('totalDiscount' in updates ? { total_discount: updates.totalDiscount } : {}),
      ...('totalTax' in updates ? { total_tax: updates.totalTax } : {}),
      ...('grandTotal' in updates ? { grand_total: updates.grandTotal } : {}),
      ...('amountPaid' in updates ? { amount_paid: updates.amountPaid } : {}),
      ...('amountDue' in updates ? { amount_due: updates.amountDue } : {}),
      ...('paymentMode' in updates ? { payment_mode: updates.paymentMode } : {}),
      ...('status' in updates ? { status: updates.status } : {}),
      ...('paidAt' in updates ? { paid_at: updates.paidAt?.toISOString() || null } : {}),
    }).eq('id', id).select();
    if (error || !data?.length) {
      setInvoices(previousInvoices);
      toast({ title: 'Invoice update failed', description: error?.message || 'The update did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const cancelInvoice = async (id: string): Promise<boolean> => {
    const invoice = invoices.find(i => i.id === id);
    if (!invoice) return false;

    for (const item of invoice.items) {
      await updateInventory(
        item.productId,
        item.quantity,
        'return',
        invoice.createdBy,
        'System',
        `Invoice ${invoice.invoiceNumber} cancelled`
      );
    }

    return updateInvoice(id, { status: 'cancelled', amountPaid: 0, amountDue: invoice.grandTotal });
  };

  const recordInvoicePayment = async (invoiceId: string, amount: number, recordedBy: string): Promise<InvoicePayment | undefined> => {
    const invoice = invoices.find(item => item.id === invoiceId);
    if (!invoice) return undefined;

    const safeAmount = Math.max(0, Number(amount ?? 0));
    if (safeAmount <= 0 || invoice.amountDue <= 0) return undefined;

    const appliedAmount = Math.min(safeAmount, invoice.amountDue);
    const { data, error } = await supabase.rpc('record_invoice_payment', {
      p_invoice_id: invoiceId,
      p_amount: appliedAmount,
      p_recorded_by: recordedBy,
    });

    if (error || !data) {
      toast({ title: 'Payment recording failed', description: error?.message || 'The payment could not be recorded.', variant: 'destructive' });
      return undefined;
    }

    const nextAmountPaid = Math.min(invoice.grandTotal, Math.max(0, invoice.amountPaid + appliedAmount));
    const nextAmountDue = Math.max(0, invoice.grandTotal - nextAmountPaid);
    const nextStatus = resolveInvoiceStatus(invoice.paymentMode, nextAmountPaid, invoice.grandTotal);

    const payment: InvoicePayment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      amount: appliedAmount,
      paidAt: new Date(),
      recordedBy,
    };

    setInvoicePayments(prev => [payment, ...prev]);
    await updateInvoice(invoiceId, {
      amountPaid: nextAmountPaid,
      amountDue: nextAmountDue,
      status: nextStatus,
      paidAt: nextStatus === 'paid' ? new Date() : invoice.paidAt,
    });

    return payment;
  };

  // Delivery functions
  const getDelivery = (id: string) => deliveries.find(d => d.id === id);

  const getDeliveryStatusFromStage = (stage: DeliveryStage): Delivery['status'] => {
    if (stage === 'in_inventory') return 'pending';
    if (stage === 'returned') return 'returned';
    if (stage === 'collected_by_receiver') return 'completed';
    return 'in_progress';
  };

  const updateDeliveryStage = async (
    id: string, 
    stage: DeliveryStage, 
    updatedBy: string, 
    notes?: string, 
    location?: string
  ): Promise<boolean> => {
    const now = new Date();
    const newTrackingEvent: DeliveryTrackingEvent = {
      id: crypto.randomUUID(),
      stage,
      timestamp: now,
      updatedBy,
      notes,
      location,
    };

    const delivery = deliveries.find(item => item.id === id);
    if (!delivery) return false;
    const previousDeliveries = deliveries;
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
    const newStatus = getDeliveryStatusFromStage(stage);
    const { data: eventData, error: eventError } = await supabase.from('delivery_tracking_events').insert({
      id: newTrackingEvent.id,
      tenant_id: user?.tenantId,
      delivery_id: id,
      stage,
      notes: notes || null,
      updated_by: user?.id || null,
      location: location || null,
    }).select();
    const { data: deliveryData, error: deliveryError } = eventError || !eventData?.length
      ? { data: null, error: eventError }
      : await supabase.from('deliveries').update({
        current_stage: stage,
        status: newStatus,
        actual_delivery_date: stage === 'collected_by_receiver' ? now.toISOString() : undefined,
      }).eq('id', id).select();
    if (eventError || deliveryError || !eventData?.length || !deliveryData?.length) {
      setDeliveries(previousDeliveries);
      toast({ title: 'Delivery update failed', description: eventError?.message || deliveryError?.message || 'The update did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const assignDeliveryPerson = async (id: string, deliveryPerson: DeliveryPerson): Promise<boolean> => {
    const previousDeliveries = deliveries;
    setDeliveries(prev => prev.map(d => 
      d.id === id ? { ...d, deliveryPerson } : d
    ));
    const { data, error } = await supabase.from('deliveries').update({ delivery_person_id: deliveryPerson.id }).eq('id', id).select();
    if (error || !data?.length) {
      setDeliveries(previousDeliveries);
      toast({ title: 'Delivery assignment failed', description: error?.message || 'The assignment did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const addDeliveryPerson = async (deliveryPersonData: Omit<DeliveryPerson, 'id'>): Promise<DeliveryPerson | undefined> => {
    const newDeliveryPerson: DeliveryPerson = {
      ...deliveryPersonData,
      id: crypto.randomUUID(),
    };
    setDeliveryPeople(prev => [...prev, newDeliveryPerson]);
    const { data, error } = await supabase.from('delivery_people').insert({
      id: newDeliveryPerson.id,
      tenant_id: user?.tenantId,
      name: newDeliveryPerson.name,
      phone: newDeliveryPerson.phone,
      vehicle_number: newDeliveryPerson.vehicleNumber || null,
    }).select();
    if (error || !data?.length) {
      setDeliveryPeople(prev => prev.filter(person => person.id !== newDeliveryPerson.id));
      toast({ title: 'Delivery person save failed', description: error?.message || 'The delivery person was not saved.', variant: 'destructive' });
      return undefined;
    }
    return newDeliveryPerson;
  };

  const assignDeliveryPeople = async (ids: string[], deliveryPerson: DeliveryPerson): Promise<boolean> => {
    const previousDeliveries = deliveries;
    setDeliveries(prev => prev.map(d => 
      ids.includes(d.id) ? { ...d, deliveryPerson } : d
    ));
    const { data, error } = await supabase.from('deliveries').update({ delivery_person_id: deliveryPerson.id }).in('id', ids).select();
    if (error || !data || data.length !== ids.length) {
      setDeliveries(previousDeliveries);
      toast({ title: 'Delivery assignment failed', description: error?.message || 'One or more assignments did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const unassignDeliveryPerson = async (id: string): Promise<boolean> => {
    const previousDeliveries = deliveries;
    setDeliveries(prev => prev.map(d => 
      d.id === id ? { ...d, deliveryPerson: undefined } : d
    ));
    const { data, error } = await supabase.from('deliveries').update({ delivery_person_id: null }).eq('id', id).select();
    if (error || !data?.length) {
      setDeliveries(previousDeliveries);
      toast({ title: 'Delivery unassignment failed', description: error?.message || 'The unassignment did not apply.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const markDeliveryReturned = async (id: string, updatedBy: string, notes?: string): Promise<boolean> => {
    return updateDeliveryStage(id, 'returned', updatedBy, notes || 'Item returned to inventory');
  };

  return (
    <DataContext.Provider value={{
      categories,
      categoryFieldSchemas,
      customers,
      laborRates,
      repairJobs,
      brands,
      models,
      colors,
      products,
      addProduct,
      updateProduct,
      archiveProduct,
      deleteProduct,
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
      invoicePayments,
      addInvoice,
      updateInvoice,
      cancelInvoice,
      recordInvoicePayment,
      isLoading,
      error,
      deliveries,
      deliveryPeople,
      updateDeliveryStage,
      assignDeliveryPerson,
      assignDeliveryPeople,
      unassignDeliveryPerson,
      markDeliveryReturned,
      addDeliveryPerson,
      getDelivery,
      addRepairJob,
      updateRepairJob,
      convertRepairToInvoice,
    }}>
      {children}
    </DataContext.Provider>
  );
};
