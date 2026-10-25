# Practical Testing Matrix & Security Audit Checklist

This testing matrix outlines all mandatory functional, transactional, security, and responsive UI test cases for the Water Purifier E-Commerce System.

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| AUTH-01 | Customer registration with valid email and password | User created in Auth and Firestore with role: `customer`. | [ ] |
| AUTH-02 | Attempt to self-assign role `admin` during registration payload | Rejected by Firestore security rules (`PERMISSION_DENIED`). | [ ] |
| AUTH-03 | Google Sign-in flow | Seamless authentication and user profile document provisioning. | [ ] |
| AUTH-04 | Unauthenticated access to `/admin` protected dashboard | Redirects to login with informative session warning. | [ ] |
| AUTH-05 | Customer attempts to fetch `/admins` collection | Rejected with Firestore security error. | [ ] |
| AUTH-06 | Customer attempts to read another customer's orders | Firestore query rejected (`PERMISSION_DENIED`). | [ ] |

---

## 2. Product Catalogue & Inventory

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| PROD-01 | Load 55+ product catalogue | Smooth virtualization/pagination; cards show correct images, tags, specs. | [ ] |
| PROD-02 | Filter by Category (RO, UV, Alkaline, Gravity, Commercial) | Accurate instant filtering without page reloads. | [ ] |
| PROD-03 | Search query by purifier name or specification (e.g., "TDS", "15 LPH") | Matches relevant items case-insensitively. | [ ] |
| PROD-04 | Sort by Price Low-to-High / High-to-Low | Correct integer paise sorting order. | [ ] |
| PROD-05 | Stock display for item with `stockQuantity: 0` | Displays "Out of Stock", disables "Add to Cart" button. | [ ] |
| PROD-06 | Admin updates product stock quantity and selling price | Updated immediately in Firestore; reflected live in catalogue. | [ ] |
| PROD-07 | Non-admin attempts to mutate product document | Firestore rule rejects with `PERMISSION_DENIED`. | [ ] |

---

## 3. Shopping Cart, Checkout & Orders

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| CART-01 | Add items to cart and increment/decrement quantity | Subtotal updates dynamically in integer paise. | [ ] |
| CART-02 | Add quantity exceeding `stockQuantity` | Blocked with warning: "Cannot add more than available stock". | [ ] |
| CART-03 | COD (Cash on Delivery) Checkout submission | Order created with status: `pending`, payment: `pending`. | [ ] |
| CART-04 | Duplicate order prevention | Button enters loading/disabled state immediately upon first click. | [ ] |
| CART-05 | Historical price verification | Changing catalogue price later does not alter previously placed order line items. | [ ] |
| CART-06 | Concurrent order stock decrement | Firestore transaction checks current stock before committing order. | [ ] |

---

## 4. Dealer Wholesale System

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| DEAL-01 | Customer submits Dealer Application with GST and Business details | Application document created in `/dealerApplications` with `pending`. | [ ] |
| DEAL-02 | Unapproved dealer attempts to access wholesale prices | Wholesale pricing and dealer portal remain locked. | [ ] |
| DEAL-03 | Admin reviews application and marks as `approved` | User document status updated to `dealer`; wholesale prices unlocked. | [ ] |
| DEAL-04 | Dealer places order below Minimum Order Quantity (MOQ) | Validation error: "Minimum order quantity for wholesale pricing is X units". | [ ] |
| DEAL-05 | Admin marks application as `rejected` with explanation note | Dealer sees status banner and rejection feedback; can re-apply. | [ ] |

---

## 5. Service & Installation Bookings

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| SRV-01 | Customer books installation with date, time slot, and address | Booking document created in `/serviceBookings` with status `booked`. | [ ] |
| SRV-02 | Admin assigns technician and updates status to `assigned` | Live status reflected in customer's bookings dashboard. | [ ] |
| SRV-03 | Status progression: `booked` -> `assigned` -> `technician_en_route` -> `completed` | Verified status timeline log with timestamps. | [ ] |

---

## 6. Responsive UI & Error Resilience

| Test ID | Test Scenario | Expected Outcome | Pass/Fail |
|---|---|---|---|
| UI-01 | Mobile viewport rendering (< 640px) | Drawer/bottom-bar navigation, finger-friendly tap targets (min 44px). | [ ] |
| UI-02 | Tablet & Desktop viewport rendering (768px - 1440px) | Multi-column grid, responsive tables, sticky filter bar. | [ ] |
| UI-03 | Network disconnection simulation | Friendly offline banner; graceful fallback without crash. | [ ] |
| UI-04 | Form input validations | Mandatory fields highlighted with clear error guidance. | [ ] |
