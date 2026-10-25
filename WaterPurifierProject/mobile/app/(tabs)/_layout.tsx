import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Home, ShoppingBag, ShoppingCart, Clock, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#22d3ee" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60 + insets.bottom,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#06b6d4',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="catalogue"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#0891b2', color: '#ffffff', fontSize: 9 },
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <Clock color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
