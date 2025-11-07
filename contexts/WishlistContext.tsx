'use client';

/**
 * Wishlist Context
 * Global state management for wishlist
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Types
interface WishlistImage {
  id: string;
  imageUrl: string;
  altText: string | null;
}

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  salePrice: string | null;
  stockQuantity: number;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: WishlistImage[];
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;
  product: WishlistProduct;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch wishlist
  const fetchWishlist = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      setCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/wishlist');
      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Add item to wishlist
  const addItem = useCallback(async (productId: string) => {
    if (status !== 'authenticated') {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Added to wishlist');
        await fetchWishlist();
      } else {
        toast.error(data.error || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  }, [status, fetchWishlist]);

  // Remove item from wishlist
  const removeItem = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Removed from wishlist');
        await fetchWishlist();
      } else {
        toast.error(data.error || 'Failed to remove from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  }, [fetchWishlist]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId: string): boolean => {
    return items.some(item => item.productId === productId);
  }, [items]);

  // Refresh wishlist
  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  // Auto-fetch wishlist on mount and auth change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status, fetchWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        count,
        loading,
        fetchWishlist,
        addItem,
        removeItem,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// Hook to use wishlist context
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

