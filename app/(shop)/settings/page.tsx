'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Shield, MapPin, CreditCard, ChevronRight, ShoppingCart } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';

function SettingsPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const { itemCount } = useCart();

  // Handle back navigation
  const handleBack = () => {
    router.push('/dashboard');
  };

  // Handle logout - langsung redirect ke halaman login (sign in/sign up)
  const handleLogout = async () => {
    try {
      // Sign out dan langsung redirect ke halaman login
      await signOut({ 
        callbackUrl: '/login',
        redirect: true 
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Jika terjadi error, langsung redirect ke halaman login
      router.push('/login');
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Settings Header - Standalone, Fixed at Top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Back Arrow */}
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Settings Title - Centered */}
            <h1 className="!text-base !font-semibold text-gray-900 flex-1 text-center">
              Pengaturan Akun
            </h1>

            {/* Cart Icon - Right */}
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

      {/* Settings Content */}
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2">
          {/* Settings Options Card - Full Width */}
          <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
            <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">

            {/* Settings Options - Single card with dividers - Full width with dividers */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2 mb-6">
            {/* Akun dan Keamanan */}
            <Link 
              href="/settings/account"
              className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
            >
              <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
              <div className="flex-shrink-0">
                <Shield className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium leading-tight">Akun dan Keamanan</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>

            {/* Alamat Saya */}
            <Link 
              href="/settings/addresses"
              className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
            >
              <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
              <div className="flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium leading-tight">Alamat Saya</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>

            {/* Kartu Rekening Bank */}
            <Link 
              href="/settings/payment"
              className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
            >
              <div className="flex-shrink-0">
                <CreditCard className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium leading-tight">Kartu Rekening Bank</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
            </div>

            {/* Logout Button Card - Full Width */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-3 hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm text-red-600 font-medium leading-tight">
                  Ganti Akun / Keluar
                </p>
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

