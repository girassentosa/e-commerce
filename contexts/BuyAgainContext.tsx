'use client';

/**
 * Buy Again Context
 * Global state management for buy again products
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types
interface BuyAgainImage {
  imageUrl: string;
}

interface BuyAgainProduct {
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
  images: BuyAgainImage[];
}

export interface BuyAgainItem {
  id: string;
  productId: string;
  purchasedAt: string;
  product: BuyAgainProduct;
}

interface BuyAgainContextType {
  items: BuyAgainItem[];
  loading: boolean;
  fetchBuyAgain: () => Promise<void>;
  refreshBuyAgain: () => Promise<void>;
}

const BuyAgainContext = createContext<BuyAgainContextType | undefined>(undefined);

export function BuyAgainProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<BuyAgainItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch buy again products
  const fetchBuyAgain = useCallback(async () => {
    if (status !== 'authenticated') {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/buy-again');
      const data = await response.json();

      if (data.success) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching buy again products:', error);
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Refresh buy again
  const refreshBuyAgain = useCallback(async () => {
    await fetchBuyAgain();
  }, [fetchBuyAgain]);

  // Auto-fetch buy again on mount and auth change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBuyAgain();
    } else {
      setItems([]);
    }
  }, [status, fetchBuyAgain]);

  return (
    <BuyAgainContext.Provider
      value={{
        items,
        loading,
        fetchBuyAgain,
        refreshBuyAgain,
      }}
    >
      {children}
    </BuyAgainContext.Provider>
  );
}

// Hook to use buy again context
export function useBuyAgain() {
  const context = useContext(BuyAgainContext);
  if (context === undefined) {
    throw new Error('useBuyAgain must be used within a BuyAgainProvider');
  }
  return context;
}

