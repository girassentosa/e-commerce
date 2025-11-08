'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { 
  Package, 
  CreditCard,
  Box,
  Truck,
  Star,
  Settings,
  ShoppingCart,
  MessageCircle,
  Heart,
  Eye,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  belumBayar: number;
  dikemas: number;
  dikirim: number;
  beriPenilaian: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { count: wishlistCount } = useWishlist();
  const { itemCount } = useCart();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    belumBayar: 0,
    dikemas: 0,
    dikirim: 0,
    beriPenilaian: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch dashboard stats from optimized endpoint
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    } else if (status === 'authenticated') {
      // Fetch immediately when authenticated
      fetchDashboardData();
    }
  }, [status, router, fetchDashboardData]);

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
            <Link href="/cart" className="relative p-2 hover:opacity-70 transition-opacity">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
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
            <div className="overflow-x-auto -mx-2 px-2 overflow-y-visible">
              <div className="grid grid-cols-5 gap-4 min-w-[500px]">
                <Link href="/orders" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2 pt-1 overflow-visible">
                    <Package className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.totalOrders > 0 && (
                      <span className="absolute top-0 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
                        {stats.totalOrders > 99 ? '99+' : stats.totalOrders}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Total Order</p>
                </Link>

                <Link href="/orders?status=PENDING&paymentStatus=PENDING" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2 pt-1 overflow-visible">
                    <CreditCard className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.belumBayar > 0 && (
                      <span className="absolute top-0 -right-1 bg-yellow-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
                        {stats.belumBayar > 99 ? '99+' : stats.belumBayar}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Belum Bayar</p>
                </Link>

                <Link href="/orders?status=PROCESSING" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2 pt-1 overflow-visible">
                    <Box className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.dikemas > 0 && (
                      <span className="absolute top-0 -right-1 bg-orange-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
                        {stats.dikemas > 99 ? '99+' : stats.dikemas}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Dikemas</p>
                </Link>

                <Link href="/orders?status=SHIPPED" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2 pt-1 overflow-visible">
                    <Truck className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.dikirim > 0 && (
                      <span className="absolute top-0 -right-1 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
                        {stats.dikirim > 99 ? '99+' : stats.dikirim}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium text-center leading-tight">Dikirim</p>
                </Link>

                <Link href="/reviews/my" className="flex flex-col items-center hover:opacity-70 transition-opacity group">
                  <div className="relative mb-2 pt-1 overflow-visible">
                    <Star className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    {stats.beriPenilaian > 0 && (
                      <span className="absolute top-0 -right-1 bg-yellow-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 z-10">
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

      {/* Aktifitas Saya Section */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="bg-white border border-gray-200 rounded-lg py-6 pl-4 pr-2 max-w-7xl mx-auto">
          <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-900">Aktifitas Saya</h2>
              <Link href="/activities" className="text-xs text-gray-900 hover:text-gray-700 font-medium inline-flex items-center gap-1 transition-colors">
                Lihat Semua
                <span className="text-gray-900">&gt;</span>
              </Link>
            </div>

            {/* Activity Grid - Horizontal Layout with Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Link href="/favorite?from=dashboard" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
                <div className="flex-shrink-0">
                  <Heart className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
                <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Favorite Saya</p>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              <Link href="/last-viewed?from=dashboard" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
                <div className="flex-shrink-0">
                  <Eye className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Terakhir Dilihat</p>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              <Link href="/buy-again?from=dashboard" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
                <div className="flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
                </div>
                <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Beli Lagi</p>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

