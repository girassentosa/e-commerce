'use client';

/**
 * Payment Modal Component - Redesigned with Clear Structure
 * Modal popup untuk menampilkan instruksi pembayaran
 * - Menampilkan QR code (QRIS) atau Virtual Account dengan jelas
 * - Real-time polling untuk cek status pembayaran
 * - Ketika PAID: Tampilkan ceklis di pop, lalu ganti dengan pop ceklis di tengah, lalu redirect
 */

import { useEffect, useState, useRef } from 'react';
import { Check, Loader2, Copy, Download, Clock, QrCode, Building2, X } from 'lucide-react';
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
import Image from 'next/image';
import { useNotification } from '@/contexts/NotificationContext';

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
  // State Management
  const [order, setOrder] = useState<Order | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [paymentTimeoutMinutes, setPaymentTimeoutMinutes] = useState<number>(1440); // Default 1440 minutes (24 hours)
  const { showSuccess, showError } = useNotification();
  
  // Refs untuk cleanup
  const isMountedRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function untuk handle payment success
  const handlePaymentSuccess = async (orderData: Order) => {
    console.log('✅ Payment SUCCESS detected!', {
      orderNumber: orderData.orderNumber,
      paymentStatus: orderData.paymentStatus,
    });

    // CRITICAL: Sync status ke database dari Midtrans API
    // Ini memastikan database ter-update meskipun webhook belum terpanggil
    try {
      const syncResponse = await fetch(`/api/orders/${orderNumber}/sync-payment`, {
        method: 'POST',
      });
      const syncData = await syncResponse.json();
      
      if (syncResponse.ok && syncData.success) {
        console.log('Payment status synced to database:', {
          orderNumber,
          synced: syncData.data.synced,
          paymentStatus: syncData.data.paymentStatus,
        });
        
        // Update order state dengan data terbaru dari database
        if (syncData.data.order) {
          setOrder(syncData.data.order);
        }
      } else {
        console.warn('Failed to sync payment status, but continuing with success flow:', syncData.error);
        // Tetap lanjutkan dengan orderData yang ada
        setOrder(orderData);
      }
    } catch (error) {
      console.error('Error syncing payment status:', error);
      // Tetap lanjutkan dengan orderData yang ada
      setOrder(orderData);
    }
    
    // Stop semua polling dan countdown
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Set states
    setIsPolling(false);
    setPaymentSuccess(true);
    setIsExpired(false);
    setTimeRemaining(null);
    
    showSuccess('Pembayaran berhasil', 'Pembayaran berhasil!'); 
    
    // Step 1: Tampilkan ceklis di pop pembayaran (paymentSuccess = true)
    // Step 2: Setelah 1 detik, tampilkan pop ceklis di tengah
    setTimeout(() => {
      if (isMountedRef.current) {
        setShowSuccessAnimation(true);
        setAnimationProgress(0);
        
        // Animate progress dari 0 ke 100 (1 detik)
        const animationDuration = 1000;
        const startTime = Date.now();
        
        const animateProgress = () => {
          if (!isMountedRef.current) return;
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(100, (elapsed / animationDuration) * 100);
          setAnimationProgress(progress);
          
          if (progress < 100) {
            requestAnimationFrame(animateProgress);
          } else {
            // Animation complete, redirect setelah 500ms
            setTimeout(() => {
              if (isMountedRef.current) {
                setShowSuccessAnimation(false);
                if (onPaymentSuccess) {
                  onPaymentSuccess();
                }
              }
            }, 500);
          }
        };
        
        requestAnimationFrame(animateProgress);
      }
    }, 1000); // Delay 1 detik untuk menampilkan ceklis di pop dulu
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      isMountedRef.current = false;
      setOrder(null);
      setIsFetching(false);
      setIsPolling(false);
      setPaymentSuccess(false);
      setTimeRemaining(null);
      setIsExpired(false);
      setShowSuccessAnimation(false);
      setAnimationProgress(0);
      
      // Clear intervals
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    } else {
      isMountedRef.current = true;
    }
  }, [isOpen]);

  // Fetch order details - Initial Load
  useEffect(() => {
    if (!isOpen || !orderNumber) return;
    if (order) return; // Jangan fetch jika sudah ada order

    let isMounted = true;

    const fetchOrder = async () => {
      try {
        setIsFetching(true);
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!isMounted) return;

        if (response.ok && data.success) {
          const orderData = data.data;
          console.log('Order fetched:', {
            orderNumber: orderData.orderNumber,
            paymentStatus: orderData.paymentStatus,
          });

          setOrder(orderData);
          
          // Jika sudah PAID, langsung handle success
          if (orderData.paymentStatus === 'PAID') {
            handlePaymentSuccess(orderData);
            return;
          }
          
          // Jangan set isPolling di sini - biarkan polling effect yang handle
          // Polling effect akan otomatis jalan jika order.paymentStatus === 'PENDING'
        } else {
          showError('Gagal memuat pesanan', 'Gagal memuat detail pesanan.');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching order:', error);
        showError('Gagal memuat pesanan', 'Gagal memuat detail pesanan.');
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

  // Fetch payment timeout minutes from settings
  useEffect(() => {
    if (!isOpen) return;

    const fetchPaymentTimeout = async () => {
      try {
        const response = await fetch('/api/settings/payment-timeout');
        const data = await response.json();
        
        if (data.success && typeof data.data === 'number') {
          setPaymentTimeoutMinutes(data.data);
        }
      } catch (error) {
        console.error('Error fetching payment timeout:', error);
        // Keep default 1440 minutes (24 hours) on error
      }
    };

    fetchPaymentTimeout();
  }, [isOpen]);

  // Countdown timer (dinamis dari settings)
  useEffect(() => {
    // Stop countdown jika payment sudah PAID atau success
    if (!order || !isOpen || paymentSuccess || order.paymentStatus === 'PAID') {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setTimeRemaining(null);
      return;
    }

    const paymentInstruction = order.paymentTransactions?.[0];
    if (!paymentInstruction) return;

    if (paymentInstruction.paymentType !== 'qris' && paymentInstruction.paymentType !== 'bank_transfer') {
      setTimeRemaining(null);
      return;
    }

    // Convert minutes to milliseconds
    const timeoutMs = paymentTimeoutMinutes * 60 * 1000;
    const expiryTime = new Date(order.createdAt).getTime() + timeoutMs;

    const updateCountdown = () => {
      // Check jika sudah PAID
      if (order?.paymentStatus === 'PAID' || paymentSuccess) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setTimeRemaining(null);
        return;
      }
      
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [order, isOpen, paymentSuccess, paymentTimeoutMinutes]);

  // Auto-cancel order saat expired - HANYA jika belum PAID
  useEffect(() => {
    if (!isExpired || !orderNumber || paymentSuccess) return;
    if (order?.paymentStatus === 'PAID') {
      console.log('Payment already PAID, skipping auto-cancel');
      return;
    }

    const cancelExpiredOrder = async () => {
      try {
        // Double check paymentStatus sebelum cancel
        const checkResponse = await fetch(`/api/orders/${orderNumber}`);
        const checkData = await checkResponse.json();
        
        if (checkResponse.ok && checkData.success && checkData.data.paymentStatus === 'PAID') {
          console.log('Payment is PAID, aborting auto-cancel');
          handlePaymentSuccess(checkData.data);
          return;
        }

        const response = await fetch(`/api/orders/${orderNumber}/cancel`, {
          method: 'PUT',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showError('Pembayaran kedaluwarsa', 'Pembayaran telah kedaluwarsa. Pesanan dibatalkan.');
          setTimeout(() => {
            onClose();
            window.location.href = '/orders';
          }, 2000);
        } else {
          showError('Gagal membatalkan pesanan', 'Gagal membatalkan pesanan yang kedaluwarsa.');
        }
      } catch (error) {
        console.error('Error cancelling expired order:', error);
        showError('Gagal membatalkan pesanan', 'Gagal membatalkan pesanan yang kedaluwarsa.');
      }
    };

    cancelExpiredOrder();
  }, [isExpired, orderNumber, paymentSuccess, onClose, order]);

  // Polling untuk cek status pembayaran - SIMPLIFIED LOGIC
  useEffect(() => {
    // Stop polling jika sudah success atau modal closed
    if (paymentSuccess || !isOpen || !orderNumber) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
      return;
    }

    // Hanya polling jika status PENDING dan bukan COD dan order sudah ada
    if (!order || order.paymentStatus !== 'PENDING' || order.paymentMethod === 'COD') {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
      return;
    }

    // Start polling - set isPolling hanya saat polling benar-benar jalan
    setIsPolling(true);

    const pollPaymentStatus = async () => {
      if (!isMountedRef.current) return;

      try {
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!isMountedRef.current) return;

        if (response.ok && data.success) {
          const newPaymentStatus = data.data.paymentStatus;
          
          console.log('Polling payment status:', {
            orderNumber,
            currentStatus: order?.paymentStatus,
            newStatus: newPaymentStatus,
            isPaid: newPaymentStatus === 'PAID',
          });
          
          // CRITICAL: Jika PAID, langsung handle success
          if (newPaymentStatus === 'PAID') {
            handlePaymentSuccess(data.data);
            return;
          }
          
          // Update order state jika ada perubahan
          if (order?.paymentStatus !== newPaymentStatus) {
            setOrder(data.data);
          }
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    };

    // Poll immediately, then every 2 seconds
    pollPaymentStatus();
    pollingIntervalRef.current = setInterval(pollPaymentStatus, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [isOpen, orderNumber, order, paymentSuccess]);

  // Helper functions
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Disalin', 'Berhasil disalin!');
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
      
      showSuccess('Berhasil diunduh', 'QR code berhasil diunduh.');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showError('Gagal mengunduh', 'Gagal mengunduh QR code.');
    }
  };

  const getQRCodeUrl = (qrString: string | null | undefined, qrImageUrl: string | null | undefined): string | null => {
    if (qrImageUrl) {
      return qrImageUrl;
    }
    if (qrString) {
      return `/api/qr/generate?string=${encodeURIComponent(qrString)}`;
    }
    return null;
  };

  if (!isOpen) return null;

  const paymentInstruction = order?.paymentTransactions?.[0];
  const currencyLocale = order ? getCurrencyLocale(order.currency) : 'en-US';
  const paymentMethodDisplay = order ? getPaymentMethodDisplay(order.paymentMethod, currencyLocale) : null;
  const address = order?.shippingAddress?.[0];

  // Check if QRIS
  const isQRIS = paymentInstruction?.paymentType === 'qris';
  const hasQRData = isQRIS && (paymentInstruction?.qrString || paymentInstruction?.qrImageUrl);
  const qrCodeUrl = isQRIS ? getQRCodeUrl(paymentInstruction?.qrString, paymentInstruction?.qrImageUrl) : null;

  // Check if Virtual Account
  const isVA = paymentInstruction?.paymentType === 'bank_transfer';
  const hasVAData = isVA && paymentInstruction?.vaNumber;

  if (!isOpen) return null;

  return (
    <>
      {/* Success Animation Overlay - Pop ceklis di tengah layar */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-in zoom-in duration-300 max-w-sm w-full mx-4">
            {/* Animated Check Circle */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={String(2 * Math.PI * 45)}
                  strokeDashoffset={String(2 * Math.PI * 45 * (1 - animationProgress / 100))}
                  className="transition-all duration-100 ease-out"
                />
              </svg>
              
              {/* Check Icon - muncul saat progress 100% */}
              {animationProgress >= 100 && (
                <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
                  <Check className="w-16 h-16 text-green-600" strokeWidth="4" />
                </div>
              )}
              
              {/* Loading spinner saat progress < 100% */}
              {animationProgress < 100 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              )}
            </div>
            
            {/* Text */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {animationProgress >= 100 ? 'Pembayaran Berhasil!' : 'Memproses Pembayaran...'}
              </h3>
              <p className="text-sm text-gray-600">
                {animationProgress >= 100 ? 'Mengalihkan ke halaman detail pesanan...' : 'Mohon tunggu sebentar'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Slide up from bottom */}
      <div className={`fixed inset-0 z-50 flex flex-col ${showSuccessAnimation ? 'pointer-events-none' : ''}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${showSuccessAnimation ? 'opacity-0' : 'opacity-100'}`}
          onClick={onClose}
        />
        
        {/* Modal Content - Slide up from bottom */}
        <div className={`relative mt-auto bg-white rounded-t-2xl sm:rounded-t-3xl shadow-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 ${showSuccessAnimation ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Header */}
          <div className="relative flex items-center justify-center px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-gray-200 bg-white">
            <div className="flex-1 text-center">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Pembayaran Pesanan</h2>
              {order && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  No. Pesanan: <span className="font-semibold text-blue-600">{order.orderNumber}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading Overlay - DIHAPUS: Tidak perlu menutupi QR/VA, polling berjalan di background */}
          {/* User harus bisa lihat QR/VA kapan saja, polling hanya background process */}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
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
                {/* Payment Success - Tampilkan ceklis di pop pembayaran */}
                {paymentSuccess && !showSuccessAnimation && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-300">
                        <Check className="w-12 h-12 text-green-600" strokeWidth={3} />
                      </div>
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-green-600 mb-1">Pembayaran Berhasil!</h3>
                        <p className="text-sm text-gray-600">Mengalihkan ke halaman detail pesanan...</p>
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

                {/* PAYMENT INSTRUCTIONS - Hanya tampilkan jika belum success */}
                {paymentInstruction && !paymentSuccess && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-lg w-full min-w-0">
                    <div className="text-center mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Instruksi Pembayaran</h3>
                      {paymentMethodDisplay && (
                        <p className="text-xs sm:text-sm text-gray-600">{paymentMethodDisplay.label}</p>
                      )}
                    </div>

                    {/* QRIS Payment */}
                    {isQRIS && (
                      <div className="space-y-3 sm:space-y-4">
                        {hasQRData ? (
                          <>
                            {/* QR Code Display */}
                            <div className="flex flex-col items-center gap-3 sm:gap-4 bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300 shadow-md w-full min-w-0">
                              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-semibold text-gray-700">QR Code Pembayaran</span>
                              </div>
                              
                              {qrCodeUrl ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square bg-white rounded-lg border-4 border-blue-400 p-3 sm:p-4 shadow-lg">
                                    <img
                                      src={qrCodeUrl}
                                      alt="QRIS Payment Code"
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        console.error('QR image failed to load:', qrCodeUrl);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleDownloadQR(paymentInstruction.qrString, paymentInstruction.qrImageUrl)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-blue-300"
                                  >
                                    <Download className="w-4 h-4" />
                                    Unduh QR Code
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <p className="text-sm text-red-600">QR Code tidak tersedia</p>
                                </div>
                              )}

                              {/* QR String as fallback */}
                              {!qrCodeUrl && paymentInstruction.qrString && (
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2 text-center">QR String:</p>
                                  <p className="text-xs break-all text-center font-mono bg-white p-3 rounded border">
                                    {paymentInstruction.qrString}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Instructions */}
                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
                              <p className="text-xs sm:text-sm text-gray-700 text-center leading-relaxed">
                                <strong>Langkah pembayaran:</strong>
                                <br />
                                1. Buka aplikasi e-wallet atau bank Anda
                                <br />
                                2. Pilih fitur scan QR code
                                <br />
                                3. Arahkan kamera ke QR code di atas
                                <br />
                                4. Konfirmasi pembayaran
                              </p>
                            </div>

                            {/* Payment URL */}
                            {paymentInstruction.paymentUrl && (
                              <div className="text-center">
                                <a
                                  href={paymentInstruction.paymentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 underline"
                                >
                                  Buka di aplikasi pembayaran
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-yellow-800">
                              Data QR code belum tersedia. Silakan refresh halaman.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Virtual Account Payment */}
                    {isVA && (
                      <div className="space-y-4">
                        {hasVAData ? (
                          <>
                            {/* VA Number Display */}
                            <div className="flex flex-col items-center gap-3 sm:gap-4 bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300 shadow-md w-full min-w-0">
                              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-semibold text-gray-700">Virtual Account</span>
                              </div>

                              <div className="w-full space-y-3 sm:space-y-4 min-w-0">
                                {/* Bank Name */}
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-gray-600 flex-shrink-0">Bank</span>
                                    <span className="text-base sm:text-lg font-bold text-gray-900 truncate text-right">
                                      {paymentInstruction.vaBank || '-'}
                                    </span>
                                  </div>
                                </div>

                                {/* VA Number */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border-2 border-blue-400 min-w-0">
                                  <div className="text-center mb-2">
                                    <span className="text-xs text-gray-600 uppercase tracking-wide">Nomor Virtual Account</span>
                                  </div>
                                  <div className="text-center min-w-0 px-2">
                                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-normal sm:tracking-wider font-mono break-all">
                                      {paymentInstruction.vaNumber || '-'}
                                    </span>
                                  </div>
                                </div>

                                {/* Copy Button */}
                                {paymentInstruction.vaNumber && (
                                  <Button
                                    onClick={() => handleCopy(paymentInstruction.vaNumber!)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-blue-300"
                                  >
                                    <Copy className="w-4 h-4" />
                                    Salin Nomor VA
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-white rounded-xl p-3 sm:p-4 border border-blue-200">
                              <p className="text-xs sm:text-sm text-gray-700 text-center leading-relaxed">
                                <strong>Langkah pembayaran:</strong>
                                <br />
                                1. Buka aplikasi mobile banking atau ATM
                                <br />
                                2. Pilih menu transfer
                                <br />
                                3. Masukkan nomor Virtual Account di atas
                                <br />
                                4. Transfer sesuai nominal yang tertera
                                <br />
                                5. Konfirmasi pembayaran
                              </p>
                            </div>

                            {/* Payment URL */}
                            {paymentInstruction.paymentUrl && (
                              <div className="text-center">
                                <a
                                  href={paymentInstruction.paymentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-blue-600 text-sm font-medium hover:text-blue-700 underline"
                                >
                                  Buka di aplikasi pembayaran
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-yellow-800">
                              Data Virtual Account belum tersedia. Silakan refresh halaman.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Countdown Timer */}
                    {timeRemaining !== null && timeRemaining > 0 && !isExpired && (
                      <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-blue-200">
                        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-600">
                          Waktu tersisa: <span className="font-bold text-blue-600 text-sm sm:text-base">
                            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                          </span>
                        </p>
                      </div>
                    )}
                    {isExpired && (
                      <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-red-200">
                        <Clock className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs sm:text-sm font-semibold text-red-600">
                          Waktu pembayaran telah habis
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Order Summary */}
                {!paymentSuccess && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Detail Pesanan</h3>
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

                    {/* Total Payment */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-semibold text-gray-700">Total Pembayaran</span>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 truncate">
                          {formatCurrency(order.total, order.currency, currencyLocale)}
                        </span>
                      </div>
                      {paymentMethodDisplay && (
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-xs sm:text-sm text-gray-600">Metode</span>
                          <StatusBadge status={order.paymentStatus as any} size="sm" />
                        </div>
                      )}
                    </div>

                    {/* Shipping Address */}
                    {address && (
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Alamat Pengiriman</h3>
                        <p className="text-xs sm:text-sm text-gray-700 break-words">
                          {formatShippingAddress(address)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                          {formatPhoneDisplay(address.phone)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
