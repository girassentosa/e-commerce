'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: string;
  currency: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  items: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      images: Array<{ imageUrl: string }>;
    };
  }>;
  _count: {
    items: number;
  };
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { setHeader } = useAdminHeader();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setHeader(ShoppingBag, 'Orders');
  }, [setHeader]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentStatusDropdownOpen, setPaymentStatusDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, paymentStatusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = (order: Order) => {
    if (order.user.firstName && order.user.lastName) {
      return `${order.user.firstName} ${order.user.lastName}`;
    }
    return order.user.email;
  };

  const handleSyncSalesCount = async () => {
    if (!confirm('Apakah Anda yakin ingin sync sales count? Ini akan menghitung ulang salesCount untuk semua produk berdasarkan order yang sudah DELIVERED. Data yang tidak konsisten akan diperbaiki.')) {
      return;
    }

    try {
      setSyncing(true);
      const response = await fetch('/api/admin/products/sync-sales-count', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync sales count');
      }

      toast.success(
        `Sales count berhasil di-sync! ${data.data.productsUpdated} produk diperbarui dari ${data.data.totalDeliveredOrders} order yang sudah DELIVERED.`,
        { duration: 5000 }
      );

      // Refresh orders list
      fetchOrders();
    } catch (error: any) {
      console.error('Error syncing sales count:', error);
      toast.error(error.message || 'Gagal sync sales count');
    } finally {
      setSyncing(false);
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order: Order) => (
        <Link
          href={`/admin/orders/${order.orderNumber}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order: Order) => (
        <div>
          <p className="font-medium text-gray-900">{getCustomerName(order)}</p>
          <p className="text-xs text-gray-500">{order.user.email}</p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (order: Order) => (
        <div className="text-sm text-gray-600">
          {formatDate(order.createdAt)}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'total',
      label: 'Total',
      render: (order: Order) => (
        <div className="font-semibold text-gray-900">
          {formatPrice(order.total)}
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (order: Order) => (
        <span className="text-sm text-gray-600">{order._count.items} item(s)</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order: Order) => <StatusBadge status={order.status} size="sm" />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (order: Order) => (
        <StatusBadge status={order.paymentStatus as any} size="sm" />
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <Link
            href={`/admin/orders/${order.orderNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Orders Management
          </h1>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-gray-600">
              Manage and track all customer orders • {totalCount} total orders
            </p>
            <Button
              onClick={handleSyncSalesCount}
              disabled={syncing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Sales Count'}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="admin-filter-card">
        <div className="admin-card-header">
          <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Filters & Search
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Filters Grid - 3 Columns on All Devices */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <span className="hidden sm:inline">Search Orders</span>
                  <span className="sm:hidden">Search</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 sm:pl-10 md:pl-12 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  />
                </div>
              </div>

              {/* Order Status Filter */}
              <div className="relative z-30">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setPaymentStatusDropdownOpen(false);
                  }}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 text-xs sm:text-sm md:text-base hover:border-emerald-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {statusFilter === 'PENDING' ? (
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
                    ) : statusFilter === 'PROCESSING' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                    ) : statusFilter === 'SHIPPED' ? (
                      <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                    ) : statusFilter === 'DELIVERED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    ) : statusFilter === 'CANCELLED' || statusFilter === 'REFUNDED' ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                    ) : (
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {statusFilter === 'PENDING' ? 'Menunggu' : 
                       statusFilter === 'PROCESSING' ? 'Dikemas' : 
                       statusFilter === 'SHIPPED' ? 'Dikirim' : 
                       statusFilter === 'DELIVERED' ? 'Selesai' : 
                       statusFilter === 'CANCELLED' ? 'Dibatalkan' : 
                       statusFilter === 'REFUNDED' ? 'Dikembalikan' : 
                       'All'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setStatusDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl"
                      style={{
                        maxHeight: '9rem',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                        overscrollBehavior: 'contain'
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-50 active:bg-emerald-100 transition-colors touch-manipulation ${
                            statusFilter === '' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-900'
                          }`}
                        >
                          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>All</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('PENDING');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-yellow-50 active:bg-yellow-100 transition-colors touch-manipulation ${
                            statusFilter === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-900'
                          }`}
                        >
                          <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                          <span>Pending</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('PROCESSING');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation ${
                            statusFilter === 'PROCESSING' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Processing</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('SHIPPED');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-indigo-50 active:bg-indigo-100 transition-colors touch-manipulation ${
                            statusFilter === 'SHIPPED' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Shipped</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('DELIVERED');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-green-50 active:bg-green-100 transition-colors touch-manipulation ${
                            statusFilter === 'DELIVERED' ? 'bg-green-50 text-green-600' : 'text-gray-900'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span>Delivered</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('CANCELLED');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation ${
                            statusFilter === 'CANCELLED' ? 'bg-red-50 text-red-600' : 'text-gray-900'
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Cancelled</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusFilter('REFUNDED');
                            setCurrentPage(1);
                            setStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation ${
                            statusFilter === 'REFUNDED' ? 'bg-red-50 text-red-600' : 'text-gray-900'
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Refunded</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Status Filter */}
              <div className="relative z-20">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Payment
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatusDropdownOpen(!paymentStatusDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 text-xs sm:text-sm md:text-base hover:border-emerald-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {paymentStatusFilter === 'PENDING' ? (
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
                    ) : paymentStatusFilter === 'PAID' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                    ) : paymentStatusFilter === 'FAILED' || paymentStatusFilter === 'REFUNDED' ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {paymentStatusFilter === 'PENDING' ? 'Menunggu' : 
                       paymentStatusFilter === 'PAID' ? 'Lunas' :
                       paymentStatusFilter === 'FAILED' ? 'Gagal' :
                       paymentStatusFilter === 'REFUNDED' ? 'Dikembalikan' :
                       'All'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0 transition-transform ${paymentStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {paymentStatusDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setPaymentStatusDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl"
                      style={{
                        maxHeight: '9rem',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                        overscrollBehavior: 'contain'
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentStatusFilter('');
                            setCurrentPage(1);
                            setPaymentStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-emerald-50 active:bg-emerald-100 transition-colors touch-manipulation ${
                            paymentStatusFilter === '' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-900'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>All</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentStatusFilter('PENDING');
                            setCurrentPage(1);
                            setPaymentStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-yellow-50 active:bg-yellow-100 transition-colors touch-manipulation ${
                            paymentStatusFilter === 'PENDING' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-900'
                          }`}
                        >
                          <Clock className="w-4 h-4 text-yellow-500 shrink-0" />
                          <span>Pending</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentStatusFilter('PAID');
                            setCurrentPage(1);
                            setPaymentStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-green-50 active:bg-green-100 transition-colors touch-manipulation ${
                            paymentStatusFilter === 'PAID' ? 'bg-green-50 text-green-600' : 'text-gray-900'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span>Paid</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentStatusFilter('FAILED');
                            setCurrentPage(1);
                            setPaymentStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation ${
                            paymentStatusFilter === 'FAILED' ? 'bg-red-50 text-red-600' : 'text-gray-900'
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Failed</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentStatusFilter('REFUNDED');
                            setCurrentPage(1);
                            setPaymentStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation ${
                            paymentStatusFilter === 'REFUNDED' ? 'bg-red-50 text-red-600' : 'text-gray-900'
                          }`}
                        >
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Refunded</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Apply Button - Full Width on Mobile */}
            <div>
              <Button
                type="submit"
                variant="primary"
                className="admin-no-animation w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white !font-normal rounded-lg sm:rounded-xl shadow-md py-2.5 sm:py-3 !transition-colors !duration-150"
                style={{ transform: 'none', transition: 'color 0.15s ease, background-color 0.15s ease' }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Apply Filters</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="admin-table-card">
        <DataTable
          columns={columns}
          data={orders}
          loading={loading}
          emptyMessage="No orders found"
          onRowClick={(order) => router.push(`/admin/orders/${order.orderNumber}`)}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

