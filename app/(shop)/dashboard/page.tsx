'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader } from '@/components/ui/Loader';
import { 
  Package, 
  CreditCard,
  Box,
  Truck,
  Star,
  ArrowRight,
  Settings,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  belumBayar: number;
  dikemas: number;
  dikirim: number;
  beriPenilaian: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders and reviews (fetch all orders for accurate stats)
      const [ordersRes, reviewsRes] = await Promise.all([
        fetch('/api/orders?limit=1000'),
        fetch(`/api/admin/reviews?userId=${session?.user?.id}&limit=100`),
      ]);

      const ordersData = await ordersRes.json();
      const reviewsData = await reviewsRes.json();

      const orders = ordersData.success ? ordersData.data : [];
      const reviews = reviewsData.success ? reviewsData.data || [] : [];

      // Count orders by status
      const belumBayar = orders.filter((o: any) => o.paymentStatus === 'PENDING').length;
      const dikemas = orders.filter((o: any) => o.status === 'PROCESSING').length;
      const dikirim = orders.filter((o: any) => o.status === 'SHIPPED').length;
      
      // Count orders that need review (DELIVERED but no review yet)
      const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED');
      const reviewedOrderIds = new Set(reviews.map((r: any) => r.orderId).filter(Boolean));
      const beriPenilaian = deliveredOrders.filter((o: any) => !reviewedOrderIds.has(o.id)).length;

      setStats({
        totalOrders: orders.length,
        belumBayar,
        dikemas,
        dikirim,
        beriPenilaian,
        recentOrders: orders.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  const displayName = session?.user?.firstName 
    ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
    : session?.user?.email || 'User';

  const avatarInitial = session?.user?.firstName?.[0] || session?.user?.email?.[0] || 'U';

  return (
    <div className="w-full">
      {/* User Profile Header - Full Width */}
      <div className="mb-6 pb-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 py-4 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {session?.user?.avatarUrl ? (
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <Image
                  src={session.user.avatarUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {avatarInitial.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {displayName}
              </h1>
              <p className="text-sm text-gray-600 break-words">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 flex-shrink-0 -mt-16">
            <button className="p-2 hover:opacity-70 transition-opacity">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <Link href="/cart" className="p-2 hover:opacity-70 transition-opacity">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
            </Link>
            <button className="p-2 hover:opacity-70 transition-opacity">
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Pesanan Saya Section */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="bg-white border border-gray-200 rounded-lg py-6 pl-4 pr-2 max-w-7xl mx-auto">
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Pesanan Saya</h2>
              <Link href="/orders" className="text-xs text-gray-900 hover:text-gray-700 font-medium inline-flex items-center gap-1 transition-colors">
                Lihat Riwayat Pesanan
                <span className="text-gray-900">&gt;</span>
              </Link>
            </div>

            {/* Stats Grid - Icon Only Layout */}
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="grid grid-cols-5 gap-4 min-w-[500px]">
                <Link href="/orders" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2">
                    <Package className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.totalOrders > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {stats.totalOrders > 99 ? '99+' : stats.totalOrders}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Total Order</p>
                </Link>

                <Link href="/orders?status=PENDING&paymentStatus=PENDING" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2">
                    <CreditCard className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.belumBayar > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {stats.belumBayar > 99 ? '99+' : stats.belumBayar}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Belum Bayar</p>
                </Link>

                <Link href="/orders?status=PROCESSING" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2">
                    <Box className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.dikemas > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {stats.dikemas > 99 ? '99+' : stats.dikemas}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Dikemas</p>
                </Link>

                <Link href="/orders?status=SHIPPED" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2">
                    <Truck className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.dikirim > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {stats.dikirim > 99 ? '99+' : stats.dikirim}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Dikirim</p>
                </Link>

                <Link href="/reviews/my" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2">
                    <Star className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.beriPenilaian > 0 && (
                      <span className="absolute -top-1 -right-1 bg-yellow-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {stats.beriPenilaian > 99 ? '99+' : stats.beriPenilaian}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Beri Penilaian</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="container mx-auto px-4">
      {stats.recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.recentOrders.length === 0 && (
        <div>
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <Link href="/products">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

