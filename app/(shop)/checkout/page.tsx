'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useNotification } from '@/contexts/NotificationContext';
import { Loader } from '@/components/ui/Loader';
import { PaymentModal } from '@/components/checkout/PaymentModal';
import { calculateShipping } from '@/lib/shipping';

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

interface CheckoutProductImage {
  imageUrl: string;
  altText: string | null;
}

interface CheckoutProduct {
  id: string;
  name: string;
  price: string;
  salePrice: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  images?: CheckoutProductImage[];
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

function CheckoutPageContent() {
  const router = useRouter();
  const { status } = useSession();
  const { showSuccess, showError } = useNotification();
  const { addressId, setAddressId, paymentMethod, paymentChannel } = useCheckout();
  const { items: cartItems, subtotal: cartSubtotal, selectedItems } = useCart();
  const { formatPrice } = useCurrency();
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customPaymentMethods, setCustomPaymentMethods] = useState<PaymentMethod[]>([]);
  const searchParams = useSearchParams();
  const flow = searchParams.get('flow');
  const isBuyNowFlow = flow === 'buy-now';
  const productIdParam = searchParams.get('productId');
  const quantityParam = Number.parseInt(searchParams.get('quantity') ?? '1', 10);
  const colorParam = searchParams.get('color');
  const sizeParam = searchParams.get('size');
  const imageUrlParam = searchParams.get('imageUrl');
  const [productDetails, setProductDetails] = useState<CheckoutProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderNumber, setPaymentOrderNumber] = useState<string | null>(null);
  const [globalShippingSettings, setGlobalShippingSettings] = useState<{
    freeShippingThreshold: number;
    defaultShippingCost: number;
  }>({
    freeShippingThreshold: 0,
    defaultShippingCost: 0,
  });

  // Fetch custom payment methods and global shipping settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
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
      }
    };

    fetchSettings();
  }, []);

  // Fetch selected address or default address
  useEffect(() => {
    const fetchAddress = async () => {
      if (status === 'authenticated') {
        try {
          setIsLoading(true);
          const response = await fetch('/api/addresses');
          const data = await response.json();
          
          if (data.success) {
            const addresses: ShippingAddress[] = data.data || [];
            
            // Find address by addressId from context, or use default
            let addressToShow: ShippingAddress | null = null;
            
            if (addressId) {
              addressToShow = addresses.find(addr => addr.id === addressId) || null;
            }
            
            // If no address found by ID, use default address
            if (!addressToShow) {
              addressToShow = addresses.find(addr => addr.isDefault) || null;
            }
            
            // If still no address, use first address
            if (!addressToShow && addresses.length > 0) {
              addressToShow = addresses[0];
            }
            
            if (addressToShow) {
              setSelectedAddress(addressToShow);
              // Update context if not set
              if (!addressId) {
                setAddressId(addressToShow.id);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching address:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAddress();
  }, [status, addressId, setAddressId]);

  useEffect(() => {
    let isActive = true;

    if (!isBuyNowFlow || !productIdParam) {
      if (isActive) {
        setProductDetails(null);
        setProductError(null);
        setProductLoading(false);
      }
      return () => {
        isActive = false;
      };
    }

    const fetchProduct = async () => {
      try {
        setProductLoading(true);
        setProductError(null);

        const response = await fetch(`/api/products/${productIdParam}`);
        const data = await response.json();

        if (!isActive) return;

        if (response.ok && data.success) {
          setProductDetails(data.data);
        } else {
          setProductDetails(null);
          setProductError(data.error || 'Gagal memuat produk');
        }
      } catch (error) {
        console.error('Error fetching checkout product:', error);
        if (!isActive) return;
        setProductDetails(null);
        setProductError('Gagal memuat produk');
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

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/products');
    }
  };

  const handleSelectAddress = () => {
    router.push('/checkout/address');
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

  const toTitleCase = (value: string) =>
    value
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const colorLabelMap: Record<string, string> = {
    hitam: 'Hitam',
    putih: 'Putih',
    'biru-navy': 'Biru Navy',
    'merah-maroon': 'Merah Maroon',
  };

  // Helper function to get variant labels (same as cart page)
  const getVariantLabels = (
    variant: { name: string; value: string } | null,
    productVariants?: Array<{ id: string; name: string; value: string }>,
    selectedColor?: string | null,
    selectedSize?: string | null
  ) => {
    let colorLabel: string | null = null;
    let sizeLabel: string | null = null;

    // First priority: use selectedColor and selectedSize from metadata (if available)
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

    // Third priority: if we still don't have both, try to find from product variants
    if (productVariants && productVariants.length > 0) {
      // If we don't have color yet, find color variant
      if (!colorLabel) {
        const colorVariant = productVariants.find(
          (v) => v.name === 'Color' || v.name.toLowerCase() === 'color'
        );
        if (colorVariant) {
          const colorValue = colorVariant.value.toLowerCase();
          colorLabel = colorLabelMap[colorValue] ?? toTitleCase(colorVariant.value);
        }
      }

      // If we don't have size yet, find size variant
      if (!sizeLabel) {
        const sizeVariant = productVariants.find(
          (v) => v.name === 'Size' || v.name.toLowerCase() === 'size'
        );
        if (sizeVariant) {
          sizeLabel = sizeVariant.value.toUpperCase();
        }
      }
    }

    return { colorLabel, sizeLabel };
  };

  const colorLabel = colorParam
    ? colorLabelMap[colorParam.toLowerCase()] ?? toTitleCase(colorParam)
    : null;
  const sizeLabel = sizeParam ? sizeParam.toUpperCase() : null;
  const safeQuantity = Number.isFinite(quantityParam) && quantityParam > 0 ? quantityParam : 1;
  // Use imageUrl from query params (selected image) if available, otherwise fallback to product details
  const productImageUrl =
    imageUrlParam ||
    productDetails?.images?.find((image) => image?.imageUrl)?.imageUrl ||
    productDetails?.imageUrl ||
    null;

  // Calculate totals for buy-now flow
  const basePrice = productDetails ? Number.parseFloat(productDetails.price ?? '0') : 0;
  const salePriceRaw =
    productDetails?.salePrice !== null && productDetails?.salePrice !== undefined
      ? Number.parseFloat(productDetails.salePrice)
      : null;
  const hasDiscount =
    salePriceRaw !== null && Number.isFinite(salePriceRaw) && salePriceRaw > 0 && basePrice > 0 && salePriceRaw < basePrice;
  const effectivePrice = hasDiscount && salePriceRaw !== null ? salePriceRaw : basePrice;
  const buyNowSubtotal = effectivePrice * safeQuantity;
  const buyNowOriginalTotal = basePrice * safeQuantity;
  const buyNowDiscountTotal = hasDiscount ? buyNowOriginalTotal - buyNowSubtotal : 0;
  const discountPercentage =
    hasDiscount && basePrice > 0 ? Math.round(((basePrice - effectivePrice) / basePrice) * 100) : 0;

  // Calculate totals for cart flow - only from selected items
  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
  const cartSubtotalValue = selectedCartItems.reduce((total, item) => {
    const price = parseFloat(item.product.salePrice || item.product.price);
    return total + (price * item.quantity);
  }, 0);
  const cartDiscountTotal = selectedCartItems.reduce((total, item) => {
    const itemBasePrice = parseFloat(item.product.price);
    const itemSalePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
    if (itemSalePrice && itemSalePrice < itemBasePrice) {
      const itemDiscount = (itemBasePrice - itemSalePrice) * item.quantity;
      return total + itemDiscount;
    }
    return total;
  }, 0);

  // Use appropriate totals based on flow
  const subtotal = isBuyNowFlow ? buyNowSubtotal : cartSubtotalValue;
  const discountTotal = isBuyNowFlow ? buyNowDiscountTotal : cartDiscountTotal;
  const hasAnyDiscount = discountTotal > 0;
  const brandLabel = productDetails?.brand?.trim() || productDetails?.name || null;
  // Get selected payment method info
  const selectedPaymentMethodData = customPaymentMethods.find(
    (m) => (paymentMethod === 'VIRTUAL_ACCOUNT' && m.id === paymentChannel) || 
           (paymentMethod === m.type && m.type !== 'VIRTUAL_ACCOUNT' && (!paymentChannel || paymentChannel === m.id))
  );
  const paymentFee = selectedPaymentMethodData?.fee || 0;

  const paymentMethodMap: Record<
    'COD' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'CREDIT_CARD',
    { label: string; description: string }
  > = {
    COD: {
      label: selectedPaymentMethodData?.name || 'Bayar di Tempat (COD)',
      description: selectedPaymentMethodData?.description || 'Pembayaran dilakukan saat pesanan diterima.',
    },
    VIRTUAL_ACCOUNT: {
      label: selectedPaymentMethodData?.name || 'Virtual Account',
      description: selectedPaymentMethodData?.description || 'Pembayaran melalui Virtual Account bank yang tersedia.',
    },
    QRIS: {
      label: selectedPaymentMethodData?.name || 'QRIS',
      description: selectedPaymentMethodData?.description || 'Pembayaran instan menggunakan QR Indonesia Standard.',
    },
    CREDIT_CARD: {
      label: selectedPaymentMethodData?.name || 'Credit/Debit Card',
      description: selectedPaymentMethodData?.description || 'Pembayaran menggunakan kartu kredit atau debit.',
    },
  };
  const selectedPaymentInfo = paymentMethod ? paymentMethodMap[paymentMethod] : null;
  let paymentLabel = selectedPaymentInfo?.label ?? 'Belum ada metode pembayaran';
  if (paymentMethod === 'VIRTUAL_ACCOUNT' && paymentChannel && !selectedPaymentMethodData) {
    paymentLabel = `${paymentLabel} • ${paymentChannel}`;
  }
  const paymentDescription =
    selectedPaymentInfo?.description ?? 'Silakan pilih metode pembayaran sebelum melanjutkan.';
  const handleSelectPayment = () => {
    router.push('/checkout/payment');
  };

  const handleCreateOrder = async () => {
    if (!addressId || !paymentMethod || (paymentMethod === 'VIRTUAL_ACCOUNT' && !paymentChannel)) {
      if (!addressId) {
        showError('Peringatan', 'Silakan pilih alamat pengiriman terlebih dahulu');
      } else if (!paymentMethod) {
        showError('Peringatan', 'Silakan pilih metode pembayaran terlebih dahulu');
      } else if (!paymentChannel) {
        showError('Peringatan', 'Silakan pilih bank virtual account');
      }
      return;
    }

    if (isBuyNowFlow) {
      if (!productDetails) {
        showError('Peringatan', 'Data produk tidak lengkap');
        return;
      }
    } else {
      if (selectedCartItems.length === 0) {
        showError('Peringatan', 'Tidak ada item yang dipilih');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let response;
      if (isBuyNowFlow) {
        const buyNowBody: any = {
          addressId,
          paymentMethod,
          productId: productIdParam,
          quantity: safeQuantity,
        };
        if (colorParam) buyNowBody.color = colorParam;
        if (sizeParam) buyNowBody.size = sizeParam;
        if (productImageUrl) buyNowBody.imageUrl = productImageUrl;
        if (paymentChannel) buyNowBody.paymentChannel = paymentChannel;

        response = await fetch('/api/checkout/buy-now', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buyNowBody),
        });
      } else {
        const checkoutBody: any = {
          addressId,
          paymentMethod,
        };
        if (paymentChannel) checkoutBody.paymentChannel = paymentChannel;

        response = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(checkoutBody),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Tampilkan detail error jika ada
        let errorMessage = data.error || 'Gagal membuat pesanan';
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const firstError = data.details[0];
          errorMessage = firstError.message || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Check payment method to determine next step
      if (data.data?.orderNumber) {
        const orderPaymentMethod = data.data?.paymentMethod;
        
        // For COD, redirect to success page immediately
        if (orderPaymentMethod === 'COD') {
          showSuccess('Berhasil', 'Pesanan berhasil dibuat!');
        router.push(`/checkout/success?order=${data.data.orderNumber}`);
      } else {
          // For QRIS/VA, show payment modal
          // Payment modal will be shown via state
          setShowPaymentModal(true);
          setPaymentOrderNumber(data.data.orderNumber);
        }
      } else {
        showSuccess('Berhasil', 'Pesanan berhasil dibuat!');
        router.push('/orders');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Gagal', error instanceof Error ? error.message : 'Gagal membuat pesanan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmitOrder =
    ((isBuyNowFlow && !!productDetails && !productLoading && !productError) ||
     (!isBuyNowFlow && selectedCartItems.length > 0)) &&
    !!addressId &&
    !!paymentMethod &&
    !(paymentMethod === 'VIRTUAL_ACCOUNT' && !paymentChannel) &&
    !isSubmitting;

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
    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
    
    const cartItemsForShipping = selectedCartItems.map(item => ({
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
                Checkout
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto ${(isBuyNowFlow || (!isBuyNowFlow && selectedCartItems.length > 0)) ? 'pb-28' : 'pb-10'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {isLoading ? (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-5 sm:p-6 flex gap-2 items-start">
              <div className="p-1 text-blue-600 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-400">Memuat alamat...</div>
              </div>
            </section>
          ) : selectedAddress ? (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-5 sm:p-6 flex gap-2 items-start">
              <div className="p-1 text-blue-600 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="!text-sm font-semibold text-gray-900">{selectedAddress.fullName}</h2>
                  <span className="text-[11px] font-medium text-gray-500">{formatPhone(selectedAddress.phone)}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {formatAddress(selectedAddress)}
                </p>
              </div>
              <button
                onClick={handleSelectAddress}
                className="flex items-center justify-center flex-shrink-0 mt-1 w-8 h-8 rounded-full transition-none hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none focus:outline-none"
                aria-label="Pilih alamat"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </section>
          ) : (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-5 sm:p-6 flex gap-2 items-start">
              <div className="p-1 text-blue-600 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="!text-sm font-semibold text-gray-900">Belum ada alamat</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Silakan pilih alamat pengiriman
                </p>
              </div>
              <button
                onClick={handleSelectAddress}
                className="flex items-center justify-center flex-shrink-0 mt-1 w-8 h-8 rounded-full transition-none hover:translate-y-0 hover:shadow-none active:translate-y-0 active:shadow-none focus:outline-none"
                aria-label="Pilih alamat"
              >
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </section>
          )}

          {isBuyNowFlow && (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                    {productLoading ? 'Memuat...' : brandLabel ?? 'Produk'}
                  </p>
                  {hasDiscount && discountPercentage > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 whitespace-nowrap">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative h-16 w-16 rounded-lg border border-gray-100 bg-gray-100 flex-shrink-0 overflow-hidden sm:h-18 sm:w-18">
                      {productLoading ? (
                        <div className="h-full w-full animate-pulse bg-gray-200" />
                      ) : productImageUrl ? (
                        <Image
                          src={productImageUrl}
                          alt={productDetails?.name ?? 'Produk'}
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
                    <div className="min-w-0 space-y-2">
                      {productLoading ? (
                        <>
                          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                        </>
                      ) : productError ? (
                        <div className="text-sm font-medium text-red-500">{productError}</div>
                      ) : productDetails ? (
                        <>
                          <p
                            className="text-sm font-semibold text-gray-900 truncate"
                            title={productDetails.name}
                          >
                            {productDetails.name}
                          </p>
                          <p
                            className="text-xs font-medium text-gray-700 truncate"
                            title={
                              colorLabel && sizeLabel
                                ? `${colorLabel}, ${sizeLabel}`
                                : colorLabel ?? sizeLabel ?? ''
                            }
                          >
                            {colorLabel && sizeLabel
                              ? `${colorLabel}, ${sizeLabel}`
                              : colorLabel ?? sizeLabel ?? ''}
                          </p>
                          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 w-[calc(100%+1rem+1rem)] -ml-4 -mr-4 pl-4 pr-4 sm:w-[calc(100%+1.25rem+1.25rem)] sm:-ml-5 sm:-mr-5 sm:pl-5 sm:pr-5">
                            <div className="flex items-end gap-2 whitespace-nowrap">
                              <span className="text-base font-bold text-blue-600">
                                {formatPrice(effectivePrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">
                                  {formatPrice(basePrice)}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-gray-500 whitespace-nowrap justify-self-end -mr-2 sm:mr-0">
                              x{safeQuantity}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">Tidak ada produk yang dipilih.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section
            onClick={handleSelectPayment}
            className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex items-start cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <h2 className="!text-sm font-semibold text-gray-900 truncate">
                  Metode Pembayaran
                </h2>
                <div className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-gray-600 justify-self-end -mr-2 sm:mr-0">
                  Pilih metode pembayaran
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <p
                className="mt-1 text-sm font-medium text-gray-800 truncate"
                title={paymentLabel}
              >
                {paymentLabel}
              </p>
              <p
                className="mt-1 text-xs text-gray-500 truncate"
                title={paymentDescription}
              >
                {paymentDescription}
              </p>
              {paymentFee !== 0 && selectedPaymentMethodData && (
                <p className={`mt-1 text-xs font-medium ${
                  paymentFee < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {paymentFee < 0 
                    ? `Potongan: ${formatPrice(Math.abs(paymentFee))}` 
                    : `Tambahan: ${formatPrice(paymentFee)}`
                  }
                </p>
              )}
            </div>
          </section>

          {/* Rincian Pembayaran Card */}
          {isBuyNowFlow && (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
              <h2 className="!text-sm font-semibold text-gray-900">
                Rincian Pembayaran
              </h2>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal pesanan</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(subtotalPesanan)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ongkos Kirim</span>
                  <span className="text-sm font-medium text-gray-900">
                    {biayaOngkir === 0 ? (
                      <span className="text-green-600 font-semibold">Gratis</span>
                    ) : (
                      formatPrice(biayaOngkir)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Biaya Layanan</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(biayaLayanan)}
                  </span>
                </div>
                {paymentFee !== 0 && selectedPaymentMethodData && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {paymentFee < 0 
                        ? `Potongan pembayaran ${selectedPaymentMethodData.name}` 
                        : `Biaya pembayaran ${selectedPaymentMethodData.name}`
                      }
                    </span>
                    <span className={`text-sm font-medium ${
                      paymentFee < 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {paymentFee < 0 ? '-' : '+'}{formatPrice(Math.abs(paymentFee))}
                    </span>
                  </div>
                )}
                {totalDiskonPengiriman > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total diskon pengiriman</span>
                    <span className="text-sm font-medium text-red-500">
                      -{formatPrice(totalDiskonPengiriman)}
                    </span>
                  </div>
                )}
                {voucherDiskon > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Voucher diskon</span>
                    <span className="text-sm font-medium text-red-500">
                      -{formatPrice(voucherDiskon)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total pembayaran</span>
                    <span className="text-sm font-bold text-blue-600">
                      {formatPrice(totalPembayaran)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {!isBuyNowFlow && (
            <>
              {/* Group selected cart items by brand/category (same structure as cart page) */}
              {(() => {
                // Filter only selected items
                const filteredItems = cartItems.filter(item => selectedItems.has(item.id));
                
                if (filteredItems.length === 0) {
                  return (
                    <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm p-8 text-center text-gray-400">
                      Tidak ada item yang dipilih
                    </section>
                  );
                }

                // Group items by brand (or category if no brand)
                const groupedItems = filteredItems.reduce((acc, item) => {
                  const brandKey = item.product.brand?.trim() || item.product.category.name || 'Produk';
                  if (!acc[brandKey]) {
                    acc[brandKey] = [];
                  }
                  acc[brandKey].push(item);
                  return acc;
                }, {} as Record<string, typeof cartItems>);

                return Object.entries(groupedItems).map(([brandKey, brandItems]) => {
                  // Calculate discount percentage for this brand group
                  const brandDiscount = brandItems.reduce((total, item) => {
                    const basePrice = parseFloat(item.product.price);
                    const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
                    if (salePrice && salePrice < basePrice) {
                      const itemDiscount = (basePrice - salePrice) * item.quantity;
                      return total + itemDiscount;
                    }
                    return total;
                  }, 0);

                  const brandHasDiscount = brandDiscount > 0;
                  const brandDiscountPercentage = brandItems.reduce((max, item) => {
                    const basePrice = parseFloat(item.product.price);
                    const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
                    if (salePrice && salePrice < basePrice && basePrice > 0) {
                      const percentage = Math.round(((basePrice - salePrice) / basePrice) * 100);
                      return Math.max(max, percentage);
                    }
                    return max;
                  }, 0);

                  return (
                    <section
                      key={brandKey}
                      className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5"
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                            {brandKey}
                          </p>
                          {brandHasDiscount && brandDiscountPercentage > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 whitespace-nowrap">
                              -{brandDiscountPercentage}%
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-3">
                          {brandItems.map((item) => {
                            const price = parseFloat(item.product.salePrice || item.product.price);
                            const basePrice = parseFloat(item.product.price);
                            const hasDiscount = item.product.salePrice && parseFloat(item.product.salePrice) < basePrice;
                            const effectivePrice = price;
                            // Use selectedImageUrl if available, otherwise fallback to first product image
                            const imageUrl = item.selectedImageUrl || item.product.images[0]?.imageUrl;

                            const { colorLabel, sizeLabel } = getVariantLabels(
                              item.variant,
                              item.product.variants,
                              item.selectedColor,
                              item.selectedSize
                            );
                            const variantText = colorLabel && sizeLabel
                              ? `${colorLabel}, ${sizeLabel}`
                              : colorLabel ?? sizeLabel ?? '';

                            return (
                              <div key={item.id} className="flex items-start gap-3 min-w-0">
                                {/* Product Image */}
                                <div className="relative h-16 w-16 rounded-lg border border-gray-100 bg-gray-100 flex-shrink-0 overflow-hidden sm:h-18 sm:w-18">
                                  {imageUrl && imageUrl.trim() !== '' ? (
                                    <Image
                                      src={imageUrl}
                                      alt={item.product.name}
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
                                        title={item.product.name}
                                      >
                                        {item.product.name}
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
                                        {formatPrice(effectivePrice)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-xs text-gray-400 line-through">
                                          {formatPrice(basePrice)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap justify-self-end -mr-2 sm:mr-0">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  );
                });
              })()}

              {/* Rincian Pembayaran Card for cart flow */}
              <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
                <h2 className="!text-sm font-semibold text-gray-900">
                  Rincian Pembayaran
                </h2>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subtotal pesanan</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(subtotalPesanan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ongkos Kirim</span>
                    <span className="text-sm font-medium text-gray-900">
                      {biayaOngkir === 0 ? (
                        <span className="text-green-600 font-semibold">Gratis</span>
                      ) : (
                        formatPrice(biayaOngkir)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Biaya Layanan</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(biayaLayanan)}
                    </span>
                  </div>
                    {paymentFee !== 0 && selectedPaymentMethodData && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {paymentFee < 0 
                            ? `Potongan pembayaran ${selectedPaymentMethodData.name}` 
                            : `Biaya pembayaran ${selectedPaymentMethodData.name}`
                          }
                        </span>
                        <span className={`text-sm font-medium ${
                          paymentFee < 0 ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {paymentFee < 0 ? '-' : '+'}{formatPrice(Math.abs(paymentFee))}
                        </span>
                      </div>
                    )}
                    {totalDiskonPengiriman > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total diskon pengiriman</span>
                      <span className="text-sm font-medium text-red-500">
                        -{formatPrice(totalDiskonPengiriman)}
                      </span>
                    </div>
                  )}
                  {voucherDiskon > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Voucher diskon</span>
                      <span className="text-sm font-medium text-red-500">
                        -{formatPrice(voucherDiskon)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">Total pembayaran</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatPrice(totalPembayaran)}
                      </span>
                    </div>
          </div>
          </div>
              </section>
            </>
          )}
        </div>
      </main>

      {(isBuyNowFlow || (!isBuyNowFlow && selectedCartItems.length > 0)) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
            <div className="flex items-center justify-end gap-3">
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
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={!canSubmitOrder}
                className={`h-10 min-w-[140px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                  canSubmitOrder
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Buat Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal for QRIS/VA */}
      {showPaymentModal && paymentOrderNumber && (
        <PaymentModal
          isOpen={showPaymentModal}
          orderNumber={paymentOrderNumber}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentOrderNumber(null);
            router.push(`/orders/${paymentOrderNumber}`);
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            setPaymentOrderNumber(null);
            router.push(`/orders/${paymentOrderNumber}`);
          }}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
