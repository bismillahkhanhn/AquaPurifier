import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { MobileCartItem } from '../context/CartContext';
import { Order, Product, ServiceBooking, UserAddress, UserProfile } from '../types';
import { auth } from './firebase';

type CheckoutError = Error & { code?: string; status?: number };

function checkoutError(message: string, code: string, status?: number): CheckoutError {
  return Object.assign(new Error(message), { code, status });
}

export function subscribeToActiveProducts(
  onProducts: (products: Product[]) => void,
  onError: (error: Error) => void
) {
  const productsQuery = query(
    collection(db, 'products'),
    where('isActive', '==', true)
  );
  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs.flatMap((item) => {
        const data = item.data();
        if (
          typeof data.name !== 'string' ||
          typeof data.brand !== 'string' ||
          typeof data.category !== 'string' ||
          !Number.isSafeInteger(data.sellingPricePaise) ||
          !Number.isSafeInteger(data.dealerPricePaise) ||
          !Number.isSafeInteger(data.stockQuantity) ||
          !Number.isSafeInteger(data.dealerMinQuantity) ||
          !data.specifications ||
          typeof data.specifications.purificationTechnology !== 'string'
        ) {
          return [];
        }
        return [{ id: item.id, ...data } as Product];
      });
      onProducts(products);
    },
    onError
  );
}

export async function placeOrder({
  uid,
  profile,
  items,
  address,
  isDealer,
}: {
  uid: string;
  profile: UserProfile;
  items: MobileCartItem[];
  address: UserAddress;
  isDealer: boolean;
}) {
  if (!items.length) {
    throw new Error('Your cart is empty.');
  }
  if (isDealer !== (profile.role === 'dealer')) {
    throw new Error('The checkout account role changed. Sign in again and retry.');
  }
  if (isDealer &&
    (profile.dealerStatus !== 'approved' || profile.accountStatus !== 'active')) {
    throw new Error('Dealer checkout requires an approved, active dealer account.');
  }
  if (!isDealer &&
    (profile.role !== 'customer' || profile.accountStatus !== 'active')) {
    throw new Error('Customer checkout requires an active customer account.');
  }

  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw checkoutError('Your sign-in session expired. Sign in again before checkout.', 'unauthenticated', 401);
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
  if (!apiBaseUrl) {
    throw checkoutError('Secure checkout is not configured. Set EXPO_PUBLIC_API_BASE_URL to the deployed AquaPure API URL.', 'api-not-configured');
  }

  const fingerprint = JSON.stringify({
    items: items.map(({ product, quantity }) => [product.id, quantity]).sort(([left], [right]) =>
      String(left).localeCompare(String(right))
    ),
    address: [
      address.fullName.trim(),
      address.phone.trim(),
      address.addressLine1.trim(),
      address.addressLine2?.trim() || '',
      address.city.trim(),
      address.state.trim(),
      address.postalCode.trim(),
    ],
    role: profile.role,
  });
  const storageKey = `aquapure.checkout.${uid}`;
  let stored: { fingerprint: string; idempotencyKey: string } | null = null;
  const persisted = await AsyncStorage.getItem(storageKey);
  if (persisted) {
    try {
      stored = JSON.parse(persisted);
    } catch {
      await AsyncStorage.removeItem(storageKey);
    }
  }
  if (!stored || stored.fingerprint !== fingerprint) {
    stored = {
      fingerprint,
      idempotencyKey: doc(collection(db, 'orders')).id,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(stored));
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await currentUser.getIdToken()}`,
      },
      body: JSON.stringify({
        idempotencyKey: stored.idempotencyKey,
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        shippingAddress: address,
      }),
    });
  } catch (error) {
    throw checkoutError(
      error instanceof Error ? error.message : 'Network request failed.',
      'network-request-failed'
    );
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof result.error === 'string' ? result.error : 'Order could not be placed.';
    throw checkoutError(message, result.code || `http-${response.status}`, response.status);
  }
  if (typeof result.id !== 'string' || !result.id) {
    throw checkoutError('The server response did not include an order ID. Retry checkout to safely recover the same request.', 'invalid-response');
  }
  try {
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('Order was created but checkout-key cleanup failed', error);
  }
  return result.id;
}

export function subscribeToOrders(
  uid: string,
  onOrders: (orders: Order[]) => void,
  onError: (error: Error) => void
) {
  const ordersQuery = query(collection(db, 'orders'), where('customerId', '==', uid));
  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as Order)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      onOrders(orders);
    },
    onError
  );
}

export function subscribeToServiceBookings(
  uid: string,
  onBookings: (bookings: ServiceBooking[]) => void,
  onError: (error: Error) => void
) {
  const bookingsQuery = query(
    collection(db, 'serviceBookings'),
    where('customerId', '==', uid)
  );
  return onSnapshot(
    bookingsQuery,
    (snapshot) => {
      const bookings = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as ServiceBooking)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      onBookings(bookings);
    },
    onError
  );
}

export async function createServiceBooking({
  uid,
  profile,
  booking,
}: {
  uid: string;
  profile: UserProfile;
  booking: Pick<
    ServiceBooking,
    | 'serviceType'
    | 'purifierModelOrBrand'
    | 'preferredDate'
    | 'preferredTimeSlot'
    | 'serviceAddress'
    | 'serviceCostPaise'
  >;
}) {
  const now = new Date().toISOString();
  const bookingRef = await addDoc(collection(db, 'serviceBookings'), {
    bookingNumber: `SV-${Date.now().toString().slice(-8)}`,
    customerId: uid,
    customerName: profile.displayName || profile.name || '',
    customerPhone: profile.phoneNumber || '',
    customerEmail: profile.email,
    ...booking,
    status: 'booked',
    createdAt: now,
    updatedAt: now,
  });
  return bookingRef.id;
}

export async function createDealerApplication({
  uid,
  profile,
  businessName,
  gstNumber,
}: {
  uid: string;
  profile: Pick<UserProfile, 'displayName' | 'name' | 'email' | 'phoneNumber'>;
  businessName: string;
  gstNumber: string;
}) {
  const now = new Date().toISOString();
  await setDoc(doc(db, 'dealerApplications', uid), {
    userId: uid,
    applicantName: profile.displayName || profile.name || '',
    email: profile.email,
    phoneNumber: profile.phoneNumber || '',
    businessName: businessName.trim(),
    gstNumber: gstNumber.trim().toUpperCase(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  });
}
