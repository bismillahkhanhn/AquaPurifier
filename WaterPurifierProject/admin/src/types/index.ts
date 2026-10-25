/**
 * AquaPure Enterprise Data Contracts & Types
 * Shared across Admin & Mobile Applications
 */

export type UserRole = 'customer' | 'dealer' | 'admin';

export type DealerStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  dealerStatus: DealerStatus;
  companyName?: string;
  gstNumber?: string;
  savedAddresses: UserAddress[];
  createdAt: string; // ISO string for client representation
  updatedAt: string;
}

export type ProductCategory =
  | 'ro_purifiers'
  | 'uv_purifiers'
  | 'gravity_filters'
  | 'commercial_ro'
  | 'spare_filters'
  | 'alkaline_units'
  | 'water_dispensers'
  | 'water_pumps';

export interface ProductSpecifications {
  purificationTechnology: string;
  storageCapacityLitres: number;
  purificationSpeedLph: number;
  suitableForTdsPpm: string;
  filterCartridges: string[];
  warrantyYears: number;
  powerConsumptionWatts: number;
  dimensionsCm?: string;
  weightKg?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  brand: string;
  description: string;
  sellingPricePaise: number;       // All currency stored as integer paise (e.g. 1499900 = ₹14,999)
  dealerPricePaise: number;        // Wholesale price in paise
  dealerMinQuantity: number;       // Minimum Order Quantity for dealer rate
  stockQuantity: number;
  images: string[];
  featured?: boolean;
  specifications: ProductSpecifications;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealerApplication {
  id: string;
  userId: string;
  applicantName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  gstNumber: string;
  panNumber: string;
  businessType: 'distributor' | 'retail_shop' | 'service_center' | 'plumbing_contractor';
  shopAddress: {
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  estimatedMonthlyUnits: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  brand: string;
  quantity: number;
  unitPricePaise: number; // Historical price preserved at purchase
  totalPricePaise: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineEvent {
  status: OrderStatus;
  note: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: 'customer_retail' | 'dealer_wholesale';
  items: OrderItemSnapshot[];
  itemsCount: number;
  subtotalPaise: number;
  taxPaise: number; // GST 18%
  deliveryFeePaise: number;
  totalAmountPaise: number;
  paymentMethod: 'cash_on_delivery' | 'dealer_credit' | 'bank_transfer';
  paymentStatus: 'pending' | 'collected' | 'refunded';
  shippingAddress: UserAddress;
  orderStatus: OrderStatus;
  statusTimeline: OrderTimelineEvent[];
  serviceRequested: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceType =
  | 'new_installation'
  | 'filter_cartridge_replacement'
  | 'leakage_repair'
  | 'tds_health_check'
  | 'annual_maintenance';

export type ServiceStatus =
  | 'booked'
  | 'assigned'
  | 'technician_en_route'
  | 'completed'
  | 'cancelled';

export interface ServiceBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: ServiceType;
  purifierModelOrBrand?: string;
  preferredDate: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  serviceAddress: {
    addressLine: string;
    city: string;
    postalCode: string;
  };
  status: ServiceStatus;
  assignedTechnician?: {
    name: string;
    phone: string;
  };
  completionNotes?: string;
  serviceCostPaise: number;
  createdAt: string;
  updatedAt: string;
}
