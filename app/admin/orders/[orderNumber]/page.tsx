'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  User,
  Calendar,
  Save,
  CheckCircle,
  Copy,
  Mail,
  Phone,
  Building2,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  formatPhoneDisplay,
  formatShippingAddress,
  getPaymentMethodDisplay,
  getVariantLabels,
} from '@/lib/order-helpers';
import { useCurrency } from '@/hooks/useCurrency';
import { useNotification } from '@/contexts/NotificationContext';

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
    slug: string;
    sku: string | null;
    images: Array<{
      imageUrl: string;
      altText: string | null;
    }>;
  };
  variant: {
    id: string;
    name: string;
    value: string;
  } | null;
}

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
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string | null;
  paymentChannel?: string | null;
  transactionId: string | null;
  subtotal: string;
  tax: string;
  shippingCost: string;
  serviceFee?: string;
  paymentFee?: string;
  discount: string;
  total: string;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress[];
  paymentTransactions?: PaymentTransaction[];
}

interface PaymentTransaction {
  id: string;
  provider: string;
  paymentType: string;
  channel?: string | null;
  amount: string;
  status: Order['paymentStatus'];
  transactionId?: string | null;
  vaNumber?: string | null;
  vaBank?: string | null;
  qrString?: string | null;
  qrImageUrl?: string | null;
  paymentUrl?: string | null;
  instructions?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;
  const { formatPrice, currency } = useCurrency();
  const { showSuccess, showError } = useNotification();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<Order['status']>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('PENDING');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodName, setPaymentMethodName] = useState<string>('');

  // Hide AdminHeader and AdminSidebar dengan CSS - HARUS dipanggil sebelum conditional return
  useEffect(() => {
    // Hide AdminHeader - cari header di dalam admin-main-content
    const adminMainContent = document.querySelector('.admin-main-content');
    if (adminMainContent) {
      const adminHeader = adminMainContent.querySelector('header');
      if (adminHeader) {
        (adminHeader as HTMLElement).style.display = 'none';
      }
      
      // Remove margin-left dan width constraint
      (adminMainContent as HTMLElement).style.marginLeft = '0';
      (adminMainContent as HTMLElement).style.width = '100%';
    }
    
    // Hide AdminSidebar
    const adminSidebar = document.querySelector('.admin-sidebar');
    if (adminSidebar) {
      (adminSidebar as HTMLElement).style.display = 'none';
    }
    
    // Remove padding dari admin-content-wrapper agar content bisa full width
    const adminContentWrapper = document.querySelector('.admin-content-wrapper');
    if (adminContentWrapper) {
      (adminContentWrapper as HTMLElement).style.padding = '0';
    }

    return () => {
      // Restore saat unmount
      if (adminMainContent) {
        const adminHeader = adminMainContent.querySelector('header');
        if (adminHeader) {
          (adminHeader as HTMLElement).style.display = '';
        }
        (adminMainContent as HTMLElement).style.marginLeft = '';
        (adminMainContent as HTMLElement).style.width = '';
      }
      if (adminSidebar) {
        (adminSidebar as HTMLElement).style.display = '';
      }
      if (adminContentWrapper) {
        (adminContentWrapper as HTMLElement).style.padding = '';
      }
    };
  }, []);

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  // Fetch payment method name
  useEffect(() => {
    const fetchPaymentMethodName = async () => {
      if (!order?.paymentMethod) {
        setPaymentMethodName('');
        return;
      }

      try {
        const response = await fetch('/api/settings/payment-methods');
        const data = await response.json();
        
        if (data.success && data.data) {
          const paymentMethods = data.data;
          const selectedMethod = paymentMethods.find(
            (m: any) => (order.paymentMethod === 'VIRTUAL_ACCOUNT' && m.id === order.paymentChannel) ||
                       (order.paymentMethod === m.type && m.type !== 'VIRTUAL_ACCOUNT' && !order.paymentChannel)
          );
          if (selectedMethod) {
            setPaymentMethodName(selectedMethod.name);
          } else {
            // Fallback to paymentChannel or paymentMethod
            const paymentMeta = getPaymentMethodDisplay(order.paymentMethod, 'id-ID');
            setPaymentMethodName(order.paymentChannel || paymentMeta.label || order.paymentMethod || '');
          }
        } else {
          // Fallback to paymentChannel or paymentMethod
          const paymentMeta = getPaymentMethodDisplay(order.paymentMethod, 'id-ID');
          setPaymentMethodName(order.paymentChannel || paymentMeta.label || order.paymentMethod || '');
        }
      } catch (error) {
        console.error('Error fetching payment method name:', error);
        // Fallback to paymentChannel or paymentMethod
        const paymentMeta = getPaymentMethodDisplay(order?.paymentMethod, 'id-ID');
        setPaymentMethodName(order?.paymentChannel || paymentMeta.label || order?.paymentMethod || '');
      }
    };

    if (order) {
      fetchPaymentMethodName();
    }
  }, [order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderNumber}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      const orderData = data.data;
      setOrder(orderData);
      setStatus(orderData.status);
      setPaymentStatus(orderData.paymentStatus);
      setTransactionId(orderData.transactionId || '');
      setNotes(orderData.notes || '');
    } catch (error: any) {
      console.error('Error fetching order:', error);
      showError('Gagal memuat order', error.message || 'Failed to load order');
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderNumber}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      showSuccess('Status diperbarui', 'Status pesanan dan sales count berhasil diperbarui.');
      fetchOrder();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      showError('Gagal memperbarui status', error.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderNumber}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus,
          transactionId: transactionId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment status');
      }

      showSuccess('Status pembayaran diperbarui', 'Status pembayaran berhasil diperbarui.');
      fetchOrder();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      showError('Gagal memperbarui pembayaran', error.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = (order: Order) => {
    if (order.user.firstName && order.user.lastName) {
      return `${order.user.firstName} ${order.user.lastName}`;
    }
    return order.user.email;
  };

  const handleCopy = async (value: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard not available');
      }
      await navigator.clipboard.writeText(value);
      showSuccess('Disalin', 'Berhasil disalin ke clipboard.');
    } catch (error) {
      console.error('Copy failed:', error);
      showError('Gagal menyalin', 'Failed to copy');
    }
  };

  if (loading || !order) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  const address = order.shippingAddress[0];
  const paymentMeta = getPaymentMethodDisplay(order.paymentMethod, 'en-US');
  const paymentInstruction = order.paymentTransactions?.[0] ?? null;
  const isOfflinePayment = paymentInstruction?.provider === 'OFFLINE';

  // Get payment source (provider)
  const paymentSource = paymentInstruction?.provider || 'Core API';
  
  // Get payment channel/type
  const paymentChannel = paymentInstruction?.channel || 
                        paymentInstruction?.paymentType || 
                        order.paymentChannel || 
                        paymentMeta.label;

  const handleBack = () => {
    router.push('/admin/orders');
  };

  return (
    <>
      {/* Header Full Width - Keluar dari container admin */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 w-full">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
            Detail Order
          </h1>
          <div className="min-h-[44px] min-w-[44px]" />
        </div>
      </header>

      {/* Content dengan padding top untuk header */}
      <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-6">
          {/* SECTION 1: PEMBAYARAN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Pembayaran
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Order ID */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-600">Order ID</p>
                  <p className="text-sm font-mono font-bold text-gray-900 break-all">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                  <p className="text-lg font-bold text-blue-600">{formatPrice(order.total)}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Status Pembayaran</p>
                <StatusBadge status={order.paymentStatus as any} size="lg" />
              </div>
            </div>
          </div>

          {/* SECTION 2: RINCIAN PEMBAYARAN */}
          {paymentInstruction && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Rincian Pembayaran
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Transaction ID */}
                  {paymentInstruction.transactionId && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Transaction ID</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-bold text-gray-900 break-all">
                          {paymentInstruction.transactionId}
                        </p>
                        <button
                          onClick={() => handleCopy(paymentInstruction.transactionId!)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                          title="Copy Transaction ID"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Channel */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Channel</p>
                    <p className="text-sm font-semibold text-gray-900">{paymentChannel}</p>
                  </div>

                  {/* Sumber */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Sumber</p>
                    <p className="text-sm font-semibold text-gray-900">{paymentSource}</p>
                  </div>

                  {/* Dibuat pada */}
                  {paymentInstruction.createdAt && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Dibuat pada</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateShort(paymentInstruction.createdAt)}
                      </p>
                    </div>
                  )}

                  {/* Batas waktu pembayaran */}
                  {paymentInstruction.expiresAt && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Batas waktu pembayaran</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDateShort(paymentInstruction.expiresAt)}
                      </p>
                    </div>
                  )}
                </div>


                {paymentInstruction.paymentType === 'bank_transfer' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Bank</p>
                        <p className="text-sm font-bold text-gray-900">
                          {paymentInstruction.vaBank || '-'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-600">Nomor Virtual Account</p>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900 font-mono">
                            {paymentInstruction.vaNumber || '-'}
                          </p>
                          {paymentInstruction.vaNumber && (
                            <button
                              onClick={() => handleCopy(paymentInstruction.vaNumber!)}
                              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Copy VA Number"
                            >
                              <Copy className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 3: RINCIAN PESANAN */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Rincian Pesanan
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Rincian Pelanggan */}
              <div className="space-y-4">
                  <h3 className="!text-sm sm:!text-base !font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  Rincian Pelanggan
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">Nama</p>
                    <p className="text-sm font-semibold text-gray-900">{getCustomerName(order)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Nomor HP
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.user.phone ? formatPhoneDisplay(order.user.phone) : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <a
                      href={`mailto:${order.user.email}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 break-all"
                    >
                      {order.user.email}
                    </a>
                  </div>
                  {address && (
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Alamat
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {formatShippingAddress(address)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rincian Pengiriman */}
              {address && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <h3 className="!text-sm sm:!text-base !font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    Rincian Pengiriman
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">Nama</p>
                      <p className="text-sm font-semibold text-gray-900">{address.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Nomor HP
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPhoneDisplay(address.phone)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </p>
                      <a
                        href={`mailto:${order.user.email}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 break-all"
                      >
                        {order.user.email}
                      </a>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Alamat Pengiriman
                      </p>
                      <p className="text-sm text-gray-900 leading-relaxed">
                        {formatShippingAddress(address)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rincian Produk */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="!text-sm sm:!text-base !font-semibold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  Rincian Produk
                </h3>
                <div className="space-y-4">
                  {order.items.map((item) => {
                    const imageUrl = item.selectedImageUrl || item.product.images[0]?.imageUrl;
                    const { colorLabel, sizeLabel } = getVariantLabels(
                      item.variant,
                      item.selectedColor,
                      item.selectedSize
                    );
                    const variantText =
                      colorLabel && sizeLabel
                        ? `${colorLabel}, ${sizeLabel}`
                        : colorLabel ?? sizeLabel ?? '';

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {/* Product Image */}
                        {imageUrl ? (
                          <div className="w-full sm:w-24 h-24 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                            <Image
                              src={imageUrl}
                              alt={item.productName}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                            No Image
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">ID Produk</p>
                            <p className="text-sm font-mono text-gray-700">{item.product.id}</p>
                          </div>
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {item.productName}
                            </Link>
                            {variantText && (
                              <p className="text-sm text-gray-600 mt-1">{variantText}</p>
                            )}
                            {item.product.sku && (
                              <p className="text-xs text-gray-500 mt-1">SKU: {item.product.sku}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Jumlah</p>
                              <p className="text-sm font-semibold text-gray-900">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Harga</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">Subtotal</p>
                              <p className="text-sm font-semibold text-blue-600">
                                {formatPrice(item.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: UPDATE ACTIONS & ORDER INFORMATION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Update Actions */}
            <div className="space-y-6">
              {/* Update Order Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    Update Order Status
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Order['status'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="PENDING">Menunggu</option>
                      <option value="PROCESSING">Dikemas</option>
                      <option value="SHIPPED">Dikirim</option>
                      <option value="DELIVERED">Selesai</option>
                      <option value="CANCELLED">Dibatalkan</option>
                      <option value="REFUNDED">Dikembalikan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add notes about this order..."
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Update Payment Status */}
              {isOfflinePayment && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Update Payment Status
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) =>
                          setPaymentStatus(e.target.value as Order['paymentStatus'])
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="PENDING">Menunggu</option>
                        <option value="PAID">Lunas</option>
                        <option value="FAILED">Gagal</option>
                        <option value="REFUNDED">Dikembalikan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID (Optional)
                      </label>
                      <Input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter transaction ID..."
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleUpdatePaymentStatus}
                      disabled={updating}
                      className="w-full"
                    >
                      {updating ? (
                        <>
                          <Loader size="sm" className="mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Update Payment Status
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Informasi Pesanan
                </h2>
              </div>
              <div className="p-6 space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-semibold">Dibuat:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Terakhir Diupdate:</span>
                  <span>{formatDate(order.updatedAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Dibayar pada:</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold">Currency:</span>
                  <span>{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: ORDER SUMMARY - FULL WIDTH */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Ringkasan Pesanan
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Subtotal pesanan</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Subtotal pengiriman</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parseFloat(order.shippingCost) === 0 ? (
                      <span className="line-through text-gray-400">Gratis Ongkir</span>
                    ) : (
                      formatPrice(order.shippingCost)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Biaya layanan</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parseFloat(order.serviceFee || '0') === 0 ? (
                      <span className="line-through text-gray-400">Gratis Ongkir</span>
                    ) : (
                      formatPrice(order.serviceFee || '0')
                    )}
                  </span>
                </div>
                {parseFloat(order.paymentFee || '0') !== 0 && paymentMethodName && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">
                      {parseFloat(order.paymentFee || '0') < 0 
                        ? `Potongan pembayaran ${paymentMethodName}` 
                        : `Biaya pembayaran ${paymentMethodName}`
                      }
                    </span>
                    <span className={`text-sm font-semibold ${
                      parseFloat(order.paymentFee || '0') < 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {parseFloat(order.paymentFee || '0') < 0 ? '-' : '+'}{formatPrice(Math.abs(parseFloat(order.paymentFee || '0')))}
                    </span>
                  </div>
                )}
                {parseFloat(order.tax) > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Pajak</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(order.tax)}
                    </span>
                  </div>
                )}
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-600">Voucher diskon</span>
                    <span className="text-sm font-semibold text-red-500">
                      -{formatPrice(order.discount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total - Full Width */}
              <div className="mt-6 pt-6 border-t-2 border-gray-300">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Pembayaran</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} • {currency}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
