'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrder } from '@/contexts/OrderContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ArrowLeft, MapPin, CreditCard, Package, Download, X, Star } from 'lucide-react';
import Image from 'next/image';
import { useCurrency } from '@/hooks/useCurrency';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { useState } from 'react';
import {
  formatPhoneDisplay,
  formatShippingAddress,
  getPaymentMethodDisplay,
  getVariantLabels,
} from '@/lib/order-helpers';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { currentOrder, loading, fetchOrderDetail, cancelOrder } = useOrder();
  const orderNumber = params?.orderNumber as string;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { formatPrice } = useCurrency();
  const [productReviews, setProductReviews] = useState<Record<string, any>>({});
  const [submittingReview, setSubmittingReview] = useState<Record<string, boolean>>({});
  const [reviewModalOpen, setReviewModalOpen] = useState<{ productId: string; productName: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/orders');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && orderNumber) {
      fetchOrderDetail(orderNumber);
    }
  }, [status, orderNumber, fetchOrderDetail]);

  // Polling untuk auto-refresh jika payment status masih PENDING
  useEffect(() => {
    // Hanya polling jika order ada, status PENDING, dan bukan COD
    if (
      !currentOrder ||
      currentOrder.paymentStatus !== 'PENDING' ||
      currentOrder.paymentMethod === 'COD' ||
      status !== 'authenticated'
    ) {
      // Stop polling jika kondisi tidak terpenuhi
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling setiap 3 detik
    const pollStatus = async () => {
      try {
        // Sync status dari Midtrans API terlebih dahulu
        const syncResponse = await fetch(`/api/orders/${orderNumber}/sync-payment`, {
          method: 'POST',
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          if (syncData.success && syncData.data.order) {
            // Refresh order detail setelah sync
            await fetchOrderDetail(orderNumber);
            
            // Jika sudah PAID, stop polling
            if (syncData.data.paymentStatus === 'PAID') {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
              toast.success('Pembayaran berhasil!');
            }
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    // Poll immediately, then every 3 seconds
    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [currentOrder, orderNumber, status, fetchOrderDetail]);

  // Fetch reviews for products in this order
  useEffect(() => {
    if (currentOrder && currentOrder.status === 'DELIVERED' && status === 'authenticated') {
      const fetchReviews = async () => {
        const reviewsMap: Record<string, any> = {};
        try {
          // Get current user ID from session
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          const currentUserId = sessionData?.user?.id;
          
          if (!currentUserId) return;
          
          for (const item of currentOrder.items) {
            try {
              const response = await fetch(`/api/products/${item.productId}/reviews?limit=100`);
              const data = await response.json();
              if (data.success && data.data) {
                // Find review by current user
                const userReview = data.data.find((r: any) => r.user?.id === currentUserId);
                if (userReview) {
                  reviewsMap[item.productId] = userReview;
                }
              }
            } catch (error) {
              console.error(`Error fetching review for product ${item.productId}:`, error);
            }
          }
          setProductReviews(reviewsMap);
        } catch (error) {
          console.error('Error fetching session:', error);
        }
      };
      fetchReviews();
    }
  }, [currentOrder, status]);

  const handleBack = () => {
    // Always redirect to orders page (profile orders page)
    router.push('/orders');
  };

  const handleCancel = async () => {
    if (confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      await cancelOrder(orderNumber);
    }
  };

  const handleSubmitReview = async (productId: string, data: { rating: number; title?: string; comment?: string; images?: string[] }) => {
    try {
      setSubmittingReview(prev => ({ ...prev, [productId]: true }));
      
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          orderId: currentOrder?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      
      // Refresh reviews
      const reviewResponse = await fetch(`/api/products/${productId}/reviews?limit=100`);
      const reviewData = await reviewResponse.json();
      if (reviewData.success && reviewData.data) {
        const { data: sessionData } = await fetch('/api/auth/session').then(r => r.json());
        if (sessionData?.user?.id) {
          const userReview = reviewData.data.find((r: any) => r.user?.id === sessionData.user.id);
          if (userReview) {
            // Ensure title is properly parsed (handle both string and null)
            const reviewWithTitle = {
              ...userReview,
              title: userReview.title || null,
            };
            setProductReviews(prev => ({ ...prev, [productId]: reviewWithTitle }));
          }
        }
      }
      
      // Refresh order detail
      if (orderNumber) {
        fetchOrderDetail(orderNumber);
      }
      
      // Close modal after successful submit
      setReviewModalOpen(null);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleDownloadQR = async (qrString: string | null | undefined, qrImageUrl: string | null | undefined, orderNumber: string) => {
    try {
      let downloadUrl: string;
      
      // Prefer qrString to generate QR code (more reliable and valid)
      if (qrString) {
        downloadUrl = `/api/qr/generate?string=${encodeURIComponent(qrString)}`;
      } else if (qrImageUrl) {
        // Fallback to download from URL
        downloadUrl = `/api/qr/download?url=${encodeURIComponent(qrImageUrl)}`;
      } else {
        throw new Error('QR code data not available');
      }
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `QRIS-${orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      toast.success('QR code berhasil diunduh');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Gagal mengunduh QR code. Silakan klik kanan pada gambar QR code dan pilih "Simpan gambar sebagai".');
    }
  };

  if (loading || !currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  const order = currentOrder;
  const address = order.shippingAddress[0];
  const canCancel = ['PENDING', 'PROCESSING'].includes(order.status);

  // Calculate payment breakdown mengikuti data backend
  const subtotalPesanan = parseFloat(order.subtotal);
  const biayaPengiriman = parseFloat(order.shippingCost);
  const pajak = parseFloat(order.tax);
  const voucherDiskon = parseFloat(order.discount);
  const totalPembayaran = parseFloat(order.total);

  const paymentMeta = getPaymentMethodDisplay(order.paymentMethod, 'id-ID');
  const paymentLabel = paymentMeta.label;
  const paymentDescription = paymentMeta.description;
  const paymentInstruction = order.paymentTransactions?.[0] ?? null;

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleCopy = async (value: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard tidak tersedia');
      }
      await navigator.clipboard.writeText(value);
      toast.success('Disalin ke clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Gagal menyalin');
    }
  };

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
                Detail Pesanan
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {/* Order Info Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="!text-sm !font-semibold text-gray-900" style={{ marginBottom: '16px' }}>Nomor Pesanan</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p className="text-sm text-gray-600">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <StatusBadge status={order.status} size="lg" />
              </div>
            </div>
          </section>

          {/* Order Items Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="!text-sm !font-semibold text-gray-900" style={{ marginBottom: '16px' }}>Produk yang Dipesan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map((item) => {
                // Use selectedImageUrl if available, otherwise fallback to first product image
                const imageUrl = item.selectedImageUrl || item.product.images?.[0]?.imageUrl;
                const unitPrice = parseFloat(item.price);
                const itemTotal = parseFloat(item.total);
                
                // Get variant labels using selectedColor and selectedSize from OrderItem
                const { colorLabel, sizeLabel } = getVariantLabels(
                  item.variant,
                  item.selectedColor,
                  item.selectedSize
                );
                const variantText = colorLabel && sizeLabel
                  ? `${colorLabel}, ${sizeLabel}`
                  : colorLabel ?? sizeLabel ?? '';

                return (
                  <div key={item.id} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="relative h-16 w-16 rounded-lg border border-gray-100 bg-gray-100 flex-shrink-0 overflow-hidden sm:h-18 sm:w-18">
                        {imageUrl ? (
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
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-gray-900 truncate" title={item.productName}>
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
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-end gap-2">
                            <span className="text-base font-bold text-blue-600">
                            {formatPrice(unitPrice)}
                            </span>
                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                          {formatPrice(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Button - Only show if order is DELIVERED */}
                    {order.status === 'DELIVERED' && (
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        {productReviews[item.productId] ? (
                          // Button to view existing review
                          <button
                            onClick={() => setReviewModalOpen({ productId: item.productId, productName: item.productName })}
                            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition-colors text-sm"
                          >
                            Lihat Penilaian
                          </button>
                        ) : (
                          // Button to create review
                          <button
                            onClick={() => setReviewModalOpen({ productId: item.productId, productName: item.productName })}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                          >
                            ⭐ Beri Ulasan Produk Ini
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Shipping Address Card */}
          {address && (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-5 py-5 sm:px-6 sm:py-6 flex gap-2 items-start">
              <div className="p-1 text-blue-600 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="!text-sm font-semibold text-gray-900">Alamat Pengiriman</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-sm font-semibold text-gray-900">{address.fullName}</span>
                  <span className="text-[11px] font-medium text-gray-500">
                    {formatPhoneDisplay(address.phone)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {formatShippingAddress(address)}
                </p>
              </div>
            </section>
          )}

          {/* Payment Method Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="!text-sm !font-semibold text-gray-900" style={{ marginBottom: '16px' }}>Metode Pembayaran</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p className="text-sm font-medium text-gray-800" title={paymentLabel}>
                  {paymentLabel}
                </p>
                {paymentDescription && (
                  <p className="mt-1.5 text-xs text-gray-500" title={paymentDescription}>
                    {paymentDescription}
                  </p>
                )}
              </div>

              {/* Bank Name for Bank Transfer */}
              {paymentInstruction?.paymentType === 'bank_transfer' && paymentInstruction.vaBank && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bank</span>
                    <span className="text-sm font-semibold text-gray-900">{paymentInstruction.vaBank}</span>
                  </div>
                </div>
              )}

              {/* QRIS Image */}
              {paymentInstruction?.paymentType === 'qris' && paymentInstruction.qrImageUrl && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }} className="flex flex-col items-center gap-3">
                  <img
                    src={paymentInstruction.qrImageUrl}
                    alt="QRIS"
                    className="w-32 h-32 rounded-lg border border-gray-200 object-cover"
                  />
                  {paymentInstruction.paymentUrl && (
                    <a
                      href={paymentInstruction.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 text-xs font-medium underline"
                    >
                      Buka di aplikasi pembayaran
                    </a>
                  )}
                </div>
              )}

              {/* Offline Payment Instructions */}
              {paymentInstruction?.provider === 'OFFLINE' && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <p className="text-sm text-gray-700">{paymentInstruction.instructions || 'Bayar langsung kepada kurir saat pesanan diterima.'}</p>
                </div>
              )}

              {/* Other Payment Instructions */}
              {paymentInstruction?.instructions && 
               paymentInstruction.provider !== 'OFFLINE' && 
               paymentInstruction.paymentType !== 'bank_transfer' && 
               paymentInstruction.paymentType !== 'qris' && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <p className="text-sm text-gray-700">{paymentInstruction.instructions}</p>
                </div>
              )}

              {/* Expiry Date */}
              {paymentInstruction?.expiresAt && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                  <p className="text-xs text-gray-500">
                    Berlaku hingga {formatDateTime(paymentInstruction.expiresAt)}
                  </p>
                </div>
              )}

              {/* Payment Status */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <StatusBadge status={order.paymentStatus as any} size="sm" />
              </div>
            </div>
          </section>

          {/* Payment Breakdown Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="!text-sm font-semibold text-gray-900">Rincian Pembayaran</h2>
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal pesanan</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(subtotalPesanan)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal pengiriman</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPrice(biayaPengiriman)}
                </span>
              </div>
              {pajak > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pajak</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(pajak)}
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

          {/* Cancel Order Button */}
          {canCancel && (
            <section className="-mx-4 sm:-mx-6 px-4 sm:px-6">
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                onClick={handleCancel}
              >
                Batalkan Pesanan
              </Button>
            </section>
          )}
        </div>
      </main>

      {/* Review Modal - Bottom Sheet */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 animate-fadeIn" 
            onClick={() => setReviewModalOpen(null)}
          />
          
          {/* Bottom Sheet */}
          <div className="relative mt-auto bg-white rounded-t-3xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-slideUpFromBottom bottom-sheet">
            {/* Handle Bar */}
            <div className="py-2 flex justify-center">
              <div className="h-1.5 w-16 rounded-full bg-gray-200"></div>
            </div>
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setReviewModalOpen(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),24px)]">
              <div className="px-5 py-4">
                {productReviews[reviewModalOpen.productId] ? (
                  // Show existing review
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">⭐</span>
                      <h2 className="!text-sm !font-semibold text-gray-900">Ulasan Anda</h2>
                    </div>
                    
                    <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < productReviews[reviewModalOpen.productId].rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        {productReviews[reviewModalOpen.productId].rating.toFixed(1)} / 5.0
                      </span>
                    </div>

                    {productReviews[reviewModalOpen.productId].title && (
                      <div className="space-y-1">
                        <span className="!text-xs !font-semibold text-gray-500 uppercase tracking-wide block">
                          Judul Ulasan
                        </span>
                        <p className="text-sm text-gray-700 font-normal">
                          {productReviews[reviewModalOpen.productId].title}
                        </p>
                      </div>
                    )}

                    {productReviews[reviewModalOpen.productId].comment && (
                      <div className="space-y-1">
                        <span className="!text-xs !font-semibold text-gray-500 uppercase tracking-wide block">
                          Ulasan
                        </span>
                        <p className="text-sm text-gray-700 font-normal whitespace-pre-wrap leading-relaxed">
                          {productReviews[reviewModalOpen.productId].comment}
                        </p>
                      </div>
                    )}

                    {productReviews[reviewModalOpen.productId].images && 
                     Array.isArray(productReviews[reviewModalOpen.productId].images) && 
                     productReviews[reviewModalOpen.productId].images.length > 0 && (
                      <div className="space-y-2">
                        <span className="!text-xs !font-semibold text-gray-500 uppercase tracking-wide block">
                          Foto Ulasan
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {productReviews[reviewModalOpen.productId].images.map((imgUrl: string, idx: number) => (
                            <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                              <Image
                                src={imgUrl}
                                alt={`Review photo ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Ulasan dibuat pada {new Date(productReviews[reviewModalOpen.productId].createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Show review form
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">⭐</span>
                      <h2 className="!text-sm !font-semibold text-gray-900">Beri Ulasan Produk Ini</h2>
                    </div>
                    <ReviewForm
                      productId={reviewModalOpen.productId}
                      productName={reviewModalOpen.productName}
                      onSubmit={(data) => handleSubmitReview(reviewModalOpen.productId, data)}
                      loading={submittingReview[reviewModalOpen.productId] || false}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
