import React, { useEffect, useState } from 'react';
import { paiseToINR } from './utils/currency';
import { auth, db } from './services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { Product, ProductCategory } from './types';

const currency = (valuePaise: number) => paiseToINR(valuePaise);

async function sendAdminPush(recipientUid: string, title: string, body: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Admin session expired.');
  const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await currentUser.getIdToken()}`,
    },
    body: JSON.stringify({ recipientUid, title, body }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(typeof result.error === 'string' ? result.error : 'Push notification failed.');
  }
}

type AdminOrder = {
  id: string;
  customerId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderType: string;
  totalAmountPaise: number;
  orderStatus: string;
  statusTimeline?: { status: string; note: string; timestamp: string }[];
  createdAt: string;
};

type AdminApplication = {
  id: string;
  userId: string;
  applicantName: string;
  businessName: string;
  email: string;
  gstNumber: string;
  status: 'pending' | 'approved' | 'rejected';
};

type AdminBooking = {
  id: string;
  customerId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
};

type AdminProduct = Product;

type AdminUser = {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  dealerStatus?: string;
  accountStatus?: string;
};

const ADMIN_ROUTES = [
  { path: '/admin', label: 'Overview', eyebrow: 'Workspace' },
  { path: '/admin/catalogue', label: 'Catalogue', eyebrow: 'Inventory' },
  { path: '/admin/customers', label: 'Customers', eyebrow: 'Accounts' },
  { path: '/admin/orders', label: 'Orders', eyebrow: 'Commerce' },
  { path: '/admin/dealers', label: 'Dealers', eyebrow: 'Applications' },
  { path: '/admin/services', label: 'Services', eyebrow: 'Support' },
] as const;

function getAdminRoute(pathname: string) {
  return ADMIN_ROUTES.find((route) => route.path === pathname) || ADMIN_ROUTES[0];
}

export default function App() {
  const [pathname, setPathname] = useState(() => getAdminRoute(window.location.pathname).path);
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dealerApplications, setDealerApplications] = useState<AdminApplication[]>([]);
  const [serviceBookings, setServiceBookings] = useState<AdminBooking[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [productEdits, setProductEdits] = useState<Record<string, Partial<AdminProduct>>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productCategory, setProductCategory] = useState<ProductCategory>('ro_purifiers');
  const [productRetailPrice, setProductRetailPrice] = useState('');
  const [productDealerPrice, setProductDealerPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [seedingCatalog, setSeedingCatalog] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [dataError, setDataError] = useState('');
  const [updating, setUpdating] = useState('');
  const currentRoute = getAdminRoute(pathname);

  const navigate = (path: string) => {
    const route = getAdminRoute(path);
    if (window.location.pathname !== route.path) {
      window.history.pushState({}, '', route.path);
    }
    setPathname(route.path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => setPathname(getAdminRoute(window.location.pathname).path);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.title = `${currentRoute.label} · AquaPure Admin`;
  }, [currentRoute]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setCheckingAccess(true);
      setAuthorized(false);
      if (!currentUser) {
        setCheckingAccess(false);
        return;
      }
      try {
        const adminRecord = await getDoc(doc(db, 'admins', currentUser.uid));
        if (!adminRecord.exists()) {
          await signOut(auth);
          setAuthError('This account is not authorized to access the admin portal.');
          return;
        }
        setAuthorized(true);
        setAuthError('');
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String(error.code)
            : 'unknown';
        console.error('Admin authorization check failed', { code });
        setAuthError(
          code === 'permission-denied'
            ? 'Firestore denied the admin check. Publish the project Firestore rules and confirm an /admins/{your Firebase UID} record exists.'
            : code === 'unavailable' || code === 'network-request-failed'
              ? 'Firebase is unreachable. Check your connection and try again.'
              : `Could not verify admin access (Firebase: ${code}). Check the Firebase project configuration and admin record.`
        );
      } finally {
        setCheckingAccess(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const handleDataError = (error: Error) => {
      console.error('Admin data subscription failed', error);
      setDataError('Some admin data could not be loaded. Verify Firestore rules and connection.');
    };
    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => setOrders(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }) as AdminOrder)),
      handleDataError
    );
    const unsubscribeApplications = onSnapshot(
      query(collection(db, 'dealerApplications'), where('status', '==', 'pending')),
      (snapshot) => setDealerApplications(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }) as AdminApplication)),
      handleDataError
    );
    const unsubscribeBookings = onSnapshot(
      collection(db, 'serviceBookings'),
      (snapshot) => setServiceBookings(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }) as AdminBooking)),
      handleDataError
    );
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => setProducts(snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }) as AdminProduct)),
      handleDataError
    );
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const nextUsers = snapshot.docs.map((item) => ({
          uid: item.id,
          ...item.data(),
        }) as AdminUser);
        setUsers(nextUsers);
        setUserCount(snapshot.size);
      },
      handleDataError
    );
    return () => {
      unsubscribeOrders();
      unsubscribeApplications();
      unsubscribeBookings();
      unsubscribeProducts();
      unsubscribeUsers();
    };
  }, [authorized]);

  const reviewDealer = async (application: AdminApplication, decision: 'approved' | 'rejected') => {
    setUpdating(application.id);
    setDataError('');
    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', application.userId), {
        dealerStatus: decision,
        accountStatus: decision === 'approved' ? 'active' : 'pending',
        updatedAt: now,
      });
      batch.update(doc(db, 'dealerApplications', application.id), {
        status: decision,
        reviewedByAdminId: user?.uid || '',
        reviewedAt: now,
        updatedAt: now,
      });
      await batch.commit();
      try {
        await sendAdminPush(
          application.userId,
          `Dealer application ${decision}`,
          decision === 'approved'
            ? 'Your AquaPure dealer account is approved. Wholesale prices are now available.'
            : 'Your AquaPure dealer application was not approved. Contact support for details.'
        );
      } catch (notificationError) {
        console.warn('Dealer status saved but push notification failed', notificationError);
        setDataError(`Dealer ${decision}, but push notification failed: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`);
      }
    } catch (error) {
      console.error(`Failed to ${decision} dealer application`, error);
      setDataError('Dealer review failed. Check Firestore rules and try again.');
    } finally {
      setUpdating('');
    }
  };

  const updateOrder = async (order: AdminOrder, status: string) => {
    setUpdating(order.id);
    setDataError('');
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'orders', order.id), {
        orderStatus: status,
        statusTimeline: [
          ...(order.statusTimeline || []),
          { status, note: 'Status updated by admin', timestamp: now },
        ],
        updatedAt: now,
      });
      try {
        await sendAdminPush(
          order.customerId,
          'AquaPure order updated',
          `Your order ${order.orderNumber} is now ${status.replace(/_/g, ' ')}.`
        );
      } catch (notificationError) {
        console.warn('Order status saved but push notification failed', notificationError);
        setDataError(`Order saved, but push notification failed: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`);
      }
    } catch (error) {
      console.error('Failed to update order status', error);
      setDataError('Order status update failed. Check Firestore rules and try again.');
    } finally {
      setUpdating('');
    }
  };

  const updateBooking = async (booking: AdminBooking, status: string) => {
    setUpdating(booking.id);
    setDataError('');
    try {
      await updateDoc(doc(db, 'serviceBookings', booking.id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      try {
        await sendAdminPush(
          booking.customerId,
          'AquaPure service request updated',
          `Your service booking ${booking.bookingNumber} is now ${status.replace(/_/g, ' ')}.`
        );
      } catch (notificationError) {
        console.warn('Service status saved but push notification failed', notificationError);
        setDataError(`Service request saved, but push notification failed: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`);
      }
    } catch (error) {
      console.error('Failed to update service booking', error);
      setDataError('Service desk update failed. Check Firestore rules and try again.');
    } finally {
      setUpdating('');
    }
  };

  const seedCatalog = async () => {
    if (!user) return;
    setSeedingCatalog(true);
    setDataError('');
    try {
      const response = await fetch('/api/seed-catalog', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Catalogue import failed.');
    } catch (error) {
      console.error('Demo catalogue import failed', error);
      setDataError(error instanceof Error ? error.message : 'Catalogue import failed.');
    } finally {
      setSeedingCatalog(false);
    }
  };

  const createProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!productName.trim() || !productBrand.trim()) {
      setDataError('Enter a product name and brand.');
      return;
    }
    const retail = Number(productRetailPrice);
    const wholesale = Number(productDealerPrice);
    const stock = Number(productStock);
    if (
      !Number.isSafeInteger(retail) || retail <= 0 ||
      !Number.isSafeInteger(wholesale) || wholesale <= 0 || wholesale > retail ||
      !Number.isSafeInteger(stock) || stock < 0
    ) {
      setDataError('Prices must be positive integer paise, wholesale price cannot exceed retail, and stock must be a non-negative integer.');
      return;
    }
    setSavingProduct(true);
    setDataError('');
    try {
      const now = new Date().toISOString();
      const productRef = doc(collection(db, 'products'));
      await setDoc(productRef, {
        id: productRef.id,
        name: productName.trim(),
        slug: productName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        category: productCategory,
        brand: productBrand.trim(),
        description: productName.trim(),
        sellingPricePaise: retail,
        dealerPricePaise: wholesale,
        dealerMinQuantity: 1,
        stockQuantity: stock,
        images: [],
        specifications: {
          purificationTechnology: 'Not specified',
          storageCapacityLitres: 0,
          purificationSpeedLph: 0,
          suitableForTdsPpm: 'Not specified',
          filterCartridges: [],
          warrantyYears: 0,
          powerConsumptionWatts: 0,
        },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      setProductName('');
      setProductBrand('');
      setProductRetailPrice('');
      setProductDealerPrice('');
      setProductStock('');
    } catch (error) {
      console.error('Product creation failed', error);
      setDataError('Product creation failed. Verify admin authorization and Firestore rules.');
    } finally {
      setSavingProduct(false);
    }
  };

  const saveProduct = async (product: AdminProduct) => {
    const edit = productEdits[product.id] || {};
    const retail = Number(edit.sellingPricePaise ?? product.sellingPricePaise);
    const wholesale = Number(edit.dealerPricePaise ?? product.dealerPricePaise);
    const stock = Number(edit.stockQuantity ?? product.stockQuantity);
    const minQuantity = Number(edit.dealerMinQuantity ?? product.dealerMinQuantity);
    if (
      !Number.isSafeInteger(retail) || retail <= 0 ||
      !Number.isSafeInteger(wholesale) || wholesale <= 0 || wholesale > retail ||
      !Number.isSafeInteger(stock) || stock < 0 ||
      !Number.isSafeInteger(minQuantity) || minQuantity < 1
    ) {
      setDataError('Product prices, stock, or minimum quantity are invalid.');
      return;
    }
    setUpdating(product.id);
    setDataError('');
    try {
      await updateDoc(doc(db, 'products', product.id), {
        sellingPricePaise: retail,
        dealerPricePaise: wholesale,
        stockQuantity: stock,
        dealerMinQuantity: minQuantity,
        isActive: edit.isActive ?? product.isActive,
        updatedAt: new Date().toISOString(),
      });
      setProductEdits((current) => {
        const next = { ...current };
        delete next[product.id];
        return next;
      });
      setEditingProductId(null);
    } catch (error) {
      console.error('Product update failed', error);
      setDataError('Product update failed. Verify admin authorization and Firestore rules.');
    } finally {
      setUpdating('');
    }
  };

  const cancelProductEdit = (productId: string) => {
    setProductEdits((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setEditingProductId(null);
  };

  const removeProduct = async (product: AdminProduct) => {
    setUpdating(product.id);
    setDataError('');
    try {
      await deleteDoc(doc(db, 'products', product.id));
      if (editingProductId === product.id) {
        setEditingProductId(null);
        setProductEdits((current) => {
          const next = { ...current };
          delete next[product.id];
          return next;
        });
      }
    } catch (error) {
      console.error('Product deletion failed', error);
      setDataError('Product deletion failed. Verify admin authorization and Firestore rules.');
    } finally {
      setUpdating('');
    }
  };

  const updateAccountStatus = async (account: AdminUser) => {
    const nextStatus = account.accountStatus === 'suspended' ? 'active' : 'suspended';
    setUpdating(account.uid);
    setDataError('');
    try {
      await updateDoc(doc(db, 'users', account.uid), {
        accountStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Account status update failed', error);
      setDataError('Account status update failed. Verify admin authorization and Firestore rules.');
    } finally {
      setUpdating('');
    }
  };

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String(error.code)
          : '';
      setAuthError(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found'
          ? 'Incorrect email or password.'
          : code === 'auth/invalid-api-key'
            ? 'Firebase is not configured. Check the VITE_FIREBASE_* values.'
            : code === 'auth/network-request-failed'
              ? 'Firebase sign-in is unreachable. Check your connection and try again.'
              : `Unable to sign in (Firebase: ${code || 'unknown'}). Check Firebase Authentication settings and try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAccess) {
    return React.createElement(
      'main',
      { className: 'flex min-h-screen items-center justify-center bg-slate-100 text-slate-600' },
      'Checking admin access...'
    );
  }

  if (!user || !authorized) {
    return React.createElement(
      'main',
      { className: 'relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10' },
      React.createElement('div', { className: 'pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl' }),
      React.createElement('div', { className: 'pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl' }),
      React.createElement(
        'form',
        {
          className: 'relative z-10 w-full max-w-md space-y-6 rounded-3xl border border-white/70 bg-white p-7 shadow-2xl shadow-black/30 sm:p-9',
          onSubmit: handleAdminLogin,
        },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 text-sm font-black tracking-wide text-white shadow-lg shadow-cyan-700/25' }, 'AP'),
          React.createElement('p', { className: 'text-xs font-bold uppercase tracking-[0.2em] text-cyan-700' }, 'AquaPure operations'),
          React.createElement('h1', { className: 'mt-2 text-3xl font-bold tracking-tight text-slate-950' }, 'Welcome back'),
          React.createElement('p', { className: 'mt-2 text-sm leading-6 text-slate-500' }, 'Sign in with your authorized administrator account to continue.')
        ),
        React.createElement('label', { className: 'block text-sm font-semibold text-slate-700' },
          'Admin email',
          React.createElement('input', {
            className: 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-600/10',
            type: 'email',
            autoComplete: 'username',
            required: true,
            placeholder: 'admin@example.com',
            value: email,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
          })
        ),
        React.createElement('label', { className: 'block text-sm font-semibold text-slate-700' },
          'Password',
          React.createElement('input', {
            className: 'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-600/10',
            type: 'password',
            autoComplete: 'current-password',
            required: true,
            placeholder: 'Enter your password',
            value: password,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value),
          })
        ),
        authError
          ? React.createElement('p', { className: 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700', role: 'alert' }, authError)
          : null,
        React.createElement(
          'button',
          {
            className: 'w-full rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-800/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60',
            type: 'submit',
            disabled: submitting,
          },
          submitting ? 'Signing in...' : 'Sign in'
        )
      )
    );
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmountPaise || 0), 0);
  const openOrders = orders.filter((order) => order.orderStatus !== 'delivered').length;
  const pendingDealers = dealerApplications.length;
  const lowStock = products.filter((product) => product.stockQuantity < 20).length;

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-slate-50 text-slate-900' },
    React.createElement(
      'header',
      { className: 'sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur' },
      React.createElement(
        'div',
        { className: 'mx-auto max-w-7xl px-4 sm:px-6' },
        React.createElement('div', { className: 'flex min-h-20 flex-col items-stretch gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4' },
          React.createElement('div', { className: 'flex min-w-0 items-center gap-3' },
            React.createElement('div', { className: 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-600 text-sm font-black tracking-wide text-white shadow-lg shadow-cyan-600/20' }, 'AP'),
            React.createElement('div', { className: 'min-w-0' },
              React.createElement('p', { className: 'text-xs font-bold uppercase tracking-[0.18em] text-cyan-700' }, 'AquaPure'),
              React.createElement('h1', { className: 'truncate text-base font-bold leading-tight text-slate-900 sm:text-xl' }, 'Operations dashboard')
            )
          ),
          React.createElement('div', { className: 'flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:justify-start sm:gap-3' },
            React.createElement('span', { className: 'hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex' },
              React.createElement('span', { className: 'h-2 w-2 rounded-full bg-emerald-500' }),
              'Live connection'
            ),
            React.createElement('button', {
              className: 'min-h-11 whitespace-nowrap rounded-xl bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-800 sm:px-4',
              onClick: () => navigate('/admin/catalogue'),
            }, '+ New product'),
            React.createElement('button', {
              className: 'min-h-11 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50',
              onClick: () => signOut(auth),
            }, 'Sign out')
          )
        ),
        React.createElement('nav', { className: 'admin-nav -mb-px flex gap-1 overflow-x-auto border-t border-slate-100 py-2', 'aria-label': 'Admin sections' },
          ...ADMIN_ROUTES.map((route) => React.createElement('a', {
            key: route.path,
            href: route.path,
            'aria-current': currentRoute.path === route.path ? 'page' : undefined,
            onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
              event.preventDefault();
              navigate(route.path);
            },
            className: `min-h-11 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition ${currentRoute.path === route.path ? 'bg-cyan-50 text-cyan-800' : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-800'}`,
          }, route.label))
        )
      )
    ),
    React.createElement(
      'main',
      { className: 'mx-auto min-w-0 max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8' },
      currentRoute.path === '/admin'
        ? React.createElement('section', { className: 'relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-cyan-800 px-6 py-7 text-white shadow-xl shadow-cyan-950/10 sm:px-8 sm:py-9' },
        React.createElement('div', { className: 'relative z-10 max-w-2xl' },
          React.createElement('p', { className: 'mb-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200' }, 'AquaPure commerce'),
          React.createElement('h2', { className: 'text-2xl font-bold tracking-tight sm:text-3xl' }, 'Your business, at a glance.'),
          React.createElement('p', { className: 'mt-2 max-w-xl text-sm leading-6 text-cyan-50/80 sm:text-base' }, 'Manage catalogue, customer orders, dealer approvals, and service requests from one place.')
        ),
        React.createElement('div', { className: 'pointer-events-none absolute -right-12 -top-28 h-80 w-80 rounded-full border-[36px] border-cyan-300/10' }),
        React.createElement('div', { className: 'pointer-events-none absolute -bottom-36 right-36 h-64 w-64 rounded-full border-[28px] border-white/5' })
        )
        : React.createElement('section', { className: 'flex flex-wrap items-end justify-between gap-3' },
          React.createElement('div', null,
            React.createElement('p', { className: 'text-xs font-bold uppercase tracking-[0.18em] text-cyan-700' }, currentRoute.eyebrow),
            React.createElement('h2', { className: 'mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl' }, currentRoute.label),
            React.createElement('p', { className: 'mt-1 text-sm text-slate-500' }, `Manage AquaPure ${currentRoute.label.toLowerCase()} in one place.`)
          )
        ),
      React.createElement(
        'section',
        { id: 'overview', className: `${currentRoute.path === '/admin' ? 'grid' : 'hidden'} gap-4 sm:grid-cols-2 xl:grid-cols-4` },
        StatCard('Order Revenue', currency(totalRevenue), 'cyan'),
        StatCard('Open Orders', String(openOrders), 'amber'),
        StatCard('Pending Dealers', String(pendingDealers), 'violet'),
        StatCard('Low Stock', String(lowStock), 'rose')
      ),
      dataError ? React.createElement('p', { className: 'rounded-lg bg-red-50 p-3 text-sm text-red-700', role: 'alert' }, dataError) : null,
      React.createElement(
        'section',
        { id: 'product-management', className: `${currentRoute.path === '/admin/catalogue' ? 'block' : 'hidden'} space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` },
        React.createElement('div', { className: 'flex flex-wrap items-center justify-between gap-3' },
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-xl font-semibold' }, 'Firestore Product Catalogue'),
            React.createElement('p', { className: 'text-sm text-slate-500' }, `${products.length} live products · prices are integer paise`)
          ),
          products.length === 0
            ? React.createElement('button', {
              className: 'rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
              disabled: seedingCatalog,
              onClick: seedCatalog,
            }, seedingCatalog ? 'Importing...' : 'Import demo catalogue')
            : null
        ),
        products.length === 0
          ? React.createElement('p', { className: 'text-sm text-slate-600' }, 'No Firestore products yet. Import the sample catalogue to enable live mobile browsing and secure checkout.')
          : React.createElement('div', { className: 'w-full overflow-x-auto' },
            React.createElement('table', { className: 'min-w-[700px] text-left text-sm' },
              React.createElement('thead', { className: 'bg-slate-50 text-slate-600' },
                React.createElement('tr', null,
                  ...['Product', 'Retail paise', 'Dealer paise', 'MOQ', 'Stock', 'Active', 'Actions'].map((label) =>
                    React.createElement('th', { key: label, className: 'px-3 py-2 font-semibold' }, label)
                  )
                )
              ),
              React.createElement('tbody', { className: 'divide-y divide-slate-100' },
                ...products.map((product) => {
                  const edit = productEdits[product.id] || {};
                  const isEditing = editingProductId === product.id;
                  const numberField = (
                    field: 'sellingPricePaise' | 'dealerPricePaise' | 'dealerMinQuantity' | 'stockQuantity',
                    value: number
                  ) => isEditing
                    ? React.createElement('input', {
                      className: 'w-28 rounded-lg border border-slate-300 px-2 py-1.5 focus:border-cyan-600 focus:outline-none',
                      type: 'number',
                      min: field === 'stockQuantity' ? 0 : 1,
                      step: 1,
                      value: edit[field] ?? value,
                      onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProductEdits((current) => ({
                        ...current,
                        [product.id]: { ...current[product.id], [field]: Number(event.target.value) },
                      })),
                      'aria-label': `${product.name} ${field}`,
                    })
                    : React.createElement('span', { className: 'font-medium text-slate-700' },
                      field === 'sellingPricePaise' || field === 'dealerPricePaise'
                        ? currency(value)
                        : String(value)
                    );
                  return React.createElement('tr', { key: product.id },
                    React.createElement('td', { className: 'max-w-64 px-3 py-2' },
                      React.createElement('p', { className: 'font-medium' }, product.name),
                      React.createElement('p', { className: 'text-xs text-slate-500' }, product.category)
                    ),
                    React.createElement('td', { className: 'px-3 py-2' }, numberField('sellingPricePaise', product.sellingPricePaise)),
                    React.createElement('td', { className: 'px-3 py-2' }, numberField('dealerPricePaise', product.dealerPricePaise)),
                    React.createElement('td', { className: 'px-3 py-2' }, numberField('dealerMinQuantity', product.dealerMinQuantity)),
                    React.createElement('td', { className: 'px-3 py-2' }, numberField('stockQuantity', product.stockQuantity)),
                    React.createElement('td', { className: 'px-3 py-2' },
                      isEditing
                        ? React.createElement('input', {
                          type: 'checkbox',
                          checked: edit.isActive ?? product.isActive,
                          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProductEdits((current) => ({
                            ...current,
                            [product.id]: { ...current[product.id], isActive: event.target.checked },
                          })),
                          'aria-label': `${product.name} active`,
                        })
                        : React.createElement('span', {
                          className: `rounded-full px-2.5 py-1 text-xs font-semibold ${product.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`,
                        }, product.isActive ? 'Active' : 'Inactive')
                    ),
                    React.createElement('td', { className: 'whitespace-nowrap px-3 py-2' },
                      isEditing
                        ? React.createElement(React.Fragment, null,
                          React.createElement('button', {
                            className: 'mr-2 rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60',
                            disabled: updating === product.id,
                            onClick: () => saveProduct(product),
                          }, updating === product.id ? 'Saving…' : 'Save'),
                          React.createElement('button', {
                            className: 'mr-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60',
                            disabled: updating === product.id,
                            onClick: () => cancelProductEdit(product.id),
                          }, 'Cancel')
                        )
                        : React.createElement('button', {
                          className: 'mr-2 rounded-lg border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-50 disabled:opacity-60',
                          disabled: editingProductId !== null,
                          onClick: () => setEditingProductId(product.id),
                        }, 'Edit'),
                      React.createElement('button', {
                        className: 'rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60',
                        disabled: updating === product.id,
                        onClick: () => removeProduct(product),
                      }, 'Delete')
                    )
                  );
                })
              )
            )
          ),
        React.createElement('form', { className: 'grid gap-3 border-t border-slate-200 pt-4 md:grid-cols-3', onSubmit: createProduct },
          React.createElement('input', {
            className: 'rounded-lg border border-slate-300 px-3 py-2',
            value: productName,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProductName(event.target.value),
            placeholder: 'Product name',
            required: true,
          }),
          React.createElement('input', {
            className: 'rounded-lg border border-slate-300 px-3 py-2',
            value: productBrand,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProductBrand(event.target.value),
            placeholder: 'Brand',
            required: true,
          }),
          React.createElement('select', {
            className: 'rounded-lg border border-slate-300 px-3 py-2',
            value: productCategory,
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => setProductCategory(event.target.value as ProductCategory),
          }, ...(['ro_purifiers', 'uv_purifiers', 'gravity_filters', 'commercial_ro', 'spare_filters', 'alkaline_units', 'water_dispensers', 'water_pumps'] as ProductCategory[]).map((category) =>
            React.createElement('option', { key: category, value: category }, category.replace(/_/g, ' '))
          )),
          ...[
            ['Retail price (paise)', productRetailPrice, setProductRetailPrice],
            ['Dealer price (paise)', productDealerPrice, setProductDealerPrice],
            ['Stock quantity', productStock, setProductStock],
          ].map(([label, value, setter]) => React.createElement('input', {
            key: label as string,
            className: 'rounded-lg border border-slate-300 px-3 py-2',
            type: 'number',
            min: 0,
            step: 1,
            value: value as string,
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => (setter as (value: string) => void)(event.target.value),
            placeholder: label as string,
            required: true,
          })),
          React.createElement('button', {
            className: 'rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60',
            type: 'submit',
            disabled: savingProduct,
          }, savingProduct ? 'Creating...' : 'Create product')
        )
      ),
      React.createElement(
        'section',
        { className: `${currentRoute.path === '/admin' ? 'grid' : 'hidden'} gap-6 xl:grid-cols-[1.5fr_1fr]` },
        React.createElement(
          'div',
          { className: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' },
          React.createElement('div', { className: 'mb-4 flex items-center justify-between' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, 'Top Products'),
            React.createElement('span', { className: 'text-sm text-slate-500' }, `${products.length} Firestore products`)
          ),
          React.createElement('div', { className: 'space-y-3' },
            ...products.slice(0, 5).map((product) =>
              React.createElement(
                'div',
                { key: product.id, className: 'flex items-center justify-between rounded-xl border border-slate-200 p-3' },
                React.createElement('div', null,
                  React.createElement('p', { className: 'font-medium text-slate-800' }, product.name),
                  React.createElement('p', { className: 'text-sm text-slate-500' }, `${product.stockQuantity} in stock`)
                ),
                React.createElement('div', { className: 'text-right' },
                  React.createElement('p', { className: 'font-semibold text-slate-900' }, currency(product.sellingPricePaise)),
                  React.createElement('p', { className: 'text-xs text-slate-500' }, product.category.replace('_', ' '))
                )
              )
            )
          )
        ),
        React.createElement(
          'div',
          { className: 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' },
          React.createElement('h2', { className: 'mb-4 text-xl font-semibold' }, 'Quick Snapshot'),
          React.createElement('ul', { className: 'space-y-4' },
            SnapshotRow('Users', String(userCount), undefined),
            SnapshotRow('Service Bookings', String(serviceBookings.length), undefined),
            SnapshotRow('Pending Dealer Applications', String(pendingDealers), undefined),
            SnapshotRow('Site Status', 'Healthy', 'success')
          )
        )
      ),
      React.createElement(
        'section',
        { id: 'customer-management', className: `${currentRoute.path === '/admin/customers' ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` },
        React.createElement('h2', { className: 'mb-4 text-xl font-semibold' }, 'Customer & Dealer Accounts'),
        users.length === 0
          ? React.createElement('p', { className: 'text-sm text-slate-500' }, 'No user profiles found.')
          : React.createElement('div', { className: 'w-full overflow-x-auto' },
            React.createElement('table', { className: 'min-w-[640px] text-left text-sm' },
              React.createElement('thead', { className: 'bg-slate-50 text-slate-600' },
                React.createElement('tr', null,
                  ...['Name', 'Email', 'Role', 'Dealer review', 'Account', 'Action'].map((label) =>
                    React.createElement('th', { key: label, className: 'px-3 py-2 font-semibold' }, label)
                  )
                )
              ),
              React.createElement('tbody', { className: 'divide-y divide-slate-100' },
                ...users.filter((account) => account.role !== 'admin').map((account) =>
                  React.createElement('tr', { key: account.uid },
                    React.createElement('td', { className: 'px-3 py-2' }, account.displayName || '—'),
                    React.createElement('td', { className: 'px-3 py-2' }, account.email || '—'),
                    React.createElement('td', { className: 'px-3 py-2 capitalize' }, account.role),
                    React.createElement('td', { className: 'px-3 py-2 capitalize' }, account.dealerStatus || '—'),
                    React.createElement('td', { className: 'px-3 py-2 capitalize' }, account.accountStatus || '—'),
                    React.createElement('td', { className: 'px-3 py-2' },
                      React.createElement('button', {
                        className: 'rounded bg-slate-800 px-3 py-1 text-white disabled:opacity-60',
                        disabled: updating === account.uid,
                        onClick: () => updateAccountStatus(account),
                      }, account.accountStatus === 'suspended' ? 'Reactivate' : 'Suspend')
                    )
                  )
                )
              )
            )
          )
      ),
      React.createElement(
        'section',
        { id: 'order-management', className: `${currentRoute.path === '/admin/orders' ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` },
        React.createElement('div', { className: 'mb-4 flex items-center justify-between' },
          React.createElement('h2', { className: 'text-xl font-semibold' }, 'Order Management'),
          React.createElement('span', { className: 'text-sm text-slate-500' }, `${orders.length} orders`)
        ),
        dataError ? React.createElement('p', { className: 'mb-3 text-sm text-red-600', role: 'alert' }, dataError) : null,
        orders.length === 0
          ? React.createElement('p', { className: 'text-sm text-slate-500' }, 'No live orders yet.')
          : React.createElement(React.Fragment, null,
          React.createElement('div', { className: 'space-y-3 sm:hidden' },
            ...orders.map((order) =>
              React.createElement('article', { key: order.id, className: 'space-y-3 rounded-xl border border-slate-200 bg-white p-4' },
                React.createElement('div', { className: 'flex items-start justify-between gap-3' },
                  React.createElement('div', { className: 'min-w-0' },
                    React.createElement('p', { className: 'truncate font-semibold text-slate-800' }, order.orderNumber),
                    React.createElement('p', { className: 'mt-1 truncate text-sm text-slate-600' }, order.customerName),
                    React.createElement('p', { className: 'truncate text-xs text-slate-500' }, order.customerEmail)
                  ),
                  React.createElement('p', { className: 'shrink-0 font-bold text-slate-900' }, currency(order.totalAmountPaise))
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-3 border-t border-slate-100 pt-3' },
                  React.createElement('div', null,
                    React.createElement('p', { className: 'text-xs font-medium text-slate-500' }, 'Order type'),
                    React.createElement('p', { className: 'mt-1 text-sm capitalize text-slate-700' }, order.orderType.replace('_', ' '))
                  ),
                  React.createElement('label', { className: 'text-xs font-medium text-slate-500' },
                    'Status',
                    React.createElement('select', {
                      className: 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800',
                      value: order.orderStatus,
                      disabled: updating === order.id,
                      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => updateOrder(order, event.target.value),
                      'aria-label': `Order ${order.orderNumber} status`,
                    },
                    ...['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
                      .map((status) => React.createElement('option', { key: status, value: status }, status.replace(/_/g, ' ')))
                    )
                  )
                )
              )
            )
          ),
          React.createElement('div', { className: 'hidden w-full overflow-x-auto rounded-xl border border-slate-200 sm:block' },
          React.createElement('table', { className: 'min-w-[760px] text-left text-sm' },
            React.createElement('thead', { className: 'bg-slate-50 text-slate-600' },
              React.createElement('tr', null,
                React.createElement('th', { className: 'px-4 py-3 font-medium' }, 'Order'),
                React.createElement('th', { className: 'px-4 py-3 font-medium' }, 'Buyer'),
                React.createElement('th', { className: 'px-4 py-3 font-medium' }, 'Type'),
                React.createElement('th', { className: 'px-4 py-3 font-medium' }, 'Status'),
                React.createElement('th', { className: 'px-4 py-3 font-medium' }, 'Amount')
              )
            ),
            React.createElement('tbody', null,
              ...orders.map((order) =>
                React.createElement('tr', { key: order.id, className: 'border-t border-slate-200' },
                  React.createElement('td', { className: 'px-4 py-3 font-medium text-slate-700' }, order.orderNumber),
                  React.createElement('td', { className: 'px-4 py-3 text-slate-600' },
                    React.createElement('div', { className: 'font-medium' }, order.customerName),
                    React.createElement('div', { className: 'text-xs text-slate-500' }, order.customerEmail)
                  ),
                  React.createElement('td', { className: 'px-4 py-3 text-slate-600' }, order.orderType.replace('_', ' ')),
                  React.createElement('td', { className: 'px-4 py-3' },
                    React.createElement('select', {
                      className: 'rounded-md border border-slate-300 px-2 py-1 text-xs',
                      value: order.orderStatus,
                      disabled: updating === order.id,
                      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => updateOrder(order, event.target.value),
                    },
                    ...['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
                      .map((status) => React.createElement('option', { key: status, value: status }, status.replace(/_/g, ' ')))
                    )
                  ),
                  React.createElement('td', { className: 'px-4 py-3 font-semibold text-slate-800' }, currency(order.totalAmountPaise))
                )
              )
            )
          )
          )
        )
      ),
      React.createElement(
        'section',
        { className: `${currentRoute.path === '/admin/dealers' || currentRoute.path === '/admin/services' ? 'grid' : 'hidden'} gap-6` },
        React.createElement(
          'div',
          { id: 'dealer-applications', className: `${currentRoute.path === '/admin/dealers' ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` },
          React.createElement('div', { className: 'mb-4 flex items-center justify-between gap-3' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, 'Dealer Applications'),
            React.createElement('span', { className: 'rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700' }, `${pendingDealers} pending`)
          ),
          dealerApplications.length === 0
            ? React.createElement('p', { className: 'text-sm text-slate-500' }, 'No pending dealer applications.')
            : React.createElement('div', { className: 'space-y-3' },
              ...dealerApplications.map((application) =>
                React.createElement('div', { key: application.id, className: 'rounded-xl border border-slate-200 p-4' },
                  React.createElement('p', { className: 'font-semibold text-slate-800' }, application.businessName),
                  React.createElement('p', { className: 'mt-1 text-sm text-slate-600' }, `${application.applicantName} · ${application.email}`),
                  React.createElement('p', { className: 'text-xs text-slate-500' }, `GSTIN: ${application.gstNumber}`),
                  React.createElement('div', { className: 'mt-3 flex gap-2' },
                    React.createElement('button', {
                      className: 'rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60',
                      disabled: updating === application.id,
                      onClick: () => reviewDealer(application, 'approved'),
                    }, 'Approve'),
                    React.createElement('button', {
                      className: 'rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60',
                      disabled: updating === application.id,
                      onClick: () => reviewDealer(application, 'rejected'),
                    }, 'Reject')
                  )
                )
              )
            )
        ),
        React.createElement(
          'div',
          { id: 'service-desk', className: `${currentRoute.path === '/admin/services' ? 'block' : 'hidden'} rounded-2xl border border-slate-200 bg-white p-5 shadow-sm` },
          React.createElement('h2', { className: 'mb-4 text-xl font-semibold' }, 'Service Desk'),
          serviceBookings.length === 0
            ? React.createElement('p', { className: 'text-sm text-slate-500' }, 'No service requests yet.')
            : React.createElement('div', { className: 'space-y-3' },
              ...serviceBookings.map((booking) =>
                React.createElement('div', { key: booking.id, className: 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4' },
                  React.createElement('div', null,
                    React.createElement('p', { className: 'font-semibold text-slate-800' }, `${booking.bookingNumber} · ${booking.customerName}`),
                    React.createElement('p', { className: 'text-sm text-slate-600' }, booking.serviceType.replace(/_/g, ' ')),
                    React.createElement('p', { className: 'text-xs text-slate-500' }, `${booking.preferredDate} · ${booking.preferredTimeSlot} · ${booking.customerPhone}`)
                  ),
                  React.createElement('select', {
                    className: 'rounded-md border border-slate-300 px-2 py-1 text-xs',
                    value: booking.status,
                    disabled: updating === booking.id,
                    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => updateBooking(booking, event.target.value),
                  },
                  ...['booked', 'assigned', 'technician_en_route', 'completed', 'cancelled']
                    .map((status) => React.createElement('option', { key: status, value: status }, status.replace(/_/g, ' ')))
                  )
                )
              )
            )
        )
      )
    )
  );
}

function StatCard(label: string, value: string, accent: 'cyan' | 'amber' | 'violet' | 'rose') {
  const accentClass = {
    cyan: 'border-cyan-500 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    violet: 'border-violet-500 bg-violet-50 text-violet-700',
    rose: 'border-rose-500 bg-rose-50 text-rose-700',
  }[accent];

  return React.createElement(
    'div',
    { className: 'rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md' },
    React.createElement('div', { className: `mb-4 inline-flex rounded-lg border-l-2 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide ${accentClass}` }, label),
    React.createElement('div', { className: 'text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl' }, value)
  );
}

function SnapshotRow(label: string, value: string, tone?: 'success') {
  return React.createElement(
    'li',
    { className: 'flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2' },
    React.createElement('span', { className: 'text-slate-600' }, label),
    React.createElement('span', { className: tone === 'success' ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-800' }, value)
  );
}
