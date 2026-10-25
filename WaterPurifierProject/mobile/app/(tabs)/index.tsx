import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShieldCheck, Wrench, Droplet, Award, ArrowRight, ShoppingCart } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { MOBILE_PRODUCTS } from '../../data/products';

export default function HomeScreen() {
  const router = useRouter();
  const { itemCount } = useCart();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>AquaPure</Text>
          <Text style={styles.brandSubtitle}>Pure & Mineralized Drinking Water</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <ShoppingCart size={17} color="#22d3ee" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceBtn}
            onPress={() => router.push('/service/book')}
          >
            <Wrench size={16} color="#ffffff" />
            <Text style={styles.serviceBtnText}>Book Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTag}>100% Copper + Alkaline RO</Text>
        <Text style={styles.heroTitle}>Grand Plus RO+UV+UF+TDS</Text>
        <Text style={styles.heroPrice}>₹14,999 • Free Installation</Text>
        <TouchableOpacity
          style={styles.heroCta}
          onPress={() => router.push('/catalogue')}
        >
          <Text style={styles.heroCtaText}>Explore Products</Text>
          <ArrowRight size={14} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Feature Badges */}
      <View style={styles.featuresRow}>
        <View style={styles.featureCard}>
          <ShieldCheck size={20} color="#06b6d4" />
          <Text style={styles.featureTitle}>1 Year Warranty</Text>
          <Text style={styles.featureDesc}>Onsite Support</Text>
        </View>
        <View style={styles.featureCard}>
          <Droplet size={20} color="#06b6d4" />
          <Text style={styles.featureTitle}>Free TDS Test</Text>
          <Text style={styles.featureDesc}>With every visit</Text>
        </View>
        <View style={styles.featureCard}>
          <Award size={20} color="#06b6d4" />
          <Text style={styles.featureTitle}>Cash on Delivery</Text>
          <Text style={styles.featureDesc}>Pay on installation</Text>
        </View>
      </View>

      {/* Categories Grid */}
      <Text style={styles.sectionTitle}>Shop by Category</Text>
      <View style={styles.categoriesGrid}>
        {[
          { label: 'RO Purifiers', cat: 'ro_purifiers', sub: 'For Borewell & High TDS' },
          { label: 'Alkaline RO', cat: 'alkaline_units', sub: 'Copper & Zinc Infused' },
          { label: 'UV Purifiers', cat: 'uv_purifiers', sub: 'For Municipal Tap Water' },
          { label: 'Gravity Non-Electric', cat: 'gravity_filters', sub: 'Zero Power Operation' },
          { label: 'Commercial RO', cat: 'commercial_ro', sub: '25 - 100 LPH Skids' },
          { label: 'Spare Filters', cat: 'spare_filters', sub: 'Membranes & Cartridges' },
        ].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.categoryCard}
            onPress={() => router.push({ pathname: '/catalogue', params: { category: item.cat } })}
          >
            <Text style={styles.catName}>{item.label}</Text>
            <Text style={styles.catSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090d16' },
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
  brandSubtitle: { fontSize: 12, color: '#94a3b8' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#0f172a' },
  serviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  serviceBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  heroBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  heroTag: { fontSize: 11, fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginTop: 4 },
  heroPrice: { fontSize: 14, color: '#cbd5e1', marginTop: 4 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#38bdf8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  heroCtaText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  featureTitle: { color: '#ffffff', fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  featureDesc: { color: '#64748b', fontSize: 9, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff', marginBottom: 12 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '47%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  catName: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  catSub: { color: '#94a3b8', fontSize: 10, marginTop: 4 },
});
