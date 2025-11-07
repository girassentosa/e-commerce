/**
 * Header Component
 * Main header dengan navigation, search, cart, dan user menu
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Heart, 
  Search, 
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ProductFilters } from '@/components/products/ProductFilters';

export default function Header() {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Only show filter on homepage (not on products page or product detail pages)
  const showFilter = pathname === '/';

  // Fetch categories
  useEffect(() => {
    if (showFilter) {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories');
          const data = await response.json();
          if (data.success) {
            setCategories(data.data || []);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };
      fetchCategories();
    }
  }, [showFilter]);

  // Get current filters from URL (works for both homepage and products page)
  const currentFilters = {
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || 'newest',
  };

  // Handle filter change
  const handleFilterChange = (filters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove params
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    // If on homepage, stay on homepage with filters
    // If on products page, update products page with filters
    if (pathname === '/') {
      router.push(`/?${params.toString()}`, { scroll: false });
    } else {
      router.push(`/products?${params.toString()}`, { scroll: false });
    }
    setIsFiltersOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Search Card - Responsive */}
          <Link href="/products" className="flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8">
            <Card padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 sm:gap-3">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 truncate">Cari produk...</span>
              </div>
            </Card>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Filter Button - Only on products page */}
            {showFilter && (
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
                aria-label="Filter products"
              >
                <SlidersHorizontal className="h-6 w-6" />
                {(currentFilters.categoryId || currentFilters.minPrice || currentFilters.maxPrice) && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
            )}

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <Heart className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Filters Dropdown/Modal */}
        {isFiltersOpen && showFilter && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsFiltersOpen(false)}
            />
            {/* Filters Panel */}
            <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-200 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <ProductFilters
                  categories={categories}
                  onFilterChange={handleFilterChange}
                  initialFilters={currentFilters}
                  isOpen={true}
                  onClose={() => setIsFiltersOpen(false)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

