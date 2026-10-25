import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFirestore } from 'firebase-admin/firestore';
import { SAMPLE_PRODUCTS } from '../src/data/products.js';
import { errorStatus, verifyAdminRequest } from '../server/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { app } = await verifyAdminRequest(req.headers.authorization);
    const db = getFirestore(app);
    const catalog = db.collection('products');
    const marker = db.collection('catalogMetadata').doc('demo-catalog-v1');
    await db.runTransaction(async (transaction) => {
      const [existingProducts, existingMarker] = await Promise.all([
        transaction.get(catalog.limit(1)),
        transaction.get(marker),
      ]);
      if (!existingProducts.empty || existingMarker.exists) {
        throw Object.assign(
          new Error('The Firestore catalogue is not empty. Import is allowed only into an empty catalogue to protect existing products and stock.'),
          { statusCode: 409 }
        );
      }

      for (const product of SAMPLE_PRODUCTS) {
        const { id, ...data } = product;
        transaction.create(catalog.doc(id), {
          ...data,
          id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      transaction.create(marker, {
        catalogue: 'demo',
        importedProducts: SAMPLE_PRODUCTS.length,
        createdAt: new Date().toISOString(),
      });
    });
    return res.status(201).json({ imported: SAMPLE_PRODUCTS.length });
  } catch (error) {
    const status = errorStatus(error);
    if (status >= 500) console.error('Demo catalogue import failed', error);
    return res.status(status).json({
      error: error instanceof Error ? error.message : 'Catalogue import failed.',
    });
  }
}
