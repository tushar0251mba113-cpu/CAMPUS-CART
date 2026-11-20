export type UserRole = 'customer' | 'retailer' | 'admin';

export type ProductCategory =
  | 'Groceries'
  | 'Snacks'
  | 'Beverages'
  | 'Stationery'
  | 'Personal Care'
  | 'Other Essentials';

export type StoreCategory =
  | 'Kirana & Groceries'
  | 'Snacks & Beverages'
  | 'Stationery & Print'
  | 'Personal Care'
  | 'Multi-Category Essentials'
  | 'Licensed Pharmacy';

export type StoreStatus = 'pending' | 'active' | 'suspended';

export type BundleCategory =
  | 'Hostel Essentials Bundle'
  | 'Study Essentials Bundle'
  | 'Late-Night Snacks Bundle'
  | 'Personal Care Bundle'
  | 'Monthly Essentials Bundle';

export type OrderStatus =
  | 'Draft'
  | 'Pending Retailer Confirmation'
  | 'Accepted'
  | 'Rejected'
  | 'Confirmed'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export type PaymentMethod = 'UPI' | 'COD';

export type PaymentStatus = 'Unverified' | 'Manually Verified' | 'Not Required Yet';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  hostelOrPg?: string;
  roomDetails?: string;
  landmark?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  category: StoreCategory;
  address: string;
  serviceAreas: string[];
  operatingHours: string;
  deliveryEstimateNote?: string;
  whatsappOrderNumber?: string;
  upiId?: string;
  upiEnabled: boolean;
  codEnabled: boolean;
  pharmacyVerified: boolean;
  status: StoreStatus;
  isDemo: boolean;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorePrivateContact {
  ownerName: string;
  registeredPhone: string;
  ownerEmail?: string;
  notes?: string;
  updatedAt: string;
}

export interface RetailerApplication {
  id: string;
  applicantUid: string;
  storeName: string;
  ownerName: string;
  phone: string;
  whatsappNumber?: string;
  address: string;
  category: string;
  serviceArea: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  unitLabel: string;
  imageKey: string;
  imageUrl?: string;
  available: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Bundle {
  id: string;
  name: string;
  category: BundleCategory;
  description: string;
  storeId: string;
  storeName: string;
  items: BundleItem[];
  regularPrice: number;
  bundlePrice: number;
  enabled: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  clusterType: 'Campus Hostel' | 'PG Cluster' | 'Campus Gate / Academic';
  description: string;
  estimatedDeliveryNote: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  deliveryServiceFee: number;
  variableCostPerTxn: number;
  monthlyFixedCost: number;
  baseMonthlyCustomers: number;
  basePurchasesPerCustomer: number;
  pilotWhatsappNumber: string;
  pilotFeeDisclaimer: string;
  promoBannerText?: string;
  promoBannerEnabled: boolean;
  upiEnabled: boolean;
  codEnabled: boolean;
  updatedAt: string;
}

export interface OrderLineItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderRef: string;
  customerUid: string;
  storeId: string;
  storeName: string;
  storeOwnerUid: string;
  customerName: string;
  customerPhone: string;
  hostelOrPg: string;
  roomDetails: string;
  landmark?: string;
  deliveryInstructions?: string;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  whatsappMessage: string;
  retailerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  customerUid: string;
  customerName: string;
  orderId?: string;
  hostelCluster: string;
  willingToPayFee: boolean;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
