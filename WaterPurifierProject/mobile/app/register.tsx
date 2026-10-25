import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Droplet, Eye, EyeOff, Lock, Mail, User, Building2 } from 'lucide-react-native';
import { registerWithEmail, getErrorMessage, logout } from '../services/auth';
import { createUserProfile } from '../services/user';
import { createDealerApplication } from '../services/shop';
import { UserProfile } from '../types';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState<'customer' | 'dealer'>(
    params.role === 'dealer' ? 'dealer' : 'customer'
  );
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!fullName.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (accountType === 'dealer' && !companyName.trim()) {
      setError('Enter your business/company name for dealer registration.');
      return;
    }
    if (accountType === 'dealer' && !gstNumber.trim()) {
      setError('Enter your GST number to submit a dealer application.');
      return;
    }

    setLoading(true);
    try {
      const user = await registerWithEmail(email, password, fullName);
      try {
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || email.trim(),
          displayName: fullName.trim(),
          name: fullName.trim(),
          role: accountType,
          dealerStatus: accountType === 'dealer' ? 'pending' : 'none',
          accountStatus: accountType === 'dealer' ? 'pending' : 'active',
          companyName: accountType === 'dealer' ? companyName.trim() : '',
          phoneNumber: '',
          savedAddresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await createUserProfile(user.uid, profile);
        if (accountType === 'dealer') {
          await createDealerApplication({
            uid: user.uid,
            profile,
            businessName: companyName,
            gstNumber,
          });
        }
        setSuccess(
          accountType === 'dealer'
            ? 'Dealer application submitted. Your account is pending admin approval.'
            : 'Account created successfully. You can sign in now.'
        );
        await logout();
        setTimeout(() => router.replace('/login'), 1400);
      } catch (profileError) {
        console.error(profileError);
        setError(
          'Account created in Firebase Authentication, but profile creation failed. Please sign in and contact support to complete your profile.'
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Droplet size={26} color="#22d3ee" />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join AquaPure today</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputRow}>
                <User size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, accountType === 'customer' && styles.typeBtnActive]}
                  onPress={() => setAccountType('customer')}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      accountType === 'customer' && styles.typeBtnTextActive,
                    ]}
                  >
                    Customer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, accountType === 'dealer' && styles.typeBtnActive]}
                  onPress={() => setAccountType('dealer')}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      accountType === 'dealer' && styles.typeBtnTextActive,
                    ]}
                  >
                    Dealer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {accountType === 'dealer' && (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>Business / Company Name</Text>
                  <View style={styles.inputRow}>
                    <Building2 size={18} color="#64748b" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter business name"
                      placeholderTextColor="#64748b"
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>GST Number</Text>
                  <View style={styles.inputRow}>
                    <Building2 size={18} color="#64748b" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter GSTIN"
                      placeholderTextColor="#64748b"
                      autoCapitalize="characters"
                      value={gstNumber}
                      onChangeText={setGstNumber}
                    />
                  </View>
                </View>
              </>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirm((prev) => !prev)}
                >
                  {showConfirm ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleRegister}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 20,
  },
  header: { alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#082f49',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#155e75',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 13, color: '#94a3b8' },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    gap: 13,
  },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#cbd5e1' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#090d16',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, color: '#ffffff', fontSize: 13 },
  passwordToggle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#090d16',
    paddingVertical: 9,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#06b6d4', borderColor: '#06b6d4' },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  typeBtnTextActive: { color: '#0f172a' },
  errorText: { fontSize: 11, color: '#f87171' },
  successText: { fontSize: 11, color: '#34d399' },
  primaryBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  footerText: { fontSize: 12, color: '#94a3b8' },
  linkText: { fontSize: 12, color: '#22d3ee', fontWeight: '700' },
});
