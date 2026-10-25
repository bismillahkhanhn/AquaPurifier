import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Wrench } from 'lucide-react-native';
import { ServiceBooking } from '../../types';
import { formatINR } from '../../utils/currency';
import { useAuth } from '../../hooks/useAuth';
import { createServiceBooking } from '../../services/shop';
import { notifyLocally } from '../../services/notifications';

const SERVICE_TYPES: {
  key: ServiceBooking['serviceType'];
  label: string;
  costPaise: number;
}[] = [
  { key: 'new_installation', label: 'New Installation', costPaise: 0 },
  { key: 'filter_cartridge_replacement', label: 'Filter Replacement', costPaise: 79900 },
  { key: 'leakage_repair', label: 'Leakage Repair', costPaise: 79900 },
  { key: 'tds_health_check', label: 'TDS Health Check', costPaise: 79900 },
  { key: 'annual_maintenance', label: 'Annual Maintenance', costPaise: 79900 },
];

const TIME_SLOTS: { key: ServiceBooking['preferredTimeSlot']; label: string }[] = [
  { key: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { key: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { key: 'evening', label: 'Evening (4 PM - 7 PM)' },
];

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3);
  return formatLocalDate(date);
}

function isFutureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  if (
    selectedDate.getFullYear() !== year ||
    selectedDate.getMonth() !== month - 1 ||
    selectedDate.getDate() !== day
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate > today;
}

export default function BookServiceScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceType, setServiceType] =
    useState<ServiceBooking['serviceType']>('new_installation');
  const [purifierModel, setPurifierModel] = useState('AquaPure Grand Plus RO+UV+UF+TDS');
  const [preferredDate, setPreferredDate] = useState(defaultDate());
  const [preferredTimeSlot, setPreferredTimeSlot] =
    useState<ServiceBooking['preferredTimeSlot']>('morning');
  const [addressLine, setAddressLine] = useState(
    'B-604, Palm Grove Apartments, Kakkanad, Kochi, 682030'
  );

  const selectedService = SERVICE_TYPES.find((item) => item.key === serviceType);
  const canBookService = Boolean(
    user && profile && profile.accountStatus === 'active' &&
    (profile.role === 'customer' ||
      (profile.role === 'dealer' && profile.dealerStatus === 'approved'))
  );
  const isValid =
    purifierModel.trim().length > 2 &&
    isFutureDate(preferredDate.trim()) &&
    addressLine.trim().length > 5 &&
    canBookService;

  const submit = async () => {
    if (!canBookService) {
      Alert.alert(
        'Service booking unavailable',
        'An active customer account or an approved, active dealer account is required.'
      );
      return;
    }
    if (!isValid) {
      Alert.alert('Missing details', 'Enter the purifier model, date (YYYY-MM-DD), and address.');
      return;
    }
    if (!user || !profile || !selectedService) return;
    setLoading(true);
    setError('');
    try {
      const addressParts = addressLine.split(',').map((part) => part.trim());
      const postalCode = addressParts.find((part) => /^\d{6}$/.test(part)) || '';
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
      await createServiceBooking({
        uid: user.uid,
        profile,
        booking: {
          serviceType,
          purifierModelOrBrand: purifierModel.trim(),
          preferredDate: preferredDate.trim(),
          preferredTimeSlot,
          serviceAddress: {
            addressLine: addressLine.trim(),
            city,
            postalCode,
          },
          serviceCostPaise: selectedService.costPaise,
        },
      });
      notifyLocally(
        'AquaPure service booked',
        `Your ${selectedService.label} visit is booked for ${preferredDate}.`
      ).catch((notificationError) => {
        console.warn('Unable to show service notification', notificationError);
      });
      Alert.alert(
        'Service request booked',
        `Your ${selectedService.label} request is saved for ${preferredDate} (${preferredTimeSlot}).`,
        [{ text: 'View bookings', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (bookingError) {
      console.error('Service booking failed', bookingError);
      setError('Could not save your service request. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Wrench size={22} color="#22d3ee" />
        </View>
        <View style={styles.heroBody}>
          <Text style={styles.heroTitle}>Certified doorstep service</Text>
          <Text style={styles.heroText}>
            Free installation with a new purifier. Paid visits are {formatINR(79900)}.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Type</Text>
        <View style={styles.optionList}>
          {SERVICE_TYPES.map((item) => {
            const active = serviceType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setServiceType(item.key)}
              >
                <View style={styles.optionRow}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {item.label}
                  </Text>
                  {active && <CheckCircle2 size={15} color="#22d3ee" />}
                </View>
                <Text style={styles.optionCost}>
                  {item.costPaise === 0 ? 'FREE' : formatINR(item.costPaise)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appliance Details</Text>
        <Text style={styles.label}>Purifier model or brand</Text>
        <TextInput
          style={styles.input}
          value={purifierModel}
          onChangeText={setPurifierModel}
          placeholder="e.g. AquaPure Grand Plus"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <CalendarDays size={15} color="#22d3ee" />
          <Text style={styles.sectionTitle}>Preferred Date</Text>
        </View>
        <TextInput
          style={styles.input}
          value={preferredDate}
          onChangeText={setPreferredDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Clock3 size={15} color="#22d3ee" />
          <Text style={styles.sectionTitle}>Time Slot</Text>
        </View>
        <View style={styles.optionList}>
          {TIME_SLOTS.map((slot) => {
            const active = preferredTimeSlot === slot.key;
            return (
              <TouchableOpacity
                key={slot.key}
                style={[styles.option, active && styles.optionActive]}
                onPress={() => setPreferredTimeSlot(slot.key)}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <MapPin size={15} color="#22d3ee" />
          <Text style={styles.sectionTitle}>Service Address</Text>
        </View>
        <TextInput
          style={[styles.input, styles.addressInput]}
          value={addressLine}
          onChangeText={setAddressLine}
          multiline
          placeholder="Flat, street, city, PIN code"
          placeholderTextColor="#64748b"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
        disabled={!isValid || loading}
        onPress={submit}
      >
        {loading ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={styles.submitText}>Confirm Service Appointment</Text>
        )}
      </TouchableOpacity>
      {profile && !canBookService ? (
        <Text style={styles.errorText}>
          Service booking requires an active customer or approved, active dealer account.
        </Text>
      ) : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  hero: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { flex: 1 },
  heroTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  heroText: { fontSize: 10, color: '#94a3b8', marginTop: 3, lineHeight: 15 },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 9,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  optionList: { gap: 8 },
  option: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
    padding: 11,
  },
  optionActive: { borderColor: '#0891b2', backgroundColor: '#082f49' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { fontSize: 11, color: '#cbd5e1', fontWeight: '600' },
  optionTextActive: { color: '#ffffff' },
  optionCost: { fontSize: 10, color: '#22d3ee', marginTop: 3, fontWeight: '700' },
  label: { fontSize: 10, color: '#94a3b8' },
  input: {
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  addressInput: { minHeight: 72, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { backgroundColor: '#334155' },
  submitText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  errorText: { fontSize: 11, color: '#f87171', textAlign: 'center' },
});
