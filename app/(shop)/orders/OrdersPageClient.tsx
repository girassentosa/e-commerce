'use client';

import { useEffect, useState, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Package, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '@/hooks/useCurrency';

// Types (mirip dengan OrderContext)
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
      variant: {
        id: string;
        productId: string;
        name: string;
        value: string;
        priceModifier: string;
        stockQuantity: number;
      } | null;
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
  currency: string;
  subtotal: string;
  tax: string;
  shippingCost: string;
  serviceFee?: string;
  paymentFee?: string;
  discount: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paymentChannel?: string | null;
  paidAt?: string | null;
  items: OrderItem[];
  shippingAddress: ShippingAddress[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrdersData {
  orders: Order[];
  pagination: PaginationMeta;
}

interface OrdersPageClientProps {
  ordersData: OrdersData;
  initialCurrency?: string;
}

export default function OrdersPageClient({
  ordersData,
  initialCurrency,
}: OrdersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatPrice } = useCurrency(initialCurrency);
  const [isMobile, setIsMobile] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');

  // Get filters from URL params (memoized to prevent infinite loops)
  const currentFilters = useMemo(() => ({
    status: searchParams.get('status') || undefined,
    paymentStatus: searchParams.get('paymentStatus') || undefined,
    search: searchParams.get('search') || '',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  }), [searchParams]);

  // Reset navigating state when ordersData changes (data has actually loaded)
  useEffect(() => {
    if (isNavigating) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ordersData.orders, ordersData.pagination.page, isNavigating]);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync search input with URL query
  useEffect(() => {
    setSearchInputValue(currentFilters.search);
  }, [currentFilters.search]);

  // Filter orders based on search query (client-side filtering)
  // Note: Status and paymentStatus filtering is done on server-side
  const filteredOrders = useMemo(() => {
    if (!currentFilters.search.trim()) return ordersData.orders;
    const query = currentFilters.search.toLowerCase();
    return ordersData.orders.filter((order) => 
      order.orderNumber.toLowerCase().includes(query) ||
      order.items.some((item) => 
        item.productName.toLowerCase().includes(query)
      )
    );
  }, [ordersData.orders, currentFilters.search]);

  // Handle back button
  const handleBack = () => {
    router.push('/dashboard');
  };

  // Handle search icon click
  const handleSearchClick = () => {
    setShowSearchCard(true);
    setSearchInputValue(currentFilters.search);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      const params = new URLSearchParams();
      if (currentFilters.status) params.set('status', currentFilters.status);
      if (currentFilters.paymentStatus) params.set('paymentStatus', currentFilters.paymentStatus);
      params.set('search', searchInputValue.trim());
      setIsNavigating(true);
      startTransition(() => {
        router.push(`/orders?${params.toString()}`);
      });
    }
    setShowSearchCard(false);
  };

  // Handle cancel search
  const handleCancelSearch = () => {
    setShowSearchCard(false);
    setSearchInputValue('');
    const params = new URLSearchParams();
    if (currentFilters.status) params.set('status', currentFilters.status);
    if (currentFilters.paymentStatus) params.set('paymentStatus', currentFilters.paymentStatus);
    setIsNavigating(true);
    startTransition(() => {
      router.push(`/orders${params.toString() ? `?${params.toString()}` : ''}`);
    });
  };

  // Handle filter button click
  const handleFilterClick = (filterStatus: string | null, filterPaymentStatus: string | null) => {
    setIsNavigating(true);
    const params = new URLSearchParams();
    if (filterStatus) {
      params.set('status', filterStatus);
    }
    if (filterPaymentStatus) {
      params.set('paymentStatus', filterPaymentStatus);
    }
    // Preserve search query if exists
    if (currentFilters.search) {
      params.set('search', currentFilters.search);
    }
    const queryString = params.toString();
    
    startTransition(() => {
      router.push(`/orders${queryString ? `?${queryString}` : ''}`);
    });
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setIsNavigating(true);
    const params = new URLSearchParams();
    if (currentFilters.status) params.set('status', currentFilters.status);
    if (currentFilters.paymentStatus) params.set('paymentStatus', currentFilters.paymentStatus);
    if (currentFilters.search) params.set('search', currentFilters.search);
    params.set('page', pageNumber.toString());
    
    startTransition(() => {
      router.push(`/orders?${params.toString()}`);
    });
  };

  // Determine active filter
  const isFilterActive = (filterStatus: string | null, filterPaymentStatus: string | null) => {
    if (filterStatus === null && filterPaymentStatus === null) {
      // Total Order (all) - active when no filters
      return !currentFilters.status && !currentFilters.paymentStatus;
    }
    if (filterStatus === 'PENDING' && filterPaymentStatus === 'PENDING') {
      // Belum Bayar
      return currentFilters.status === 'PENDING' && currentFilters.paymentStatus === 'PENDING';
    }
    // Other filters
    return currentFilters.status === filterStatus;
  };

  const filterButtons = [
    { label: 'Total Order', status: null, paymentStatus: null },
    { label: 'Belum Bayar', status: 'PENDING', paymentStatus: 'PENDING' },
    { label: 'Dikemas', status: 'PROCESSING', paymentStatus: null },
    { label: 'Dikirim', status: 'SHIPPED', paymentStatus: null },
    { label: 'Selesai', status: 'DELIVERED', paymentStatus: null },
    { label: 'Dibatalkan', status: 'CANCELLED', paymentStatus: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <div className="max-w-[1440px] mx-auto">
            {/* Search Card */}
            {showSearchCard ? (
              <div className="flex items-center h-14 sm:h-16 gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    placeholder="Cari pesanan..."
                    autoFocus
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    style={{
                      WebkitTextFillColor: '#111827',
                      color: '#111827',
                    }}
                  />
                </form>
                <button
                  onClick={handleCancelSearch}
                  className="text-sm sm:text-base text-gray-700 hover:text-gray-900 font-medium px-2 py-1"
                >
                  Batalkan
                </button>
              </div>
            ) : (
              <>
                {/* Top Row: Back, Title, Search */}
                <div className="flex items-center h-14 sm:h-16">
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Kembali"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 ml-3">
                    Pesanan Saya
                  </h1>
                  <div className="flex-1"></div>
                  <button
                    onClick={handleSearchClick}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </>
            )}
            
            {/* Filter Buttons */}
            {!showSearchCard && (
              <div className="overflow-x-auto scrollbar-hide touch-pan-x -mx-4 sm:-mx-6 px-4 sm:px-6">
                <div className="inline-flex gap-4 sm:gap-6 md:gap-8 py-1.5 sm:py-2 md:py-2.5 items-center min-w-full">
                  {filterButtons.map((filter) => {
                    const isActive = isFilterActive(filter.status, filter.paymentStatus);
                    return (
                      <span
                        key={filter.label}
                        onClick={() => handleFilterClick(filter.status, filter.paymentStatus)}
                        className={`flex-shrink-0 text-xs sm:text-sm md:text-base cursor-pointer whitespace-nowrap relative pb-1 select-none ${
                          isActive
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {filter.label}
                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2">
          {/* Loading State - Hide data lama dan tampilkan loading saat navigating */}
          {isNavigating ? (
            <div className="min-h-[400px] flex items-center justify-center bg-white rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Memuat pesanan...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Search Results Info */}
              {currentFilters.search && filteredOrders.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  Menampilkan {filteredOrders.length} dari {ordersData.orders.length} pesanan
                </div>
              )}

              {/* No search results */}
              {currentFilters.search && filteredOrders.length === 0 && ordersData.orders.length > 0 && (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
                  <p className="text-gray-600 mb-6">
                    Tidak ada pesanan yang cocok dengan "{currentFilters.search}"
                  </p>
                </div>
              )}

              {/* Empty state - no orders */}
              {filteredOrders.length === 0 && !currentFilters.search && (
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
                    <div className="px-2 sm:px-2.5 md:px-3 pb-2 sm:pb-3 md:pb-4" style={{ overflow: 'visible' }}>
                      <div 
                        className="orders-scroll-container space-y-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2"
                        style={{
                          maxHeight: isMobile ? '600px' : '680px',
                          overflowY: 'auto',
                          overflowX: 'hidden',
                          WebkitOverflowScrolling: 'touch',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e1 #f1f5f9',
                          overscrollBehavior: 'contain',
                          position: 'relative',
                          display: 'block',
                          height: 'auto',
                          minHeight: '0',
                          willChange: 'scroll-position'
                        }}
                      >
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
                                  const imageUrl = item.selectedImageUrl || item.product.images?.[0]?.imageUrl;
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
                                <p className="text-lg font-bold">{formatPrice(order.total)}</p>
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

              {/* Pagination */}
              {ordersData.pagination.totalPages > 1 && (
                <div className="flex gap-1 sm:gap-2 justify-center mt-4 sm:mt-6 mb-0">
                  {[...Array(ordersData.pagination.totalPages)].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded ${
                          ordersData.pagination.page === pageNumber
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

