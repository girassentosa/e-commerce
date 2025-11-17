'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useNotification } from '@/contexts/NotificationContext';
import { calculateShipping } from '@/lib/shipping';

const virtualAccountBanks = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'BSI', 'PERMATA'];

interface CheckoutProduct {
  id: string;
  name: string;
  price: string;
  salePrice: string | null;
  brand?: string | null;
  freeShippingThreshold?: string | null;
  defaultShippingCost?: string | null;
  serviceFee?: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: 'VIRTUAL_ACCOUNT' | 'QRIS' | 'COD' | 'CREDIT_CARD';
  fee: number;
  isActive: boolean;
  description?: string;
  icon?: string;
}

function SelectPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const { paymentMethod, paymentChannel, setPaymentMethod, setPaymentChannel } = useCheckout();
  const { items, subtotal: cartSubtotal } = useCart();
  const { formatPrice } = useCurrency();
  const [isVirtualAccountExpanded, setIsVirtualAccountExpanded] = useState(false);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [globalShippingSettings, setGlobalShippingSettings] = useState<{
    freeShippingThreshold: number;
    defaultShippingCost: number;
  }>({
    freeShippingThreshold: 0,
    defaultShippingCost: 0,
  });
  
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
    // Check if there's a custom COD method
    const customCOD = customPaymentMethods.find(m => m.type === 'COD');
    
    if (paymentMethod === 'COD' && (!customCOD || paymentChannel === customCOD.id)) {
      setPaymentMethod(null);
      setPaymentChannel(null);
      setIsVirtualAccountExpanded(false);
      showSuccess('Berhasil', 'Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('COD');
    setPaymentChannel(customCOD?.id || null);
    setIsVirtualAccountExpanded(false);
    showSuccess('Berhasil', 'Metode pembayaran COD dipilih');
  };

  const handleSelectQRIS = () => {
    // Check if there's a custom QRIS method
    const customQRIS = customPaymentMethods.find(m => m.type === 'QRIS');
    
    if (paymentMethod === 'QRIS' && (!customQRIS || paymentChannel === customQRIS.id)) {
      setPaymentMethod(null);
      setPaymentChannel(null);
      setIsVirtualAccountExpanded(false);
      showSuccess('Berhasil', 'Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('QRIS');
    setPaymentChannel(customQRIS?.id || null);
    setIsVirtualAccountExpanded(false);
    showSuccess('Berhasil', 'Metode pembayaran QRIS dipilih');
  };

  const handleSelectVirtualAccount = (bank: string) => {
    // Check if there's a custom method for this bank
    const customMethod = customPaymentMethods.find(m => m.id === bank && m.type === 'VIRTUAL_ACCOUNT');
    
    if (paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel === bank) {
      setPaymentMethod(null);
      setPaymentChannel(null);
      showSuccess('Berhasil', 'Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod('VIRTUAL_ACCOUNT');
    setPaymentChannel(bank);
    showSuccess('Berhasil', `Virtual Account ${bank} dipilih`);
  };

  const handleSelectCustomMethod = (method: PaymentMethod) => {
    if (paymentMethod === method.type && paymentChannel === method.id) {
      setPaymentMethod(null);
      setPaymentChannel(null);
      setIsVirtualAccountExpanded(false);
      showSuccess('Berhasil', 'Metode pembayaran dibatalkan');
      return;
    }
    setPaymentMethod(method.type);
    setPaymentChannel(method.id);
    setIsVirtualAccountExpanded(false);
    showSuccess('Berhasil', `Metode pembayaran ${method.name} dipilih`);
  };

  const handleConfirm = () => {
    if (!paymentMethod) {
      showError('Peringatan', 'Silakan pilih metode pembayaran terlebih dahulu');
      return;
    }
    router.back();
  };

  const toggleVirtualAccount = () => {
    setIsVirtualAccountExpanded((prev) => !prev);
  };

  // Fetch custom payment methods
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingPaymentMethods(true);
        
        const [paymentRes, shippingRes] = await Promise.all([
          fetch('/api/settings/payment-methods'),
          fetch('/api/settings'),
        ]);

        const [paymentData, shippingData] = await Promise.all([
          paymentRes.json(),
          shippingRes.json(),
        ]);

        if (paymentRes.ok && paymentData.success) {
          setCustomPaymentMethods(paymentData.data || []);
        }

        if (shippingRes.ok && shippingData.success) {
          setGlobalShippingSettings({
            freeShippingThreshold: parseFloat(shippingData.data.freeShippingThreshold || '0'),
            defaultShippingCost: parseFloat(shippingData.data.defaultShippingCost || '0'),
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    fetchSettings();
  }, []);

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

  // Get selected payment method fee
  const selectedPaymentMethodData = customPaymentMethods.find(
    (m) => (paymentMethod === 'VIRTUAL_ACCOUNT' && m.id === paymentChannel) || 
           (paymentMethod === m.type && m.type !== 'VIRTUAL_ACCOUNT' && !paymentChannel)
  );
  const paymentFee = selectedPaymentMethodData?.fee || 0;

  // Payment breakdown calculations
  const subtotalPesanan = subtotal;
  
  // Calculate shipping using new hybrid logic
  let biayaOngkir = 0;
  let biayaLayanan = 0;
  let shippingReason = '';
  
  if (isBuyNowFlow && productDetails) {
    // Buy now flow: single product
    const cartItemsForShipping = [{
      productId: productIdParam || '',
      quantity: quantityParam,
      subtotal: subtotal,
      shippingSettings: {
        freeShippingThreshold: productDetails.freeShippingThreshold ? parseFloat(productDetails.freeShippingThreshold) : null,
        defaultShippingCost: productDetails.defaultShippingCost ? parseFloat(productDetails.defaultShippingCost) : null,
        serviceFee: productDetails.serviceFee ? parseFloat(productDetails.serviceFee) : null,
      },
    }];
    
    const shippingResult = calculateShipping(cartItemsForShipping, globalShippingSettings);
    biayaOngkir = shippingResult.shippingCost;
    biayaLayanan = shippingResult.serviceFee;
    shippingReason = shippingResult.reason;
  } else {
    // Cart flow: multiple products
    const cartItemsForShipping = items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      subtotal: parseFloat(item.product.salePrice || item.product.price) * item.quantity,
      shippingSettings: {
        freeShippingThreshold: item.product.freeShippingThreshold ? parseFloat(item.product.freeShippingThreshold) : null,
        defaultShippingCost: item.product.defaultShippingCost ? parseFloat(item.product.defaultShippingCost) : null,
        serviceFee: item.product.serviceFee ? parseFloat(item.product.serviceFee) : null,
      },
    }));
    
    const shippingResult = calculateShipping(cartItemsForShipping, globalShippingSettings);
    biayaOngkir = shippingResult.shippingCost;
    biayaLayanan = shippingResult.serviceFee;
    shippingReason = shippingResult.reason;
  }
  
  const totalDiskonPengiriman = 0; // No shipping discount for now
  const voucherDiskon = 0; // No voucher discount for now
  const totalPembayaran = subtotalPesanan + biayaOngkir + biayaLayanan + paymentFee - totalDiskonPengiriman - voucherDiskon;
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
          {(() => {
            const customQRIS = customPaymentMethods.find(m => m.type === 'QRIS');
            const isSelected = paymentMethod === 'QRIS' && (!customQRIS || paymentChannel === customQRIS.id);
            const fee = customQRIS?.fee || 0;
            
            return (
              <section
                onClick={handleSelectQRIS}
                className={`-mx-4 sm:-mx-6 bg-white border rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {customQRIS?.name || 'QRIS'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {customQRIS?.description || 'Scan QR Indonesia Standard untuk pembayaran instan'}
                    </p>
                    {fee !== 0 && (
                      <p className={`mt-1 text-xs font-medium ${
                        fee < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {fee < 0 ? `Potongan: ${formatPrice(Math.abs(fee))}` : `Tambahan: ${formatPrice(fee)}`}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="ml-3 flex-shrink-0">
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

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
              <div className="border-t border-gray-200">
                <div className="px-5 py-4 sm:px-6 sm:py-4">
                  <p className="text-xs font-semibold text-gray-700 mb-3">
                    Pilih Bank Virtual Account:
                  </p>
                </div>
                {/* Scrollable container dengan tinggi fixed */}
                <div 
                  className="px-5 pb-4 sm:px-6 sm:pb-4"
                  style={{ 
                    maxHeight: '280px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <div className="space-y-2 pr-1">
                    {/* Default banks */}
                    {virtualAccountBanks.map((bank) => {
                      const customMethod = customPaymentMethods.find(m => m.id === bank && m.type === 'VIRTUAL_ACCOUNT');
                      const isSelected =
                        paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel === bank;
                      const fee = customMethod?.fee || 0;

                      return (
                        <button
                          key={bank}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectVirtualAccount(bank);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {customMethod?.name || bank}
                                </span>
                                {fee !== 0 && (
                                  <span className={`text-xs font-medium ${
                                    fee < 0 ? 'text-green-600' : 'text-gray-600'
                                  }`}>
                                    {fee < 0 ? `-${formatPrice(Math.abs(fee))}` : `+${formatPrice(fee)}`}
                                  </span>
                                )}
                              </div>
                              {customMethod?.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{customMethod.description}</p>
                              )}
                            </div>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                    
                    {/* Custom Virtual Account methods not in default list */}
                    {customPaymentMethods
                      .filter(m => m.type === 'VIRTUAL_ACCOUNT' && !virtualAccountBanks.includes(m.id))
                      .map((method) => {
                        const isSelected = paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCustomMethod(method);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{method.name}</span>
                                  {method.fee !== 0 && (
                                    <span className={`text-xs font-medium ${
                                      method.fee < 0 ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                      {method.fee < 0 ? `-${formatPrice(Math.abs(method.fee))}` : `+${formatPrice(method.fee)}`}
                                    </span>
                                  )}
                                </div>
                                {method.description && (
                                  <p className="text-xs text-gray-500 mt-0.5">{method.description}</p>
                                )}
                              </div>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg] flex-shrink-0 ml-2" />
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

          {/* Custom Payment Methods (CREDIT_CARD and others) */}
          {customPaymentMethods
            .filter(m => m.type === 'CREDIT_CARD' || (m.type !== 'COD' && m.type !== 'QRIS' && m.type !== 'VIRTUAL_ACCOUNT'))
            .map((method) => {
              const isSelected = paymentMethod === method.type && paymentChannel === method.id;
              return (
                <section
                  key={method.id}
                  onClick={() => handleSelectCustomMethod(method)}
                  className={`-mx-4 sm:-mx-6 bg-white border rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{method.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {method.description || 'Metode pembayaran tersedia'}
                      </p>
                      {method.fee !== 0 && (
                        <p className={`mt-1 text-xs font-medium ${
                          method.fee < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {method.fee < 0 ? `Potongan: ${formatPrice(Math.abs(method.fee))}` : `Tambahan: ${formatPrice(method.fee)}`}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="ml-3 flex-shrink-0">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
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
