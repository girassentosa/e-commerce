'use client';

/**
 * Order Context
 * Global state management for orders
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Types
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  total: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedImageUrl?: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    images: Array<{
      imageUrl: string;
      altText: string | null;
    }>;
  };
  variant: any;
}

interface ShippingAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string | null;
  subtotal: string;
  tax: string;
  shippingCost: string;
  discount: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  pagination: Pagination | null;
  fetchOrders: (page?: number, status?: string, paymentStatus?: string, showLoading?: boolean) => Promise<void>;
  fetchOrderDetail: (orderNumber: string) => Promise<void>;
  cancelOrder: (orderNumber: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch orders list
  const fetchOrders = useCallback(async (page = 1, statusFilter?: string, paymentStatusFilter?: string, showLoading = false) => {
    if (status !== 'authenticated') {
      setOrders([]);
      return;
    }

    try {
      // Only show loading on initial load or when explicitly requested
      if (isInitialLoad || showLoading) {
        setLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (paymentStatusFilter) {
        params.append('paymentStatus', paymentStatusFilter);
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
        setPagination(data.pagination || null);
        setIsInitialLoad(false);
      } else {
        toast.error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [status, isInitialLoad]);

  // Fetch single order detail
  const fetchOrderDetail = useCallback(async (orderNumber: string) => {
    if (status !== 'authenticated') {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderNumber}`);
      const data = await response.json();

      if (data.success) {
        setCurrentOrder(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Cancel order
  const cancelOrder = useCallback(async (orderNumber: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderNumber}/cancel`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order cancelled successfully');
        // Refresh order detail if it's the current order
        if (currentOrder?.orderNumber === orderNumber) {
          await fetchOrderDetail(orderNumber);
        }
        return true;
      } else {
        toast.error(data.error || 'Failed to cancel order');
        return false;
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentOrder, fetchOrderDetail]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        loading,
        pagination,
        fetchOrders,
        fetchOrderDetail,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// Hook to use order context
export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}

