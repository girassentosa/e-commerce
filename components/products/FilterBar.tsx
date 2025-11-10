'use client';

/**
 * FilterBar Component - Top Filter Bar (Sticky)
 * Shopee/Tokopedia style filtering
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Grid3x3, List, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string | null;
  priceRange: string | null;
  minRating: number | null;
  sortBy: string;
  viewMode: 'grid' | 'list';
  onCategoryChange: (categoryId: string | null) => void;
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(event.target as Node)
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

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

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || 'All Categories';
  const selectedPriceLabel = priceRanges.find(p => p.value === priceRange)?.label || 'All Prices';
  const selectedRatingLabel = ratingOptions.find(r => r.value === minRating)?.label || 'All Ratings';
  const selectedSortLabel = sortOptions.find(s => s.value === sortBy)?.label || 'Terbaru';

  return (
    <div className="sticky top-[3.5rem] sm:top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="py-3">
          {/* All Buttons in One Row - Horizontal Scroll on Mobile */}
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex items-center gap-2 min-w-max">
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

              {/* Category Dropdown */}
              <div className="relative flex-shrink-0" ref={(el) => { dropdownRefs.current['category'] = el; }}>
                <button
                  onClick={() => toggleDropdown('category')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border whitespace-nowrap ${
                    selectedCategory
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">📂</span>
                  <span className="max-w-[120px] truncate">{selectedCategoryName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                </button>

              {openDropdown === 'category' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-80 overflow-y-auto z-50">
                  <button
                    onClick={() => {
                      onCategoryChange(null);
                      setOpenDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        onCategoryChange(category.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                        selectedCategory === category.id ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Price Dropdown */}
              <div className="relative flex-shrink-0" ref={(el) => { dropdownRefs.current['price'] = el; }}>
                <button
                  onClick={() => toggleDropdown('price')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border whitespace-nowrap ${
                    priceRange
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="hidden sm:inline">💰</span>
                  <span className="max-w-[120px] truncate">{selectedPriceLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'price' ? 'rotate-180' : ''}`} />
                </button>

              {openDropdown === 'price' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        onPriceRangeChange(range.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                        priceRange === range.value ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Rating Dropdown */}
              <div className="relative flex-shrink-0" ref={(el) => { dropdownRefs.current['rating'] = el; }}>
                <button
                  onClick={() => toggleDropdown('rating')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border whitespace-nowrap ${
                    minRating
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>⭐</span>
                  <span className="hidden sm:inline max-w-[100px] truncate">{selectedRatingLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'rating' ? 'rotate-180' : ''}`} />
                </button>

              {openDropdown === 'rating' && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating.label}
                      onClick={() => {
                        onMinRatingChange(rating.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                        minRating === rating.value ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {rating.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
              {/* Sort Dropdown */}
              <div className="relative flex-shrink-0" ref={(el) => { dropdownRefs.current['sort'] = el; }}>
                <button
                  onClick={() => toggleDropdown('sort')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                >
                  <span className="text-gray-600">Sort:</span>
                  <span className="text-gray-900">{selectedSortLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
                </button>

              {openDropdown === 'sort' && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                        sortBy === option.value ? 'bg-blue-50 text-blue-700 font-medium' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
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

