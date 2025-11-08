'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Products Listing Page
 * Main page untuk browse semua products dengan filters dan pagination
 */

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Check, Search, ShoppingCart, ArrowLeft } from 'lucide-react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import { Loader } from '@/components/ui/Loader';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  salePrice?: string | null;
  imageUrl?: string | null;
  images?: string[];
  stock: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: string | null;
  rating?: number | null;
  reviewCount?: number;
  isFeatured?: boolean;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsData {
  products: Product[];
  pagination: PaginationMeta;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itemCount } = useCart();

  // Single state object for products and pagination - ensures all updates happen together
  const [productsData, setProductsData] = useState<ProductsData>({
    products: [],
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Get filters from URL params (memoized to prevent infinite loops)
  const currentFilters = useMemo(() => ({
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  }), [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (currentFilters.categoryId) params.append('categoryId', currentFilters.categoryId);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString());
      if (currentFilters.sort) params.append('sort', currentFilters.sort);
      params.append('page', currentFilters.page.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // Update ALL state in a SINGLE update to ensure everything appears together
        // Using single state object ensures all elements update simultaneously
        setProductsData({
          products: data.data || [],
          pagination: data.pagination || {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0,
          },
        });
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);


  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update URL with filters
  const updateURL = (newFilters: any) => {
    const params = new URLSearchParams();
    
    Object.keys(newFilters).forEach((key) => {
      const value = newFilters[key];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    updateURL({ ...currentFilters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsData.products;
    const query = searchQuery.toLowerCase();
    return productsData.products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category?.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query)
    );
  }, [productsData.products, searchQuery]);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Fixed height container to prevent layout shift */}
        <div className="mb-2">
          <div className="flex items-center min-h-[56px] gap-3">
            {/* Left Section */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {!isSearchOpen ? (
                <>
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                  <h1 className="text-3xl font-bold text-gray-900">Trending</h1>
                </>
              ) : (
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:opacity-70 transition-opacity"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Middle Section - Search Input (only when search is open) */}
            {isSearchOpen && (
              <div className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                  <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari produk..."
                    className="bg-transparent border-none outline-none text-sm text-gray-900 flex-1"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              {!isSearchOpen ? (
                <>
                  <button
                    onClick={() => setIsSearchOpen(true)}
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
              ) : (
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Features Card */}
        <div className="mb-8 w-screen -ml-[calc((100vw-100%)/2)] bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-black rounded-full bg-black flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-red-700 italic">Baru Setiap Hari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-black rounded-full bg-black flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs sm:text-sm text-red-700 italic">Gratis Ongkir</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8">
          {/* Products Grid */}
          <main className="w-full">
            {loading && productsData.products.length === 0 ? (
              <ProductGridSkeleton count={12} />
            ) : (
              <>
                {/* Search Results Info */}
                {searchQuery && filteredProducts.length > 0 && (
                  <div className="mb-4 text-sm text-gray-600">
                    Menampilkan {filteredProducts.length} dari {productsData.products.length} produk
                  </div>
                )}

                {/* No search results */}
                {searchQuery && filteredProducts.length === 0 && productsData.products.length > 0 && (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
                    <p className="text-gray-600 mb-6">
                      Tidak ada produk yang cocok dengan "{searchQuery}"
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Hapus pencarian
                    </button>
                  </div>
                )}

                {/* Products */}
                {filteredProducts.length > 0 ? (
                  <>
                    <ProductGrid
                      products={filteredProducts}
                      columns={3}
                    />

                    {/* Pagination - only show when not searching */}
                    {!searchQuery && productsData.pagination.totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={productsData.pagination.page}
                          totalPages={productsData.pagination.totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  !loading && !searchQuery && (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-600">No products available</p>
                    </div>
                  )
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}

