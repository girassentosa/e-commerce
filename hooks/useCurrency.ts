/**
 * Currency Hook
 * Mengambil currency dari settings dan menyediakan helper untuk format harga
 */

import { useEffect, useState } from 'react';
import { getStoreSettings, clearSettingsCache } from '@/lib/settings';
import { formatCurrency } from '@/lib/utils';
import { getCurrencyLocale } from '@/lib/order-helpers';

export function useCurrency() {
  const [currency, setCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(true);

  const fetchCurrency = async () => {
    try {
      // Clear cache first to ensure fresh data
      clearSettingsCache();
      
      const settings = await getStoreSettings();
      const currencyCode = settings.currency || 'USD';
      
      console.log('[useCurrency] Fetched currency:', currencyCode, 'from settings:', settings);
      
      setCurrency(currencyCode);
    } catch (error) {
      console.error('Error fetching currency:', error);
      setCurrency('USD'); // Fallback to USD
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
    
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
  }, []);

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

