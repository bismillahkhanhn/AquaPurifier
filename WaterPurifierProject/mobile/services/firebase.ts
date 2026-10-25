import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  type Persistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type ReactNativeAuthModule = typeof import('firebase/auth') & {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missingFirebaseConfig.length > 0) {
  console.error(`Missing Firebase environment values: ${missingFirebaseConfig.join(', ')}`);
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const { getReactNativePersistence } = require('firebase/auth') as ReactNativeAuthModule;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export { auth };
export const db = getFirestore(app);
export { app };
