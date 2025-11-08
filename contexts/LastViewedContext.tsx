'use client';

/**
 * Last Viewed Context
 * Global state management for last viewed products
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types
interface LastViewedImage {
  imageUrl: string;
}

interface LastViewedProduct {
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
  images: LastViewedImage[];
}

export interface LastViewedItem {
  id: string;
  productId: string;
  viewedAt: string;
  product: LastViewedProduct;
}

interface LastViewedContextType {
  items: LastViewedItem[];
  loading: boolean;
  fetchLastViewed: () => Promise<void>;
  refreshLastViewed: () => Promise<void>;
}

const LastViewedContext = createContext<LastViewedContextType | undefined>(undefined);

export function LastViewedProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<LastViewedItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch last viewed products
  const fetchLastViewed = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/last-viewed');
      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching last viewed:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Refresh last viewed
  const refreshLastViewed = useCallback(async () => {
    await fetchLastViewed();
  }, [fetchLastViewed]);

  // Auto-fetch last viewed on mount and auth change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchLastViewed();
    } else {
      setItems([]);
    }
  }, [status, fetchLastViewed]);

  return (
    <LastViewedContext.Provider
      value={{
        items,
        loading,
        fetchLastViewed,
        refreshLastViewed,
      }}
    >
      {children}
    </LastViewedContext.Provider>
  );
}

// Hook to use last viewed context
export function useLastViewed() {
  const context = useContext(LastViewedContext);
  if (context === undefined) {
    throw new Error('useLastViewed must be used within a LastViewedProvider');
  }
  return context;
}

