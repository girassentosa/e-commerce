'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Products Listing Page
 * Main page untuk browse semua products dengan filters dan pagination
 */

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';
import { Pagination } from '@/components/ui/Pagination';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';

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

interface Category {
  id: string;
  name: string;
  slug: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          const list =
            (Array.isArray(data?.categories) && data.categories) ||
            (Array.isArray(data?.data) && data.data) ||
            (Array.isArray(data?.results) && data.results) ||
            [];
          setCategories(list);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fallback: derive categories from products if API returns empty
  useEffect(() => {
    if (categories.length === 0 && productsData.products.length > 0) {
      const derived = new Map<string, Category>();
      productsData.products.forEach((product) => {
        if (product.category?.id && product.category?.name) {
          derived.set(product.category.id, {
            id: String(product.category.id),
            name: product.category.name,
            slug: product.category.slug || String(product.category.id),
          });
        }
      });
      if (derived.size > 0) {
        setCategories(Array.from(derived.values()));
      }
    }
  }, [categories.length, productsData.products]);


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
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleCategorySelect = (categoryId?: string) => {
    updateURL({
      ...currentFilters,
      categoryId,
      page: 1,
    });
  };


  // Handle page change
  const handlePageChange = (page: number) => {
    updateURL({ ...currentFilters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Get search query from URL
  const urlSearchQuery = searchParams.get('search') || '';
  
  // Filter products based on search query from URL
  const filteredProducts = useMemo(() => {
    if (!urlSearchQuery.trim()) return productsData.products;
    const query = urlSearchQuery.toLowerCase();
    return productsData.products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category?.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query)
    );
  }, [productsData.products, urlSearchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 sm:px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
              Categories
            </h1>
            <Link
              href="/cart"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
          </div>
        </div>
        <div className="border-t border-gray-200 bg-white overflow-x-auto min-h-[52px]">
          <div className="inline-flex gap-6 sm:gap-8 py-3 min-h-[52px] items-center min-w-full">
            <span className="flex-shrink-0 w-2 sm:w-3"></span>
            <span
              onClick={() => handleCategorySelect(undefined)}
              className={`flex-shrink-0 text-sm sm:text-base cursor-pointer whitespace-nowrap relative pb-1 select-none ${
                !currentFilters.categoryId
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              All
              {!currentFilters.categoryId && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
              )}
            </span>
            {loadingCategories ? (
              <span className="flex-shrink-0 text-xs text-gray-500">Loading...</span>
            ) : categories.length === 0 ? (
              <span className="flex-shrink-0 text-xs text-gray-400">No categories</span>
            ) : (
              categories.map((category) => (
                <span
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`flex-shrink-0 text-sm sm:text-base cursor-pointer whitespace-nowrap relative pb-1 select-none ${
                    currentFilters.categoryId === category.id
                      ? 'text-blue-600 font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  {category.name}
                  {currentFilters.categoryId === category.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                  )}
                </span>
              ))
            )}
            <span className="flex-shrink-0 w-2 sm:w-3"></span>
          </div>
        </div>
      </header>
      <div className="px-1 sm:px-3 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="max-w-[1440px] mx-auto">
          {/* Features Card - Baru Setiap Hari & Gratis Ongkir - Full Width */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl py-3 px-4 mb-6 sm:mb-8">
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

          {/* Products Section - Struktur identik dengan halaman utama */}
          {loading && productsData.products.length === 0 ? (
            <ProductGridSkeleton count={12} />
          ) : (
            <div>
              {/* Search Results Info */}
              {urlSearchQuery && filteredProducts.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  Menampilkan {filteredProducts.length} dari {productsData.products.length} produk
                </div>
              )}

              {/* No search results */}
              {urlSearchQuery && filteredProducts.length === 0 && productsData.products.length > 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
                  <p className="text-gray-600 mb-6">
                    Tidak ada produk yang cocok dengan "{urlSearchQuery}"
                  </p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <>
                  {/* Products Grid */}
                  <div className="mb-6 sm:mb-8 w-screen -ml-[calc((100vw-100%)/2)] sm:w-auto sm:ml-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 sm:gap-2 md:gap-3">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pagination - only show when not searching */}
                  {!urlSearchQuery && productsData.pagination.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={productsData.pagination.page}
                        totalPages={productsData.pagination.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : !loading && !urlSearchQuery ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No products available</p>
                </div>
              ) : null}
            </div>
          )}
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

