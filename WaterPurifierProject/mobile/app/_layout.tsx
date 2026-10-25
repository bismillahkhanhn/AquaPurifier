import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../hooks/useAuth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#090d16' },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="service/book"
              options={{
                headerShown: true,
                title: 'Book Installation / Service',
                presentation: 'modal',
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#ffffff',
              }}
            />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
