'use client';

/**
 * Cart Context
 * Global state management for shopping cart
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

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
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: CartImage[];
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
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [subtotal, setSubtotal] = useState('0.00');
  const [loading, setLoading] = useState(false);

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
  const addItem = useCallback(async (productId: string, quantity = 1, variantId?: string) => {
    if (status !== 'authenticated') {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, variantId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Item added to cart');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  }, [status, fetchCartCount, fetchCart]);

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
        toast.success('Cart updated');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  }, [fetchCartCount, fetchCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item removed from cart');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  }, [fetchCartCount, fetchCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cart cleared');
        // Update count immediately, then fetch full cart
        await fetchCartCount();
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  }, [fetchCartCount, fetchCart]);

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

