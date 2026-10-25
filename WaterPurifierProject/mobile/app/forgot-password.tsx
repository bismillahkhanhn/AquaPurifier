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
import { useRouter } from 'expo-router';
import { ArrowLeft, Droplet, Mail } from 'lucide-react-native';
import { sendResetEmail, getErrorMessage } from '../services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const handleReset = async () => {
    setError('');
    setSuccess('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await sendResetEmail(email);
      setSuccess('Password reset email sent. Check your inbox.');
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
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={18} color="#94a3b8" />
            <Text style={styles.backText}>Back to login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Droplet size={26} color="#22d3ee" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              We'll send a password reset link to your email
            </Text>
          </View>

          <View style={styles.card}>
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              disabled={loading}
              onPress={handleReset}
            >
              {loading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
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
    gap: 18,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 12, color: '#94a3b8' },
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
  subtitle: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
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
});
