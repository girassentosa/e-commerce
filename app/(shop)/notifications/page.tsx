'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Notifications Page
 * Halaman untuk menampilkan notifikasi pengguna
 */

export default function NotificationsPage() {
  const router = useRouter();
  const { itemCount } = useCart();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Local Header - same style as Profile header, centered title, no cart icon */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
              Notifikasi
            </h1>
            <Link
              href="/cart"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada notifikasi</h2>
          <p className="text-gray-600">Anda belum memiliki notifikasi baru</p>
        </div>
      </div>
    </div>
  );
}

