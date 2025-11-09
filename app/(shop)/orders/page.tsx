'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrder } from '@/contexts/OrderContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Package, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { orders, loading, pagination, fetchOrders } = useOrder();
  
  // Get search query from URL (managed by Header component)
  const searchQuery = searchParams.get('search') || '';
  
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
      // Use showLoading=false for smooth filter transitions (only show loading on initial load)
      // Check if this is initial load by checking if we have no filters and no orders yet
      const isInitialLoad = !statusFilter && !paymentStatusFilter && orders.length === 0 && !loading;
      fetchOrders(1, statusFilter, paymentStatusFilter, isInitialLoad);
    }
  }, [status, statusFilter, paymentStatusFilter, fetchOrders, orders.length, loading]);

  // Filter handling is now done in Header component
  // This effect will fetch orders when filters change via URL

  // Only show loader on initial load when no orders exist
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center"><Loader size="lg" /></div>
      </div>
    );
  }

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some((item) => 
        item.productName.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-4 sm:pb-6 md:pb-8">
      <div className="-mt-2">

      {/* Search Results Info */}
      {searchQuery && filteredOrders.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Menampilkan {filteredOrders.length} dari {orders.length} pesanan
        </div>
      )}

      {/* No search results */}
      {searchQuery && filteredOrders.length === 0 && orders.length > 0 && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
          <p className="text-gray-600 mb-6">
            Tidak ada pesanan yang cocok dengan "{searchQuery}"
          </p>
        </div>
      )}

      {/* Empty state - no orders */}
      {filteredOrders.length === 0 && !searchQuery && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">No orders found</p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      )}

      {/* Orders list */}
      {filteredOrders.length > 0 && (
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)] mb-2 sm:mb-6 md:mb-8">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="px-2 sm:px-2.5 md:px-3 pb-2 sm:pb-3 md:pb-4">
              <div className="space-y-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
                {filteredOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.orderNumber}`}>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer">
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
            </div>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex gap-1 sm:gap-2 justify-center mt-4 sm:mt-6 mb-0">
          {[...Array(pagination.totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => fetchOrders(i + 1, statusFilter, paymentStatusFilter)}
              className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded ${
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

