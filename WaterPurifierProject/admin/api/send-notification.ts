import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { errorStatus, verifyAdminRequest } from '../server/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { recipientUid, title, body } = req.body || {};
  if (
    typeof recipientUid !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,128}$/.test(recipientUid) ||
    typeof title !== 'string' ||
    title.length < 1 ||
    title.length > 80 ||
    typeof body !== 'string' ||
    body.length < 1 ||
    body.length > 300
  ) {
    return res.status(400).json({ error: 'Invalid notification request.' });
  }

  try {
    const { app } = await verifyAdminRequest(req.headers.authorization);
    const db = getFirestore(app);
    const recipient = await db.collection('users').doc(recipientUid).get();
    const pushToken = recipient.data()?.pushToken;
    if (typeof pushToken !== 'string' || !pushToken) {
      return res.status(404).json({
        code: 'push-token-missing',
        error: 'The order was saved, but this customer has no registered device token. Open the mobile app in a development or production build and sign in to register notifications.',
      });
    }

    const messageId = await getMessaging(app).send({
      token: pushToken,
      notification: { title, body },
      android: { priority: 'high', notification: { channelId: 'orders' } },
      data: { title, body },
    });
    return res.status(200).json({ messageId });
  } catch (error) {
    const status = errorStatus(error);
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
    if (status >= 500) {
      console.error('FCM notification send failed', { code: code || 'unknown' });
    }
    const tokenIsStale = code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token';
    const projectMismatch = code === 'messaging/mismatched-credential';
    return res.status(status).json({
      code: status === 401 || status === 403
        ? 'admin-authorization'
        : tokenIsStale
          ? 'push-token-stale'
          : projectMismatch
            ? 'push-project-mismatch'
          : code === 'messaging/third-party-auth-error'
            ? 'fcm-configuration'
            : 'push-send-failed',
      error: status === 401 || status === 403
        ? error instanceof Error ? error.message : 'Administrator access required.'
        : tokenIsStale
          ? 'The order was saved, but the customer device token is no longer valid. Ask them to reopen the mobile app to register notifications again.'
          : projectMismatch
            ? 'The order was saved, but the device push token and Vercel Firebase service account belong to different Firebase projects. Ensure both use waterpurifier-9f18a, then reinstall or reopen the Android app to register a new token.'
          : code === 'messaging/third-party-auth-error'
            ? 'The order was saved, but Firebase Cloud Messaging credentials are not configured correctly.'
            : 'The order was saved, but Firebase Cloud Messaging could not deliver the notification. Check the Vercel function logs and Firebase Cloud Messaging setup.',
    });
  }
}
