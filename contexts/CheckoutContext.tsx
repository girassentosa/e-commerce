'use client';

/**
 * Checkout Context
 * Global state management for checkout process
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNotification } from './NotificationContext';

// Types
interface OrderSummary {
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
}

interface CheckoutContextType {
  step: number;
  addressId: string | null;
  paymentMethod: 'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'CREDIT_CARD' | null;
  paymentChannel: string | null;
  orderSummary: OrderSummary | null;
  loading: boolean;
  setAddressId: (id: string) => void;
  setPaymentMethod: (method: 'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'CREDIT_CARD' | null) => void;
  setPaymentChannel: (channel: string | null) => void;
  validateCart: () => Promise<boolean>;
  calculateTotals: (addressId: string) => Promise<void>;
  createOrder: (notes?: string) => Promise<string | null>;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  reset: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [paymentMethodState, setPaymentMethodState] = useState<'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'CREDIT_CARD' | null>(null);
  const [paymentChannel, setPaymentChannelState] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate cart before checkout
  const validateCart = useCallback(async (): Promise<boolean> => {
    if (status !== 'authenticated') {
      showError('Butuh login', 'Silakan masuk terlebih dahulu untuk melanjutkan checkout.');
      return false;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/checkout/validate', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.validation.valid) {
        return true;
      } else {
        // Show validation errors
        if (data.validation?.errors && data.validation.errors.length > 0) {
          const firstError = data.validation.errors[0];
          showError('Validasi keranjang gagal', firstError || 'Beberapa item tidak valid.');
        } else {
          showError('Validasi keranjang gagal', data.error || 'Cart validation failed');
        }
        return false;
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      showError('Validasi keranjang gagal', 'Terjadi kesalahan saat memvalidasi keranjang.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [status, showError]);

  // Calculate totals
  const calculateTotals = useCallback(async (addressIdParam: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/checkout/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId: addressIdParam }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderSummary(data.data);
      } else {
        showError('Gagal menghitung total', data.error || 'Failed to calculate totals');
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
      showError('Gagal menghitung total', 'Terjadi kesalahan saat menghitung total belanja.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Create order
  const createOrder = useCallback(async (notes?: string): Promise<string | null> => {
    if (!addressId || !paymentMethodState) {
      showError('Checkout belum lengkap', 'Silakan lengkapi alamat dan metode pembayaran.');
      return null;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId,
          paymentMethod: paymentMethodState,
          paymentChannel,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Pesanan dibuat', 'Pesanan berhasil dibuat. Lanjutkan ke pembayaran.');
        return data.data.orderNumber;
      } else {
        showError('Gagal membuat pesanan', data.error || 'Failed to create order');
        return null;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Gagal membuat pesanan', 'Terjadi kesalahan saat membuat pesanan.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addressId, paymentMethodState, paymentChannel, showError, showSuccess]);

  // Step navigation
  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  // Reset checkout state
  const reset = useCallback(() => {
    setStep(1);
    setAddressId(null);
    setPaymentMethodState(null);
    setPaymentChannelState(null);
    setOrderSummary(null);
  }, []);

  const handleSetPaymentMethod = useCallback((method: 'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'CREDIT_CARD' | null) => {
    setPaymentMethodState(method);
    if (method !== 'VIRTUAL_ACCOUNT') {
      setPaymentChannelState(null);
    }
  }, []);

  const handleSetPaymentChannel = useCallback((channel: string | null) => {
    setPaymentChannelState(channel);
  }, []);

  return (
    <CheckoutContext.Provider
      value={{
        step,
        addressId,
        paymentMethod: paymentMethodState,
        paymentChannel,
        orderSummary,
        loading,
        setAddressId,
        setPaymentMethod: handleSetPaymentMethod,
        setPaymentChannel: handleSetPaymentChannel,
        validateCart,
        calculateTotals,
        createOrder,
        nextStep,
        prevStep,
        setStep,
        reset,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

// Hook to use checkout context
export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

