# AquaPure: Water Purifier E-Commerce & Dealer Management System

AquaPure is a full-stack, enterprise-grade Water Purifier E-Commerce System featuring a tri-role architecture:
- **Customers**: Browse 69 mock-data products across purifiers, dispensers, pumps, filters, and spares; use role-priced cart and COD checkout; follow Firestore order/service history; edit profile; receive device notifications.
- **Dealers**: Apply with business/GST details, sign in through the dealer flow, and access wholesale pricing and bulk minimum quantities after admin approval.
- **Admins**: Sign in to a Firebase-authorized portal to manage live orders, approve/reject dealer applications, update service requests, and send FCM status alerts.

The admin portal is configured for Vercel deployment. It is not yet deployed; follow [docs/SETUP.md](./docs/SETUP.md) and configure Firebase/Vercel credentials before publishing.

---

## Project Structure

```text
WaterPurifierProject/
├── admin/                    # Admin Portal (React + Vite + TypeScript + Tailwind CSS)
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # Reusable UI components (Modals, Tables, Cards, Badges)
│   │   ├── layouts/          # Admin layout, sidebar, header, role switcher
│   │   ├── pages/            # Dashboard, Products, Orders, Dealers, Service, Customers
│   │   ├── hooks/            # Custom React hooks (useAuth, useProducts, useOrders)
│   │   ├── services/         # Firebase Firestore & Auth integration services
│   │   ├── types/            # Shared TypeScript data models & DTOs
│   │   ├── utils/            # Currency formatting (paise to INR), date formatters
│   │   └── styles/           # Global styles and design tokens
│   ├── index.html            # Admin HTML entry point
│   ├── package.json          # Admin dependencies & scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── vite.config.ts        # Vite configuration
│
├── mobile/                   # Customer & Dealer Mobile App (React Native + Expo Router)
│   ├── app/                  # Expo Router file-based screens (tabs, details, checkout)
│   ├── components/           # Mobile UI components
│   ├── constants/            # Theme colors, config, constants
│   ├── hooks/                # Mobile hooks
│   ├── services/             # Firebase SDK client service bindings
│   ├── types/                # TypeScript interfaces aligned with Admin schema
│   ├── utils/                # Mobile utilities & formatters
│   ├── assets/               # Splash screen, icons, images
│   ├── app.json              # Expo application configuration
│   ├── package.json          # Mobile dependencies & scripts
│   └── tsconfig.json         # Mobile TypeScript configuration
│
├── docs/                     # Comprehensive Architecture & Operations Documentation
│   ├── SETUP.md              # Beginner-friendly setup instructions for Windows & VS Code
│   ├── FIREBASE_SETUP.md     # Firebase Auth, Firestore, and Security Rules guide
│   ├── DATABASE_SCHEMA.md    # Detailed Firestore collections, types, and indexes
│   └── TESTING.md            # Comprehensive test matrix and security audit checklist
│
└── README.md                 # Project root overview and phase roadmap
```

---

## Architectural Principles

1. **Integer Paise Monetary Units**: All prices and order totals are stored as integer paise in Firestore to prevent floating-point rounding errors. For example: `₹14,999` is stored as `1499900` paise.
2. **Historical Price Preservation**: Order items capture snapshots of `productName`, `unitPricePaise`, and `specifications` at the exact time of order placement.
3. **Role-Based Access Control (RBAC)**: Roles (`customer`, `dealer`, `admin`) are strictly enforced. Admins cannot be self-assigned; dealers undergo an approval workflow.
4. **Shared Data Contract**: Both Admin and Mobile share the exact same Firestore schema and TypeScript interfaces.

---

## Roadmap

- [x] **Phase 1**: Environment inspection, folder structure generation, core documentation, and base data contracts.
- [x] **Phase 2**: Responsive admin sign-in/dashboard and 69-product mobile catalogue with product-specific illustrations.
- [x] **Phase 3**: Firebase Email/Password Authentication and Firestore-backed customer/dealer profiles.
- [x] **Phase 4**: Role-gated dealer applications, wholesale access, and admin approval workflow.
- [x] **Phase 5**: Cart, COD/dealer-credit checkout, live order history, service bookings, and admin status management.
- [x] **Phase 6**: Android Expo application and FCM token registration.
- [ ] **Phase 7**: Configure production Firebase/Vercel credentials, publish Firestore rules, deploy the admin portal, and validate on a physical Android build.
