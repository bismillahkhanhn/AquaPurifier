# Project Setup Guide (Windows & VS Code Friendly)

This guide walks you through setting up and running both the **Admin Website** and the **Android Expo Mobile App** from scratch on Windows using VS Code or any cross-platform terminal.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:

1. **Node.js**: Version 18.x or 20.x LTS ([Download Node.js](https://nodejs.org/))
2. **Git**: Version 2.30+ ([Download Git](https://git-scm.com/))
3. **VS Code**: Visual Studio Code editor ([Download VS Code](https://code.visualstudio.com/))
4. **Android Device or Emulator** (for mobile testing):
   - Install **Expo Go** from Google Play Store on your physical Android phone, OR
   - Install **Android Studio** and configure an Android Virtual Device (AVD).

---

## 2. Directory Layout & Terminals

Open VS Code and open the root `WaterPurifierProject` folder. You will use two separate terminal tabs:

- **Terminal 1**: Admin Website (`WaterPurifierProject/admin`)
- **Terminal 2**: Android Mobile App (`WaterPurifierProject/mobile`)

> **Windows path note:** If the folder path contains `&`, npm scripts can fail because Windows passes that path through `cmd.exe`. In PowerShell, map the project folder to an unused drive letter first (replace `A:` if it is already in use). Use `npm.cmd` and `npx.cmd` to avoid PowerShell's blocked `.ps1` wrappers:
>
> ```powershell
> subst A: 'C:\Users\ELCOT\Downloads\aquapure---water-purifier-e-commerce-&-admin'
> Set-Location A:\WaterPurifierProject
> ```
>
> Use the mapped `A:` path for the commands below. Remove the mapping with `subst A: /d`.
---

## 3. Running the Admin Website

Open your first PowerShell terminal. The admin portal is in the nested `WaterPurifierProject\admin` folder; installing from the download root installs a different app.

```powershell
# Run the drive mapping from section 2 first if the original path contains &
Set-Location A:\WaterPurifierProject\admin

# Install dependencies in the admin app
npm.cmd install

# Create .env.local with the VITE_FIREBASE_* values from section 5

# Start the admin portal
npm.cmd run dev
```

The admin web portal will start on:
`http://localhost:3000` (or the port specified in terminal output).

---

## 4. Running the Android Expo Customer App

Open your second PowerShell terminal:

```powershell
# Run the drive mapping from section 2 first if the original path contains &
Set-Location A:\WaterPurifierProject\mobile

# Install dependencies in the mobile app
npm.cmd install

# Copy the mobile Firebase example and replace its placeholder values
Copy-Item .env.example .env

# Start the Expo development server
npx.cmd expo start
```

### Testing on Android:
1. Launch **Expo Go** on your Android phone connected to the same Wi-Fi network.
2. Scan the QR code displayed in your terminal.
3. The app bundle will download and open live with fast reload.

---

## 5. Environment Variables Configuration

Both applications connect to the same Firebase project. Replace the placeholders with the Firebase Web App configuration from **Project settings > General > Your apps**.

For `WaterPurifierProject/admin/.env.local`:

```ini
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

For `WaterPurifierProject/mobile/.env`, use the `EXPO_PUBLIC_` names from `mobile/.env.example`:

```ini
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_API_BASE_URL=https://your-aquapure-admin.vercel.app
```

Set `EXPO_PUBLIC_API_BASE_URL` to the deployed Vercel origin hosting the server APIs (no trailing slash). Restart Expo after changing these values. The mobile app cannot authenticate while Firebase example placeholders remain in `.env`, and secure checkout is unavailable until the API URL is configured.

Publish the root `firestore.rules` file to the same Firebase project before testing account, order, service, or dealer approval flows. You can publish it from Firebase Console or with the Firebase CLI. Refer to `FIREBASE_SETUP.md` for Firebase provisioning and initial admin bootstrapping instructions.

## 6. Android push notifications

The app registers the device's native Firebase token in `users/{uid}` and shows local order/service confirmation notifications. Remote status notifications are not registered from Expo Go; use an Android development or production build so tokens belong to the configured Firebase project. Add the Firebase Android app's `google-services.json` to `WaterPurifierProject/mobile/` (it is git-ignored), ensure its package name is `com.waterpurifier.ecommerce`, enable Firebase Cloud Messaging, and build/install the app. The dynamic Expo config detects the file and configures the native FCM plugin automatically. After installation, sign in to register a fresh token; confirm the Vercel service account and Android app both use project `waterpurifier-9f18a`.

## 7. Deploy the admin portal to Vercel

1. Import the repository in Vercel and set the project root to `WaterPurifierProject/admin`. The checked-in `vercel.json` configures the Vite build and SPA routing; API routes in `admin/api/` provide trusted checkout, catalogue import, and notifications.
2. Add the six `VITE_FIREBASE_*` values from section 5 as Vercel environment variables.
3. Set server-only `FIREBASE_PROJECT_ID=waterpurifier-9f18a` and `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel. The service account must belong to this project and have the required Firestore and FCM permissions. Never prefix the private key with `VITE_` or `EXPO_PUBLIC_`, put it in a client `.env`, or commit it.
4. In Firebase Console, enable Cloud Messaging API and ensure the service account has permission to send FCM messages.
5. Deploy from Vercel, set `EXPO_PUBLIC_API_BASE_URL` in the mobile `.env` to the deployment origin, and restart Expo.
6. Publish the complete repository-root `firestore.rules` in Firebase Console. Bootstrap the first admin record at `/admins/{uid}` through the Firebase Console; client-side admin record writes are denied.
7. Sign into the admin portal and select **Import demo catalogue** only if the `products` collection is empty. Test customer/dealer checkout, product stock, dealer approvals, admin account management, service desk, and push delivery.

The Vercel API functions require server credentials. Vite's local dev server does not host `/api` functions; use the deployed Vercel origin for mobile checkout, or run the Vercel development server from the admin project when its CLI is installed. The notification function sends only to devices with registered FCM tokens. Remote push delivery also requires a native Android build and Firebase Android configuration.
