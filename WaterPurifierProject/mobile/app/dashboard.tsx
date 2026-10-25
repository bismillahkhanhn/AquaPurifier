import React from 'react';
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
import {
  BadgeCheck,
  Building2,
  Clock,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/auth';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && (
      !user ||
      !profile ||
      !['customer', 'dealer'].includes(profile.role) ||
      profile.accountStatus === 'suspended'
    )) {
      router.replace('/login');
    }
  }, [loading, profile, router, user]);

  if (
    loading ||
    !user ||
    !profile ||
    !['customer', 'dealer'].includes(profile.role) ||
    profile.accountStatus === 'suspended'
  ) {
    return (
      <View style={[styles.safe, styles.loading]}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  const role = profile.role;
  const dealerStatus = profile?.dealerStatus || 'none';
  const name = profile?.displayName || profile?.name || user?.displayName || user?.email || 'User';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerBody}>
            <Text style={styles.title} numberOfLines={1}>AquaPure Dashboard</Text>
            <Text style={styles.subtitle} numberOfLines={1}>Welcome, {name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#94a3b8" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={22} color="#22d3ee" />
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <ShieldCheck size={12} color="#22d3ee" />
                <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
              </View>
              {role === 'dealer' && (
                <View
                  style={[
                    styles.statusBadge,
                    dealerStatus === 'approved'
                      ? styles.statusApproved
                      : dealerStatus === 'pending'
                      ? styles.statusPending
                      : styles.statusNone,
                  ]}
                >
                  <BadgeCheck size={12} color="#e2e8f0" />
                  <Text style={styles.statusText}>Dealer: {dealerStatus}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {role === 'customer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.actions}>
              <ActionCard
                icon={<ShoppingBag size={18} color="#22d3ee" />}
                title="Browse Catalogue"
                subtitle="Shop water purifiers and spares"
                onPress={() => router.push('/(tabs)/catalogue')}
              />
              <ActionCard
                icon={<Wrench size={18} color="#22d3ee" />}
                title="Book Service"
                subtitle="Installation, repair, or maintenance"
                onPress={() => router.push('/service/book')}
              />
              <ActionCard
                icon={<Clock size={18} color="#22d3ee" />}
                title="My Orders"
                subtitle="Track orders and service requests"
                onPress={() => router.push('/(tabs)/orders')}
              />
            </View>
          </View>
        )}

        {role === 'dealer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dealer Portal</Text>
            {dealerStatus !== 'approved' ? (
              <View style={styles.noticeCard}>
                <Clock size={18} color="#fbbf24" />
                <View style={styles.noticeBody}>
                  <Text style={styles.noticeTitle}>Application pending approval</Text>
                  <Text style={styles.noticeText}>
                    Dealer features are locked until an admin approves your KYC
                    application.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.actions}>
                <ActionCard
                  icon={<Building2 size={18} color="#22d3ee" />}
                  title="Wholesale Catalogue"
                  subtitle="Dealer pricing and bulk orders"
                  onPress={() => router.push('/(tabs)/catalogue')}
                />
                <ActionCard
                  icon={<Clock size={18} color="#22d3ee" />}
                  title="Dealer Orders"
                  subtitle="Manage wholesale orders"
                  onPress={() => router.push('/(tabs)/orders')}
                />
              </View>
            )}
          </View>
        )}

        {role === 'admin' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin</Text>
            <View style={styles.noticeCard}>
              <ShieldCheck size={18} color="#34d399" />
              <View style={styles.noticeBody}>
                <Text style={styles.noticeTitle}>Admin access active</Text>
                <Text style={styles.noticeText}>
                  Use the web admin portal for full management. Dealer approvals
                  must be done through trusted admin operations only.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={styles.actionIcon}>{icon}</View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionText}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  headerBody: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  logoutBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBody: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  profileEmail: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#082f49',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleBadgeText: { fontSize: 9, fontWeight: '800', color: '#22d3ee' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusApproved: { backgroundColor: '#052e1c' },
  statusPending: { backgroundColor: '#422006' },
  statusNone: { backgroundColor: '#1e293b' },
  statusText: { fontSize: 9, fontWeight: '700', color: '#e2e8f0' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  actions: { gap: 8 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  actionText: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  noticeBody: { flex: 1 },
  noticeTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  noticeText: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 15 },
});
