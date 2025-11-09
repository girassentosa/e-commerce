/**
 * Header Component
 * Main header dengan navigation, search, cart, dan user menu
 */

'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Search, 
  SlidersHorizontal,
  X,
  ArrowLeft,
  TrendingUp,
  Bell,
  MessageCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { useCart } from '@/contexts/CartContext';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useFavoriteEditMode } from '@/contexts/FavoriteEditModeContext';

export default function Header() {
  const { itemCount } = useCart();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Only show filter on homepage (not on products page or product detail pages)
  const showFilter = pathname === '/';
  const isHomepage = pathname === '/';
  const isTrendingPage = pathname === '/products';
  const isNotificationsPage = pathname === '/notifications';
  const isOrdersPage = pathname === '/orders';
  const isActivitiesPage = pathname === '/activities';
  const isFavoritePage = pathname === '/favorite';
  const isLastViewedPage = pathname === '/last-viewed';
  const isBuyAgainPage = pathname === '/buy-again';
  
  // Edit mode state for favorite page - always use hook (returns default if context not available)
  const favoriteEditMode = useFavoriteEditMode();

  // Initialize search query from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
    // Open search if URL has search param on pages with search functionality
    if (urlSearch && (isHomepage || isTrendingPage || isOrdersPage || isFavoritePage || isLastViewedPage || isBuyAgainPage)) {
      setIsSearchOpen(true);
    } else if (!urlSearch && (isHomepage || isTrendingPage || isOrdersPage || isFavoritePage || isLastViewedPage || isBuyAgainPage)) {
      // Close search if URL doesn't have search param
      setIsSearchOpen(false);
    }
  }, [searchParams, isHomepage, isTrendingPage, isOrdersPage, isFavoritePage, isLastViewedPage, isBuyAgainPage]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isSearchOpen && (isHomepage || isTrendingPage || isOrdersPage || isFavoritePage || isLastViewedPage || isBuyAgainPage) && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen, isHomepage, isTrendingPage, isOrdersPage, isFavoritePage, isLastViewedPage, isBuyAgainPage]);

  // Handle search query change and update URL
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    // Update URL based on current page
    if (isHomepage) {
      router.replace(`/?${params.toString()}`, { scroll: false });
    } else if (isTrendingPage) {
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else if (isOrdersPage) {
      router.replace(`/orders?${params.toString()}`, { scroll: false });
    } else if (isFavoritePage) {
      router.replace(`/favorite?${params.toString()}`, { scroll: false });
    } else if (isLastViewedPage) {
      router.replace(`/last-viewed?${params.toString()}`, { scroll: false });
    } else if (isBuyAgainPage) {
      router.replace(`/buy-again?${params.toString()}`, { scroll: false });
    }
  };

  // Handle search open
  const handleSearchOpen = () => {
    setIsSearchOpen(true);
    // Close edit mode when opening search on favorite page
    if (isFavoritePage) {
      favoriteEditMode.setIsEditMode(false);
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Handle search close
  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    // Update URL based on current page
    if (isHomepage) {
      router.replace(`/?${params.toString()}`, { scroll: false });
    } else if (isTrendingPage) {
      router.replace(`/products?${params.toString()}`, { scroll: false });
    } else if (isOrdersPage) {
      router.replace(`/orders?${params.toString()}`, { scroll: false });
    } else if (isFavoritePage) {
      router.replace(`/favorite?${params.toString()}`, { scroll: false });
    } else if (isLastViewedPage) {
      router.replace(`/last-viewed?${params.toString()}`, { scroll: false });
    } else if (isBuyAgainPage) {
      router.replace(`/buy-again?${params.toString()}`, { scroll: false });
    }
  };
  
  // Handle favorite edit mode toggle
  const handleFavoriteEditToggle = () => {
    if (favoriteEditMode.isEditMode) {
      favoriteEditMode.setIsEditMode(false);
    } else {
      favoriteEditMode.setIsEditMode(true);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Handle orders filter click
  const handleOrdersFilterClick = (filterType: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (filterType === 'status') {
      if (value) {
        params.set('status', value);
      } else {
        params.delete('status');
      }
      params.delete('paymentStatus');
    } else if (filterType === 'paymentStatus') {
      if (value) {
        params.set('paymentStatus', value);
      } else {
        params.delete('paymentStatus');
      }
      params.delete('status');
    } else {
      // Reset all filters
      params.delete('status');
      params.delete('paymentStatus');
    }
    
    router.replace(`/orders${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
  };

  // Get orders filter states from URL
  const urlStatus = searchParams.get('status');
  const urlPaymentStatus = searchParams.get('paymentStatus');
  const isAllActive = !urlStatus && !urlPaymentStatus;
  const isBelumBayarActive = urlPaymentStatus === 'PENDING';
  const isDikemasActive = urlStatus === 'PROCESSING';
  const isDikirimActive = urlStatus === 'SHIPPED';
  const isSelesaiActive = urlStatus === 'DELIVERED';
  const isPengembalianActive = urlStatus === 'REFUNDED';
  const isDibatalkanActive = urlStatus === 'CANCELLED';

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
          {/* Left Section - Page Title or Search Card (homepage) */}
          {isFavoritePage && isSearchOpen ? (
            // Back Button (Favorite Page - Search Open)
            <button
              onClick={handleSearchClose}
              className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : isFavoritePage && !isSearchOpen && !favoriteEditMode.isEditMode ? (
            // Favorite Title (Favorite Page - Search Closed, Not Edit Mode)
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => {
                  const fromPage = searchParams.get('from') || 'dashboard';
                  if (fromPage === 'activities') {
                    router.push('/activities');
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Pembeli</h1>
            </div>
          ) : isFavoritePage && favoriteEditMode.isEditMode ? (
            // Favorite Title (Favorite Page - Edit Mode)
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => {
                  favoriteEditMode.setIsEditMode(false);
                  const fromPage = searchParams.get('from') || 'dashboard';
                  if (fromPage === 'activities') {
                    router.push('/activities');
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Pembeli</h1>
            </div>
          ) : isLastViewedPage && isSearchOpen ? (
            // Back Button (Last Viewed Page - Search Open)
            <button
              onClick={handleSearchClose}
              className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : isLastViewedPage && !isSearchOpen ? (
            // Last Viewed Title (Last Viewed Page - Search Closed)
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => {
                  const fromPage = searchParams.get('from') || 'dashboard';
                  if (fromPage === 'activities') {
                    router.push('/activities');
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Terakhir Dilihat</h1>
            </div>
          ) : isBuyAgainPage && isSearchOpen ? (
            // Back Button (Buy Again Page - Search Open)
            <button
              onClick={handleSearchClose}
              className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : isBuyAgainPage && !isSearchOpen ? (
            // Buy Again Title (Buy Again Page - Search Closed)
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => {
                  const fromPage = searchParams.get('from') || 'dashboard';
                  if (fromPage === 'activities') {
                    router.push('/activities');
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Beli Lagi</h1>
            </div>
          ) : isActivitiesPage ? (
            // Activities Title (Activities Page - ArrowLeft on left, title centered)
            <>
              <button 
                onClick={() => router.push('/dashboard')}
                className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">Aktifitas Saya</h1>
              <div className="w-5 h-5 flex-shrink-0"></div> {/* Spacer untuk balance */}
            </>
          ) : isOrdersPage && isSearchOpen ? (
            // Back Button (Orders Page - Search Open)
            <button
              onClick={handleSearchClose}
              className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : isOrdersPage && !isSearchOpen ? (
            // Orders Title (Orders Page - Search Closed)
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => router.push('/dashboard')}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Pesanan Saya</h1>
            </div>
          ) : isNotificationsPage ? (
            // Notifications Title (Notifications Page - Always visible, no search)
            <div className="flex items-center gap-3 flex-shrink-0">
              <Bell className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Notifikasi</h1>
            </div>
          ) : isTrendingPage && !isSearchOpen ? (
            // Trending Title (Trending Page - Closed)
            <div className="flex items-center gap-3 flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Trending</h1>
            </div>
          ) : isTrendingPage && isSearchOpen ? (
            // Back Button (Trending Page - Open)
            <button
              onClick={handleSearchClose}
              className="p-1 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : isHomepage && isSearchOpen ? (
            // Inline Search Input (Homepage - Open)
            <div className="flex items-center flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8">
              <button
                onClick={handleSearchClose}
                className="p-1 hover:opacity-70 transition-opacity mr-2"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Cari produk..."
                  className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-900 flex-1"
                />
              </div>
              <button
                onClick={handleSearchClose}
                className="ml-2 text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            </div>
          ) : isHomepage ? (
            // Search Card Button (Homepage - Closed)
            <button
              onClick={handleSearchOpen}
              className="flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8 text-left"
            >
              <Card padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600 truncate">Cari produk...</span>
                </div>
              </Card>
            </button>
          ) : (
            // Search Card Link (Other Pages - Redirect to Products)
            <Link href="/products" className="flex-1 max-w-xl mx-2 sm:mx-4 lg:mx-8">
              <Card padding="sm" className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600 truncate">Cari produk...</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Middle Section - Search Input (only when search is open) */}
          {(isTrendingPage || isOrdersPage || isFavoritePage || isLastViewedPage || isBuyAgainPage) && isSearchOpen && (
            <div className="flex items-center flex-1">
              <div className="flex items-center gap-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={
                    isOrdersPage ? "Cari pesanan atau produk..." :
                    isFavoritePage ? "Cari produk favorit..." :
                    isLastViewedPage ? "Cari produk yang dilihat..." :
                    isBuyAgainPage ? "Cari produk yang dibeli..." :
                    "Cari produk..."
                  }
                  className="bg-transparent border-none outline-none text-sm text-gray-900 flex-1"
                />
              </div>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Favorite Page - Search Icon, Cart Icon, and Ubah Button (when search is closed and not edit mode) */}
            {isFavoritePage && !isSearchOpen && !favoriteEditMode.isEditMode && (
              <>
                <button
                  onClick={handleSearchOpen}
                  className="p-2 hover:opacity-70 transition-opacity"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <Link href="/cart" className="relative p-2 hover:opacity-70 transition-opacity">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
                <button 
                  onClick={handleFavoriteEditToggle}
                  className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  Ubah
                </button>
              </>
            )}

            {/* Favorite Page - Selesai Button (when in edit mode) */}
            {isFavoritePage && favoriteEditMode.isEditMode && (
              <button 
                onClick={handleFavoriteEditToggle}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Selesai
              </button>
            )}

            {/* Favorite Page - Cancel Button (when search is open) */}
            {isFavoritePage && isSearchOpen && (
              <button
                onClick={handleSearchClose}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            )}

            {/* Last Viewed Page - Search Icon and Cart Icon (when search is closed) */}
            {isLastViewedPage && !isSearchOpen && (
              <>
                <button
                  onClick={handleSearchOpen}
                  className="p-2 hover:opacity-70 transition-opacity"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <Link href="/cart" className="relative p-2 hover:opacity-70 transition-opacity">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Last Viewed Page - Cancel Button (when search is open) */}
            {isLastViewedPage && isSearchOpen && (
              <button
                onClick={handleSearchClose}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            )}

            {/* Buy Again Page - Search Icon and Cart Icon (when search is closed) */}
            {isBuyAgainPage && !isSearchOpen && (
              <>
                <button
                  onClick={handleSearchOpen}
                  className="p-2 hover:opacity-70 transition-opacity"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <Link href="/cart" className="relative p-2 hover:opacity-70 transition-opacity">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {/* Buy Again Page - Cancel Button (when search is open) */}
            {isBuyAgainPage && isSearchOpen && (
              <button
                onClick={handleSearchClose}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            )}

            {/* Orders Page - Search Icon and Message Icon (when search is closed) */}
            {isOrdersPage && !isSearchOpen && (
              <>
                <button
                  onClick={handleSearchOpen}
                  className="p-2 hover:opacity-70 transition-opacity"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:opacity-70 transition-opacity">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {/* Orders Page - Cancel Button (when search is open) */}
            {isOrdersPage && isSearchOpen && (
              <button
                onClick={handleSearchClose}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            )}

            {/* Notifications Page - Cart Icon and Message Icon */}
            {isNotificationsPage && (
              <>
                {/* Cart Icon */}
                <Link
                  href="/cart"
                  className="relative p-2 hover:opacity-70 transition-opacity"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
                {/* Message Icon */}
                <button className="p-2 hover:opacity-70 transition-opacity">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}

            {/* Trending Page - Search Icon Button (when search is closed) */}
            {isTrendingPage && !isSearchOpen && (
              <button
                onClick={handleSearchOpen}
                className="p-2 hover:opacity-70 transition-opacity"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {/* Trending Page - Cancel Button (when search is open) */}
            {isTrendingPage && isSearchOpen && (
              <button
                onClick={handleSearchClose}
                className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
              >
                Batalkan
              </button>
            )}

            {/* Homepage - Filter Button (hide when search is open) */}
            {showFilter && !isSearchOpen && (
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

            {/* Cart Icon (for homepage and trending page) */}
            {!isNotificationsPage && !isOrdersPage && !isActivitiesPage && !isFavoritePage && !isLastViewedPage && !isBuyAgainPage && (
              <Link
                href="/cart"
                className="relative p-2 hover:opacity-70 transition-opacity"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Orders Filter Buttons - Second Row (only on orders page when search is closed) */}
        {isOrdersPage && !isSearchOpen && (
          <div className="-mt-2">
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-1">
                <button
                  onClick={() => handleOrdersFilterClick('all')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isAllActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Total Order
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('paymentStatus', 'PENDING')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isBelumBayarActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Belum Bayar
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('status', 'PROCESSING')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isDikemasActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Dikemas
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('status', 'SHIPPED')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isDikirimActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Dikirim
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('status', 'DELIVERED')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isSelesaiActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Selesai
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('status', 'REFUNDED')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isPengembalianActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Pengembalian
                </button>
                <button
                  onClick={() => handleOrdersFilterClick('status', 'CANCELLED')}
                  className={`px-4 py-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-in-out border-b-2 ${
                    isDibatalkanActive
                      ? 'text-gray-900 border-red-500'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
                  }`}
                >
                  Dibatalkan
                </button>
              </div>
            </div>
          </div>
        )}

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

