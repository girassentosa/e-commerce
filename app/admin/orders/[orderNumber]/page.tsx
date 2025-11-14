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
  Download,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';
import {
  formatPhoneDisplay,
  formatShippingAddress,
  getPaymentMethodDisplay,
  getVariantLabels,
  getCurrencyLocale,
} from '@/lib/order-helpers';

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
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<Order['status']>('PENDING');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('PENDING');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

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
      toast.error(error.message || 'Failed to load order');
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

      toast.success('Order status updated successfully');
      fetchOrder();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
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

      toast.success('Payment status updated successfully');
      fetchOrder();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error(error.message || 'Failed to update payment status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (loading || !order) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  const address = order.shippingAddress[0];
  const currencyLocale = getCurrencyLocale(order.currency);
  const formatPrice = (value: string | number) =>
    formatCurrencyUtil(value, order.currency, currencyLocale);
  const paymentMeta = getPaymentMethodDisplay(order.paymentMethod, 'en-US');
  const paymentInstruction = order.paymentTransactions?.[0] ?? null;
  const isOfflinePayment = paymentInstruction?.provider === 'OFFLINE';

  const handleCopy = async (value: string) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard not available');
      }
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order #{order.orderNumber}
            </h1>
            <p className="text-gray-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} size="lg" />
            <StatusBadge status={order.paymentStatus as any} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items.length})
            </h2>
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
                    className="flex gap-4 border-b border-gray-200 pb-4 last:border-0"
                  >
                    {imageUrl ? (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {item.productName}
                      </Link>
                      {variantText && (
                        <p className="text-sm text-gray-600 mt-1">{variantText}</p>
                      )}
                      {item.variant && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        SKU: {item.product.sku || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-gray-600">
                          Quantity: <span className="font-medium">{item.quantity}</span>
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(item.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          {address && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700 space-y-1">
                <p className="font-semibold text-gray-900">{address.fullName}</p>
                <p>{formatPhoneDisplay(address.phone)}</p>
                <p className="mt-2">{formatShippingAddress(address)}</p>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Name:</span> {getCustomerName(order)}
              </p>
              <p>
                <span className="font-semibold">Email:</span>{' '}
                <a
                  href={`mailto:${order.user.email}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {order.user.email}
                </a>
              </p>
              {order.user.phone && (
                <p>
                  <span className="font-semibold">Phone:</span>{' '}
                  <a
                    href={`tel:${order.user.phone}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    {formatPhoneDisplay(order.user.phone)}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">{formatPrice(order.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {parseFloat(order.shippingCost) === 0
                    ? 'FREE'
                    : formatPrice(order.shippingCost)}
                </span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {paymentInstruction && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold mb-4">Payment Instructions</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-semibold">{paymentInstruction.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Channel</span>
                  <span className="font-semibold">
                    {paymentInstruction.channel || paymentInstruction.paymentType}
                  </span>
                </div>
                {paymentInstruction.transactionId && (
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="font-semibold">{paymentInstruction.transactionId}</span>
                  </div>
                )}

                {paymentInstruction.paymentType === 'bank_transfer' && (
                  <>
                    <div className="flex justify-between">
                      <span>Bank</span>
                      <span className="font-semibold">{paymentInstruction.vaBank || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span>VA Number</span>
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
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {paymentInstruction.paymentType === 'qris' && (
                  <div className="flex flex-col items-center gap-3">
                    {paymentInstruction.qrImageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={paymentInstruction.qrImageUrl}
                          alt="QRIS"
                          className="w-40 h-40 rounded-lg border border-gray-200 object-cover"
                        />
                        <Button
                          onClick={() => {
                            try {
                              let downloadUrl: string;
                              
                              // Prefer qrString to generate QR code (more reliable and valid)
                              if (paymentInstruction.qrString) {
                                downloadUrl = `/api/qr/generate?string=${encodeURIComponent(paymentInstruction.qrString)}`;
                              } else if (paymentInstruction.qrImageUrl) {
                                // Fallback to download from URL
                                downloadUrl = `/api/qr/download?url=${encodeURIComponent(paymentInstruction.qrImageUrl)}`;
                              } else {
                                throw new Error('QR code data not available');
                              }
                              
                              // Create a temporary anchor element and trigger download
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = `QRIS-${order.orderNumber}.png`;
                              document.body.appendChild(link);
                              link.click();
                              
                              // Cleanup
                              setTimeout(() => {
                                document.body.removeChild(link);
                              }, 100);
                              
                              toast.success('QR code downloaded successfully');
                            } catch (error) {
                              console.error('Error downloading QR code:', error);
                              toast.error('Failed to download QR code. Please try right-clicking the QR code and saving it manually.');
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download QR Code
                        </Button>
                      </div>
                    ) : null}
                    {paymentInstruction.qrString && (
                      <p className="text-xs break-all text-center">{paymentInstruction.qrString}</p>
                    )}
                    {paymentInstruction.paymentUrl && (
                      <a
                        href={paymentInstruction.paymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-xs font-medium underline"
                      >
                        Open payment URL
                      </a>
                    )}
                  </div>
                )}

                {paymentInstruction.instructions && (
                  <p className="text-xs text-gray-500">{paymentInstruction.instructions}</p>
                )}
                {paymentInstruction.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Expires at {formatDate(paymentInstruction.expiresAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Update Order Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Update Order Status
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Update Payment Status
            </h2>
            {isOfflinePayment ? (
              <div className="space-y-4">
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
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
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
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Payment Method:</strong> {paymentMeta.label}
                  </p>
                  {paymentMeta.description && (
                    <p className="text-sm text-gray-600 mb-2">{paymentMeta.description}</p>
                  )}
                  {order.transactionId && (
                    <p className="text-sm text-gray-600">
                      <strong>Current Transaction ID:</strong> {order.transactionId}
                    </p>
                  )}
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
            ) : (
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  Pembayaran ini dikelola otomatis oleh gateway ({paymentInstruction?.provider}). Status akan
                  ter-update realtime ketika gateway mengirim notifikasi.
                </p>
                {order.transactionId && (
                  <p>
                    <strong>Transaction ID:</strong> {order.transactionId}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Order Information
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Created:</span> {formatDate(order.createdAt)}
              </p>
              <p>
                <span className="font-semibold">Last Updated:</span> {formatDate(order.updatedAt)}
              </p>
              <p>
                <span className="font-semibold">Currency:</span> {order.currency}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

