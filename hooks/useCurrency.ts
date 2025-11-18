/**
 * Currency Hook
 * Mengambil currency dari settings dan menyediakan helper untuk format harga
 */

import { useEffect, useState } from 'react';
import { getStoreSettings, clearSettingsCache } from '@/lib/settings';
import { formatCurrency } from '@/lib/utils';
import { getCurrencyLocale } from '@/lib/order-helpers';

export function useCurrency(initialCurrency?: string) {
  // Use initialCurrency if provided, otherwise default to IDR (most common for Indonesian stores)
  const [currency, setCurrency] = useState<string>(initialCurrency || 'IDR');
  const [loading, setLoading] = useState(!initialCurrency); // If initialCurrency provided, not loading

  const fetchCurrency = async () => {
    try {
      // Clear cache first to ensure fresh data
      clearSettingsCache();
      
      const settings = await getStoreSettings();
      const currencyCode = settings.currency || 'IDR';
      
      console.log('[useCurrency] Fetched currency:', currencyCode, 'from settings:', settings);
      
      setCurrency(currencyCode);
    } catch (error) {
      console.error('Error fetching currency:', error);
      setCurrency(initialCurrency || 'IDR'); // Fallback to initialCurrency or IDR
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If initialCurrency is provided, use it immediately and fetch in background
    if (initialCurrency) {
      setCurrency(initialCurrency);
      setLoading(false);
      // Still fetch in background to ensure we have latest value
      fetchCurrency();
    } else {
      // If no initialCurrency, fetch immediately
      fetchCurrency();
    }
    
    // Listen for storage event to refresh when settings change
    const handleStorageChange = () => {
      fetchCurrency();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    window.addEventListener('settingsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
    };
  }, [initialCurrency]);

  const formatPrice = (amount: number | string) => {
    const currencyLocale = getCurrencyLocale(currency);
    return formatCurrency(amount, currency, currencyLocale);
  };

  return {
    currency,
    formatPrice,
    loading,
    refresh: fetchCurrency, // Expose refresh function
  };
}

