'use client';

/**
 * FilterModal Component - Mobile Filter Modal
 * Full screen modal untuk filter di mobile
 */

import { X } from 'lucide-react';
import { FilterSidebar } from './FilterSidebar';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: Array<{ id: string; name: string }>;
  selectedCategories?: string[];
  priceRange: { min: number; max: number };
  maxPrice: number;
  minRating: number | null;
  inStockOnly: boolean;
  onCategoriesChange?: (categories: string[]) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onMinRatingChange: (rating: number | null) => void;
  onInStockOnlyChange: (value: boolean) => void;
  onResetFilters: () => void;
  onApplyFilters: () => void;
  activeFiltersCount: number;
}

export function FilterModal({
  isOpen,
  onClose,
  ...filterProps
}: FilterModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
        onClick={onClose}
      />

      {/* Modal - Bottom Sheet for Mobile */}
      <div className="fixed inset-0 z-50 lg:hidden flex items-end justify-center p-0">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col bottom-sheet shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Filters
              {filterProps.activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {filterProps.activeFiltersCount}
                </span>
              )}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Reuse FilterSidebar styles */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <MobileFilterContent {...filterProps} />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  filterProps.onResetFilters();
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  filterProps.onApplyFilters();
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// Mobile-optimized filter content
function MobileFilterContent({
  categories,
  selectedCategories,
  priceRange,
  maxPrice,
  minRating,
  inStockOnly,
  onCategoriesChange,
  onPriceRangeChange,
  onMinRatingChange,
  onInStockOnlyChange,
}: Omit<FilterModalProps, 'isOpen' | 'onClose' | 'onApplyFilters' | 'onResetFilters' | 'activeFiltersCount'>) {
  const handleCategoryToggle = (categoryId: string) => {
    if (!onCategoriesChange || !selectedCategories) return;
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter((id) => id !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  const ratingOptions = [
    { label: '⭐⭐⭐⭐⭐ 5 Stars', value: 5 },
    { label: '⭐⭐⭐⭐ 4+ Stars', value: 4 },
    { label: '⭐⭐⭐ 3+ Stars', value: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Categories - Only show if categories provided */}
      {categories && categories.length > 0 && onCategoriesChange && selectedCategories && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">${priceRange.min}</span>
            <span className="text-gray-400">-</span>
            <span className="text-gray-600">
              ${priceRange.max === maxPrice ? `${maxPrice}+` : priceRange.max}
            </span>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Min Price</label>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="10"
              value={priceRange.min}
              onChange={(e) =>
                onPriceRangeChange({
                  ...priceRange,
                  min: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Max Price</label>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="10"
              value={priceRange.max}
              onChange={(e) =>
                onPriceRangeChange({
                  ...priceRange,
                  max: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under $50', min: 0, max: 50 },
              { label: '$50-$100', min: 50, max: 100 },
              { label: '$100-$200', min: 100, max: 200 },
              { label: 'Over $200', min: 200, max: maxPrice },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => onPriceRangeChange({ min: preset.min, max: preset.max })}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
        <div className="space-y-2">
          <button
            onClick={() => onMinRatingChange(null)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              minRating === null
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            All Ratings
          </button>
          {ratingOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onMinRatingChange(option.value)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                minRating === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Availability */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onInStockOnlyChange(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );
}

