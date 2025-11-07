'use client';

/**
 * ProductFilters Component
 * Sidebar filter untuk products (category, price range, etc)
 */

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface FilterState {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  sort?: string;
}

interface ProductFiltersProps {
  categories: Category[];
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProductFilters({
  categories,
  onFilterChange,
  initialFilters = {},
  isOpen = true,
  onClose,
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    sort: true,
  });

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' },
  ];

  // Price ranges
  const priceRanges = [
    { label: 'Under $50', min: 0, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: '$100 - $200', min: 100, max: 200 },
    { label: '$200 - $500', min: 200, max: 500 },
    { label: 'Over $500', min: 500, max: undefined },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = {
      ...filters,
      categoryId: filters.categoryId === categoryId ? undefined : categoryId,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (min?: number, max?: number) => {
    // Clear previous price filters and set new ones
    const newFilters = {
      ...filters,
      minPrice: min,
      maxPrice: max,
    };
    // If selecting a new range, ensure we clear any existing price filters first
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sort: string) => {
    const newFilters = {
      ...filters,
      sort,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters: FilterState = {};
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof FilterState];
    return value !== undefined && value !== null;
  });

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        ${isOpen ? 'block' : 'hidden lg:block'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Sort */}
        <div>
          <button
            onClick={() => toggleSection('sort')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">Sort By</span>
            {expandedSections.sort ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSections.sort && (
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <label key={option.value} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name="sort"
                    value={option.value}
                    checked={filters.sort === option.value}
                    onChange={() => handleSortChange(option.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div>
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">Category</span>
            {expandedSections.category ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSections.category && (
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.categoryId === category.id}
                    onChange={() => handleCategoryChange(category.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                    {category.name}
                  </span>
                  {category.productCount !== undefined && (
                    <span className="text-xs text-gray-500">({category.productCount})</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="font-medium text-gray-900">Price Range</span>
            {expandedSections.price ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandedSections.price && (
            <div className="space-y-2">
              {priceRanges.map((range, index) => {
                const isActive =
                  filters.minPrice === range.min && filters.maxPrice === range.max;
                return (
                  <label key={index} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="priceRange"
                      checked={isActive}
                      onChange={() => handlePriceRangeChange(range.min, range.max)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      {range.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

