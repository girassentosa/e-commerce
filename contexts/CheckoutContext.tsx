'use client';

/**
 * Checkout Context
 * Global state management for checkout process
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

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
  paymentMethod: 'COD' | 'CREDIT_CARD' | 'BANK_TRANSFER' | null;
  orderSummary: OrderSummary | null;
  loading: boolean;
  setAddressId: (id: string) => void;
  setPaymentMethod: (method: 'COD' | 'CREDIT_CARD' | 'BANK_TRANSFER') => void;
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
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CREDIT_CARD' | 'BANK_TRANSFER' | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Validate cart before checkout
  const validateCart = useCallback(async (): Promise<boolean> => {
    if (status !== 'authenticated') {
      toast.error('Please login to continue');
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
        if (data.validation.errors && data.validation.errors.length > 0) {
          data.validation.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(data.error || 'Cart validation failed');
        }
        return false;
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      toast.error('Failed to validate cart');
      return false;
    } finally {
      setLoading(false);
    }
  }, [status]);

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
        toast.error(data.error || 'Failed to calculate totals');
      }
    } catch (error) {
      console.error('Error calculating totals:', error);
      toast.error('Failed to calculate totals');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create order
  const createOrder = useCallback(async (notes?: string): Promise<string | null> => {
    if (!addressId || !paymentMethod) {
      toast.error('Please complete all checkout steps');
      return null;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressId,
          paymentMethod,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order created successfully!');
        return data.data.orderNumber;
      } else {
        toast.error(data.error || 'Failed to create order');
        return null;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addressId, paymentMethod]);

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
    setPaymentMethod(null);
    setOrderSummary(null);
  }, []);

  return (
    <CheckoutContext.Provider
      value={{
        step,
        addressId,
        paymentMethod,
        orderSummary,
        loading,
        setAddressId,
        setPaymentMethod,
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

