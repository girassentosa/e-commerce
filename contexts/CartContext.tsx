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

  // Fetch cart
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
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  }, [status, fetchCart]);

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
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    }
  }, [fetchCart]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Item removed from cart');
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  }, [fetchCart]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Cart cleared');
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  }, [fetchCart]);

  // Refresh cart
  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  // Auto-fetch cart on mount and auth change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCart();
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

