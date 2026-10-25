# Firebase Setup & Security Architecture Guide

AquaPure uses Google Firebase for Authentication, Cloud Firestore (Enterprise/Standard mode), and secure Cloud Messaging.

---

## 1. Firebase Project Provisioning

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., `aquapure-purifiers`).
3. Under **Build**, select **Authentication**:
   - Enable **Email/Password** provider.
   - Enable **Google** sign-in provider.
4. Under **Build**, select **Firestore Database**:
   - Choose a region close to your primary audience (e.g., `asia-south1` or `asia-northeast1`).
   - Start in **Production Mode** (default deny).

---

## 2. Bootstrapping the First Admin Account Securely

> **CRITICAL SECURITY RULE:** Never allow users to assign themselves the `admin` role in client-side registration forms. Doing so allows privilege escalation attacks.

To provision the trusted initial administrator:

### Method A: Direct Firestore Admin Record (Recommended for Setup)
1. In Firebase Console, have the administrator sign up via Email or Google once.
2. Copy the resulting User UID from Firebase Authentication.
3. In Firestore Console, go to the `users` collection and find the document with ID equal to that User UID.
4. Set the field: `role: "admin"`.
5. Create a document in `/admins/{uid}` with `{ "email": "admin@yourcompany.com", "createdAt": timestamp }`.
6. Firestore Security Rules verify `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or document role check.

### Method B: Firebase Admin SDK Script (Backend CLI)
A local administrative script using `firebase-admin` can set custom claims or populate the `/admins` collection using a secure service account credential located strictly outside public source control.

---

## 3. Publish the App's Firestore Rules

The authoritative rules for this app are in the repository-root `firestore.rules` file. Do not use a shortened sample: the app's profile fields and dealer states must match its registration code, and collections have separate ownership/admin rules.

To fix a Firebase project currently using deny-all rules:

1. Open **Firebase Console → `waterpurifier-9f18a` → Build → Firestore Database → Rules**.
2. Replace the current rules with the complete contents of [`../../firestore.rules`](../../firestore.rules), then click **Publish**.
3. Confirm the published rules include `match /users/{userId}` and `match /orders/{orderId}` from the file. Owners may update only profile/contact/address fields and their push token; admins alone can change roles and account/dealer approval states. Orders are accepted only for an active customer or an approved, active dealer.
4. In Firestore **Data**, verify `users/{UID}` exists for the signed-in Firebase Authentication UID. Customer records need `role: "customer"` and `accountStatus: "active"`. Dealer records need `role: "dealer"`, `dealerStatus: "approved"`, and `accountStatus: "active"` before wholesale checkout. Do not mark a dealer active unless an admin has approved the application.
5. Retry profile save and checkout. COD order creation goes through the deployed `/api/create-order` server endpoint. It verifies Firebase Authentication, reloads the customer/dealer profile and active product/stock data from Firestore, computes prices and totals, and atomically writes the order, saves the address, and decrements stock. An idempotency key makes a network retry return the original order instead of creating another one.

The app's root rules include a default-deny catch-all. It does not override collection-specific permissions: Firestore combines matching `allow` expressions with OR, so only explicitly allowed operations succeed.

---

## 4. Key Security Invariants
- Dealer profiles are created as pending and cannot self-change their role, approval, or account status. An admin must approve the dealer before wholesale orders are permitted.
- When approving a dealer, set `dealerStatus: "approved"` and `accountStatus: "active"` on `users/{uid}`. The application alone does not grant wholesale access.
- Client devices cannot create order documents directly. The authenticated server endpoint creates orders only for active customers or approved, active dealers and recalculates prices and stock from Firestore.
- FCM device tokens are stored only on the signed-in user's own `users/{uid}` profile. Remote messages are sent by the Vercel API using a server-only Firebase service account, never by embedding service-account credentials in either client.
- **Catalogue setup**: Use the admin portal's **Import demo catalogue** action once when the Firestore `products` collection is empty. It imports the sample catalogue through an admin-authenticated server function. Active Firestore products drive the mobile catalogue; local sample products are shown only as a fallback when Firestore has no active products.
- **Checkout scope**: The server currently supports COD and dealer-credit records; it does not charge a payment method. The Vercel service account is required for server checkout and must have Firestore read/write access. It is not a client credential.
- **No Leaked PII**: Customer addresses, phone numbers, and orders are isolated to the authenticated owner and administrators.
