'use client';

/**
 * FilterSidebar Component - Desktop Sidebar Filters
 * Collapsible sections dengan berbagai filter options
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface FilterSidebarProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategories: string[];
  priceRange: { min: number; max: number };
  maxPrice: number;
  minRating: number | null;
  inStockOnly: boolean;
  onCategoriesChange: (categories: string[]) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onMinRatingChange: (rating: number | null) => void;
  onInStockOnlyChange: (value: boolean) => void;
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export function FilterSidebar({
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
  onResetFilters,
  activeFiltersCount,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['categories', 'price', 'rating'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleCategoryToggle = (categoryId: string) => {
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
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="sticky top-[8.5rem] bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={onResetFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filters Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {/* Categories Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Categories</span>
              {expandedSections.has('categories') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('categories') && (
              <div className="px-4 pb-4 space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('price')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Price Range</span>
              {expandedSections.has('price') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('price') && (
              <div className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Price Display */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      ${priceRange.min}
                    </span>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-600">
                      ${priceRange.max === maxPrice ? `${maxPrice}+` : priceRange.max}
                    </span>
                  </div>

                  {/* Min Price Slider */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
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

                  {/* Max Price Slider */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
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

                  {/* Preset Price Ranges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[
                      { label: 'Under $50', min: 0, max: 50 },
                      { label: '$50-$100', min: 50, max: 100 },
                      { label: '$100-$200', min: 100, max: 200 },
                      { label: 'Over $200', min: 200, max: maxPrice },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => onPriceRangeChange({ min: preset.min, max: preset.max })}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating Section */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('rating')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">Rating</span>
              {expandedSections.has('rating') ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('rating') && (
              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={() => onMinRatingChange(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    minRating === null
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  All Ratings
                </button>
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onMinRatingChange(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      minRating === option.value
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stock Availability */}
          <div className="p-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => onInStockOnlyChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                In Stock Only
              </span>
            </label>
          </div>
        </div>

        {/* Reset Button */}
        {activeFiltersCount > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onResetFilters}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors text-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

