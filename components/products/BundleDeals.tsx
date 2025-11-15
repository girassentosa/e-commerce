'use client';

/**
 * Bundle Deals Component
 * Shows special offers like "Buy 2 Save 20%"
 * Cross-sell dengan discount
 */

import { Check, Gift, Tag, TrendingUp } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface BundleDeal {
  id: string;
  quantity: number;
  discount: number; // percentage
  label: string;
  savings?: number; // calculated amount
  badge?: string;
}

interface BundleDealsProps {
  productPrice: number;
  deals?: BundleDeal[];
  onSelectDeal?: (deal: BundleDeal) => void;
  selectedQuantity?: number;
}

export function BundleDeals({
  productPrice,
  deals,
  onSelectDeal,
  selectedQuantity = 1,
}: BundleDealsProps) {
  const { formatPrice } = useCurrency();
  
  // Default bundle deals if none provided
  const defaultDeals: BundleDeal[] = [
    {
      id: 'bundle-2',
      quantity: 2,
      discount: 10,
      label: 'Buy 2',
      badge: 'SAVE 10%',
    },
    {
      id: 'bundle-3',
      quantity: 3,
      discount: 15,
      label: 'Buy 3',
      badge: 'SAVE 15%',
    },
    {
      id: 'bundle-5',
      quantity: 5,
      discount: 20,
      label: 'Buy 5+',
      badge: 'BEST DEAL',
    },
  ];

  const bundleDeals = deals || defaultDeals;

  // Calculate savings for each deal
  const dealsWithSavings = bundleDeals.map(deal => ({
    ...deal,
    savings: (productPrice * deal.quantity * deal.discount) / 100,
    totalPrice: productPrice * deal.quantity * (1 - deal.discount / 100),
    pricePerItem: productPrice * (1 - deal.discount / 100),
  }));

  // Find best deal
  const bestDeal = dealsWithSavings.reduce((best, current) => 
    current.discount > best.discount ? current : best
  );

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-xl p-4 sm:p-6 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Special Bundle Deals</h3>
          <p className="text-xs text-gray-600">Save more when you buy in bulk!</p>
        </div>
      </div>

      {/* Deal Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {dealsWithSavings.map((deal, index) => {
          const isSelected = selectedQuantity >= deal.quantity;
          const isBestDeal = deal.id === bestDeal.id;

          return (
            <button
              key={deal.id}
              onClick={() => onSelectDeal?.(deal)}
              className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                isSelected
                  ? 'border-purple-500 bg-white shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              {/* Best Deal Badge */}
              {isBestDeal && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  🔥 BEST
                </div>
              )}

              {/* Discount Badge */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold mb-2 ${
                isSelected
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <Tag className="w-3 h-3" />
                {deal.badge || `${deal.discount}% OFF`}
              </div>

              {/* Quantity */}
              <p className="text-2xl font-extrabold text-gray-900 mb-1">
                {deal.label}
              </p>

              {/* Price */}
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-purple-600">
                  {formatPrice(deal.pricePerItem)}
                  <span className="text-xs text-gray-500 font-normal">/ea</span>
                </p>
                <p className="text-xs text-gray-500 line-through">
                  {formatPrice(productPrice)} each
                </p>
              </div>

              {/* Savings */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-green-600">
                  💰 Save {formatPrice(deal.savings)}
                </p>
                <p className="text-[10px] text-gray-500">
                  Total: {formatPrice(deal.totalPrice)}
                </p>
              </div>

              {/* Selected Check */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="flex items-start gap-2 bg-white bg-opacity-60 rounded-lg p-3">
        <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-gray-900">
            Bulk Discount Applied Automatically
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            The more you buy, the more you save! Discount applies at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact variant for product cards
export function BundleBadge({ discount }: { discount: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-md">
      <Gift className="w-3 h-3" />
      Bundle & Save {discount}%
    </div>
  );
}

