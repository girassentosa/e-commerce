'use client';

/**
 * Cart Context
 * Global state management for shopping cart
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from './NotificationContext';

// Types
interface CartImage {
  id: string;
  imageUrl: string;
  altText: string | null;
}

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  salePrice: string | null;
  stockQuantity: number;
  brand?: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: CartImage[];
  variants?: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  freeShippingThreshold?: string | null;
  defaultShippingCost?: string | null;
}

interface CartVariant {
  id: string;
  name: string;
  value: string;
  priceModifier: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: string;
  addedAt: string;
  product: CartProduct;
  variant: CartVariant | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedImageUrl?: string | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
  loading: boolean;
  selectedItems: Set<string>;
  setSelectedItems: (items: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, variantId?: string, color?: string, size?: string, imageUrl?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch cart count only (lightweight, fast)
  const fetchCartCount = useCallback(async () => {
    if (status !== 'authenticated') {
      setItemCount(0);
      return;
    }

    try {
      const response = await fetch('/api/cart/count');
      const data = await response.json();

      if (data.success) {
        setItemCount(data.data.itemCount || 0);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  }, [status]);

  // Fetch full cart data (items, subtotal, etc.)
  const fetchCart = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      setItemCount(0);
      setSubtotal('0.00');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart');
      const data = await response.json();

      if (data.success) {
        setItems(data.data.cart.items || []);
        setItemCount(data.data.itemCount || 0);
        setSubtotal(data.data.subtotal || '0.00');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Add item to cart
  const addItem = useCallback(async (productId: string, quantity = 1, variantId?: string, color?: string, size?: string, imageUrl?: string) => {
    if (status !== 'authenticated') {
      showError('Login Diperlukan', 'Silakan login untuk menambahkan item ke keranjang');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, variantId, color, size, imageUrl }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Berhasil', data.message || 'Item berhasil ditambahkan ke keranjang');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        showError('Gagal', data.error || 'Gagal menambahkan item ke keranjang');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Gagal', 'Gagal menambahkan item ke keranjang');
    }
  }, [status, fetchCartCount, fetchCart, showSuccess, showError]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Berhasil', 'Keranjang berhasil diperbarui');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        showError('Gagal', data.error || 'Gagal memperbarui keranjang');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      showError('Gagal', 'Gagal memperbarui keranjang');
    }
  }, [fetchCartCount, fetchCart, showSuccess, showError]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Berhasil', 'Item berhasil dihapus dari keranjang');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        showError('Gagal', data.error || 'Gagal menghapus item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      showError('Gagal', 'Gagal menghapus item');
    }
  }, [fetchCartCount, fetchCart, showSuccess, showError]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Berhasil', 'Keranjang berhasil dikosongkan');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        showError('Gagal', data.error || 'Gagal mengosongkan keranjang');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Gagal', 'Gagal mengosongkan keranjang');
    }
  }, [fetchCartCount, fetchCart, showSuccess, showError]);

  // Refresh cart
  const refreshCart = useCallback(async () => {
    // Update count first (fast), then full cart data
    await fetchCartCount();
    await fetchCart();
  }, [fetchCartCount, fetchCart]);

  // Auto-fetch full cart data on mount and auth change
  // Note: Cart count is fetched separately by pages that need instant display (e.g., dashboard)
  // This prevents race conditions and ensures instant badge display
  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch full cart data (items, subtotal, and itemCount)
      // This will update itemCount from the full cart response
      // Pages that need instant display (like dashboard) fetch cart count separately
      fetchCart();
    } else {
      // Reset when not authenticated
      setItems([]);
      setItemCount(0);
      setSubtotal('0.00');
    }
  }, [status, fetchCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        loading,
        selectedItems,
        setSelectedItems,
        fetchCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

