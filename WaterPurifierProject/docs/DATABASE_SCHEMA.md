# Cloud Firestore Database Schema Specification

This document details the complete Firestore schema, collection structures, field data types, relationships, indexes, and constraints for AquaPure.

---

## 1. Monetary Unit Standard: Integer Paise

All monetary values (`sellingPricePaise`, `dealerPricePaise`, `orderTotalPaise`, `deliveryFeePaise`, etc.) are stored as **64-bit integer paise** in Firestore.

```typescript
// Conversion Helper Formula:
// ₹14,999.00 -> 1499900 paise
export const paiseToINR = (paise: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(paise / 100);
};

export const inrToPaise = (rupees: number): number => Math.round(rupees * 100);
```

---

## 2. Collections Overview

| Collection Name | Document ID Pattern | Purpose | Read Access | Write Access |
|---|---|---|---|---|
| `users` | `users/{uid}` | User profiles, roles, and addresses | Owner, Admin | Owner (safe fields), Admin |
| `admins` | `admins/{uid}` | Trusted administrator lookup records | Admin | Admin (Secure CLI / Console) |
| `categories` | `categories/{categoryId}` | Product taxonomies (RO, UV, UF, Commercial) | Public | Admin |
| `products` | `products/{productId}` | Active Firestore product catalogue, prices, and stock | Public (active only), Admin | Admin; trusted checkout API decrements stock |
| `dealerApplications`| `dealerApplications/{appId}` | KYC & wholesale requests | Applicant, Admin | Applicant (create), Admin (status) |
| `orders` | `orders/{orderId}` | Customer & dealer order records | Owner, Admin | Trusted checkout API (create), Admin (limited status changes) |
| `serviceBookings` | `serviceBookings/{bookingId}` | Installation & maintenance requests | Customer, Admin | Customer (create), Admin (status) |
| `inventoryMovements`| `inventoryMovements/{movId}` | Reserved for a future stock audit log | Denied until implemented | Denied until implemented |

The mobile catalogue subscribes to active Firestore products. The bundled mock catalogue is shown only when Firestore has no valid active products; secure checkout accepts only product IDs backed by active Firestore records. An admin can import the sample catalogue once from the portal if the `products` collection is empty.

---

## 3. Detailed Document Schemas

### 3.1 `users`
```typescript
interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: 'customer' | 'dealer' | 'admin';
  dealerStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  accountStatus: 'active' | 'pending' | 'suspended';
  companyName?: string;
  gstNumber?: string;
  savedAddresses: Array<{
    id: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
  }>;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  pushToken?: string;
  pushTokenUpdatedAt?: string;
}
```

### 3.2 `products` (Firestore catalogue)
```typescript
interface ProductDocument {
  id: string;
  name: string;
  slug: string;
  category: 'ro_purifiers' | 'uv_purifiers' | 'gravity_filters' | 'commercial_ro' | 'spare_filters' | 'alkaline_units' | 'water_dispensers' | 'water_pumps';
  brand: string;
  description: string;
  sellingPricePaise: number;       // e.g., 1499900 for ₹14,999
  dealerPricePaise: number;        // e.g., 1120000 for ₹11,200 (Wholesale)
  dealerMinQuantity: number;       // e.g., 5 units minimum for dealer pricing
  stockQuantity: number;           // Active real-time stock
  images: string[];                // Optional image URLs; the current app renders category-matched SVG artwork
  featured: boolean;
  specifications: {
    purificationTechnology: string; // "RO + UV + UF + TDS Controller"
    storageCapacityLitres: number;  // 8.5
    purificationSpeedLph: number;   // 15 LPH
    suitableForTdsPpm: string;      // "Up to 2000 ppm"
    filterCartridges: string[];     // ["Sediment", "Pre-Carbon", "RO Membrane", "Post-Carbon"]
    warrantyYears: number;          // 1
    powerConsumptionWatts: number;  // 60W
    dimensionsCm?: string;          // "39 x 28 x 53 cm"
    weightKg?: number;              // 7.8
  };
  isActive: boolean;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

### 3.3 `dealerApplications`
```typescript
interface DealerApplicationDocument {
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
  reviewedAt?: string;          // ISO 8601
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

### 3.4 `orders`
```typescript
interface OrderItemSnapshot {
  productId: string;
  productName: string;
  productImage: string;
  category: string;
  brand: string;
  quantity: number;
  unitPricePaise: number;       // Preserved historical price at moment of purchase
  totalPricePaise: number;
}

interface OrderDocument {
  id: string;
  orderNumber: string;          // Human-readable: "AQ-2026-8812"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderType: 'customer_retail' | 'dealer_wholesale';
  items: OrderItemSnapshot[];
  itemsCount: number;
  subtotalPaise: number;
  taxPaise: number;             // Currently 0; no tax is calculated by this demo
  deliveryFeePaise: number;     // 0 for Free Delivery
  totalAmountPaise: number;
  paymentMethod: 'cash_on_delivery' | 'dealer_credit' | 'bank_transfer';
  paymentStatus: 'pending' | 'collected' | 'refunded';
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  statusTimeline: Array<{
    status: string;
    note: string;
    timestamp: string;          // ISO 8601
  }>;
  serviceRequested: boolean;
  notes?: string;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

Order document IDs are generated client-side as 20-character idempotency keys and submitted to the Vercel `/api/create-order` endpoint. The server verifies Firebase ID tokens, role/account status, active product records, prices, stock, and dealer minimum quantities. In one Firestore transaction it writes the order, stores a changed delivery address, and decrements stock. Client applications are denied direct order creation.

### 3.5 `serviceBookings`
```typescript
interface ServiceBookingDocument {
  id: string;
  bookingNumber: string;        // "SRV-2026-4421"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: 'new_installation' | 'filter_cartridge_replacement' | 'leakage_repair' | 'tds_health_check' | 'annual_maintenance';
  purifierModelOrBrand?: string;
  preferredDate: string;        // "2026-10-25"
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  serviceAddress: {
    addressLine: string;
    city: string;
    postalCode: string;
  };
  status: 'booked' | 'assigned' | 'technician_en_route' | 'completed' | 'cancelled';
  assignedTechnician?: {
    name: string;
    phone: string;
  };
  completionNotes?: string;
  serviceCostPaise: number;     // 0 if warranty/free installation
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}
```

---

## 4. Required Composite Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "sellingPricePaise", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "dealerApplications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
