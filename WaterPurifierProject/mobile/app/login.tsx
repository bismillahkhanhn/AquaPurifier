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
import { Droplet, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { loginWithEmail, getErrorMessage, logout } from '../services/auth';
import { getUserProfile } from '../services/user';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { refreshProfile, profileError } = useAuth();
  const [accountType, setAccountType] = useState<'customer' | 'dealer'>(
    params.role === 'dealer' ? 'dealer' : 'customer'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleLogin = async () => {
    setError('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(email, password);
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        await logout();
        setError('Your account profile is missing. Please register again or contact support.');
        return;
      }
      if (profile.role !== accountType) {
        await logout();
        setError(
          accountType === 'dealer'
            ? 'This is not a dealer account. Apply for dealer access or choose Customer sign in.'
            : 'This is a dealer account. Choose Dealer sign in to continue.'
        );
        return;
      }
      if (profile.accountStatus === 'suspended') {
        await logout();
        setError('This account has been suspended. Contact support for assistance.');
        return;
      }
      await refreshProfile();
      router.replace('/dashboard');
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
            <Text style={styles.title}>AquaPure</Text>
            <Text style={styles.subtitle}>
              {accountType === 'dealer' ? 'Dealer sign in' : 'Customer sign in'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.accountTypeRow}>
              {(['customer', 'dealer'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.accountTypeButton, accountType === type && styles.accountTypeButtonActive]}
                  onPress={() => {
                    setAccountType(type);
                    setError('');
                  }}
                >
                  <Text style={[styles.accountTypeText, accountType === type && styles.accountTypeTextActive]}>
                    {type === 'dealer' ? 'Dealer' : 'Customer'}
                  </Text>
                </TouchableOpacity>
              ))}
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
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="#64748b" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {!error && profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.linkText}>Create account</Text>
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
    gap: 24,
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
    gap: 14,
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
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 11, color: '#22d3ee', fontWeight: '600' },
  errorText: { fontSize: 11, color: '#f87171' },
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
  accountTypeRow: { flexDirection: 'row', gap: 8 },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  accountTypeButtonActive: { backgroundColor: '#082f49', borderColor: '#0891b2' },
  accountTypeText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  accountTypeTextActive: { color: '#22d3ee' },
});
