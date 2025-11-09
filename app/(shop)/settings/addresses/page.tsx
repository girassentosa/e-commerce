'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, MapPin, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShippingAddress {
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

function AddressesPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          const response = await fetch('/api/addresses');
          const data = await response.json();
          if (data.success) {
            setAddresses(data.data || []);
          } else {
            toast.error('Gagal memuat alamat');
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
          toast.error('Gagal memuat alamat');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAddresses();
  }, [status]);

  // Handle add new address
  const handleAddAddress = () => {
    router.push('/settings/addresses/new');
  };

  // Handle address click (for editing)
  const handleAddressClick = (addressId: string) => {
    router.push(`/settings/addresses/${addressId}/edit`);
  };

  // Format address for display
  const formatAddress = (address: ShippingAddress) => {
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/addresses');
    return null;
  }

  return (
    <div className="container mx-auto px-4 pt-0 pb-8">
      <div className="-mt-2">
        {/* Alamat Saya Card - Full Width */}
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
          <div className="max-w-7xl mx-auto pl-4 pr-2">
            {/* Header */}
            <div className="mb-4 -ml-4 -mr-2">
              <h2 className="text-base font-bold text-gray-900 px-4">Alamat Saya</h2>
            </div>

            {/* Addresses List - Single card with dividers - Full width with dividers */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2 mb-3">
              {/* Address List */}
              {addresses.length > 0 ? (
                addresses.map((address, index) => (
                  <div key={address.id}>
                    <button
                      onClick={() => handleAddressClick(address.id)}
                      className="w-full flex items-start gap-3 p-3 hover:bg-gray-100 transition-colors group relative text-left"
                    >
                      {index < addresses.length - 1 && (
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                      )}
                      <div className="flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-700 font-medium leading-tight">
                            {address.fullName}
                          </p>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-tight mb-1">
                          {address.phone}
                        </p>
                        <p className="text-xs text-gray-500 leading-tight">
                          {formatAddress(address)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  Belum ada alamat
                </div>
              )}
            </div>

            {/* Add New Address Button - Card sendiri terpisah */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2 mb-0">
              <button
                onClick={handleAddAddress}
                className="w-full flex items-center justify-center p-3 hover:bg-gray-100 transition-colors group"
              >
                <Plus className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors flex-shrink-0 mr-1.5" />
                <p className="text-sm text-gray-700 font-medium leading-tight">
                  Tambah Alamat Baru
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={null}>
      <AddressesPageContent />
    </Suspense>
  );
}

