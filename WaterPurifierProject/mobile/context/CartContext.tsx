import React, { createContext, useContext, useState } from 'react';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';

export interface MobileCartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: MobileCartItem[];
  priceForProduct: (product: Product) => number;
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  totalPaise: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<MobileCartItem[]>([]);
  const { profile } = useAuth();
  const isApprovedDealer =
    profile?.role === 'dealer' &&
    profile.dealerStatus === 'approved' &&
    profile.accountStatus === 'active';

  const getUnitPrice = (product: Product) =>
    isApprovedDealer ? product.dealerPricePaise : product.sellingPricePaise;

  const addItem = (product: Product) => {
    if (product.stockQuantity <= 0) return;
    if (isApprovedDealer && product.stockQuantity < product.dealerMinQuantity) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (!existing) {
        return [
          ...prev,
          {
            product,
            quantity: isApprovedDealer ? product.dealerMinQuantity : 1,
          },
        ];
      }
      return prev.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stockQuantity) }
          : item
      );
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(
                Math.max(quantity, isApprovedDealer ? item.product.dealerMinQuantity : 1),
                item.product.stockQuantity
              ),
            }
          : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPaise = items.reduce(
    (sum, item) => sum + getUnitPrice(item.product) * item.quantity,
    0
  );
  const deliveryFeePaise = subtotalPaise > 0 ? (subtotalPaise > 100000 ? 0 : 9900) : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        priceForProduct: getUnitPrice,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotalPaise,
        deliveryFeePaise,
        totalPaise: subtotalPaise + deliveryFeePaise,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
