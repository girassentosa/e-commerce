'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Heart, ShoppingCart, Search, ArrowLeft } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { useFavoriteEditMode, FavoriteEditModeProvider } from '@/contexts/FavoriteEditModeContext';

function FavoritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { items, loading, removeItem } = useWishlist();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  
  // Get search query from URL (managed by Header component)
  const searchQuery = searchParams.get('search') || '';
  
  // Get edit mode from context - MUST be called before any early returns
  const { isEditMode, setIsEditMode } = useFavoriteEditMode();
  
  // Reset selected items when edit mode changes - MUST be called before any early returns
  useEffect(() => {
    if (!isEditMode) {
      setSelectedItems([]);
    }
  }, [isEditMode]);

  // Sync search input with URL query
  useEffect(() => {
    setSearchInputValue(searchQuery);
  }, [searchQuery]);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/favorite');
    return null;
  }

  // Loading state - non-blocking, show content immediately
  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  // Handle remove from wishlist
  const handleRemove = async (productId: string) => {
    setActionLoading(productId);
    await removeItem(productId);
    setActionLoading(null);
  };

  // Handle remove multiple items
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    
    setActionLoading('bulk');
    try {
      // Remove items one by one
      for (const productId of selectedItems) {
        await removeItem(productId);
      }
      setSelectedItems([]);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error removing items:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      // Deselect all
      setSelectedItems([]);
    } else {
      // Select all
      const allProductIds = filteredItems.map(item => item.product.id);
      setSelectedItems(allProductIds);
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(query) ||
      item.product.category?.name.toLowerCase().includes(query)
    );
  });

  // Handle back button
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  // Handle search icon click - show search card
  const handleSearchClick = () => {
    setShowSearchCard(true);
    setSearchInputValue(searchQuery);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      router.push(`/favorite?search=${encodeURIComponent(searchInputValue.trim())}`);
    } else {
      router.push('/favorite');
    }
    setShowSearchCard(false);
  };

  // Handle cancel search
  const handleCancelSearch = () => {
    setShowSearchCard(false);
    setSearchInputValue('');
    router.push('/favorite');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Konsisten dengan halaman lainnya */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 sm:px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            {/* Search Card - Full Width, Muncul dari Kiri */}
            {showSearchCard ? (
              <div className="flex items-center h-14 sm:h-16 gap-3">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={searchInputValue}
                    onChange={(e) => setSearchInputValue(e.target.value)}
                    placeholder="Cari produk favorit..."
                    autoFocus
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    style={{
                      WebkitTextFillColor: '#111827', // Explicit color for iOS
                      color: '#111827', // Explicit color for iOS
                    }}
                  />
                </form>
                <button
                  onClick={handleCancelSearch}
                  className="text-sm sm:text-base text-gray-700 font-medium px-2 py-1"
                >
                  Batalkan
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between h-14 sm:h-16">
                <button
                  onClick={handleBack}
                  className="p-2 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                  Favorite Saya
                </h1>
                <button
                  onClick={handleSearchClick}
                  className="p-2 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-1 sm:px-3 md:px-4 pt-4 pb-8">

      {/* Search Results Info */}
      <div className="-mt-2">
        {searchQuery && filteredItems.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Menampilkan {filteredItems.length} dari {items.length} produk favorit
        </div>
      )}

      {/* Empty wishlist state */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-6">
            <Heart className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada produk favorit</h2>
          <p className="text-gray-600 mb-6">
            Simpan produk favorit Anda untuk dibeli nanti
          </p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Jelajahi Produk
            </Button>
          </Link>
        </div>
      )}

      {/* No search results */}
      {searchQuery && filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
          <p className="text-gray-600 mb-6">
            Tidak ada produk favorit yang cocok dengan "{searchQuery}"
          </p>
          <Link
            href="/favorite"
            className="text-indigo-600 font-medium"
          >
            Hapus pencarian
          </Link>
        </div>
      )}

      {/* Wishlist Grid */}
      {filteredItems.length > 0 && (
        <div className="pb-4 w-screen -ml-[calc((100vw-100%)/2)] sm:w-auto sm:ml-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 sm:gap-2 md:gap-3">
                {filteredItems.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item.product}
                  />
                ))}
          </div>
        </div>
      )}

      {/* Edit Mode Footer */}
      {isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-red-600 border-gray-300 rounded cursor-pointer"
                    style={{
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                    onFocus={(e) => e.target.blur()}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Dipilih
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedItems.length}/50
                  </span>
                </div>
              </div>
              <div className={`px-4 py-2 bg-gray-50 rounded-lg border ${
                selectedItems.length > 0
                  ? 'border-red-600'
                  : 'border-gray-200'
              }`}>
                <button
                  onClick={handleRemoveSelected}
                  disabled={selectedItems.length === 0 || actionLoading === 'bulk'}
                  className={`text-sm font-medium ${
                    selectedItems.length > 0
                      ? 'text-red-600 cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {actionLoading === 'bulk' ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" />
                      Menghapus...
                    </span>
                  ) : (
                    'Hapus'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for footer */}
      {isEditMode && <div className="h-20"></div>}
      </div>
      </div>
    </div>
  );
}

export default function FavoritePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    }>
      <FavoriteEditModeProvider>
        <FavoritePageContent />
      </FavoriteEditModeProvider>
    </Suspense>
  );
}

