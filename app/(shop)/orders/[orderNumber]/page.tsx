'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOrder } from '@/contexts/OrderContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ArrowLeft, MapPin, CreditCard, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrder(orderNumber);
    }
  };

  if (loading || !currentOrder) {
    return (
      <div className="flex justify-center"><Loader size="lg" /></div>
    );
  }

  const order = currentOrder;
  const address = order.shippingAddress[0];
  const canCancel = ['PENDING', 'PROCESSING'].includes(order.status);

  return (
    <div>
      <Link href="/orders" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={order.status} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const imageUrl = item.product.images[0]?.imageUrl;
                return (
                  <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                    {imageUrl && (
                      <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={item.productName}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-blue-600">
                        {item.productName}
                      </Link>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: ${parseFloat(item.price).toFixed(2)}</p>
                      <p className="text-sm font-bold mt-1">Total: ${parseFloat(item.total).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Address */}
          {address && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-semibold">{address.fullName}</p>
                <p>{address.phone}</p>
                <p className="mt-2">{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${parseFloat(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{parseFloat(order.shippingCost) === 0 ? 'FREE' : `$${parseFloat(order.shippingCost).toFixed(2)}`}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${parseFloat(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment
            </h2>
            <p className="text-gray-700">
              <strong>Method:</strong> {order.paymentMethod}
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Status:</strong> <StatusBadge status={order.paymentStatus as any} size="sm" />
            </p>
          </div>

          {/* Actions */}
          {canCancel && (
            <Button
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              onClick={handleCancel}
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

