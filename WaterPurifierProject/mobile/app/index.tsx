import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user && profile && ['customer', 'dealer'].includes(profile.role)) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [loading, user, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#22d3ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
