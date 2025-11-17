'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Search,
  Eye,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
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
      images: Array<{ imageUrl: string | null }>;
    };
  }>;
  _count: {
    items: number;
  };
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface AdminOrdersClientProps {
  initialOrders: Order[];
  initialPagination: PaginationInfo;
}

export default function AdminOrdersClient({
  initialOrders,
  initialPagination,
}: AdminOrdersClientProps) {
  const { setHeader } = useAdminHeader();
  const { formatPrice } = useCurrency();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [paymentStatusDropdownOpen, setPaymentStatusDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const pageSize = initialPagination.limit || 20;
  const initialFetchSkipped = useRef(false);

  useEffect(() => {
    setHeader(ShoppingBag, 'Orders');
  }, [setHeader]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(paymentStatusFilter && { paymentStatus: paymentStatusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/admin/orders?${params}`, { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      showError('Gagal', error.message || 'Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    dateFrom,
    dateTo,
    pageSize,
    paymentStatusFilter,
    search,
    showError,
    statusFilter,
  ]);

  useEffect(() => {
    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      return;
    }
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
    return date.toLocaleDateString('id-ID', {
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

  const performSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/admin/products/sync-sales-count', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync sales count');
      }

      showSuccess(
        'Berhasil',
        `Sales count berhasil di-sync! ${data.data.productsUpdated} produk diperbarui dari ${data.data.totalDeliveredOrders} order yang sudah DELIVERED.`
      );

      fetchOrders();
    } catch (error: any) {
      console.error('Error syncing sales count:', error);
      showError('Gagal', error.message || 'Gagal sync sales count');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSalesCount = () => {
    showConfirm(
      'Sync Sales Count',
      'Apakah Anda yakin ingin sync sales count? Ini akan menghitung ulang salesCount untuk semua produk berdasarkan order yang sudah DELIVERED.',
      performSync,
      undefined,
      'Ya, Sync',
      'Batal'
    );
  };

  const statusOptions: { label: string; value: OrderStatus }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Refunded', value: 'REFUNDED' },
  ];

  const paymentStatusOptions: { label: string; value: PaymentStatus }[] = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Refunded', value: 'REFUNDED' },
  ];

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
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{getCustomerName(order)}</span>
          <span className="text-sm text-gray-500">{order.user.email}</span>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (order: Order) => (
        <div className="text-sm text-gray-700 font-semibold">{order._count.items} item(s)</div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (order: Order) => (
        <div className="font-semibold text-gray-900">{formatPrice(order.total)}</div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (order: Order) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Created At',
      render: (order: Order) => (
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium">{formatDate(order.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (order: Order) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/orders/${order.orderNumber}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            Detail
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
            </div>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2"
              onClick={handleSyncSalesCount}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Sales Count
            </Button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="Cari order berdasarkan nomor, email, atau nama customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-3 rounded-xl border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                Order Status
              </p>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                Payment Status
              </p>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Status</option>
                {paymentStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Dari Tanggal
              </p>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border-gray-200 text-sm"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Sampai Tanggal
              </p>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={fetchOrders}>
              Terapkan Filter
            </Button>
            <Button type="button" variant="ghost" onClick={handleClearFilters}>
              Reset
            </Button>
            <div className="text-sm text-gray-500">
              Menampilkan {orders.length} dari {totalCount} order
            </div>
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        <DataTable columns={columns as any} data={orders} loading={loading} emptyMessage="Tidak ada order" />
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}

