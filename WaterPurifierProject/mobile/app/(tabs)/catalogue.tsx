import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Droplet, Search, ShoppingCart } from 'lucide-react-native';
import { Product, ProductCategory } from '../../types';
import { MOBILE_PRODUCTS } from '../../data/products';
import { subscribeToActiveProducts } from '../../services/shop';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { ProductArtwork } from '../../components/ProductArtwork';
import { formatINR } from '../../utils/currency';

type CategoryFilter = 'all' | ProductCategory;

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ro_purifiers', label: 'RO Purifiers' },
  { key: 'alkaline_units', label: 'Alkaline' },
  { key: 'uv_purifiers', label: 'UV' },
  { key: 'gravity_filters', label: 'Gravity' },
  { key: 'commercial_ro', label: 'Commercial' },
  { key: 'spare_filters', label: 'Spares' },
  { key: 'water_dispensers', label: 'Dispensers' },
  { key: 'water_pumps', label: 'Pumps' },
];

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  ro_purifiers: '#082f49',
  alkaline_units: '#3b1f08',
  uv_purifiers: '#2e1065',
  gravity_filters: '#052e1c',
  commercial_ro: '#3f1d38',
  spare_filters: '#1e293b',
  water_dispensers: '#172554',
  water_pumps: '#431407',
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ro_purifiers: 'RO Purifier',
  alkaline_units: 'Alkaline RO',
  uv_purifiers: 'UV Purifier',
  gravity_filters: 'Gravity Filter',
  commercial_ro: 'Commercial RO',
  spare_filters: 'Spare Part',
  water_dispensers: 'Water Dispenser',
  water_pumps: 'Water Pump',
};

export default function CatalogueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { addItem, itemCount } = useCart();
  const { profile } = useAuth();
  const isApprovedDealer =
    profile?.role === 'dealer' &&
    profile.dealerStatus === 'approved' &&
    profile.accountStatus === 'active';
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryFilter>('all');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[] | null>(null);
  const [catalogueError, setCatalogueError] = useState('');

  useEffect(() => subscribeToActiveProducts(
    (products) => {
      setFirestoreProducts(products);
      setCatalogueError('');
    },
    (error) => {
      console.warn('Firestore catalogue subscription failed', {
        code: 'code' in error ? error.code : undefined,
        message: error.message,
      });
      setCatalogueError('Live catalogue unavailable. Showing sample products; checkout requires active Firestore products.');
    }
  ), []);

  useEffect(() => {
    const initial = params.category as CategoryFilter | undefined;
    if (initial && CATEGORIES.some((item) => item.key === initial)) {
      setSelectedCat(initial);
    }
  }, [params.category]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const products = firestoreProducts?.length ? firestoreProducts : MOBILE_PRODUCTS;
    return products.filter((product) => {
      const matchesCategory = selectedCat === 'all' || product.category === selectedCat;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.specifications.purificationTechnology.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [firestoreProducts, search, selectedCat]);

  const handleAdd = (product: Product) => {
    if (!firestoreProducts?.some((liveProduct) => liveProduct.id === product.id)) {
      setCatalogueError('These are preview products. Ask an admin to import or create the live Firestore catalogue before adding products to your cart.');
      return;
    }
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId((current) => (current === product.id ? null : current)), 1200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {(catalogueError || firestoreProducts?.length === 0) && (
          <View style={styles.addedNotice}>
            <Text style={styles.addedNoticeText}>
              {catalogueError || 'Firestore catalogue is empty. Sample products are preview-only and cannot be ordered. Ask an admin to import the demo catalogue.'}
            </Text>
          </View>
        )}
        {profile?.role === 'dealer' && !isApprovedDealer && (
          <View style={styles.addedNotice}>
            <Text style={styles.addedNoticeText}>
              Dealer access is locked until your account is approved.
            </Text>
          </View>
        )}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Water Purifier Catalogue</Text>
            <Text style={styles.subtitle}>Genuine systems, filters, and spares</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <ShoppingCart size={19} color="#22d3ee" />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by RO, UV, TDS, AquaPure..."
            placeholderTextColor="#64748b"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {CATEGORIES.map((category) => {
            const active = selectedCat === category.key;
            return (
              <TouchableOpacity
                key={category.key}
                style={[styles.pill, active && styles.activePill]}
                onPress={() => setSelectedCat(category.key)}
              >
                <Text style={[styles.pillText, active && styles.activePillText]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {addedId && (
          <View style={styles.addedNotice}>
            <Text style={styles.addedNoticeText}>Added to cart</Text>
          </View>
        )}

        <View style={styles.list}>
          {filteredProducts.map((product) => {
            const inStock = product.stockQuantity > 0;
            const isLiveProduct = firestoreProducts?.some((liveProduct) => liveProduct.id === product.id) ?? false;
            const meetsDealerMinimum =
              !isApprovedDealer || product.stockQuantity >= product.dealerMinQuantity;
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productTop}>
                  <View
                    style={styles.productArt}
                  >
                    <ProductArtwork
                      category={product.category}
                      name={product.name}
                      width={88}
                      height={102}
                    />
                  </View>
                  <View style={styles.productBody}>
                    <Text style={styles.categoryLabel}>{CATEGORY_LABELS[product.category]}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.productBottom}>
                  <View>
                    <Text style={styles.price}>
                      {formatINR(
                        isApprovedDealer ? product.dealerPricePaise : product.sellingPricePaise
                      )}
                    </Text>
                    {isApprovedDealer && (
                      <Text style={styles.stock}>Wholesale · Min {product.dealerMinQuantity}</Text>
                    )}
                    <Text style={[styles.stock, !inStock && styles.outOfStock]}>
                      {!inStock
                        ? 'Out of stock'
                        : meetsDealerMinimum
                          ? `${product.stockQuantity} in stock`
                          : `Dealer minimum is ${product.dealerMinQuantity}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      (!inStock ||
                        !isLiveProduct ||
                        !meetsDealerMinimum ||
                        (profile?.role === 'dealer' && !isApprovedDealer)) &&
                        styles.addBtnDisabled,
                    ]}
                    disabled={
                      !inStock ||
                      !isLiveProduct ||
                      !meetsDealerMinimum ||
                      (profile?.role === 'dealer' && !isApprovedDealer)
                    }
                    onPress={() => handleAdd(product)}
                  >
                    <Text style={styles.addBtnText}>
                      {addedId === product.id
                        ? 'Added'
                        : !isLiveProduct
                          ? 'Preview only'
                        : !meetsDealerMinimum
                          ? 'Below Minimum'
                          : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {filteredProducts.length === 0 && (
            <View style={styles.emptyBox}>
              <Search size={28} color="#475569" />
              <Text style={styles.emptyText}>No products match your search.</Text>
            </View>
          )}
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
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    marginTop: 8,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  cartBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#0f172a' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#ffffff', fontSize: 13 },
  pillsRow: { gap: 6, paddingBottom: 14 },
  pill: {
    paddingHorizontal: 12,
    minHeight: 44,
    paddingVertical: 9,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activePill: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  pillText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  activePillText: { color: '#ffffff' },
  addedNotice: {
    backgroundColor: '#052e1c',
    borderWidth: 1,
    borderColor: '#065f46',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  addedNoticeText: { fontSize: 10, fontWeight: '700', color: '#34d399' },
  list: { gap: 10 },
  productCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12,
  },
  productTop: { flexDirection: 'row', gap: 11 },
  productArt: {
    width: 88,
    height: 102,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productBody: { flex: 1 },
  categoryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  productName: { fontSize: 13, fontWeight: '700', color: '#ffffff', marginTop: 3 },
  productDescription: { fontSize: 10, color: '#94a3b8', lineHeight: 15, marginTop: 4 },
  productBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  price: { fontSize: 15, fontWeight: '800', color: '#22d3ee' },
  stock: { fontSize: 9, color: '#64748b', marginTop: 2 },
  outOfStock: { color: '#f87171' },
  addBtn: {
    backgroundColor: '#06b6d4',
    borderRadius: 9,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#334155' },
  addBtnText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emptyText: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
});
