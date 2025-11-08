'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { AddressForm } from '@/components/checkout/AddressForm';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

function EditAddressPageContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { status } = useSession();
  const addressId = params?.id;

  const [address, setAddress] = useState<Address | null>(null);
  const [saveButtonProps, setSaveButtonProps] = useState<{ disabled: boolean; onClick: () => void; loading: boolean } | null>(null);

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings/addresses');
  };

  // Fetch address data - Non-blocking, langsung render form
  useEffect(() => {
    const fetchAddress = async () => {
      if (status === 'authenticated' && addressId) {
        try {
          const response = await fetch(`/api/addresses/${addressId}`);
          const data = await response.json();
          if (data.success && data.data) {
            setAddress(data.data);
          } else {
            toast.error('Gagal memuat alamat');
            router.push('/settings/addresses');
          }
        } catch (error) {
          console.error('Error fetching address:', error);
          toast.error('Gagal memuat alamat');
          router.push('/settings/addresses');
        }
      }
    };

    fetchAddress();
  }, [status, addressId, router]);

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
    router.push(`/login?callbackUrl=/settings/addresses/${addressId}/edit`);
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Fixed height container to prevent layout shift */}
      <div className="mb-4">
        <div className="flex items-center justify-between min-h-[48px] gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBack}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Ubah Alamat</h1>
          </div>

          {/* Save Button - Right (always visible but disabled until there are changes) */}
          <button
            onClick={saveButtonProps?.onClick || (() => {})}
            disabled={!saveButtonProps || saveButtonProps.disabled}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {saveButtonProps?.loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Address Form Card - Full Width */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            <AddressForm 
              addressId={addressId}
              initialData={address}
              onSuccess={handleSuccess} 
              onCancel={handleCancel}
              onSaveButtonRef={setSaveButtonProps}
              showSaveButton={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditAddressPage() {
  return (
    <Suspense fallback={null}>
      <EditAddressPageContent />
    </Suspense>
  );
}

