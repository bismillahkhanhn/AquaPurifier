import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/currency';
import { ProductArtwork } from '../../components/ProductArtwork';
import { useAuth } from '../../hooks/useAuth';
import { placeOrder } from '../../services/shop';
import { notifyLocally } from '../../services/notifications';

function getCheckoutErrorMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : '';
  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number(error.status)
      : 0;

  if (code === 'permission-denied' || status === 403) {
    return error instanceof Error
      ? error.message
      : 'Your Firebase account is not authorized to place this order. Verify your active customer or approved dealer profile.';
  }
  if (status === 401 || code === 'unauthenticated') {
    return 'Your sign-in session expired. Sign in again, then retry checkout.';
  }
  if (status === 503) {
    return error instanceof Error ? error.message : 'Secure checkout is not configured. Contact support.';
  }
  if (code === 'firebase-service-account-permission-denied') {
    return 'The checkout server’s Firebase service account lacks Firestore access. The administrator must fix its Google Cloud IAM permissions.';
  }
  if (code === 'checkout-configuration') {
    return error instanceof Error
      ? error.message
      : 'Secure checkout configuration is incomplete. The administrator should check Vercel environment variables.';
  }
  if (status >= 500) {
    return error instanceof Error && error.message
      ? `${error.message} Your retry uses the same request key, so it will not create a duplicate order.`
      : 'Secure checkout encountered a server error. Check Vercel function logs; retrying reuses the same key to prevent duplicate orders.';
  }
  if (code === 'unavailable' || code === 'network-request-failed') {
    return 'The connection to secure checkout failed. Check your internet connection and retry; duplicate orders are prevented.';
  }
  if (code === 'api-not-configured') return error instanceof Error ? error.message : 'Secure checkout API is not configured.';
  if (error instanceof Error && error.message) return error.message;
  return 'Could not place the order. Check your connection and try again.';
}

export default function CartScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [name, setName] = React.useState(profile?.displayName || profile?.name || '');
  const [phone, setPhone] = React.useState(profile?.phoneNumber || '');
  const [addressLine1, setAddressLine1] = React.useState('');
  const [city, setCity] = React.useState('');
  const [state, setState] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [placingOrder, setPlacingOrder] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState('');
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotalPaise,
    deliveryFeePaise,
    totalPaise,
    priceForProduct,
  } = useCart();

  const submitOrder = async () => {
    if (!user || !profile) {
      setCheckoutError('Sign in to place an order.');
      return;
    }
    if (profile.role === 'dealer' &&
      (profile.dealerStatus !== 'approved' || profile.accountStatus !== 'active')) {
      setCheckoutError('Dealer orders are available after your account is approved.');
      return;
    }
    if (profile.role === 'customer' && profile.accountStatus !== 'active') {
      setCheckoutError('Your customer account is not active in Firestore. Contact support to verify your users/{UID} profile before checkout.');
      return;
    }
    if (profile.role !== 'customer' && profile.role !== 'dealer') {
      setCheckoutError('Only customer and approved dealer accounts can place orders.');
      return;
    }
    if (!name.trim() || !phone.trim() || !addressLine1.trim() ||
      !city.trim() || !state.trim() || !/^\d{6}$/.test(postalCode.trim())) {
      setCheckoutError('Complete the delivery details and enter a valid 6-digit PIN code.');
      return;
    }
    setPlacingOrder(true);
    setCheckoutError('');
    try {
      const orderId = await placeOrder({
        uid: user.uid,
        profile,
        items,
        address: {
          id: `delivery-${Date.now()}`,
          fullName: name.trim(),
          phone: phone.trim(),
          addressLine1: addressLine1.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          isDefault: false,
        },
        isDealer: profile.role === 'dealer',
      });
      clearCart();
      notifyLocally(
        'AquaPure order placed',
        'Your order is confirmed as pending. Track progress in Order History.'
      ).catch((notificationError) => {
        console.warn('Unable to show order notification', notificationError);
      });
      Alert.alert('Order placed', 'Your order is saved. You can track its status in Order History.', [
        { text: 'View orders', onPress: () => router.push('/(tabs)/orders') },
      ]);
      void orderId;
    } catch (error) {
      if (__DEV__) {
        console.warn('Order placement failed', {
          code: error && typeof error === 'object' && 'code' in error
            ? error.code
            : 'unknown',
          message: error instanceof Error ? error.message : 'Unknown checkout failure',
        });
      }
      setCheckoutError(getCheckoutErrorMessage(error));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Cart</Text>
            <Text style={styles.subtitle}>
              {items.length === 0 ? 'No items yet' : `${items.length} product${items.length > 1 ? 's' : ''}`}
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <ShoppingBag size={20} color="#22d3ee" />
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyBox}>
            <ShoppingBag size={42} color="#475569" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Browse our purifiers and add a system to continue.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/catalogue')}>
              <Text style={styles.primaryBtnText}>Browse Catalogue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.product.id} style={styles.itemCard}>
                  <View style={styles.itemIcon}>
                    <ProductArtwork
                      category={item.product.category}
                      name={item.product.name}
                      width={58}
                      height={58}
                    />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatINR(priceForProduct(item.product))}
                    </Text>
                    <Text style={styles.stockText}>{item.product.stockQuantity} in stock</Text>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeItem(item.product.id)}
                      >
                        <Trash2 size={16} color="#f87171" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.lineTotal}>
                    {formatINR(priceForProduct(item.product) * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatINR(subtotalPaise)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={[styles.summaryValue, deliveryFeePaise === 0 && styles.freeText]}>
                  {deliveryFeePaise === 0 ? 'FREE' : formatINR(deliveryFeePaise)}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatINR(totalPaise)}</Text>
              </View>

              <View style={styles.checkoutForm}>
                <Text style={styles.checkoutTitle}>Delivery details</Text>
                <TextInput style={styles.checkoutInput} value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor="#64748b" />
                <TextInput style={styles.checkoutInput} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor="#64748b" keyboardType="phone-pad" />
                <TextInput style={styles.checkoutInput} value={addressLine1} onChangeText={setAddressLine1} placeholder="Flat, building, street" placeholderTextColor="#64748b" />
                <View style={styles.checkoutRow}>
                  <TextInput style={[styles.checkoutInput, styles.checkoutHalf]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#64748b" />
                  <TextInput style={[styles.checkoutInput, styles.checkoutHalf]} value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#64748b" />
                </View>
                <TextInput style={styles.checkoutInput} value={postalCode} onChangeText={setPostalCode} placeholder="6-digit PIN code" placeholderTextColor="#64748b" keyboardType="number-pad" maxLength={6} />
              </View>
              {profile?.role === 'dealer' && profile.dealerStatus !== 'approved' ? (
                <Text style={styles.errorText}>Dealer orders unlock after approval.</Text>
              ) : null}
              {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, placingOrder && styles.disabledBtn]}
                disabled={placingOrder}
                onPress={submitOrder}
              >
                {placingOrder ? <ActivityIndicator color="#0f172a" /> : (
                  <Text style={styles.primaryBtnText}>
                    {profile?.role === 'dealer' ? 'Place Wholesale Order' : 'Place COD Order'}
                  </Text>
                )}
              </TouchableOpacity>
              <Text style={styles.note}>
                {profile?.role === 'dealer'
                  ? 'Wholesale orders use dealer credit terms.'
                  : 'Cash on delivery. No online payment is collected.'}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 28,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff', marginTop: 12 },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  list: { gap: 10 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 10,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  itemPrice: { fontSize: 12, color: '#22d3ee', fontWeight: '700', marginTop: 3 },
  stockText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { color: '#ffffff', fontSize: 13, fontWeight: '700', minWidth: 18, textAlign: 'center' },
  removeBtn: {
    width: 40,
    height: 40,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineTotal: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  summary: {
    marginTop: 18,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: '#94a3b8' },
  summaryValue: { fontSize: 12, color: '#ffffff', fontWeight: '700' },
  freeText: { color: '#34d399' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 10 },
  totalLabel: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
  totalValue: { fontSize: 18, color: '#22d3ee', fontWeight: '800' },
  primaryBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#0f172a', fontSize: 13, fontWeight: '800' },
  note: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  checkoutForm: { gap: 8, marginTop: 8 },
  checkoutTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff', marginBottom: 2 },
  checkoutInput: {
    minHeight: 42,
    flex: 1,
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 12,
  },
  checkoutRow: { flexDirection: 'row', gap: 8 },
  checkoutHalf: { minWidth: 0 },
  errorText: { fontSize: 11, color: '#f87171' },
  disabledBtn: { opacity: 0.6 },
});
