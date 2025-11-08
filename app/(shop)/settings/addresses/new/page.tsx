'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { AddressForm } from '@/components/checkout/AddressForm';

function NewAddressPageContent() {
  const router = useRouter();
  const { status } = useSession();

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings/addresses');
  };

  // Handle form success
  const handleSuccess = () => {
    router.push('/settings/addresses');
  };

  // Handle form cancel
  const handleCancel = () => {
    router.push('/settings/addresses');
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/addresses/new');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Fixed height container to prevent layout shift */}
      <div className="mb-4">
        <div className="flex items-center justify-center min-h-[48px] gap-3 relative">
          {/* Back Button - Left */}
          <button
            onClick={handleBack}
            className="p-1 hover:opacity-70 transition-opacity absolute left-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Center Title */}
          <h1 className="text-lg font-bold text-gray-900">Tambah Alamat Baru</h1>
        </div>
      </div>

      {/* Address Form Card - Full Width */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            <AddressForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewAddressPage() {
  return (
    <Suspense fallback={null}>
      <NewAddressPageContent />
    </Suspense>
  );
}

