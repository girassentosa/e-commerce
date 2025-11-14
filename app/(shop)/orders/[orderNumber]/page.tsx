'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrder } from '@/contexts/OrderContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ArrowLeft, MapPin, CreditCard, Package, Download } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import {
  formatPhoneDisplay,
  formatShippingAddress,
  getPaymentMethodDisplay,
  getVariantLabels,
  getCurrencyLocale,
} from '@/lib/order-helpers';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { currentOrder, loading, fetchOrderDetail, cancelOrder } = useOrder();
  const orderNumber = params?.orderNumber as string;

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

  const handleBack = () => {
    // Always redirect to orders page (profile orders page)
    router.push('/orders');
  };

  const handleCancel = async () => {
    if (confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      await cancelOrder(orderNumber);
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
  const currencyLocale = getCurrencyLocale(order.currency);

  const formatPrice = (value: number | string) => formatCurrency(value, order.currency, currencyLocale);

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
                <h2 className="!text-sm font-semibold text-gray-900">Nomor Pesanan</h2>
                <p className="mt-1 text-sm text-gray-600">{order.orderNumber}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Dibuat pada {new Date(order.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <StatusBadge status={order.status} size="lg" />
              </div>
            </div>
          </section>

          {/* Order Items Card */}
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
            <h2 className="!text-sm font-semibold text-gray-900 mb-3">Produk yang Dipesan</h2>
            <div className="space-y-4">
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
                  <div key={item.id} className="flex items-start gap-3">
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
          <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5 flex items-start">
            <div className="flex-1 min-w-0">
              <h2 className="!text-sm font-semibold text-gray-900 truncate">Metode Pembayaran</h2>
              <p className="mt-1 text-sm font-medium text-gray-800 truncate" title={paymentLabel}>
                {paymentLabel}
              </p>
              {paymentDescription && (
                <p className="mt-1 text-xs text-gray-500 truncate" title={paymentDescription}>
                  {paymentDescription}
                </p>
              )}
              <div className="mt-2">
                <StatusBadge status={order.paymentStatus as any} size="sm" />
              </div>
            </div>
          </section>

          {paymentInstruction && (
            <section className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5">
              <h2 className="!text-sm font-semibold text-gray-900">Instruksi Pembayaran</h2>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                {paymentInstruction.provider === 'OFFLINE' ? (
                  <p>{paymentInstruction.instructions || 'Bayar langsung kepada kurir saat pesanan diterima.'}</p>
                ) : paymentInstruction.paymentType === 'bank_transfer' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Bank</span>
                      <span className="font-semibold">{paymentInstruction.vaBank || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nomor Virtual Account</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">
                          {paymentInstruction.vaNumber || '-'}
                        </span>
                        {paymentInstruction.vaNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopy(paymentInstruction.vaNumber!)}
                            className="text-xs font-semibold text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Salin
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                ) : paymentInstruction.paymentType === 'qris' ? (
                  <div className="flex flex-col items-center gap-3">
                    {paymentInstruction.qrImageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={paymentInstruction.qrImageUrl}
                          alt="QRIS"
                          className="w-40 h-40 rounded-lg border border-gray-200 object-cover"
                        />
                        <Button
                          onClick={() => handleDownloadQR(paymentInstruction.qrString, paymentInstruction.qrImageUrl, order.orderNumber)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Unduh QR Code
                        </Button>
                      </div>
                    ) : paymentInstruction.qrString ? (
                      <p className="text-xs break-all text-center">{paymentInstruction.qrString}</p>
                    ) : null}
                    <p className="text-xs text-gray-500 text-center">
                      Scan QR ini menggunakan aplikasi bank atau e-wallet Anda untuk menyelesaikan pembayaran.
                    </p>
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
                ) : (
                  <p>{paymentInstruction.instructions || 'Ikuti petunjuk pembayaran sesuai metode yang dipilih.'}</p>
                )}

                {paymentInstruction.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Berlaku hingga {formatDateTime(paymentInstruction.expiresAt)}
                  </p>
                )}
              </div>
            </section>
          )}

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
    </div>
  );
}
