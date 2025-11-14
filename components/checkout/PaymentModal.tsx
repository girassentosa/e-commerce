'use client';

/**
 * Payment Modal Component
 * Modal popup untuk menampilkan instruksi pembayaran dan menunggu konfirmasi pembayaran
 * - Menampilkan detail pesanan lengkap
 * - Menampilkan QR code (QRIS) atau Virtual Account
 * - Loading indicator saat menunggu pembayaran
 * - Real-time polling untuk cek status pembayaran
 * - Animasi checkmark setelah pembayaran berhasil
 */

import { useEffect, useState, useRef } from 'react';
import { Check, Loader2, Copy, Download, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import {
  formatPhoneDisplay,
  formatShippingAddress,
  getPaymentMethodDisplay,
  getVariantLabels,
  getCurrencyLocale,
} from '@/lib/order-helpers';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
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

interface PaymentTransaction {
  qrString?: string | null;
  qrImageUrl?: string | null;
  vaNumber?: string | null;
  vaBank?: string | null;
  paymentUrl?: string | null;
  instructions?: string | null;
  expiresAt?: string | null;
  paymentType?: string;
  provider?: string;
}

interface Order {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentChannel?: string | null;
  total: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: Array<{
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  paymentTransactions?: PaymentTransaction[];
  createdAt: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  orderNumber: string;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  orderNumber,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isFetching, setIsFetching] = useState(false); // State untuk tracking fetch pertama kali
  const [isPolling, setIsPolling] = useState(false); // State untuk tracking apakah sedang polling aktif
  const [polling, setPolling] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // Countdown timer
  const [isExpired, setIsExpired] = useState(false); // Flag untuk expired
  const isMountedRef = useRef(true); // Ref untuk track apakah component masih mounted

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      isMountedRef.current = false;
      setOrder(null);
      setIsFetching(false);
      setIsPolling(false);
      setPolling(false);
      setPaymentSuccess(false);
      setTimeRemaining(null);
      setIsExpired(false);
    } else {
      isMountedRef.current = true;
    }
  }, [isOpen]);

  // Fetch order details (tanpa loading spinner)
  useEffect(() => {
    if (!isOpen || !orderNumber) return;

    // Skip jika sudah ada order (untuk menghindari re-fetch yang tidak perlu)
    if (order) return;

    let isMounted = true;

    const fetchOrder = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!isMounted) return; // Skip jika component sudah unmount

        if (response.ok && data.success) {
          setOrder(data.data);
          // Start polling if payment is pending
          if (data.data.paymentStatus === 'PENDING' && data.data.paymentMethod !== 'COD') {
            setPolling(true);
          }
          // Check if already paid
          if (data.data.paymentStatus === 'PAID') {
            setPaymentSuccess(true);
          }
        } else {
          toast.error('Gagal memuat detail pesanan');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching order:', error);
        toast.error('Gagal memuat detail pesanan');
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderNumber]);

  // Countdown timer untuk QR/VA expiry (1 menit) - untuk QRIS dan Virtual Account
  useEffect(() => {
    if (!order || !isOpen || paymentSuccess || isExpired) return;

    const paymentInstruction = order.paymentTransactions?.[0];
    if (!paymentInstruction) return;

    // Untuk QRIS dan Virtual Account (bank_transfer)
    if (paymentInstruction.paymentType !== 'qris' && paymentInstruction.paymentType !== 'bank_transfer') {
      setTimeRemaining(null);
      return;
    }

    // Force 1 menit dari createdAt (abaikan expiresAt dari Midtrans)
    const expiryTime = new Date(order.createdAt).getTime() + 60000; // 1 menit dari order dibuat

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        setPolling(false);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [order, isOpen, paymentSuccess, isExpired]);

  // Auto-cancel order saat expired
  useEffect(() => {
    if (!isExpired || !orderNumber || paymentSuccess) return;

    const cancelExpiredOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderNumber}/cancel`, {
          method: 'PUT',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.error('Pembayaran telah kedaluwarsa. Pesanan dibatalkan.');
          // Close modal dan redirect
          setTimeout(() => {
            onClose();
            window.location.href = '/orders';
          }, 2000);
        } else {
          toast.error('Gagal membatalkan pesanan yang expired');
        }
      } catch (error) {
        console.error('Error cancelling expired order:', error);
        toast.error('Gagal membatalkan pesanan yang expired');
      }
    };

    cancelExpiredOrder();
  }, [isExpired, orderNumber, paymentSuccess, onClose]);

  // Polling untuk cek status pembayaran (tanpa loading overlay yang terus-terusan)
  useEffect(() => {
    if (!polling || !orderNumber || paymentSuccess || !isOpen || isExpired) {
      setIsPolling(false);
      return;
    }

    let isMounted = true;

    const pollInterval = setInterval(async () => {
      // Double check jika modal sudah ditutup
      if (!isMounted || !isMountedRef.current) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!isMounted || !isMountedRef.current) return; // Skip jika component sudah unmount atau modal ditutup

        if (response.ok && data.success) {
          // Cek perubahan status sebelum update
          setOrder((prevOrder) => {
            if (!prevOrder) {
              return data.data;
            }
            // Hanya update jika ada perubahan status pembayaran
            if (prevOrder.paymentStatus !== data.data.paymentStatus) {
              // Jika ada perubahan status, tampilkan loading sebentar
              if (isMounted) {
                setIsPolling(true);
                setTimeout(() => {
                  if (isMounted) setIsPolling(false);
                }, 1000);
              }
              return data.data;
            }
            // Jika tidak ada perubahan, return previous order (tidak trigger re-render)
            return prevOrder;
          });
          
          // Jika pembayaran berhasil
          if (data.data.paymentStatus === 'PAID') {
            if (isMounted) {
              setPolling(false);
              setIsPolling(true); // Tampilkan loading saat payment success
              setPaymentSuccess(true);
              toast.success('Pembayaran berhasil!');
              if (onPaymentSuccess) {
                setTimeout(() => {
                  if (isMounted) {
                    setIsPolling(false);
                    onPaymentSuccess();
                  }
                }, 2000); // Delay untuk animasi
              }
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error polling payment status:', error);
        }
      }
    }, 3000); // Poll setiap 3 detik

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [polling, orderNumber, paymentSuccess, onPaymentSuccess, isOpen, isExpired]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Berhasil disalin!');
  };

  const handleDownloadQR = async (qrString: string | null | undefined, qrImageUrl: string | null | undefined) => {
    try {
      let downloadUrl: string;
      
      if (qrString) {
        downloadUrl = `/api/qr/generate?string=${encodeURIComponent(qrString)}`;
      } else if (qrImageUrl) {
        downloadUrl = `/api/qr/download?url=${encodeURIComponent(qrImageUrl)}`;
      } else {
        throw new Error('QR code data not available');
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `QRIS-${orderNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code berhasil diunduh');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Gagal mengunduh QR code');
    }
  };

  if (!isOpen) return null;

  const paymentInstruction = order?.paymentTransactions?.[0];
  const currencyLocale = order ? getCurrencyLocale(order.currency) : 'en-US';
  const paymentMethodDisplay = order ? getPaymentMethodDisplay(order.paymentMethod, currencyLocale) : null;
  const address = order?.shippingAddress?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pembayaran Pesanan</h2>
            {order && (
              <p className="text-sm text-gray-500 mt-1">
                No. Pesanan: <span className="font-semibold text-blue-600">{order.orderNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Loading Overlay di tengah popup (hanya saat sedang polling aktif) */}
        {isPolling && polling && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white bg-opacity-90 rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-sm text-gray-600">Memeriksa status pembayaran...</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isFetching && !order ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Memuat detail pesanan...</p>
            </div>
          ) : !order ? (
            <div className="text-center py-12">
              <p className="text-red-500">Gagal memuat detail pesanan</p>
            </div>
          ) : (
            <>
              {/* Payment Status */}
              {paymentSuccess && (
                <div className="flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-green-600">Pembayaran Berhasil!</h3>
                      <p className="text-sm text-gray-600 mt-1">Pesanan Anda sedang diproses</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expired Warning */}
              {isExpired && !paymentSuccess && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-red-600">
                    Waktu pembayaran telah habis. Pesanan akan dibatalkan.
                  </p>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Detail Pesanan</h3>
                {order.items.map((item) => {
                  const { colorLabel, sizeLabel } = getVariantLabels(
                    item.variant,
                    item.selectedColor,
                    item.selectedSize
                  );
                  const variantText = colorLabel && sizeLabel
                    ? `${colorLabel}, ${sizeLabel}`
                    : colorLabel ?? sizeLabel ?? '';
                  const imageUrl = item.selectedImageUrl || item.product.images?.[0]?.imageUrl;

                  return (
                    <div key={item.id} className="flex gap-3 bg-white rounded-lg p-3">
                      {imageUrl && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.productName}
                        </p>
                        {variantText && (
                          <p className="text-xs text-gray-500 mt-0.5">{variantText}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.total, order.currency, currencyLocale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method */}
              {paymentMethodDisplay && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Metode Pembayaran</p>
                      <p className="text-sm text-gray-600 mt-1">{paymentMethodDisplay.label}</p>
                    </div>
                    <StatusBadge status={order.paymentStatus as any} size="sm" />
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              {paymentInstruction && !paymentSuccess && (
                <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Instruksi Pembayaran
                  </h3>

                  {/* QRIS */}
                  {paymentInstruction.paymentType === 'qris' && (
                    <div className="flex flex-col items-center gap-4">
                      {paymentInstruction.qrImageUrl ? (
                        <div className="flex flex-col items-center gap-3">
                          <img
                            src={paymentInstruction.qrImageUrl}
                            alt="QRIS"
                            className="w-48 h-48 rounded-lg border-2 border-gray-300 bg-white p-2"
                          />
                          <Button
                            onClick={() => handleDownloadQR(paymentInstruction.qrString, paymentInstruction.qrImageUrl)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Unduh QR Code
                          </Button>
                        </div>
                      ) : paymentInstruction.qrString ? (
                        <p className="text-xs break-all text-center bg-white p-3 rounded border">
                          {paymentInstruction.qrString}
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-700 text-center">
                        Scan QR code ini menggunakan aplikasi e-wallet atau bank Anda
                      </p>
                      {paymentInstruction.paymentUrl && (
                        <a
                          href={paymentInstruction.paymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 text-sm font-medium underline"
                        >
                          Buka di aplikasi pembayaran
                        </a>
                      )}
                    </div>
                  )}

                  {/* Virtual Account */}
                  {paymentInstruction.paymentType === 'bank_transfer' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 w-full">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">Bank</span>
                          <span className="text-base font-bold text-gray-900">
                            {paymentInstruction.vaBank || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-600">Nomor Virtual Account</span>
                          <span className="text-lg font-bold text-gray-900">
                            {paymentInstruction.vaNumber || '-'}
                          </span>
                        </div>
                      </div>
                      {paymentInstruction.vaNumber && (
                        <Button
                          onClick={() => handleCopy(paymentInstruction.vaNumber!)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Salin Nomor VA
                        </Button>
                      )}
                      <p className="text-sm text-gray-700 text-center">
                        Transfer sesuai nominal ke Virtual Account di atas
                      </p>
                      {paymentInstruction.paymentUrl && (
                        <a
                          href={paymentInstruction.paymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 text-sm font-medium underline"
                        >
                          Buka di aplikasi pembayaran
                        </a>
                      )}
                    </div>
                  )}

                  {/* Countdown Timer - untuk QRIS dan Virtual Account */}
                  {timeRemaining !== null && timeRemaining > 0 && !isExpired && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-blue-200">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <p className="text-xs text-gray-600">
                        Waktu tersisa: <span className="font-bold text-blue-600">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                      </p>
                    </div>
                  )}
                  {isExpired && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-red-200">
                      <Clock className="w-4 h-4 text-red-500" />
                      <p className="text-xs font-semibold text-red-600">
                        Waktu pembayaran telah habis
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Pembayaran</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(order.total, order.currency, currencyLocale)}
                  </span>
                </div>
              </div>

              {/* Shipping Address */}
              {address && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Alamat Pengiriman</h3>
                  <p className="text-sm text-gray-700">
                    {formatShippingAddress(address)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPhoneDisplay(address.phone)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

