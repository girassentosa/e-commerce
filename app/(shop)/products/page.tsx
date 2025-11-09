'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Products Listing Page
 * Main page untuk browse semua products dengan filters dan pagination
 */

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';
import { Pagination } from '@/components/ui/Pagination';
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
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2 sm:-mt-4 md:-mt-6">
          {/* Features Card - Baru Setiap Hari & Gratis Ongkir - Full Width */}
          <div className="w-full mb-4 sm:mb-3 md:mb-2 w-screen -ml-[calc((100vw-100%)/2)]">
            <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-y border-red-200 py-2 px-2 sm:px-3 md:px-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
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
                   {/* Products Grid - Full Width Edge-to-Edge */}
                   <div className="w-full w-screen -ml-[calc((100vw-100%)/2)] mb-2 sm:mb-6 md:mb-8">
                     <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
                       <div className="px-2 sm:px-2.5 md:px-3 pb-2 sm:pb-3 md:pb-4">
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
                         {filteredProducts.map((product) => (
                           <ProductCard
                             key={product.id}
                             product={product}
                           />
                         ))}
                         </div>
                       </div>
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

