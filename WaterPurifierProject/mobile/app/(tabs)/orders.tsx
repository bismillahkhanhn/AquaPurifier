import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle2, Clock, Package, Wrench } from 'lucide-react-native';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToOrders, subscribeToServiceBookings } from '../../services/shop';
import { Order, ServiceBooking } from '../../types';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let completedLoads = 0;
    const finishLoad = () => {
      completedLoads += 1;
      if (completedLoads === 2) setLoading(false);
    };
    const unsubscribeOrders = subscribeToOrders(
      user.uid,
      (nextOrders) => {
        setOrders(nextOrders);
        finishLoad();
      },
      (loadError) => {
        console.error('Failed to load order history', loadError);
        setError('Unable to load order history. Check your connection and try again.');
        finishLoad();
      }
    );
    const unsubscribeBookings = subscribeToServiceBookings(
      user.uid,
      (nextBookings) => {
        setBookings(nextBookings);
        finishLoad();
      },
      (loadError) => {
        console.error('Failed to load service history', loadError);
        setError('Unable to load service history. Check your connection and try again.');
        finishLoad();
      }
    );
    return () => {
      unsubscribeOrders();
      unsubscribeBookings();
    };
  }, [user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Orders</Text>
            <Text style={styles.subtitle}>Track deliveries and service visits</Text>
          </View>
          <View style={styles.headerIcon}>
            <Package size={20} color="#22d3ee" />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? <ActivityIndicator color="#22d3ee" /> : null}
        {!loading && orders.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.orderItem}>No orders yet. Your purchases will appear here.</Text>
            <TouchableOpacity style={styles.serviceBtn} onPress={() => router.push('/(tabs)/catalogue')}>
              <Text style={styles.serviceBtnText}>Browse products</Text>
            </TouchableOpacity>
          </View>
        )}
        {orders.map((order) => {
          const delivered = order.orderStatus === 'delivered';
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTop}>
                <View>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <Text style={styles.orderDate}>
                    Placed {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, delivered ? styles.deliveredBadge : styles.shippedBadge]}>
                  {delivered ? (
                    <CheckCircle2 size={12} color="#34d399" />
                  ) : (
                    <Clock size={12} color="#38bdf8" />
                  )}
                  <Text style={[styles.statusText, delivered ? styles.deliveredText : styles.shippedText]}>
                    {order.orderStatus.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              {order.items.map((item) => (
                <Text key={item.productId} style={styles.orderItem} numberOfLines={2}>
                  {item.productName} × {item.quantity}
                </Text>
              ))}

              <View style={styles.orderBottom}>
                <Text style={styles.totalLabel}>Order total</Text>
                <Text style={styles.totalValue}>{formatINR(order.totalAmountPaise)}</Text>
              </View>
            </View>
          );
        })}

        {bookings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Service bookings</Text>
            {bookings.map((booking) => (
              <View key={booking.id} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderNumber}>{booking.bookingNumber}</Text>
                    <Text style={styles.orderDate}>
                      {booking.serviceType.replace(/_/g, ' ')} · {booking.preferredDate}
                    </Text>
                  </View>
                  <Text style={styles.statusText}>{booking.status.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.orderItem}>
                  {booking.purifierModelOrBrand} · {booking.preferredTimeSlot}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.helpCard}>
          <View style={styles.helpIcon}>
            <Wrench size={20} color="#22d3ee" />
          </View>
          <View style={styles.helpBody}>
            <Text style={styles.helpTitle}>Need a service visit?</Text>
            <Text style={styles.helpText}>Book filter replacement, leak repair, or a TDS health check.</Text>
            <TouchableOpacity style={styles.serviceBtn} onPress={() => router.push('/service/book')}>
              <Text style={styles.serviceBtnText}>Book Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  orderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 8,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
  orderDate: { fontSize: 10, color: '#64748b', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deliveredBadge: { backgroundColor: '#052e1c', borderColor: '#065f46' },
  shippedBadge: { backgroundColor: '#082f49', borderColor: '#0c4a6e' },
  statusText: { fontSize: 10, fontWeight: '700' },
  deliveredText: { color: '#34d399' },
  shippedText: { color: '#38bdf8' },
  orderItem: { fontSize: 12, color: '#cbd5e1', lineHeight: 18 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 10, color: '#64748b' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#22d3ee' },
  helpCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginTop: 6,
  },
  helpIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBody: { flex: 1 },
  helpTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  helpText: { fontSize: 11, color: '#94a3b8', marginTop: 3, lineHeight: 16 },
  serviceBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#06b6d4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 10,
  },
  serviceBtnText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  errorText: { color: '#f87171', fontSize: 12 },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
