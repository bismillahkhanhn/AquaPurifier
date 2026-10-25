import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building2, LogOut, MapPin, Phone, ShieldCheck, User, Wrench } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';
import { updateUserProfile } from '../../services/user';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.displayName || profile?.name || '');
    setPhone(profile?.phoneNumber || '');
  }, [profile]);

  const saveProfile = async () => {
    if (!user || !profile || !name.trim()) {
      setError('Enter your name before saving.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateUserProfile(user.uid, {
        displayName: name.trim(),
        phoneNumber: phone.trim(),
        savedAddresses: profile.savedAddresses || [],
      });
      await refreshProfile();
      setSaved(true);
    } catch (saveError) {
      console.error('Profile update failed', saveError);
      const code =
        saveError && typeof saveError === 'object' && 'code' in saveError
          ? String(saveError.code)
          : '';
      setError(
        code === 'permission-denied'
          ? 'Firebase denied this profile update. Confirm the complete AquaPure Firestore rules are published to the same project and allow owners to update displayName, name, phoneNumber, and savedAddresses.'
          : code === 'unavailable' || code === 'network-request-failed'
            ? 'Firebase is temporarily unavailable. Check your internet connection and try again.'
            : 'Could not save your profile. Check your connection and try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerIcon}>
            <User size={20} color="#22d3ee" />
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.displayName || profile?.email || 'U').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.name}>{profile?.displayName || profile?.name || 'Your profile'}</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
            <View style={styles.roleBadge}>
              <ShieldCheck size={12} color="#34d399" />
              <Text style={styles.roleText}>{profile?.role?.toUpperCase() || 'ACCOUNT'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact details</Text>
          <TextInput
            style={styles.profileInput}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#64748b"
          />
          <TextInput
            style={styles.profileInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
          />
          <View style={styles.row}>
            <Phone size={16} color="#22d3ee" />
            <Text style={styles.rowText}>{profile?.email || user?.email || 'No email'}</Text>
          </View>
          {(profile?.savedAddresses || []).map((address) => (
            <View key={address.id} style={styles.row}>
              <MapPin size={16} color="#22d3ee" />
              <Text style={styles.rowText}>
                {address.addressLine1}, {address.city}, {address.state} {address.postalCode}
              </Text>
            </View>
          ))}
          {(!profile?.savedAddresses || profile.savedAddresses.length === 0) && (
            <Text style={styles.actionText}>Delivery addresses can be entered during checkout.</Text>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {saved ? <Text style={styles.savedText}>Profile saved.</Text> : null}
          <TouchableOpacity style={styles.saveBtn} disabled={saving} onPress={saveProfile}>
            {saving ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.saveBtnText}>Save profile</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/service/book')}>
          <View style={styles.actionIcon}>
            <Wrench size={19} color="#22d3ee" />
          </View>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Book Installation / Service</Text>
            <Text style={styles.actionText}>Free installation with every purifier purchase.</Text>
          </View>
        </TouchableOpacity>

        {profile?.role === 'dealer' ? (
          <View style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Building2 size={19} color="#fbbf24" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Dealer application: {profile.dealerStatus || 'pending'}</Text>
              <Text style={styles.actionText}>
                {profile.dealerStatus === 'approved'
                  ? `Wholesale access active for ${profile.companyName || 'your business'}.`
                  : 'Your wholesale access will be enabled after admin review.'}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/register', params: { role: 'dealer' } })}
          >
            <View style={styles.actionIcon}>
              <Building2 size={19} color="#fbbf24" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Become a Wholesale Dealer</Text>
              <Text style={styles.actionText}>Create a dealer account and submit your business GST details for approval.</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color="#f87171" />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AquaPure Customer App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    marginTop: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 19, fontWeight: '800', color: '#ffffff' },
  profileBody: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  email: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#052e1c',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 7,
  },
  roleText: { fontSize: 9, fontWeight: '700', color: '#34d399' },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  rowText: { flex: 1, fontSize: 11, color: '#cbd5e1', lineHeight: 17 },
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
  actionText: { fontSize: 10, color: '#94a3b8', marginTop: 3, lineHeight: 15 },
  version: { fontSize: 10, color: '#475569', textAlign: 'center', marginTop: 8 },
  profileInput: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  saveBtn: {
    minHeight: 40,
    backgroundColor: '#06b6d4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  saveBtnText: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
  errorText: { color: '#f87171', fontSize: 11 },
  savedText: { color: '#34d399', fontSize: 11 },
  logoutBtn: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  logoutText: { color: '#f87171', fontSize: 12, fontWeight: '700' },
});
