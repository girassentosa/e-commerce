 'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  LayoutDashboard,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useNotification } from '@/contexts/NotificationContext';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
}

interface AdminDashboardClientProps {
  initialStats: DashboardStats;
  userEmail?: string | null;
  generatedAt: string;
}

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
    SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Truck },
    DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  };

  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock };
  const Icon = config.icon;

  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    PROCESSING: 'Dikemas',
    SHIPPED: 'Dikirim',
    DELIVERED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };

  return (
    <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
      <span className="hidden sm:inline">{statusLabels[status] || status}</span>
      <span className="sm:hidden text-[10px] leading-tight">{(statusLabels[status] || status).substring(0, 3)}</span>
    </span>
  );
};

export default function AdminDashboardClient({ initialStats, userEmail, generatedAt }: AdminDashboardClientProps) {
  const { setHeader } = useAdminHeader();
  const { formatPrice } = useCurrency();
  const { showError } = useNotification();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(generatedAt);

  useEffect(() => {
    setHeader(LayoutDashboard, 'Dashboard');
  }, [setHeader]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/dashboard', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard stats');
      }

      setStats(data.data);
      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error('Error refreshing dashboard stats:', error);
      showError('Gagal memuat dashboard', error.message || 'Failed to load dashboard');
    } finally {
      setRefreshing(false);
    }
  }, [showError]);

  const formattedUpdatedDate = useMemo(() => {
    try {
      return new Date(lastUpdated).toLocaleDateString();
    } catch {
      return new Date().toLocaleDateString();
    }
  }, [lastUpdated]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Dashboard Overview
          </h1>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-semibold text-gray-900">{userEmail || 'Admin'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-gray-50 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-200">
                <p className="text-xs text-gray-500">Last updated</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{formattedUpdatedDate}</p>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {refreshing && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total Sales - Baris 1 Kolom 1 */}
        <div className="group relative bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="bg-emerald-500 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-semibold shrink-0">
              <ArrowUpRight className="w-3 h-3" />
              <span>12%</span>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1">Total Sales</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">{formatPrice(stats.totalSales)}</p>
            <p className="text-xs text-emerald-600">Last 30 days</p>
          </div>
        </div>

        {/* Active Products - Baris 1 Kolom 2 */}
        <div className="group relative bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="bg-purple-500 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1">Active Products</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">{stats.totalProducts.toLocaleString()}</p>
            <p className="text-xs text-purple-600">Currently active</p>
          </div>
        </div>

        {/* Total Orders - Baris 2 Kolom 1 */}
        <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="bg-blue-500 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-xs font-semibold shrink-0">
              <ArrowUpRight className="w-3 h-3" />
              <span>8%</span>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Total Orders</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">{stats.totalOrders.toLocaleString()}</p>
            <p className="text-xs text-blue-600">All time</p>
          </div>
        </div>

        {/* Total Users - Baris 2 Kolom 2 */}
        <div className="group relative bg-gradient-to-br from-orange-50 to-amber-100 border border-orange-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="bg-orange-500 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-xs font-semibold shrink-0">
              <ArrowUpRight className="w-3 h-3" />
              <span>3%</span>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-orange-700 mb-1">Total Users</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 break-words">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-xs text-orange-600">Registered users</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="admin-card">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2 flex-1 min-w-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                <span className="truncate">Recent Orders</span>
                <span className="text-xs sm:text-sm font-normal text-gray-600 ml-2 shrink-0">
                  ({stats.recentOrders.length} {stats.recentOrders.length === 1 ? 'order' : 'orders'})
                </span>
              </h2>
              <Link 
                href="/admin/orders"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors shrink-0"
              >
                <span className="hidden sm:inline">View all</span>
                <span className="sm:hidden">All</span>
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
          <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-50 to-white overflow-visible">
            {stats.recentOrders.length > 0 ? (
              <div className="admin-dashboard-orders-scroll space-y-3 sm:space-y-4">
                {stats.recentOrders.map((order, index) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.orderNumber}`}
                    className="block"
                  >
                    <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          {/* Left Section */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <div className="flex items-center gap-2">
                                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-1.5 sm:p-2">
                                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                </div>
                                <p className="font-bold text-sm sm:text-base md:text-lg text-gray-900 truncate">
                                  {order.orderNumber}
                                </p>
                              </div>
                              <div className="shrink-0">{getStatusBadge(order.status)}</div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {new Date(order.createdAt).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Total */}
                          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-xs sm:text-sm text-gray-500 mb-0.5">Total</p>
                              <p className="font-bold text-lg sm:text-xl md:text-2xl text-gray-900">
                                {formatPrice(order.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1">No recent orders</p>
                <p className="text-sm text-gray-500">Orders will appear here once they are placed</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2 flex-1 min-w-0">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                <span className="truncate">Low Stock Alerts</span>
              </h2>
              <Link 
                href="/admin/products"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors shrink-0"
              >
                <span className="hidden sm:inline">Manage</span>
                <span className="sm:hidden">Edit</span>
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {stats.lowStockProducts.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {stats.lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/admin/products/${product.id}/edit`}
                    className="block group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 mb-1 group-hover:text-red-600 transition-colors truncate">
                          {product.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3 shrink-0" />
                            Stock: <span className="font-semibold text-red-600">{product.stockQuantity}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            Threshold: <span className="font-semibold">{product.lowStockThreshold}</span>
                          </span>
                        </div>
                      </div>
                      <div className="sm:ml-4 shrink-0 self-start sm:self-center">
                        <span className={`inline-flex items-center px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                          product.stockQuantity === 0 
                            ? 'bg-red-600 text-white' 
                            : 'bg-orange-500 text-white'
                        }`}>
                          <span className="hidden sm:inline">{product.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'}</span>
                          <span className="sm:hidden">{product.stockQuantity === 0 ? 'Out' : 'Low'}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-400 mx-auto mb-3" />
                <p className="text-sm sm:text-base text-gray-500 font-medium">All products in stock</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Great job! No low stock alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

