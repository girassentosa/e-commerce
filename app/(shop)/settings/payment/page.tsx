'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';

function PaymentPageContent() {
  const router = useRouter();
  const { status } = useSession();

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings');
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/payment');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Kartu Rekening Bank Header - Standalone, Fixed at Top */}
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

            {/* Kartu Rekening Bank Title - Centered */}
            <h1 className="!text-base !font-semibold text-gray-900 flex-1 text-center">
              Kartu Rekening Bank
            </h1>

            {/* Empty space for balance (no cart icon) */}
            <div className="w-[44px]"></div>
          </div>
        </div>
      </header>

      {/* Kartu Rekening Bank Content */}
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2">
          {/* Payment Card - Full Width */}
          <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
            <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
              {/* Payment Options - Single card with dividers - Full width with dividers */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2">
                <div className="p-4 text-center text-sm text-gray-500">
                  Fitur Kartu Rekening Bank akan segera hadir
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentPageContent />
    </Suspense>
  );
}

