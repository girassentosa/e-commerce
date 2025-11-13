'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { Loader } from '@/components/ui/Loader';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: string;
  total: string;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedImageUrl?: string | null;
  product: {
    id: string;
    name: string;
    images?: Array<{
      imageUrl: string;
      altText: string | null;
    }>;
  };
  variant: {
    name: string;
    value: string;
  } | null;
}

interface Order {
  orderNumber: string;
  items: OrderItem[];
  total: string;
}

// Helper function to format color and size labels (same as checkout)
const toTitleCase = (str: string) =>
  str
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const colorLabelMap: Record<string, string> = {
  hitam: 'Hitam',
  putih: 'Putih',
  'biru-navy': 'Biru Navy',
  'merah-maroon': 'Merah Maroon',
};

const getVariantLabels = (
  variant: { name: string; value: string } | null,
  selectedColor?: string | null,
  selectedSize?: string | null
) => {
  let colorLabel: string | null = null;
  let sizeLabel: string | null = null;

  // First priority: use selectedColor and selectedSize from OrderItem
  if (selectedColor) {
    const colorValue = selectedColor.toLowerCase();
    colorLabel = colorLabelMap[colorValue] ?? toTitleCase(selectedColor);
  }

  if (selectedSize) {
    sizeLabel = selectedSize.toUpperCase();
  }

  // Second priority: use the stored variant
  if (!colorLabel && !sizeLabel && variant) {
    if (variant.name === 'Color' || variant.name.toLowerCase() === 'color') {
      const colorValue = variant.value.toLowerCase();
      colorLabel = colorLabelMap[colorValue] ?? toTitleCase(variant.value);
    } else if (variant.name === 'Size' || variant.name.toLowerCase() === 'size') {
      sizeLabel = variant.value.toUpperCase();
    }
  }

  return { colorLabel, sizeLabel };
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reset } = useCheckout();
  const { refreshCart } = useCart();
  const orderNumber = searchParams?.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      router.push('/');
      return;
    }

    // Reset checkout state
    reset();
    
    // Refresh cart to ensure it's empty (cart items are deleted on server after order creation)
    const syncCart = async () => {
      await refreshCart();
    };
    syncCart();

    // Fetch order details
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setOrder(data.data);
        } else {
          setError(data.error || 'Gagal memuat detail pesanan');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, router, reset, refreshCart]);

  const handleBack = () => {
    router.push('/');
  };

  const handleViewOrderDetails = () => {
    if (orderNumber) {
      router.push(`/orders/${orderNumber}`);
    }
  };

  const handleContinueShopping = () => {
    router.push('/');
  };

  const currencyCode = 'USD';

  if (!orderNumber) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error || !order) {
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
                  Pesanan Berhasil
                </h1>
                <div className="min-h-[44px] min-w-[44px]" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
            <div className="text-center py-12">
              <p className="text-sm text-red-500">{error || 'Gagal memuat detail pesanan'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Group items by brand (if available) or show as single group
  const groupedItems = order.items.reduce((acc, item) => {
    // Since we don't have brand info in order items, group all together
    const brandKey = 'Produk yang Dibeli';
    if (!acc[brandKey]) {
      acc[brandKey] = [];
    }
    acc[brandKey].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

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
                Pesanan Berhasil
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {/* Success Notification */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">
                  Pesanan Berhasil Dibuat!
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Terima kasih atas pesanan Anda. Nomor pesanan: <span className="font-semibold text-blue-600">{order.orderNumber}</span>
                </p>
              </div>
            </div>
          </section>

          {/* Products Card with Checkmarks */}
          {Object.entries(groupedItems).map(([brandKey, brandItems]) => (
            <section
              key={brandKey}
              className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                    {brandKey}
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {brandItems.map((item) => {
                    // Use selectedImageUrl if available, otherwise fallback to first product image
                    const imageUrl = item.selectedImageUrl || item.product.images?.[0]?.imageUrl;
                    const unitPrice = parseFloat(item.price);
                    const { colorLabel, sizeLabel } = getVariantLabels(
                      item.variant,
                      item.selectedColor,
                      item.selectedSize
                    );
                    const variantText = colorLabel && sizeLabel
                      ? `${colorLabel}, ${sizeLabel}`
                      : colorLabel ?? sizeLabel ?? '';

                    return (
                      <div key={item.id} className="relative">
                        {/* Check icon - always visible for success page */}
                        <div className="absolute top-0 right-0 z-10 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                        </div>

                        <div className="flex items-start gap-3 min-w-0 pr-8">
                          {/* Product Image */}
                          <div className="relative h-16 w-16 rounded-lg border border-gray-100 bg-gray-100 flex-shrink-0 overflow-hidden sm:h-18 sm:w-18">
                            {imageUrl && imageUrl.trim() !== '' ? (
                              <Image
                                src={imageUrl}
                                alt={item.productName}
                                fill
                                className="object-cover"
                                sizes="72px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-gray-400">
                                Tidak ada gambar
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-semibold text-gray-900 truncate"
                                  title={item.productName}
                                >
                                  {item.productName}
                                </p>
                                {variantText && (
                                  <p
                                    className="text-xs font-medium text-gray-700 truncate mt-0.5"
                                    title={variantText}
                                  >
                                    {variantText}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Price and Quantity */}
                            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 w-[calc(100%+1rem+1rem)] -ml-4 -mr-4 pl-4 pr-4 sm:w-[calc(100%+1.25rem+1.25rem)] sm:-ml-5 sm:-mr-5 sm:pl-5 sm:pr-5">
                              <div className="flex items-end gap-2 whitespace-nowrap">
                                <span className="text-base font-bold text-blue-600">
                                  {formatCurrency(unitPrice, currencyCode)}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap justify-self-end -mr-2 sm:mr-0">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleContinueShopping}
              className="flex-1 h-10 rounded-lg px-4 text-sm font-semibold transition-colors border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              Continue Shopping
            </button>
            <button
              type="button"
              onClick={handleViewOrderDetails}
              className="flex-1 h-10 rounded-lg px-4 text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              View Order Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
