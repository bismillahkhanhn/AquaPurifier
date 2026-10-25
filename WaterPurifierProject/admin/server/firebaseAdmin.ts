import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminApp() {
  const existing = getApps().find((app) => app.name === '[DEFAULT]');
  if (existing) return existing;

  const accountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!accountJson) {
    throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.'), { statusCode: 503 });
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw Object.assign(new Error('FIREBASE_PROJECT_ID is not configured.'), { statusCode: 503 });
  }
  let serviceAccount: {
    type?: string;
    project_id?: string;
    client_email?: string;
    private_key?: string;
  };
  try {
    serviceAccount = JSON.parse(accountJson);
  } catch {
    throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.'), { statusCode: 503 });
  }
  if (
    serviceAccount.type !== 'service_account' ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing required service account fields.'), { statusCode: 503 });
  }
  if (serviceAccount.project_id !== projectId) {
    throw Object.assign(new Error('The Firebase service account does not belong to FIREBASE_PROJECT_ID.'), { statusCode: 503 });
  }
  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
    projectId,
  });
}

export async function verifyAdminRequest(authorization: string | undefined) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    throw Object.assign(new Error('Authentication required.'), { statusCode: 401 });
  }

  const app = getAdminApp();
  let caller: DecodedIdToken;
  try {
    caller = await getAuth(app).verifyIdToken(token);
  } catch {
    throw Object.assign(new Error('The Firebase sign-in token is invalid or expired.'), { statusCode: 401 });
  }
  const admin = await getFirestore(app).collection('admins').doc(caller.uid).get();
  if (!admin.exists) {
    throw Object.assign(new Error('Administrator access required.'), { statusCode: 403 });
  }
  return { app, caller };
}

export function errorStatus(error: unknown): number {
  return error && typeof error === 'object' && 'statusCode' in error &&
    typeof error.statusCode === 'number'
    ? error.statusCode
    : 500;
}
