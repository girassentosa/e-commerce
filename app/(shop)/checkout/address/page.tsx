'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useCheckout } from '@/contexts/CheckoutContext';

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

export default function SelectAddressPage() {
  const router = useRouter();
  const { status } = useSession();
  const { showError } = useNotification();
  const { addressId, setAddressId } = useCheckout();
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(addressId);

  // Fetch addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          const response = await fetch('/api/addresses');
          const data = await response.json();
          if (data.success) {
            const fetchedAddresses = data.data || [];
            setAddresses(fetchedAddresses);
            
            // Set selected address from context, or default, or first address
            let addressToSelect: string | null = addressId;
            
            if (!addressToSelect) {
              const defaultAddress = fetchedAddresses.find((addr: ShippingAddress) => addr.isDefault);
              if (defaultAddress) {
                addressToSelect = defaultAddress.id;
              } else if (fetchedAddresses.length > 0) {
                addressToSelect = fetchedAddresses[0].id;
              }
            }
            
            setSelectedAddressId(addressToSelect);
          } else {
            showError('Gagal', 'Gagal memuat alamat');
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
          showError('Gagal', 'Gagal memuat alamat');
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        router.push('/login?callbackUrl=/checkout/address');
      }
    };

    fetchAddresses();
  }, [status, router]);

  const handleBack = () => {
    router.back();
  };

  const handleSelectAddress = (addressIdParam: string) => {
    setSelectedAddressId(addressIdParam);
    setAddressId(addressIdParam);
    // Redirect back to checkout after selecting address
    router.push('/checkout');
  };

  // Format phone number
  const formatPhone = (phone: string) => {
    if (phone.startsWith('+62')) {
      return `(+62) ${phone.substring(3).trim()}`;
    }
    return phone;
  };

  // Format full address
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="px-4 sm:px-6 border-b border-gray-200">
            <div className="max-w-[1440px] mx-auto">
              <div className="flex items-center justify-between h-14 sm:h-16">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                  Pilih alamat
                </h1>
                <div className="min-h-[44px] min-w-[44px]" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
            <div className="text-center text-gray-400">Memuat alamat...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 sm:px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                Pilih alamat
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <section
                key={address.id}
                onClick={() => handleSelectAddress(address.id)}
                className="cursor-pointer -mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-5 sm:p-6 flex gap-2 items-start"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedAddressId === address.id
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedAddressId === address.id && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="!text-sm font-semibold text-gray-900">{address.fullName}</h2>
                    <span className="text-[11px] font-medium text-gray-500">{formatPhone(address.phone)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {formatAddress(address)}
                  </p>
                </div>
              </section>
            ))
          ) : (
            <div className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-8 text-center text-gray-400">
              Belum ada alamat tersimpan
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

