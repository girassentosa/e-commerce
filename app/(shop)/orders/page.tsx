'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrder } from '@/contexts/OrderContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Package, ChevronRight, Search, MessageCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { orders, loading, pagination, fetchOrders } = useOrder();
  
  // Get initial filter from URL params
  const urlStatus = searchParams.get('status');
  const urlPaymentStatus = searchParams.get('paymentStatus');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    urlStatus || undefined
  );
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string | undefined>(
    urlPaymentStatus || undefined
  );

  // Update state when URL params change
  useEffect(() => {
    setStatusFilter(urlStatus || undefined);
    setPaymentStatusFilter(urlPaymentStatus || undefined);
  }, [urlStatus, urlPaymentStatus]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/orders');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders(1, statusFilter, paymentStatusFilter);
    }
  }, [status, statusFilter, paymentStatusFilter, fetchOrders]);

  const handleFilterClick = (filterType: string, value?: string) => {
    let newStatusFilter: string | undefined;
    let newPaymentStatusFilter: string | undefined;

    if (filterType === 'status') {
      newStatusFilter = value;
      newPaymentStatusFilter = undefined;
    } else if (filterType === 'paymentStatus') {
      newPaymentStatusFilter = value;
      newStatusFilter = undefined;
    } else {
      // Reset all filters
      newStatusFilter = undefined;
      newPaymentStatusFilter = undefined;
    }

    // Optimistic update - langsung update state dan URL
    setStatusFilter(newStatusFilter);
    setPaymentStatusFilter(newPaymentStatusFilter);

    // Update URL dengan replace untuk smooth transition (tanpa scroll)
    const params = new URLSearchParams();
    if (newStatusFilter) params.set('status', newStatusFilter);
    if (newPaymentStatusFilter) params.set('paymentStatus', newPaymentStatusFilter);
    router.replace(`/orders${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    
    // Fetch data di background tanpa blocking UI (tanpa loading indicator)
    fetchOrders(1, newStatusFilter, newPaymentStatusFilter, false);
  };

  // Only show loader on initial load when no orders exist
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center"><Loader size="lg" /></div>
      </div>
    );
  }

  // Determine active filter
  const isAllActive = !statusFilter && !paymentStatusFilter;
  const isBelumBayarActive = paymentStatusFilter === 'PENDING';
  const isDikemasActive = statusFilter === 'PROCESSING';
  const isDikirimActive = statusFilter === 'SHIPPED';
  const isSelesaiActive = statusFilter === 'DELIVERED';
  const isPengembalianActive = statusFilter === 'REFUNDED';
  const isDibatalkanActive = statusFilter === 'CANCELLED';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Pesanan Saya</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:opacity-70 transition-opacity">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:opacity-70 transition-opacity">
            <MessageCircle className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filter Buttons - Horizontal Scroll */}
      <div className="overflow-x-auto mb-6">
        <div className="flex gap-2 min-w-max pb-1">
          <button
            onClick={() => handleFilterClick('all')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isAllActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Total Order
          </button>
          <button
            onClick={() => handleFilterClick('paymentStatus', 'PENDING')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isBelumBayarActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Belum Bayar
          </button>
          <button
            onClick={() => handleFilterClick('status', 'PROCESSING')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isDikemasActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Dikemas
          </button>
          <button
            onClick={() => handleFilterClick('status', 'SHIPPED')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isDikirimActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Dikirim
          </button>
          <button
            onClick={() => handleFilterClick('status', 'DELIVERED')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isSelesaiActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Selesai
          </button>
          <button
            onClick={() => handleFilterClick('status', 'REFUNDED')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isPengembalianActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Pengembalian
          </button>
          <button
            onClick={() => handleFilterClick('status', 'CANCELLED')}
            className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
              isDibatalkanActive
                ? 'text-gray-900 border-red-500'
                : 'text-gray-700 border-transparent hover:text-gray-900'
            }`}
          >
            Dibatalkan
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">No orders found</p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.orderNumber}`}>
              <div className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex gap-2 mb-3">
                  {order.items.slice(0, 3).map((item) => {
                    const imageUrl = item.product.images[0]?.imageUrl;
                    return imageUrl ? (
                      <div key={item.id} className="w-16 h-16 bg-gray-100 rounded">
                        <Image
                          src={imageUrl}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    ) : null;
                  })}
                  {order.items.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">${parseFloat(order.total).toFixed(2)}</p>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex gap-2 justify-center mt-6">
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => fetchOrders(i + 1, statusFilter, paymentStatusFilter)}
              className={`px-4 py-2 rounded ${
                pagination.page === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center"><Loader size="lg" /></div>
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}

