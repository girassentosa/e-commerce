'use client';

import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

interface OrderSummaryProps {
  totals?: {
    subtotal: string;
    discount: string;
    tax: string;
    shipping: string;
    total: string;
  } | null;
}

export function OrderSummary({ totals }: OrderSummaryProps) {
  const { items, subtotal, itemCount } = useCart();

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Order Summary</h3>

      {/* Items */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {items.map((item) => {
          const imageUrl = item.product.images[0]?.imageUrl;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                <p className="text-sm font-semibold mt-1">
                  ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>${totals?.subtotal || subtotal}</span>
        </div>
        {totals && (
          <>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>${totals.tax}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{parseFloat(totals.shipping) === 0 ? 'FREE' : `$${totals.shipping}`}</span>
            </div>
            {parseFloat(totals.discount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${totals.discount}</span>
              </div>
            )}
          </>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>Total</span>
          <span>${totals?.total || subtotal}</span>
        </div>
      </div>
    </div>
  );
}

