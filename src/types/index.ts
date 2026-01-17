// User & Auth Types
export type UserRole = 'admin' | 'sales' | 'inventory' | 'accountant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

// Product Types
export type ProductType = 'hardware' | 'software';
export type ProductStatus = 'active' | 'inactive';
export type LicenseType = 'single' | 'multi-user';

export interface BaseProduct {
  id: string;
  productCode: string;
  barcode: string;
  name: string;
  category: string;
  type: ProductType;
  costPrice: number;
  sellingPrice: number;
  taxPercent: number;
  status: ProductStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HardwareProduct extends BaseProduct {
  type: 'hardware';
  stockQuantity: number;
  supplier: string;
  warrantyPeriod: number; // in months
}

export interface SoftwareProduct extends BaseProduct {
  type: 'software';
  licenseType: LicenseType;
  licenseQuantity: number;
  expiryDate?: Date;
}

export type Product = HardwareProduct | SoftwareProduct;

// Inventory Types
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';
export type InventoryChangeReason = 'sale' | 'return' | 'manual' | 'adjustment' | 'purchase';

export interface InventoryLog {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  change: number;
  reason: InventoryChangeReason;
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
}

// Quotation Types
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface QuotationItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discount: number;
  lineTotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  status: QuotationStatus;
  validUntil: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice/Billing Types
export type PaymentMode = 'cash' | 'online' | 'bank';
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled';

export interface InvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  taxPercent: number;
  discount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  status: InvoiceStatus;
  createdBy: string;
  createdAt: Date;
  paidAt?: Date;
}

// Delivery Types
export type DeliveryStage = 
  | 'in_inventory'           // Product ready for dispatch
  | 'collected_by_driver'    // Collected by delivery person
  | 'in_transit'             // On the way to destination
  | 'arrived_at_location'    // Arrived at delivery location
  | 'collected_by_receiver'  // Received by customer
  | 'returned';              // Returned to inventory

export type DeliveryStatus = 'pending' | 'in_progress' | 'completed' | 'returned';

export interface DeliveryTrackingEvent {
  id: string;
  stage: DeliveryStage;
  timestamp: Date;
  notes?: string;
  updatedBy: string;
  location?: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  vehicleNumber?: string;
}

export interface Delivery {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  productCode: string;
  productName: string;
  quantity: number;
  currentStage: DeliveryStage;
  status: DeliveryStatus;
  trackingHistory: DeliveryTrackingEvent[];
  deliveryPerson?: DeliveryPerson;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  createdAt: Date;
  notes?: string;
}

// Report Types
export interface SalesReport {
  date: string;
  totalSales: number;
  totalProfit: number;
  invoiceCount: number;
  hardwareSales: number;
  softwareSales: number;
}

export interface ProductReport {
  productId: string;
  productCode: string;
  productName: string;
  type: ProductType;
  totalSold: number;
  totalRevenue: number;
  totalProfit: number;
}

// Categories
export const PRODUCT_CATEGORIES = [
  'Laptops',
  'Desktops',
  'Monitors',
  'Keyboards',
  'Mice',
  'Storage',
  'RAM',
  'Graphics Cards',
  'Networking',
  'Software Licenses',
  'Antivirus',
  'Office Suite',
  'Operating Systems',
  'Accessories',
  'Cables',
  'Peripherals',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
