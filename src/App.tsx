/**
 * AquaPure Water Purifier E-Commerce System
 * Complete End-to-End System:
 * - Customer Storefront (Catalogue, Search, Specs Modal, Cart, COD Checkout, Orders, Service Booking)
 * - Dealer Wholesale Portal (KYC Application, Wholesale Pricing, MOQ, Dealer Orders)
 * - Admin Control Dashboard (Inventory, Order Management, Dealer KYC, Service Tickets, Stock Updates)
 * - Android Expo Mobile Simulator (Interactive Mobile App Experience)
 * - Firebase & Database Config Hub (Firestore Rules, Integer-Paise Schema, Blueprint)
 */

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Layers,
  Users,
  LayoutDashboard,
  Smartphone,
  Database,
  Terminal,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Phone,
  MapPin,
  Check,
  Copy,
  DollarSign,
  TrendingUp,
  FileText,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../WaterPurifierProject/admin/src/data/products';
import { SAMPLE_ORDERS, SAMPLE_DEALER_APPLICATIONS, SAMPLE_SERVICES, SAMPLE_USERS } from '../WaterPurifierProject/admin/src/data/mockData';
import { paiseToINR, inrToPaise } from '../WaterPurifierProject/admin/src/utils/currency';
import { Product, ProductCategory, Order, DealerApplication, ServiceBooking, UserProfile, UserRole, DealerStatus } from '../WaterPurifierProject/admin/src/types';

// Cart Item Model
interface CartItem {
  product: Product;
  quantity: number;
  unitPricePaise: number;
}

export default function App() {
  // Current Active User Simulation
  const [currentUser, setCurrentUser] = useState<UserProfile>(SAMPLE_USERS[0]); // Default to Admin for testing
  const [activePortal, setActivePortal] = useState<'storefront' | 'dealer' | 'admin' | 'mobile_sim' | 'firebase_hub'>('storefront');

  // Products State
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'stock'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAddress, setCheckoutAddress] = useState({
    fullName: 'Priya Nair',
    phone: '+91 94470 98765',
    addressLine1: 'B-604, Palm Grove Apartments, Kakkanad',
    city: 'Kochi',
    state: 'Kerala',
    postalCode: '682030',
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Orders & Data State
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [dealerApps, setDealerApps] = useState<DealerApplication[]>(SAMPLE_DEALER_APPLICATIONS);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>(SAMPLE_SERVICES);

  // Service Booking Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    serviceType: 'new_installation' as ServiceBooking['serviceType'],
    purifierModel: 'AquaPure Grand Plus RO+UV+UF+TDS',
    preferredDate: '2026-10-26',
    preferredTimeSlot: 'morning' as ServiceBooking['preferredTimeSlot'],
    addressLine: 'B-604, Palm Grove Apartments, Kakkanad, Kochi (682030)',
  });

  // Dealer Application Form Modal
  const [isDealerModalOpen, setIsDealerModalOpen] = useState(false);
  const [dealerForm, setDealerForm] = useState({
    businessName: '',
    gstNumber: '',
    panNumber: '',
    businessType: 'retail_shop' as DealerApplication['businessType'],
    addressLine1: '',
    city: '',
    state: '',
    postalCode: '',
    estimatedMonthlyUnits: 15,
  });

  // Admin Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'ro_purifiers' as ProductCategory,
    brand: 'AquaPure',
    description: '',
    sellingPriceRupees: 14999,
    dealerPriceRupees: 11200,
    dealerMinQuantity: 4,
    stockQuantity: 25,
    imageUrl: '/images/ro-purifiers.svg',
    purificationTech: 'RO + UV + UF + Alkaline',
    storageCapacity: 9,
    purificationSpeed: 15,
    suitableTds: 'Up to 2000 ppm',
  });

  // Admin Edit Stock
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(0);

  // Mobile Simulator Tab State
  const [mobileTab, setMobileTab] = useState<'home' | 'catalogue' | 'cart' | 'orders' | 'profile'>('home');

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.specifications.purificationTechnology.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.sellingPricePaise - b.sellingPricePaise;
        if (sortBy === 'price_high') return b.sellingPricePaise - a.sellingPricePaise;
        if (sortBy === 'stock') return b.stockQuantity - a.stockQuantity;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Is Approved Dealer Check
  const isApprovedDealer = currentUser.role === 'dealer' && currentUser.dealerStatus === 'approved';

  const isCheckoutValid =
    checkoutAddress.fullName.trim().length > 1 &&
    checkoutAddress.phone.replace(/\D/g, '').length >= 10 &&
    checkoutAddress.addressLine1.trim().length > 4 &&
    checkoutAddress.city.trim().length > 1 &&
    checkoutAddress.state.trim().length > 1 &&
    /^\d{6}$/.test(checkoutAddress.postalCode.trim());

  // Cart Computations in Integer Paise
  const cartSubtotalPaise = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPricePaise * item.quantity, 0);
  }, [cart]);

  const deliveryFeePaise = cartSubtotalPaise > 0 ? (cartSubtotalPaise > 100000 ? 0 : 9900) : 0; // Free delivery above ₹1,000
  const cartTotalPaise = cartSubtotalPaise + deliveryFeePaise;

  // Add to Cart
  const handleAddToCart = (product: Product, customQty = 1) => {
    // If dealer, use dealer wholesale price, else selling price
    const unitPricePaise = isApprovedDealer ? product.dealerPricePaise : product.sellingPricePaise;
    const minQty = isApprovedDealer ? product.dealerMinQuantity : 1;
    const qtyToAdd = Math.min(Math.max(customQty, minQty), Math.max(0, product.stockQuantity));
    if (qtyToAdd <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const updatedQty = Math.min(existing.quantity + qtyToAdd, product.stockQuantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: updatedQty } : item
        );
      }
      return [...prev, { product, quantity: qtyToAdd, unitPricePaise }];
    });
    setIsCartOpen(true);
  };

  // Update Cart Quantity
  const handleUpdateCartQty = (productId: string, newQty: number) => {
    setCart((prev) =>
      prev.flatMap((item) => {
        if (item.product.id !== productId) return [item];
        const minQty = isApprovedDealer ? item.product.dealerMinQuantity : 1;
        if (newQty < minQty) return [];
        return [{ ...item, quantity: Math.min(newQty, item.product.stockQuantity) }];
      })
    );
  };

  // Submit COD Order
  const handlePlaceOrder = () => {
    if (cart.length === 0 || isSubmittingOrder || !isCheckoutValid) return;
    setIsSubmittingOrder(true);

    setTimeout(() => {
      const newOrderNum = `AQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        orderNumber: newOrderNum,
        customerId: currentUser.uid,
        customerName: checkoutAddress.fullName,
        customerEmail: currentUser.email,
        customerPhone: checkoutAddress.phone,
        orderType: isApprovedDealer ? 'dealer_wholesale' : 'customer_retail',
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          category: item.product.category,
          brand: item.product.brand,
          quantity: item.quantity,
          unitPricePaise: item.unitPricePaise, // Historical snapshot price
          totalPricePaise: item.unitPricePaise * item.quantity,
        })),
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
        subtotalPaise: cartSubtotalPaise,
        taxPaise: 0,
        deliveryFeePaise: deliveryFeePaise,
        totalAmountPaise: cartTotalPaise,
        paymentMethod: isApprovedDealer ? 'bank_transfer' : 'cash_on_delivery',
        paymentStatus: 'pending',
        shippingAddress: {
          id: `addr-${Date.now()}`,
          fullName: checkoutAddress.fullName,
          phone: checkoutAddress.phone,
          addressLine1: checkoutAddress.addressLine1,
          city: checkoutAddress.city,
          state: checkoutAddress.state,
          postalCode: checkoutAddress.postalCode,
          isDefault: true,
        },
        orderStatus: 'confirmed',
        statusTimeline: [
          {
            status: 'pending',
            note: isApprovedDealer ? 'Wholesale order registered' : 'Cash on Delivery order placed',
            timestamp: new Date().toISOString(),
          },
          {
            status: 'confirmed',
            note: 'Order confirmed by automated inventory allocation',
            timestamp: new Date().toISOString(),
          },
        ],
        serviceRequested: includeInstallation,
        notes: orderNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Decrement stock in catalogue (simulating atomic Firestore transaction)
      setProducts((prev) =>
        prev.map((p) => {
          const inCart = cart.find((c) => c.product.id === p.id);
          if (inCart) {
            return { ...p, stockQuantity: Math.max(0, p.stockQuantity - inCart.quantity) };
          }
          return p;
        })
      );

      // Auto-create service booking if requested
      if (includeInstallation) {
        const newService: ServiceBooking = {
          id: `srv-${Date.now()}`,
          bookingNumber: `SRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          customerId: currentUser.uid,
          customerName: checkoutAddress.fullName,
          customerPhone: checkoutAddress.phone,
          customerEmail: currentUser.email,
          serviceType: 'new_installation',
          purifierModelOrBrand: cart[0]?.product.name || 'AquaPure RO System',
          preferredDate: '2026-10-26',
          preferredTimeSlot: 'morning',
          serviceAddress: {
            addressLine: checkoutAddress.addressLine1,
            city: checkoutAddress.city,
            postalCode: checkoutAddress.postalCode,
          },
          status: 'booked',
          serviceCostPaise: 0, // Free with new installation
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setServiceBookings((prev) => [newService, ...prev]);
      }

      setOrders((prev) => [newOrder, ...prev]);
      setLastPlacedOrder(newOrder);
      setCart([]);
      setIsSubmittingOrder(false);
      setIsCheckoutOpen(false);
    }, 800);
  };

  // Submit Dealer Application
  const handleSubmitDealerApp = () => {
    if (!dealerForm.businessName || !dealerForm.gstNumber) return;
    const newApp: DealerApplication = {
      id: `app-${Date.now()}`,
      userId: currentUser.uid,
      applicantName: currentUser.displayName,
      email: currentUser.email,
      phoneNumber: currentUser.phoneNumber || '+91 98765 00000',
      businessName: dealerForm.businessName,
      gstNumber: dealerForm.gstNumber,
      panNumber: dealerForm.panNumber,
      businessType: dealerForm.businessType,
      shopAddress: {
        addressLine1: dealerForm.addressLine1 || 'Main Market Road',
        city: dealerForm.city || 'Mumbai',
        state: dealerForm.state || 'Maharashtra',
        postalCode: dealerForm.postalCode || '400001',
      },
      estimatedMonthlyUnits: dealerForm.estimatedMonthlyUnits,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDealerApps((prev) => [newApp, ...prev]);
    setCurrentUser((prev) => ({
      ...prev,
      role: 'dealer',
      dealerStatus: 'pending',
      companyName: dealerForm.businessName,
      gstNumber: dealerForm.gstNumber,
    }));
    setIsDealerModalOpen(false);
  };

  // Admin: Approve Dealer
  const handleApproveDealer = (appId: string) => {
    setDealerApps((prev) =>
      prev.map((app) =>
        app.id === appId
          ? { ...app, status: 'approved', reviewedByAdminId: currentUser.uid, reviewedAt: new Date().toISOString() }
          : app
      )
    );
    // If the active simulated user is that applicant, update their state
    const matched = dealerApps.find((a) => a.id === appId);
    if (matched && matched.userId === currentUser.uid) {
      setCurrentUser((prev) => ({ ...prev, role: 'dealer', dealerStatus: 'approved' }));
    }
  };

  // Admin: Reject Dealer
  const handleRejectDealer = (appId: string, reason: string) => {
    setDealerApps((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              status: 'rejected',
              rejectionReason: reason || 'Incomplete documentation or unverified GSTIN.',
              reviewedByAdminId: currentUser.uid,
              reviewedAt: new Date().toISOString(),
            }
          : app
      )
    );
  };

  // Admin: Update Order Status
  const handleAdvanceOrderStatus = (orderId: string, nextStatus: Order['orderStatus']) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedTimeline = [
            ...o.statusTimeline,
            {
              status: nextStatus,
              note: `Status updated to ${nextStatus.replace(/_/g, ' ')} by Admin`,
              timestamp: new Date().toISOString(),
            },
          ];
          return {
            ...o,
            orderStatus: nextStatus,
            statusTimeline: updatedTimeline,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
  };

  // Admin: Update Service Status
  const handleAdvanceServiceStatus = (serviceId: string, nextStatus: ServiceBooking['status']) => {
    setServiceBookings((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          return {
            ...s,
            status: nextStatus,
            assignedTechnician:
              nextStatus === 'assigned'
                ? { name: 'Sunil Verma (Senior Water Specialist)', phone: '+91 98765 88990' }
                : s.assignedTechnician,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  };

  // Admin: Create Product
  const handleCreateProduct = () => {
    if (!newProductForm.name) return;
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newProductForm.name,
      slug: newProductForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newProductForm.category,
      brand: newProductForm.brand,
      description: newProductForm.description || 'Precision engineered water purifier with comprehensive multi-stage filtration.',
      sellingPricePaise: inrToPaise(newProductForm.sellingPriceRupees),
      dealerPricePaise: inrToPaise(newProductForm.dealerPriceRupees),
      dealerMinQuantity: newProductForm.dealerMinQuantity,
      stockQuantity: newProductForm.stockQuantity,
      images: [newProductForm.imageUrl],
      featured: true,
      specifications: {
        purificationTechnology: newProductForm.purificationTech,
        storageCapacityLitres: newProductForm.storageCapacity,
        purificationSpeedLph: newProductForm.purificationSpeed,
        suitableForTdsPpm: newProductForm.suitableTds,
        filterCartridges: ['Sediment', 'Pre-Carbon', 'RO Membrane', 'Alkaline Mineralizer'],
        warrantyYears: 1,
        powerConsumptionWatts: 60,
        dimensionsCm: '40 x 30 x 54 cm',
        weightKg: 8.5,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProd, ...prev]);
    setIsAddProductModalOpen(false);
  };

  // Submit Service Request
  const handleBookService = () => {
    const newService: ServiceBooking = {
      id: `srv-${Date.now()}`,
      bookingNumber: `SRV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: currentUser.uid,
      customerName: currentUser.displayName,
      customerPhone: currentUser.phoneNumber || '+91 94470 98765',
      customerEmail: currentUser.email,
      serviceType: serviceForm.serviceType,
      purifierModelOrBrand: serviceForm.purifierModel,
      preferredDate: serviceForm.preferredDate,
      preferredTimeSlot: serviceForm.preferredTimeSlot,
      serviceAddress: {
        addressLine: serviceForm.addressLine,
        city: 'Kochi',
        postalCode: '682030',
      },
      status: 'booked',
      serviceCostPaise: serviceForm.serviceType === 'new_installation' ? 0 : 79900, // ₹799 service charge
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setServiceBookings((prev) => [newService, ...prev]);
    setIsServiceModalOpen(false);
  };

  // User Switcher options
  const handleSelectSimulatedUser = (role: UserRole, status: DealerStatus = 'none') => {
    if (role === 'admin') {
      setCurrentUser({
        uid: 'user-001',
        email: 'bismillahkhan.hn@gmail.com',
        displayName: 'Bismillah Khan (Admin)',
        phoneNumber: '+91 98765 43210',
        role: 'admin',
        dealerStatus: 'none',
        savedAddresses: [],
        createdAt: '2026-09-01T08:00:00Z',
        updatedAt: '2026-10-22T08:00:00Z',
      });
      setActivePortal('admin');
    } else if (role === 'dealer') {
      setCurrentUser({
        uid: 'user-002',
        email: 'rajesh.sharma@purifiersindia.com',
        displayName: 'Rajesh Sharma',
        phoneNumber: '+91 98220 12345',
        role: 'dealer',
        dealerStatus: status === 'pending' ? 'pending' : 'approved',
        companyName: 'Sharma Water Solutions',
        gstNumber: '29ABCDE1234F1Z5',
        savedAddresses: [],
        createdAt: '2026-09-10T11:00:00Z',
        updatedAt: '2026-10-15T09:30:00Z',
      });
      setActivePortal('dealer');
    } else {
      setCurrentUser({
        uid: 'user-003',
        email: 'priya.nair@example.com',
        displayName: 'Priya Nair',
        phoneNumber: '+91 94470 98765',
        role: 'customer',
        dealerStatus: 'none',
        savedAddresses: [],
        createdAt: '2026-09-20T14:20:00Z',
        updatedAt: '2026-10-21T16:00:00Z',
      });
      setActivePortal('storefront');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Universal Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/95 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">AquaPure</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase">
                  End-to-End System
                </span>
              </div>
              <p className="text-xs text-slate-400">Water Purifiers • Wholesale Dealers • Administration</p>
            </div>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActivePortal('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activePortal === 'storefront' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Customer Store</span>
            </button>
            <button
              onClick={() => setActivePortal('dealer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activePortal === 'dealer' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Dealer Wholesale</span>
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activePortal === 'admin' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Control</span>
            </button>
            <button
              onClick={() => setActivePortal('mobile_sim')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activePortal === 'mobile_sim' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Android Expo Simulator</span>
            </button>
            <button
              onClick={() => setActivePortal('firebase_hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activePortal === 'firebase_hub' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Firebase & Rules</span>
            </button>
          </div>

          {/* User Role Quick Switcher & Cart Trigger */}
          <div className="flex items-center gap-3">
            {/* Role Switcher Dropdown simulation */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 text-xs">
              <span className="text-[10px] text-slate-400">Viewing as:</span>
              <select
                aria-label="Select user role"
                value={`${currentUser.role}_${currentUser.dealerStatus}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'admin_none') handleSelectSimulatedUser('admin');
                  else if (val === 'dealer_approved') handleSelectSimulatedUser('dealer', 'approved');
                  else if (val === 'dealer_pending') handleSelectSimulatedUser('dealer', 'pending');
                  else handleSelectSimulatedUser('customer');
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="customer_none" className="bg-slate-900 text-white">Customer (Priya Nair)</option>
                <option value="dealer_approved" className="bg-slate-900 text-white">Dealer (Approved Wholesale)</option>
                <option value="dealer_pending" className="bg-slate-900 text-white">Dealer (Pending KYC)</option>
                <option value="admin_none" className="bg-slate-900 text-white">Admin (Bismillah Khan)</option>
              </select>
            </div>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center shadow-md">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        {/* ========================================================================= */}
        {/* PORTAL 1: CUSTOMER STOREFRONT */}
        {/* ========================================================================= */}
        {activePortal === 'storefront' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-900 via-blue-900 to-slate-900 border border-cyan-800/40 p-6 lg:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  100% Certified RO + Alkaline Water Filtration
                </div>
                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Pure, Mineral-Rich Drinking Water For Your Family
                </h1>
                <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                  Certified multi-barrier purification systems: Copper-infused Alkaline, UV Disinfection, Gravity Non-Electric & Heavy-Duty Commercial RO plants. Free doorstep installation & Cash on Delivery across India.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      const el = document.getElementById('catalogue-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
                  >
                    <span>Browse 55+ Purifiers</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsServiceModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>Book Installation / Service</span>
                  </button>
                  {currentUser.role === 'customer' && (
                    <button
                      onClick={() => setIsDealerModalOpen(true)}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold rounded-xl text-xs border border-amber-500/30 transition-colors flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Become a Wholesale Dealer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quality & Value Proposition Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">1 Year Warranty</h4>
                  <p className="text-[11px] text-slate-400">Free parts replacement</p>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Free Installation</h4>
                  <p className="text-[11px] text-slate-400">By certified engineers</p>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cash on Delivery</h4>
                  <p className="text-[11px] text-slate-400">Pay after installation</p>
                </div>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Free TDS Health Check</h4>
                  <p className="text-[11px] text-slate-400">Instant water analysis</p>
                </div>
              </div>
            </div>

            {/* Product Catalogue Section */}
            <div id="catalogue-section" className="space-y-6 pt-4">
              {/* Filter & Search Bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 55+ purifiers, filters, spares..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: 'All Products (58)' },
                    { id: 'ro_purifiers', label: 'RO Purifiers' },
                    { id: 'alkaline_units', label: 'Alkaline RO' },
                    { id: 'uv_purifiers', label: 'UV Disinfection' },
                    { id: 'gravity_filters', label: 'Gravity 0-Power' },
                    { id: 'commercial_ro', label: 'Commercial Skids' },
                    { id: 'spare_filters', label: 'Filters & Spares' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors font-medium ${
                        selectedCategory === cat.id
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <span className="text-slate-400">Sort:</span>
                  <select
                    aria-label="Sort products by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="stock">Highest Stock</option>
                  </select>
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((p) => {
                  const effectivePrice = isApprovedDealer ? p.dealerPricePaise : p.sellingPricePaise;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition-all group"
                    >
                      <div>
                        {/* Image */}
                        <div
                          className="h-44 bg-slate-950 relative overflow-hidden cursor-pointer"
                          onClick={() => setSelectedProduct(p)}
                        >
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-950/80 backdrop-blur-md text-cyan-300 border border-slate-700">
                              {p.category.replace(/_/g, ' ')}
                            </span>
                            {p.featured && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-slate-950">
                                Best Seller
                              </span>
                            )}
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/90 backdrop-blur-md text-slate-300 border border-slate-700">
                            {p.brand}
                          </span>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 space-y-2">
                          <h3
                            onClick={() => setSelectedProduct(p)}
                            className="font-bold text-sm text-white line-clamp-1 hover:text-cyan-400 cursor-pointer"
                          >
                            {p.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>

                          {/* Quick Spec Pills */}
                          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-300 font-mono">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                              {p.specifications.storageCapacityLitres > 0
                                ? `${p.specifications.storageCapacityLitres}L Storage`
                                : 'Direct Flow'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                              {p.specifications.purificationSpeedLph} LPH
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Pricing & Action */}
                      <div className="p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-extrabold text-cyan-400">
                              {paiseToINR(effectivePrice)}
                            </span>
                            {isApprovedDealer && (
                              <span className="text-[10px] line-through text-slate-500">
                                {paiseToINR(p.sellingPricePaise)}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {isApprovedDealer
                              ? `Wholesale (MOQ: ${p.dealerMinQuantity})`
                              : 'Includes 18% GST + Free Installation'}
                          </span>
                        </div>

                        <button
                          disabled={p.stockQuantity === 0}
                          onClick={() => handleAddToCart(p)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            p.stockQuantity === 0
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{p.stockQuantity === 0 ? 'Out of Stock' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 2: DEALER WHOLESALE SYSTEM */}
        {/* ========================================================================= */}
        {activePortal === 'dealer' && (
          <div className="space-y-6">
            {/* Dealer Status Banner */}
            {currentUser.dealerStatus === 'none' && (
              <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    AquaPure Authorized Wholesale Partner Network
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Register your dealership to access B2B wholesale prices (up to 28% margins), bulk spare membranes, priority technician dispatch, and credit facilities.
                  </p>
                </div>
                <button
                  onClick={() => setIsDealerModalOpen(true)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 shadow-lg"
                >
                  Submit Dealer KYC Application
                </button>
              </div>
            )}

            {currentUser.dealerStatus === 'pending' && (
              <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Dealer Application Under Admin Review</h3>
                    <p className="text-xs text-slate-400">Business Name: {currentUser.companyName || 'Registered Enterprise'} • GST: {currentUser.gstNumber || 'Pending verification'}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Our compliance team reviews GSTIN and shop credentials within 24 hours. Once verified, your account automatically unlocks wholesale rates across all 58 products.
                </p>
              </div>
            )}

            {isApprovedDealer && (
              <div className="space-y-6">
                {/* Approved Header */}
                <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Authorized Wholesale Partner
                    </div>
                    <h2 className="text-lg font-bold text-white">{currentUser.companyName || 'Sharma Water Solutions'}</h2>
                    <p className="text-xs text-slate-400">GSTIN: {currentUser.gstNumber || '29ABCDE1234F1Z5'} • Wholesale Pricing Active</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Wholesale Discount</span>
                      <span className="font-extrabold text-emerald-400 text-sm">~26% Average</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Payment Terms</span>
                      <span className="font-extrabold text-cyan-400 text-sm">RTGS / Net 15</span>
                    </div>
                  </div>
                </div>

                {/* Wholesale Quick Order Catalogue */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Wholesale Catalogue & Minimum Order Quantities (MOQ)</h3>
                    <span className="text-xs text-slate-400">Prices displayed in integer-paise converted to INR</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.slice(0, 9).map((p) => (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-[10px] text-cyan-400 uppercase font-bold">{p.category.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              MOQ: {p.dealerMinQuantity} units
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-white line-clamp-1">{p.name}</h4>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-sm font-extrabold text-emerald-400">{paiseToINR(p.dealerPricePaise)}</span>
                            <span className="text-xs line-through text-slate-500">{paiseToINR(p.sellingPricePaise)}</span>
                            <span className="text-[10px] text-slate-400">/ unit</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Stock: <strong className="text-white">{p.stockQuantity}</strong></span>
                          <button
                            disabled={p.stockQuantity < p.dealerMinQuantity}
                            onClick={() => handleAddToCart(p, p.dealerMinQuantity)}
                            className={`px-3 py-1.5 font-bold text-xs rounded-lg transition-colors ${
                              p.stockQuantity < p.dealerMinQuantity
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {p.stockQuantity < p.dealerMinQuantity ? 'Below MOQ Stock' : `Order MOQ (${p.dealerMinQuantity})`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 3: ADMIN CONTROL DASHBOARD */}
        {/* ========================================================================= */}
        {activePortal === 'admin' && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Total System Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2">
                  {paiseToINR(orders.reduce((acc, o) => acc + o.totalAmountPaise, 0))}
                </p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Across {orders.length} verified orders
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Active Catalogue Inventory</span>
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2">{products.length} SKUs</p>
                <p className="text-xs text-slate-400 mt-1">
                  Total Stock: {products.reduce((acc, p) => acc + p.stockQuantity, 0)} units
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dealer KYC Applications</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 mt-2">
                  {dealerApps.filter((a) => a.status === 'pending').length} Pending
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {dealerApps.filter((a) => a.status === 'approved').length} approved wholesale dealers
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Service & Installation Tickets</span>
                  <Wrench className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-black text-white mt-2">{serviceBookings.length} Active</p>
                <p className="text-xs text-cyan-400 mt-1">
                  {serviceBookings.filter((s) => s.status === 'assigned').length} technicians on duty
                </p>
              </div>
            </div>

            {/* Admin Action Tabs: Inventory, Orders, Dealers, Services */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <h3 className="font-bold text-sm text-white">Administration Modules</h3>
                <button
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* 1. ORDER DISPATCH & STATUS LIFECYCLE */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Live Orders Management</h4>
                      <p className="text-xs text-slate-400">Historical snapshots & payment status updates</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400">{orders.length} Total Orders</span>
                  </div>

                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{o.orderNumber}</span>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                                o.orderType === 'dealer_wholesale'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              }`}>
                                {o.orderType === 'dealer_wholesale' ? 'Dealer Wholesale' : 'Customer Retail COD'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Recipient: <strong className="text-white">{o.customerName}</strong> ({o.customerPhone}) • Address: {o.shippingAddress.addressLine1}, {o.shippingAddress.city}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-extrabold text-cyan-400">{paiseToINR(o.totalAmountPaise)}</p>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                              Current: {o.orderStatus.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Line Items */}
                        <div className="space-y-1.5 text-xs">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                              <span className="text-slate-300">{it.productName} × {it.quantity}</span>
                              <span className="font-mono text-cyan-300 font-semibold">{paiseToINR(it.totalPricePaise)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Admin Action Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                          <span className="text-[11px] text-slate-500">
                            Timeline: {o.statusTimeline.length} events logged
                          </span>
                          <div className="flex items-center gap-2">
                            {o.orderStatus === 'confirmed' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(o.id, 'processing')}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs"
                              >
                                Mark Processing
                              </button>
                            )}
                            {o.orderStatus === 'processing' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(o.id, 'shipped')}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs"
                              >
                                Mark Shipped
                              </button>
                            )}
                            {o.orderStatus === 'shipped' && (
                              <button
                                onClick={() => handleAdvanceOrderStatus(o.id, 'delivered')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs"
                              >
                                Mark Delivered
                              </button>
                            )}
                            {o.orderStatus === 'delivered' && (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Delivered & Settled
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. DEALER KYC APPROVAL QUEUE */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Dealer KYC Approvals</h4>
                      <p className="text-xs text-slate-400">Review business registration, PAN, and GST credentials</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dealerApps.map((d) => (
                      <div key={d.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-white">{d.businessName}</h5>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                              d.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : d.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              {d.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">Contact: {d.applicantName} ({d.phoneNumber}) • Email: {d.email}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            GSTIN: <span className="text-cyan-400">{d.gstNumber}</span> • PAN: {d.panNumber} • Type: {d.businessType}
                          </p>
                          <p className="text-xs text-slate-400">
                            Location: {d.shopAddress.addressLine1}, {d.shopAddress.city}, {d.shopAddress.state} ({d.shopAddress.postalCode})
                          </p>
                          {d.rejectionReason && (
                            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 p-2 rounded-lg mt-1">
                              Rejection Reason: {d.rejectionReason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {d.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveDealer(d.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                              >
                                Approve Dealer
                              </button>
                              <button
                                onClick={() => handleRejectDealer(d.id, 'Unverified GST number or invalid business proof.')}
                                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40 rounded-lg text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : d.status === 'approved' ? (
                            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-4 h-4" /> Active Wholesale Partner
                            </span>
                          ) : (
                            <span className="text-xs text-red-400 font-semibold">Rejected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SERVICE & INSTALLATION TICKETS */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Service & Installation Tickets</h4>
                      <p className="text-xs text-slate-400">Technician dispatch and on-site resolution tracking</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {serviceBookings.map((s) => (
                      <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{s.bookingNumber}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                              {s.serviceType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">Customer: {s.customerName} ({s.customerPhone})</p>
                          <p className="text-xs text-slate-400">Address: {s.serviceAddress.addressLine}</p>
                          <p className="text-xs text-slate-400">Slot: <strong className="text-white">{s.preferredDate}</strong> ({s.preferredTimeSlot})</p>
                          {s.assignedTechnician && (
                            <p className="text-xs text-emerald-400 mt-1">
                              Assigned Engineer: {s.assignedTechnician.name} ({s.assignedTechnician.phone})
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {s.status === 'booked' && (
                            <button
                              onClick={() => handleAdvanceServiceStatus(s.id, 'assigned')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                            >
                              Assign Technician
                            </button>
                          )}
                          {s.status === 'assigned' && (
                            <button
                              onClick={() => handleAdvanceServiceStatus(s.id, 'completed')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                            >
                              Mark Completed
                            </button>
                          )}
                          <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                            {s.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. STOCK & INVENTORY CONTROLS */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">Stock Replenishment & Pricing Overrides</h4>
                      <p className="text-xs text-slate-400">Direct inventory adjustments with zero downtime</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                    {products.slice(0, 12).map((p) => (
                      <div key={p.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="max-w-[180px]">
                          <p className="font-bold text-white line-clamp-1">{p.name}</p>
                          <p className="text-slate-400">{paiseToINR(p.sellingPricePaise)} • Stock: {p.stockQuantity}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setProducts((prev) =>
                                prev.map((item) =>
                                  item.id === p.id ? { ...item, stockQuantity: item.stockQuantity + 10 } : item
                                )
                              );
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded text-[11px]"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => {
                              setProducts((prev) =>
                                prev.map((item) =>
                                  item.id === p.id ? { ...item, stockQuantity: Math.max(0, item.stockQuantity - 5) } : item
                                )
                              );
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-red-400 font-bold rounded text-[11px]"
                          >
                            -5
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 4: ANDROID EXPO MOBILE SIMULATOR */}
        {/* ========================================================================= */}
        {activePortal === 'mobile_sim' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
            {/* Left: Explanatory & File Map */}
            <div className="max-w-md space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Android Expo App (Expo Router)</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This interactive smartphone canvas runs the exact file-based screens implemented inside <code className="text-cyan-300 font-mono">WaterPurifierProject/mobile/app/</code>.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="font-bold text-cyan-400 font-mono">(tabs)/index.tsx</span>: Featured purifiers & fast service dispatch.
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="font-bold text-cyan-400 font-mono">(tabs)/catalogue.tsx</span>: 55+ Product catalogue with live search.
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="font-bold text-cyan-400 font-mono">(tabs)/cart.tsx</span>: Cart quantity control & COD checkout.
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="font-bold text-cyan-400 font-mono">(tabs)/orders.tsx</span>: Order history with timeline tracking.
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-400">
                To run on a real Android device, run <code className="text-cyan-300">cd WaterPurifierProject/mobile && npx expo start</code> and scan the QR code in Expo Go.
              </div>
            </div>

            {/* Right: Smartphone Mockup Frame */}
            <div className="w-[340px] h-[680px] bg-slate-950 rounded-[48px] p-4 border-4 border-slate-700 shadow-2xl relative flex flex-col justify-between shrink-0">
              {/* Speaker & Sensor Notch */}
              <div className="w-36 h-4 bg-slate-800 rounded-full mx-auto mb-2 shrink-0"></div>

              {/* Simulated Screen */}
              <div className="flex-1 bg-slate-900 rounded-[34px] overflow-hidden flex flex-col justify-between border border-slate-800">
                {/* Mobile App Header */}
                <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                      AQ
                    </div>
                    <span className="font-bold text-xs text-white">AquaPure</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Expo Go
                  </span>
                </div>

                {/* Mobile Tab Content */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {/* TAB: HOME */}
                  {mobileTab === 'home' && (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 p-3.5 rounded-2xl text-white shadow-lg">
                        <span className="text-[9px] uppercase font-bold text-cyan-200">100% Copper Alkaline</span>
                        <h4 className="font-extrabold text-sm mt-0.5">Grand Plus RO+UV 9L</h4>
                        <p className="text-[10px] text-cyan-100 mt-0.5">₹14,999 • Free Installation</p>
                        <button
                          onClick={() => setMobileTab('catalogue')}
                          className="mt-3 px-3 py-1.5 bg-slate-950 text-white font-bold rounded-lg text-[10px]"
                        >
                          Shop 55+ Models
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setIsServiceModalOpen(true)}
                          className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-left hover:border-cyan-500/40"
                        >
                          <Wrench className="w-4 h-4 text-cyan-400 mb-1" />
                          <h5 className="font-bold text-white text-[11px]">Book Service</h5>
                          <p className="text-[9px] text-slate-400">Installation & repair</p>
                        </button>
                        <button
                          onClick={() => setMobileTab('catalogue')}
                          className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-left hover:border-cyan-500/40"
                        >
                          <Package className="w-4 h-4 text-blue-400 mb-1" />
                          <h5 className="font-bold text-white text-[11px]">Catalogue</h5>
                          <p className="text-[9px] text-slate-400">58 purifiers & spares</p>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-white block">Popular purifiers</span>
                        {products.slice(0, 3).map((p) => (
                          <div key={p.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white text-[11px] line-clamp-1">{p.name}</p>
                              <p className="text-[10px] text-cyan-400 font-semibold">{paiseToINR(p.sellingPricePaise)}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded text-[10px]"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: CATALOGUE */}
                  {mobileTab === 'catalogue' && (
                    <div className="space-y-2.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search RO, UV, spares..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        {filteredProducts.slice(0, 8).map((p) => (
                          <div key={p.id} className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div className="max-w-[170px]">
                              <p className="font-bold text-white text-[11px] line-clamp-1">{p.name}</p>
                              <p className="text-[10px] text-slate-400">{p.specifications.purificationSpeedLph} LPH • {paiseToINR(p.sellingPricePaise)}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(p)}
                              className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-[10px]"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: CART */}
                  {mobileTab === 'cart' && (
                    <div className="space-y-3">
                      <span className="font-bold text-xs text-white">Your Cart ({cart.length})</span>
                      {cart.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-8">Your cart is empty.</p>
                      ) : (
                        <div className="space-y-2">
                          {cart.map((item) => (
                            <div key={item.product.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                              <div className="max-w-[150px]">
                                <p className="font-bold text-white text-[11px] line-clamp-1">{item.product.name}</p>
                                <p className="text-[10px] text-cyan-400">{paiseToINR(item.unitPricePaise * item.quantity)}</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                                  className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="font-bold text-white text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                                  className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">Total:</span>
                              <span className="font-bold text-cyan-400">{paiseToINR(cartTotalPaise)}</span>
                            </div>
                            <button
                              onClick={() => {
                                setIsCartOpen(false);
                                setIsCheckoutOpen(true);
                              }}
                              className="w-full mt-2 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs"
                            >
                              Checkout (Cash on Delivery)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: ORDERS */}
                  {mobileTab === 'orders' && (
                    <div className="space-y-2.5">
                      <span className="font-bold text-xs text-white">Your Orders</span>
                      {orders.map((o) => (
                        <div key={o.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                          <div className="flex justify-between font-bold">
                            <span className="text-white">{o.orderNumber}</span>
                            <span className="text-cyan-400">{paiseToINR(o.totalAmountPaise)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{o.items.length} items • Status: <strong className="text-emerald-400">{o.orderStatus}</strong></p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB: PROFILE */}
                  {mobileTab === 'profile' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                        <p className="font-bold text-white text-xs">{currentUser.displayName}</p>
                        <p className="text-[10px] text-slate-400">{currentUser.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Role: {currentUser.role}
                        </span>
                      </div>
                      <button
                        onClick={() => setIsServiceModalOpen(true)}
                        className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs font-semibold text-slate-300 flex items-center justify-between"
                      >
                        <span>Book Service / Filter Replacement</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => setIsDealerModalOpen(true)}
                        className="w-full p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs font-semibold text-amber-400 flex items-center justify-between"
                      >
                        <span>Apply for Dealership (KYC)</span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="bg-slate-950 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] text-slate-400">
                  <button
                    onClick={() => setMobileTab('home')}
                    className={`flex flex-col items-center ${mobileTab === 'home' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={() => setMobileTab('catalogue')}
                    className={`flex flex-col items-center ${mobileTab === 'catalogue' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Shop</span>
                  </button>
                  <button
                    onClick={() => setMobileTab('cart')}
                    className={`flex flex-col items-center relative ${mobileTab === 'cart' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Cart</span>
                    {cart.length > 0 && (
                      <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[8px] flex items-center justify-center font-bold">
                        {cart.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setMobileTab('orders')}
                    className={`flex flex-col items-center ${mobileTab === 'orders' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Orders</span>
                  </button>
                  <button
                    onClick={() => setMobileTab('profile')}
                    className={`flex flex-col items-center ${mobileTab === 'profile' ? 'text-cyan-400 font-bold' : ''}`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2 shrink-0"></div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL 5: FIREBASE CONFIG & SECURITY RULES HUB */}
        {/* ========================================================================= */}
        {activePortal === 'firebase_hub' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Cloud Firestore & Security Rules</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Zero-Trust ABAC Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                AquaPure is built on Google Cloud Firestore with Attribute-Based Access Control (ABAC). Security rules reject unverified writes, prevent client role manipulation, and guarantee integer-paise financial consistency.
              </p>

              {/* Security Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Non-Self-Assignable Roles
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Users cannot create or elevate their profile to <code className="text-cyan-300 font-mono">admin</code> or bypass dealer KYC.
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Integer-Paise Currency
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Every financial value is strictly 64-bit integer paise (e.g., ₹14,999 = 1,499,900 paise) preventing decimal skew.
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-purple-400" />
                    Historical Price Snapshots
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Order line items preserve unit price and specs at the exact timestamp of purchase.
                  </p>
                </div>
              </div>

              {/* Code Viewer: firestore.rules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-cyan-400 font-semibold">firestore.rules</span>
                  <span>Version 2</span>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-96 overflow-y-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Default-Deny Catch-All
    }

    function isSignedIn() { return request.auth != null; }
    function isAdmin() {
      return isSignedIn() && (
        exists(/databases/$(database)/documents/admins/$(request.auth.uid)) ||
        (request.auth.token.email != null && request.auth.token.email == 'bismillahkhan.hn@gmail.com')
      );
    }

    match /products/{productId} {
      allow get, list: if true;
      allow write: if isAdmin();
    }

    match /users/{userId} {
      allow get: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == userId && request.resource.data.role in ['customer', 'dealer'];
      allow update: if (request.auth.uid == userId && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'dealerStatus'])) || isAdmin();
    }

    match /dealerApplications/{appId} {
      allow get, list: if (isSignedIn() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid && request.resource.data.status == 'pending';
      allow update: if isAdmin();
    }

    match /orders/{orderId} {
      allow get, list: if (isSignedIn() && resource.data.customerId == request.auth.uid) || isAdmin();
      allow create: if isSignedIn() && request.resource.data.customerId == request.auth.uid;
      allow update: if isAdmin();
    }

    match /serviceBookings/{bookingId} {
      allow get, list: if (isSignedIn() && resource.data.customerId == request.auth.uid) || isAdmin();
      allow create: if isSignedIn() && request.resource.data.customerId == request.auth.uid;
      allow update: if isAdmin();
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* SLIDE-OVER: SHOPPING CART */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-base text-white">Your Shopping Cart</h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="py-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-sm text-slate-400">Your cart is currently empty.</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs"
                    >
                      Browse Catalogue
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg bg-slate-900 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-white line-clamp-1">{item.product.name}</h4>
                        <p className="text-[11px] text-cyan-400 font-semibold mt-0.5">
                          {paiseToINR(item.unitPricePaise)}
                        </p>
                        <span className="text-[10px] text-slate-500">
                          Stock: {item.product.stockQuantity} available
                        </span>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, 0)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">{paiseToINR(cartSubtotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery:</span>
                    <span className="font-mono text-emerald-400">
                      {deliveryFeePaise === 0 ? 'FREE' : paiseToINR(deliveryFeePaise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                    <span>Total Amount:</span>
                    <span className="font-extrabold text-cyan-400 text-base">{paiseToINR(cartTotalPaise)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  <span>Proceed to Cash on Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CASH ON DELIVERY CHECKOUT */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Cash on Delivery (COD) Checkout</h3>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={checkoutAddress.fullName}
                  onChange={(e) => setCheckoutAddress({ ...checkoutAddress, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={checkoutAddress.phone}
                    onChange={(e) => setCheckoutAddress({ ...checkoutAddress, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={checkoutAddress.postalCode}
                    onChange={(e) => setCheckoutAddress({ ...checkoutAddress, postalCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Door / Flat / Street Address</label>
                <input
                  type="text"
                  value={checkoutAddress.addressLine1}
                  onChange={(e) => setCheckoutAddress({ ...checkoutAddress, addressLine1: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={checkoutAddress.city}
                    onChange={(e) => setCheckoutAddress({ ...checkoutAddress, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={checkoutAddress.state}
                    onChange={(e) => setCheckoutAddress({ ...checkoutAddress, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Free Installation Checkbox */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="installCheck"
                  checked={includeInstallation}
                  onChange={(e) => setIncludeInstallation(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="installCheck" className="text-slate-300 cursor-pointer">
                  Include <strong>Free Onsite Installation</strong> & technician visit
                </label>
              </div>
            </div>

            {/* Total & Submit Button */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-300">Total COD Payable:</span>
                <span className="text-cyan-400 text-base">{paiseToINR(cartTotalPaise)}</span>
              </div>
              {!isCheckoutValid && (
                <p className="text-[11px] text-amber-400">
                  Enter a valid name, 10-digit phone, address, city, state, and 6-digit PIN code.
                </p>
              )}
              <button
                disabled={isSubmittingOrder || !isCheckoutValid}
                onClick={handlePlaceOrder}
                className={`w-full py-3 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isSubmittingOrder || !isCheckoutValid
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {isSubmittingOrder ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Order (Pay on Delivery)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRODUCT SPECIFICATIONS & DETAILS */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <div className="overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400">{selectedProduct.category.replace(/_/g, ' ')}</span>
                  <h3 className="font-bold text-lg text-white mt-0.5">{selectedProduct.name}</h3>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-48 rounded-xl bg-slate-950 overflow-hidden border border-slate-800">
                  <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300 leading-relaxed">{selectedProduct.description}</p>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <p className="text-slate-400">Suitable For: <strong className="text-white">{selectedProduct.specifications.suitableForTdsPpm}</strong></p>
                    <p className="text-slate-400">Warranty: <strong className="text-emerald-400">{selectedProduct.specifications.warrantyYears} Year Comprehensive</strong></p>
                    <p className="text-slate-400">Power: <strong className="text-white">{selectedProduct.specifications.powerConsumptionWatts} Watts</strong></p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Technical Specifications</h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <div className="grid grid-cols-2 p-2.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Purification Technology</span>
                    <span className="text-white font-semibold">{selectedProduct.specifications.purificationTechnology}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Storage Tank Capacity</span>
                    <span className="text-white font-semibold">
                      {selectedProduct.specifications.storageCapacityLitres > 0
                        ? `${selectedProduct.specifications.storageCapacityLitres} Litres`
                        : 'Direct Flow / In-line'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 border-b border-slate-800/80">
                    <span className="text-slate-400">Filtration Speed</span>
                    <span className="text-white font-semibold">{selectedProduct.specifications.purificationSpeedLph} Litres Per Hour</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="text-slate-400">Cartridge Stages</span>
                    <span className="text-white font-semibold">
                      {selectedProduct.specifications.filterCartridges.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Retail Selling Price</span>
                <span className="text-xl font-extrabold text-cyan-400">{paiseToINR(selectedProduct.sellingPricePaise)}</span>
              </div>
              <button
                disabled={selectedProduct.stockQuantity === 0}
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BOOK INSTALLATION / SERVICE */}
      {/* ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Book Installation / Service</h3>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Type</label>
                <select
                  aria-label="Select service type"
                  value={serviceForm.serviceType}
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="new_installation">New Purifier Installation (Free with purchase)</option>
                  <option value="filter_cartridge_replacement">Filter / Membrane Cartridge Replacement</option>
                  <option value="leakage_repair">Leakage & Pipe Fitting Repair</option>
                  <option value="tds_health_check">TDS Level & Water Purity Health Check</option>
                  <option value="annual_maintenance">Annual Maintenance Contract (AMC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Purifier Model / Brand</label>
                <input
                  type="text"
                  value={serviceForm.purifierModel}
                  onChange={(e) => setServiceForm({ ...serviceForm, purifierModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={serviceForm.preferredDate}
                    onChange={(e) => setServiceForm({ ...serviceForm, preferredDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Slot</label>
                  <select
                    aria-label="Select preferred time slot"
                    value={serviceForm.preferredTimeSlot}
                    onChange={(e) => setServiceForm({ ...serviceForm, preferredTimeSlot: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="morning">Morning (9 AM - 1 PM)</option>
                    <option value="afternoon">Afternoon (1 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 8 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Service Address</label>
                <input
                  type="text"
                  value={serviceForm.addressLine}
                  onChange={(e) => setServiceForm({ ...serviceForm, addressLine: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleBookService}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Confirm Service Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEALER KYC REGISTRATION */}
      {/* ========================================================================= */}
      {isDealerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Wholesale Dealership Application</h3>
              </div>
              <button onClick={() => setIsDealerModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Business / Enterprise Name</label>
                <input
                  type="text"
                  placeholder="e.g. PureTech Water Solutions"
                  value={dealerForm.businessName}
                  onChange={(e) => setDealerForm({ ...dealerForm, businessName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    placeholder="29ABCDE1234F1Z5"
                    value={dealerForm.gstNumber}
                    onChange={(e) => setDealerForm({ ...dealerForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={dealerForm.panNumber}
                    onChange={(e) => setDealerForm({ ...dealerForm, panNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Business Type</label>
                  <select
                    aria-label="Select business type"
                    value={dealerForm.businessType}
                    onChange={(e) => setDealerForm({ ...dealerForm, businessType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="retail_shop">Retail Water Shop</option>
                    <option value="distributor">Regional Distributor</option>
                    <option value="service_center">RO Service Center</option>
                    <option value="plumbing_contractor">Plumbing Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Est. Monthly Units</label>
                  <input
                    type="number"
                    value={dealerForm.estimatedMonthlyUnits}
                    onChange={(e) => setDealerForm({ ...dealerForm, estimatedMonthlyUnits: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Shop Address</label>
                <input
                  type="text"
                  placeholder="Street / Market Yard"
                  value={dealerForm.addressLine1}
                  onChange={(e) => setDealerForm({ ...dealerForm, addressLine1: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleSubmitDealerApp}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                Submit Application for Admin Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN ADD NEW PRODUCT */}
      {/* ========================================================================= */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Add New Product SKU</h3>
              </div>
              <button onClick={() => setIsAddProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  placeholder="AquaPure SuperRO Max 10L"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    aria-label="Select product category"
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="ro_purifiers">RO Purifiers</option>
                    <option value="alkaline_units">Alkaline Units</option>
                    <option value="uv_purifiers">UV Purifiers</option>
                    <option value="gravity_filters">Gravity Filters</option>
                    <option value="commercial_ro">Commercial RO</option>
                    <option value="spare_filters">Spare Filters</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brand</label>
                  <input
                    type="text"
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Retail Price (INR)</label>
                  <input
                    type="number"
                    value={newProductForm.sellingPriceRupees}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sellingPriceRupees: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dealer Wholesale Price (INR)</label>
                  <input
                    type="number"
                    value={newProductForm.dealerPriceRupees}
                    onChange={(e) => setNewProductForm({ ...newProductForm, dealerPriceRupees: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProductForm.stockQuantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dealer MOQ (Units)</label>
                  <input
                    type="number"
                    value={newProductForm.dealerMinQuantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, dealerMinQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                <input
                  type="text"
                  value={newProductForm.imageUrl}
                  onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleCreateProduct}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg"
              >
                Save Product to Catalogue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Order Confirmation Popup / Alert */}
      {lastPlacedOrder && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 border border-emerald-500/50 p-4 rounded-2xl shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Order Placed Successfully!
            </span>
            <button onClick={() => setLastPlacedOrder(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Order <strong className="text-white font-mono">{lastPlacedOrder.orderNumber}</strong> confirmed for {paiseToINR(lastPlacedOrder.totalAmountPaise)}. Cash on Delivery scheduled.
          </p>
        </div>
      )}
    </div>
  );
}
