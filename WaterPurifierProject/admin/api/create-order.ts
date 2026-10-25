import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminApp } from '../server/firebaseAdmin.js';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { DocumentSnapshot } from 'firebase-admin/firestore';

type CheckoutItem = { productId: string; quantity: number };
type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
};

function invalidRequest(message: string) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 &&
    value.trim().length <= maxLength;
}

function isAddress(value: unknown): value is ShippingAddress {
  if (!value || typeof value !== 'object') return false;
  const address = value as Record<string, unknown>;
  return isText(address.fullName, 100) &&
    isText(address.phone, 20) &&
    isText(address.addressLine1, 200) &&
    (address.addressLine2 === undefined ||
      (typeof address.addressLine2 === 'string' && address.addressLine2.length <= 200)) &&
    isText(address.city, 100) &&
    isText(address.state, 100) &&
    typeof address.postalCode === 'string' && /^\d{6}$/.test(address.postalCode);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Authentication required.' });
    const app = getAdminApp();
    const identity = await getAuth(app).verifyIdToken(token);
    const body = req.body || {};
    const key = body.idempotencyKey;
    const items = body.items as CheckoutItem[];
    if (
      typeof key !== 'string' ||
      !/^[A-Za-z0-9_-]{20}$/.test(key) ||
      !Array.isArray(items) ||
      items.length < 1 ||
      items.length > 30 ||
      !isAddress(body.shippingAddress)
    ) {
      throw invalidRequest('Checkout details are invalid. Review your cart and delivery address.');
    }

    const seen = new Set<string>();
    for (const item of items) {
      if (
        !item || typeof item.productId !== 'string' ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(item.productId) ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100 ||
        seen.has(item.productId)
      ) {
        throw invalidRequest('Cart items are invalid. Remove duplicate products and try again.');
      }
      seen.add(item.productId);
    }

    const db = getFirestore(app);
    const orderRef = db.collection('orders').doc(key);
    const userRef = db.collection('users').doc(identity.uid);
    const productRefs = items.map((item) => db.collection('products').doc(item.productId));
    const orderNumber = `AQ-${Date.now().toString().slice(-8)}`;
    const transactionResult = await db.runTransaction(async (transaction) => {
      const existingOrder = await transaction.get(orderRef);
      if (existingOrder.exists) {
        if (existingOrder.data()?.customerId !== identity.uid) {
          throw Object.assign(new Error('This checkout request key has already been used.'), { statusCode: 409 });
        }
        return { id: orderRef.id, orderNumber: existingOrder.data()?.orderNumber, reused: true };
      }

      const userSnapshot = await transaction.get(userRef);
      if (!userSnapshot.exists) {
        throw Object.assign(new Error('Your Firestore profile is missing. Sign in again or contact support.'), { statusCode: 403 });
      }
      const profile = userSnapshot.data()!;
      const isCustomer = profile.role === 'customer' && profile.accountStatus === 'active';
      const isDealer = profile.role === 'dealer' &&
        profile.dealerStatus === 'approved' && profile.accountStatus === 'active';
      if (!isCustomer && !isDealer) {
        throw Object.assign(new Error('Your account is not active for checkout. Dealer accounts require approval.'), { statusCode: 403 });
      }

      const productSnapshots: DocumentSnapshot[] = [];
      for (const productRef of productRefs) {
        productSnapshots.push(await transaction.get(productRef));
      }

      const address = body.shippingAddress as ShippingAddress;
      const orderItems = items.map((item, index) => {
        const snapshot = productSnapshots[index];
        if (!snapshot.exists) {
          throw Object.assign(new Error(`Product ${item.productId} is no longer available.`), { statusCode: 409 });
        }
        const product = snapshot.data()!;
        const retailPrice = product.sellingPricePaise;
        const dealerPrice = product.dealerPricePaise;
        const stock = product.stockQuantity;
        const minQuantity = product.dealerMinQuantity;
        if (
          product.isActive !== true ||
          !Number.isSafeInteger(retailPrice) || retailPrice <= 0 ||
          !Number.isSafeInteger(dealerPrice) || dealerPrice <= 0 || dealerPrice > retailPrice ||
          !Number.isSafeInteger(stock) || stock < 0 ||
          !Number.isSafeInteger(minQuantity) || minQuantity < 1
        ) {
          throw Object.assign(new Error(`Product ${item.productId} has invalid catalogue data. Contact support.`), { statusCode: 409 });
        }
        if (item.quantity > stock) {
          throw Object.assign(new Error(`${product.name} has only ${stock} units available.`), { statusCode: 409 });
        }
        if (isDealer && item.quantity < minQuantity) {
          throw Object.assign(new Error(`${product.name} requires a dealer minimum quantity of ${minQuantity}.`), { statusCode: 400 });
        }
        const unitPricePaise = isDealer ? dealerPrice : retailPrice;
        return {
          productRef: productRefs[index],
          productId: snapshot.id,
          productName: product.name,
          productImage: Array.isArray(product.images) ? product.images[0] || '' : '',
          category: product.category || '',
          brand: product.brand || '',
          quantity: item.quantity,
          unitPricePaise,
          totalPricePaise: unitPricePaise * item.quantity,
          stock,
        };
      });

      const subtotalPaise = orderItems.reduce((total, item) => total + item.totalPricePaise, 0);
      if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise <= 0) {
        throw invalidRequest('The cart total is invalid. Refresh the catalogue and try again.');
      }
      const deliveryFeePaise = subtotalPaise > 100000 ? 0 : 9900;
      const now = new Date().toISOString();
      const savedAddresses = Array.isArray(profile.savedAddresses) ? profile.savedAddresses : [];
      const addressExists = savedAddresses.some((saved: Record<string, unknown>) =>
        saved.addressLine1 === address.addressLine1 &&
        saved.postalCode === address.postalCode
      );

      transaction.set(orderRef, {
        orderNumber,
        customerId: identity.uid,
        customerName: profile.displayName || profile.name || identity.name || '',
        customerEmail: identity.email || profile.email || '',
        customerPhone: address.phone.trim(),
        orderType: isDealer ? 'dealer_wholesale' : 'customer_retail',
        items: orderItems.map(({ productRef: _ref, stock: _stock, ...item }) => item),
        itemsCount: orderItems.reduce((count, item) => count + item.quantity, 0),
        subtotalPaise,
        taxPaise: 0,
        deliveryFeePaise,
        totalAmountPaise: subtotalPaise + deliveryFeePaise,
        paymentMethod: isDealer ? 'dealer_credit' : 'cash_on_delivery',
        paymentStatus: 'pending',
        shippingAddress: {
          ...address,
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          addressLine1: address.addressLine1.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.postalCode.trim(),
          isDefault: false,
        },
        orderStatus: 'pending',
        statusTimeline: [{ status: 'pending', note: 'Order received', timestamp: now }],
        serviceRequested: false,
        createdAt: now,
        updatedAt: now,
      });
      for (const item of orderItems) {
        transaction.update(item.productRef, { stockQuantity: item.stock - item.quantity, updatedAt: now });
      }
      if (!addressExists || profile.phoneNumber !== address.phone) {
        transaction.update(userRef, {
          savedAddresses: addressExists ? savedAddresses : [...savedAddresses, {
            ...address,
            fullName: address.fullName.trim(),
            phone: address.phone.trim(),
            addressLine1: address.addressLine1.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            postalCode: address.postalCode.trim(),
            isDefault: false,
          }],
          phoneNumber: address.phone.trim(),
          updatedAt: now,
        });
      }
      return { id: orderRef.id, orderNumber, reused: false };
    });

    return res.status(transactionResult.reused ? 200 : 201).json(transactionResult);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
    const errorName = error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : 'UnknownError';
    const status = error && typeof error === 'object' && 'statusCode' in error &&
      typeof error.statusCode === 'number'
      ? error.statusCode
      : code.startsWith('auth/') ? 401
        : code === 'permission-denied' || code === '7' ? 503 : 500;
    if (status >= 500) {
      const message = error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'No error message provided.';
      console.error('Order creation failed', { name: errorName, code: code || 'unknown', message });
    }
    const publicError = code === 'permission-denied' || code === '7'
      ? 'Checkout service account is missing Firestore access. Check its Google Cloud IAM permissions.'
      : status === 503
        ? error instanceof Error ? error.message : 'Secure checkout configuration is incomplete.'
        : status >= 500
          ? 'Secure checkout encountered a server error. Check the Vercel function logs.'
          : error instanceof Error ? error.message : 'Checkout details are invalid.';
    return res.status(status).json({
      error: publicError,
      code: status === 401
        ? 'unauthenticated'
        : code === 'permission-denied' || code === '7'
          ? 'firebase-service-account-permission-denied'
          : status === 503
            ? 'checkout-configuration'
            : status >= 500 ? 'internal' : code || 'invalid-request',
    });
  }
}
