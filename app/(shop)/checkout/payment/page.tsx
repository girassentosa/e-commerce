'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import toast from 'react-hot-toast';

const virtualAccountBanks = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'PERMATA'];

interface CheckoutProduct {
  id: string;
  name: string;
  price: string;
  salePrice: string | null;
  brand?: string | null;
}

function SelectPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { paymentMethod, paymentChannel, setPaymentMethod, setPaymentChannel } = useCheckout();
  const { items, subtotal: cartSubtotal } = useCart();
  const { formatPrice } = useCurrency();
  const [isVirtualAccountExpanded, setIsVirtualAccountExpanded] = useState(false);
  
  // For buy-now flow
  const flow = searchParams.get('flow');
  const isBuyNowFlow = flow === 'buy-now';
  const productIdParam = searchParams.get('productId');
  const quantityParam = Number.parseInt(searchParams.get('quantity') ?? '1', 10);
  const [productDetails, setProductDetails] = useState<CheckoutProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/checkout');
    }
  };

  const handleSelectCOD = () => {
    if (paymentMethod === 'COD') {
      setPaymentMethod(null);
      setIsVirtualAccountExpanded(false);
      toast.success('Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('COD');
    setPaymentChannel(null);
    setIsVirtualAccountExpanded(false);
    toast.success('Metode pembayaran COD dipilih');
  };

  const handleSelectQRIS = () => {
    if (paymentMethod === 'QRIS') {
      setPaymentMethod(null);
      setIsVirtualAccountExpanded(false);
      toast.success('Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('QRIS');
    setPaymentChannel(null);
    setIsVirtualAccountExpanded(false);
    toast.success('Metode pembayaran QRIS dipilih');
  };

  const handleSelectVirtualAccount = (bank: string) => {
    if (paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel === bank) {
      setPaymentMethod(null);
      setPaymentChannel(null);
      toast.success('Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('VIRTUAL_ACCOUNT');
    setPaymentChannel(bank);
    toast.success(`Virtual Account ${bank} dipilih`);
  };

  const handleConfirm = () => {
    if (!paymentMethod) {
      toast.error('Silakan pilih metode pembayaran terlebih dahulu');
      return;
    }
    router.back();
  };

  const toggleVirtualAccount = () => {
    setIsVirtualAccountExpanded((prev) => !prev);
  };

  // Fetch product details for buy-now flow
  useEffect(() => {
    let isActive = true;

    if (!isBuyNowFlow || !productIdParam) {
      if (isActive) {
        setProductDetails(null);
        setProductLoading(false);
      }
      return () => {
        isActive = false;
      };
    }

    const fetchProduct = async () => {
      try {
        setProductLoading(true);

        const response = await fetch(`/api/products/${productIdParam}`);
        const data = await response.json();

        if (!isActive) return;

        if (response.ok && data.success) {
          setProductDetails(data.data);
        } else {
          setProductDetails(null);
        }
      } catch (error) {
        console.error('Error fetching checkout product:', error);
        if (!isActive) return;
        setProductDetails(null);
      } finally {
        if (!isActive) return;
        setProductLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isActive = false;
    };
  }, [isBuyNowFlow, productIdParam]);

  // Calculate totals (same logic as checkout page)
  const safeQuantity = Number.isFinite(quantityParam) && quantityParam > 0 ? quantityParam : 1;
  const basePrice = productDetails ? Number.parseFloat(productDetails.price ?? '0') : 0;
  const salePriceRaw =
    productDetails?.salePrice !== null && productDetails?.salePrice !== undefined
      ? Number.parseFloat(productDetails.salePrice)
      : null;
  const hasDiscount =
    salePriceRaw !== null && Number.isFinite(salePriceRaw) && salePriceRaw > 0 && basePrice > 0 && salePriceRaw < basePrice;
  const effectivePrice = hasDiscount && salePriceRaw !== null ? salePriceRaw : basePrice;
  const subtotal = isBuyNowFlow ? effectivePrice * safeQuantity : parseFloat(cartSubtotal || '0');
  const originalTotal = isBuyNowFlow ? basePrice * safeQuantity : parseFloat(cartSubtotal || '0');
  
  // Calculate discount total
  let discountTotal = 0;
  if (isBuyNowFlow) {
    discountTotal = hasDiscount ? originalTotal - subtotal : 0;
  } else {
    // Calculate discount from cart items
    discountTotal = items.reduce((total, item) => {
      const itemBasePrice = parseFloat(item.product.price);
      const itemSalePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
      if (itemSalePrice && itemSalePrice < itemBasePrice) {
        const itemDiscount = (itemBasePrice - itemSalePrice) * item.quantity;
        return total + itemDiscount;
      }
      return total;
    }, 0);
  }

  // Payment breakdown calculations (same as checkout page)
  const subtotalPesanan = subtotal;
  const subtotalPengiriman = 15000; // Fixed shipping cost for now
  const biayaLayanan = 2000; // Fixed service fee for now
  const totalDiskonPengiriman = 0; // No shipping discount for now
  const voucherDiskon = 0; // No voucher discount for now
  const totalPembayaran =
    subtotalPesanan + subtotalPengiriman + biayaLayanan - totalDiskonPengiriman - voucherDiskon;
  const hasAnyDiscount = discountTotal > 0;

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
                Metode Pembayaran
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {/* COD Card */}
          <section
            onClick={handleSelectCOD}
            className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-gray-900">Bayar di Tempat (COD)</p>
                <p className="mt-1 text-xs text-gray-500">
                  Pembayaran dilakukan saat pesanan diterima
                </p>
              </div>
              {paymentMethod === 'COD' && (
                <div className="ml-3 flex-shrink-0">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          </section>

          {/* QRIS Card */}
          <section
            onClick={handleSelectQRIS}
            className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-base sm:text-lg font-semibold text-gray-900">QRIS</p>
                <p className="mt-1 text-xs text-gray-500">
                  Scan QR Indonesia Standard untuk pembayaran instan
                </p>
              </div>
              {paymentMethod === 'QRIS' && (
                <div className="ml-3 flex-shrink-0">
                  <Check className="w-5 h-5 text-blue-600" />
                </div>
              )}
            </div>
          </section>

          {/* Virtual Account Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm overflow-hidden">
            <div
              onClick={toggleVirtualAccount}
              className="px-5 py-5 sm:px-6 sm:py-6 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-base sm:text-lg font-semibold text-gray-900">Virtual Account</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Pembayaran melalui Virtual Account bank yang tersedia
                  </p>
                </div>
                <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                  {paymentMethod === 'VIRTUAL_ACCOUNT' && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      isVirtualAccountExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>
            </div>

            {isVirtualAccountExpanded && (
              <div className="border-t border-gray-200 px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-700 mb-3">
                    Pilih Bank Virtual Account:
                  </p>
                  <div className="space-y-2">
                    {virtualAccountBanks.map((bank) => {
                      const isSelected =
                        paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel === bank;

                      return (
                        <button
                          key={bank}
                          onClick={() => handleSelectVirtualAccount(bank)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{bank}</span>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="flex items-center justify-end gap-3">
            {paymentMethod && (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-base font-bold text-gray-900">
                  {formatPrice(totalPembayaran)}
                </span>
                {hasAnyDiscount && discountTotal > 0 && (
                  <span className="text-[11px] font-semibold text-red-500">
                    Hemat {formatPrice(discountTotal)}
                  </span>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!paymentMethod}
              className={`h-10 min-w-[140px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                paymentMethod
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Konfirmasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SelectPaymentPageContent />
    </Suspense>
  );
}
