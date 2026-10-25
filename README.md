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

## Deployment Guide

See [`WaterPurifierProject/docs/AquaPure-End-to-End-Guide.html`](WaterPurifierProject/docs/AquaPure-End-to-End-Guide.html) for the full Firebase, Vercel, Expo, Android build, and notification walkthrough.

## Security

Never commit `.env` files, `google-services.json`, or Firebase service-account credentials. The server service-account key belongs only in the Vercel environment configuration.
