/**
 * Shop Layout
 * Layout untuk shop pages dengan Header & Footer
 */

'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, TrendingUp, Bell, User } from 'lucide-react';

function ShopLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideFooter = pathname === '/' || pathname === '/dashboard' || pathname === '/orders' || pathname === '/products' || pathname === '/notifications' || pathname === '/activities' || pathname === '/favorite' || pathname === '/last-viewed' || pathname === '/buy-again' || pathname === '/settings' || pathname === '/cart' || pathname === '/checkout' || pathname?.startsWith('/orders/') || pathname?.startsWith('/products/') || pathname?.startsWith('/settings/') || pathname?.startsWith('/checkout/');
  const hideHeader = pathname?.startsWith('/orders/') || pathname?.startsWith('/products/');
  const hideBottomNav = pathname === '/orders' || pathname === '/activities' || pathname === '/favorite' || pathname === '/last-viewed' || pathname === '/buy-again' || pathname === '/settings' || pathname?.startsWith('/orders/') || pathname?.startsWith('/products/') || pathname?.startsWith('/settings/');

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideHeader && <Header />}
      <main className={`flex-grow bg-white p-4 sm:p-6 lg:p-8 ${!hideBottomNav ? 'pb-20' : 'pb-8'}`}>{children}</main>
      {!hideFooter && <Footer />}
      {/* Bottom Navigation - Sticky Footer */}
      {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <Link 
                href="/" 
                className="flex flex-col items-center hover:opacity-70 transition-opacity group py-2"
              >
                <Home className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  pathname === '/' ? 'text-red-600' : 'text-gray-600 group-hover:text-indigo-600'
                }`} />
                <span className={`text-xs sm:text-sm font-medium mt-1 text-center ${
                  pathname === '/' ? 'text-red-600' : 'text-gray-700'
                }`}>Beranda</span>
              </Link>
              <Link 
                href="/products?sort=popular" 
                className="flex flex-col items-center hover:opacity-70 transition-opacity group py-2"
              >
                <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  (pathname === '/products' || (pathname?.startsWith('/products?') && !pathname?.includes('/products/'))) ? 'text-red-600' : 'text-gray-600 group-hover:text-indigo-600'
                }`} />
                <span className={`text-xs sm:text-sm font-medium mt-1 text-center ${
                  (pathname === '/products' || (pathname?.startsWith('/products?') && !pathname?.includes('/products/'))) ? 'text-red-600' : 'text-gray-700'
                }`}>Trending</span>
              </Link>
              <Link 
                href="/notifications" 
                className="flex flex-col items-center hover:opacity-70 transition-opacity group relative py-2"
              >
                <Bell className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  pathname === '/notifications' ? 'text-red-600' : 'text-gray-600 group-hover:text-indigo-600'
                }`} />
                <span className={`text-xs sm:text-sm font-medium mt-1 text-center ${
                  pathname === '/notifications' ? 'text-red-600' : 'text-gray-700'
                }`}>Notifikasi</span>
              </Link>
              <Link 
                href="/dashboard" 
                className="flex flex-col items-center hover:opacity-70 transition-opacity group py-2"
              >
                <User className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  pathname === '/dashboard' || pathname?.startsWith('/dashboard') ? 'text-red-600' : 'text-gray-600 group-hover:text-indigo-600'
                }`} />
                <span className={`text-xs sm:text-sm font-medium mt-1 text-center ${
                  pathname === '/dashboard' || pathname?.startsWith('/dashboard') ? 'text-red-600' : 'text-gray-700'
                }`}>Saya</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-white">
        <main className="flex-grow bg-white">{children}</main>
      </div>
    }>
      <ShopLayoutContent>{children}</ShopLayoutContent>
    </Suspense>
  );
}

