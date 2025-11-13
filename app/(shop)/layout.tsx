/**
 * Shop Layout - Mobile-First Approach
 * Bottom Navigation: Home, Categories, Cart, Profile
 * Thumb-friendly touch targets (min 44px)
 */

'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Home, Grid3x3, Bell, User } from 'lucide-react';

function ShopLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isCheckoutRoute =
    pathname === '/checkout' || pathname?.startsWith('/checkout/');

  const hideFooter =
    pathname === '/' ||
    pathname === '/dashboard' ||
    pathname === '/orders' ||
    pathname === '/products' ||
    pathname === '/notifications' ||
    pathname === '/activities' ||
    pathname === '/favorite' ||
    pathname === '/last-viewed' ||
    pathname === '/buy-again' ||
    pathname === '/settings' ||
    pathname === '/cart' ||
    isCheckoutRoute ||
    pathname?.startsWith('/orders/') ||
    pathname?.startsWith('/products/') ||
    pathname?.startsWith('/settings/');

  const hideHeader =
    pathname === '/dashboard' ||
    pathname === '/settings' ||
    pathname === '/notifications' ||
    pathname === '/orders' ||
    pathname?.startsWith('/orders/') ||
    pathname === '/products' ||
    pathname?.startsWith('/products/') ||
    pathname === '/activities' ||
    pathname === '/favorite' ||
    pathname === '/last-viewed' ||
    pathname === '/buy-again' ||
    pathname === '/cart' ||
    pathname?.startsWith('/settings/') ||
    isCheckoutRoute;

  const hideBottomNav =
    pathname === '/orders' ||
    pathname === '/activities' ||
    pathname === '/favorite' ||
    pathname === '/last-viewed' ||
    pathname === '/buy-again' ||
    pathname === '/settings' ||
    pathname === '/cart' ||
    pathname?.startsWith('/orders/') ||
    pathname?.startsWith('/products/') ||
    pathname?.startsWith('/settings/') ||
    isCheckoutRoute;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    if (path === '/products')
      return pathname === '/products' || pathname?.startsWith('/products?');
    if (path === '/notifications') return pathname === '/notifications';
    if (path === '/profile')
      return pathname === '/profile' || pathname === '/dashboard';
    return false;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!hideHeader && <Header />}
      <main className={`flex-grow bg-white ${!hideBottomNav ? 'pb-20 sm:pb-16' : 'pb-8'}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}

      {/* ========================================
          BOTTOM NAVIGATION BAR (All Devices)
          Thumb-friendly: min 44px touch targets
          Responsive: Compact on desktop/tablet
      ======================================== */}
      {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl backdrop-blur-lg bg-opacity-95">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-0">
              {/* Home */}
              <Link
                href="/"
                className="flex flex-col items-center justify-center py-2 sm:py-3 px-2 relative group transition-all min-h-[44px] touch-manipulation"
              >
                {isActive('/') && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></div>
                )}
                <div
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                    isActive('/') ? 'bg-blue-100 scale-110' : 'group-active:bg-gray-100 group-active:scale-95'
                  }`}
                >
                  <Home
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive('/') ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 transition-colors ${
                    isActive('/') ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Home
                </span>
              </Link>

              {/* Categories */}
              <Link
                href="/products"
                className="flex flex-col items-center justify-center py-2 sm:py-3 px-2 relative group transition-all min-h-[44px] touch-manipulation"
              >
                {isActive('/products') && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></div>
                )}
                <div
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                    isActive('/products') ? 'bg-blue-100 scale-110' : 'group-active:bg-gray-100 group-active:scale-95'
                  }`}
                >
                  <Grid3x3
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive('/products') ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 transition-colors ${
                    isActive('/products') ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Categories
                </span>
              </Link>

              {/* Notifications */}
              <Link
                href="/notifications"
                className="flex flex-col items-center justify-center py-2 sm:py-3 px-2 relative group transition-all min-h-[44px] touch-manipulation"
              >
                {isActive('/notifications') && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></div>
                )}
                <div
                  className={`p-2 sm:p-2.5 rounded-xl relative transition-all duration-300 ${
                    isActive('/notifications') ? 'bg-blue-100 scale-110' : 'group-active:bg-gray-100 group-active:scale-95'
                  }`}
                >
                  <Bell
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive('/notifications') ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 transition-colors ${
                    isActive('/notifications') ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Notifications
                </span>
              </Link>

              {/* Profile */}
              <Link
                href="/dashboard"
                className="flex flex-col items-center justify-center py-2 sm:py-3 px-2 relative group transition-all min-h-[44px] touch-manipulation"
              >
                {isActive('/profile') && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></div>
                )}
                <div
                  className={`p-2 sm:p-2.5 rounded-xl transition-all duration-300 ${
                    isActive('/profile') ? 'bg-blue-100 scale-110' : 'group-active:bg-gray-100 group-active:scale-95'
                  }`}
                >
                  <User
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                      isActive('/profile') ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 sm:mt-1 transition-colors ${
                    isActive('/profile') ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Profile
                </span>
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
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-white">
          <main className="flex-grow bg-white">{children}</main>
        </div>
      }
    >
      <ShopLayoutContent>{children}</ShopLayoutContent>
    </Suspense>
  );
}
