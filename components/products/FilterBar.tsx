'use client';

/**
 * FilterBar Component - Top Filter Bar (Sticky)
 * Shopee/Tokopedia style filtering
 */

import { ChevronDown, Grid3x3, List, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  categories?: Array<{ id: string; name: string }>;
  selectedCategory?: string | null;
  priceRange: string | null;
  minRating: number | null;
  sortBy: string;
  viewMode: 'grid' | 'list';
  onCategoryChange?: (categoryId: string | null) => void;
  onPriceRangeChange: (range: string | null) => void;
  onMinRatingChange: (rating: number | null) => void;
  onSortChange: (sort: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onOpenMobileFilters?: () => void;
  activeFiltersCount: number;
}

export function FilterBar({
  categories,
  selectedCategory,
  priceRange,
  minRating,
  sortBy,
  viewMode,
  onCategoryChange,
  onPriceRangeChange,
  onMinRatingChange,
  onSortChange,
  onViewModeChange,
  onOpenMobileFilters,
  activeFiltersCount,
}: FilterBarProps) {

  const priceRanges = [
    { label: 'All Prices', value: null },
    { label: 'Under $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: '$100 - $200', value: '100-200' },
    { label: '$200 - $500', value: '200-500' },
    { label: 'Over $500', value: '500-9999' },
  ];

  const ratingOptions = [
    { label: 'All Ratings', value: null },
    { label: '⭐ 4+ Stars', value: 4 },
    { label: '⭐ 4.5+ Stars', value: 4.5 },
    { label: '⭐ 5 Stars', value: 5 },
  ];

  const sortOptions = [
    { label: 'Terbaru', value: 'newest' },
    { label: 'Termurah', value: 'price-low' },
    { label: 'Termahal', value: 'price-high' },
    { label: 'Terpopuler', value: 'popular' },
  ];

  const selectedPriceLabel = priceRanges.find(p => p.value === priceRange)?.label || 'All Prices';
  const selectedRatingLabel = ratingOptions.find(r => r.value === minRating)?.label || 'All Ratings';
  const selectedSortLabel = sortOptions.find(s => s.value === sortBy)?.label || 'Terbaru';

  return (
    <div className="sticky top-[3.5rem] sm:top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-1 sm:px-3">
        <div className="py-3">
          {/* All Filters in One Row - Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max px-2 sm:px-3">
              {/* Mobile Filter Button */}
              <button
                onClick={onOpenMobileFilters}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium relative flex-shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Category Select - Removed since categories page exists */}

              {/* Price Select */}
              <div className="relative flex-shrink-0">
                <select
                  value={priceRange || ''}
                  onChange={(e) => onPriceRangeChange(e.target.value || null)}
                  className={`px-4 py-2 pr-8 rounded-lg transition-colors text-sm font-medium border appearance-none cursor-pointer ${
                    priceRange
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.value || ''}>
                      {range.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {/* Rating Select */}
              <div className="relative flex-shrink-0">
                <select
                  value={minRating || ''}
                  onChange={(e) => onMinRatingChange(e.target.value ? Number(e.target.value) : null)}
                  className={`px-4 py-2 pr-8 rounded-lg transition-colors text-sm font-medium border appearance-none cursor-pointer ${
                    minRating
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ratingOptions.map((rating) => (
                    <option key={rating.label} value={rating.value || ''}>
                      {rating.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
              {/* Sort Select */}
              <div className="relative flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="px-4 py-2 pr-8 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors text-sm font-medium appearance-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

