# AquaPure Water Purifier Platform

E-commerce and operations platform for water purifiers, with customer and dealer shopping, an admin portal, order management, service bookings, and Firebase-backed notifications.

## Live Apps

- **Admin website:** [aquapure-admin-gules.vercel.app](https://aquapure-admin-gules.vercel.app)
- **Android development APK:** [Install the latest EAS build](https://expo.dev/accounts/waterpurifier/projects/aquapure-water-purifier/builds/0b2e8b67-6d36-41b7-b5b8-1fc476c820e0)

The Android APK is an internal **development build**, not a standalone production release. After installing it, start the mobile development server and open the project from the build:

```powershell
cd WaterPurifierProject/mobile
npx expo start --dev-client --tunnel
```

## Project Layout

- `WaterPurifierProject/admin/` contains the React admin website and Vercel API functions.
- `WaterPurifierProject/mobile/` contains the Expo customer/dealer Android app.
- `WaterPurifierProject/docs/` contains setup, Firebase, schema, testing, and deployment guides.
- `firestore.rules` contains the Firestore security rules to publish to the Firebase project.

## Local Development

Install and run each app from its own folder. Configure the environment files using the examples and instructions in [`WaterPurifierProject/docs/SETUP.md`](WaterPurifierProject/docs/SETUP.md).

Admin website:

```powershell
cd WaterPurifierProject/admin
npm install
npm run dev
```

Mobile app:

```powershell
cd WaterPurifierProject/mobile
npm install
npx expo start
```

## Notifications

For a manual notification test, the admin must be signed in and use the admin portal to change an order or service status. The customer must have opened the installed Android development build at least once, signed in to the same account that owns the order or booking, and granted notification permission so the app can save its Firebase device token.

Both screens do **not** need to remain open for remote notifications. Android should receive status notifications while AquaPure is in the background, provided notifications are enabled and the app has not been force-stopped or restricted by device battery settings. A heads-up banner is controlled by Android notification/channel settings; the notification may appear only in the notification shade.

To test: register the device token, press Home to background AquaPure (do not force-stop it), then change the relevant order or service status in the admin portal. New order placement currently shows a local confirmation; remote notifications are sent when an admin changes a status. If messages appear only while the app is open, check Android's AquaPure notification and `Orders and service` channel settings.

## Deployment Guide

See [`WaterPurifierProject/docs/AquaPure-End-to-End-Guide.html`](WaterPurifierProject/docs/AquaPure-End-to-End-Guide.html) for the full Firebase, Vercel, Expo, Android build, and notification walkthrough.

## Security

Never commit `.env` files, `google-services.json`, or Firebase service-account credentials. The server service-account key belongs only in the Vercel environment configuration.
