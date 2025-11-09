/**
 * Homepage
 * Landing page untuk E-Commerce platform
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';

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

function HomePageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Get filters from URL params
  const currentFilters = useMemo(() => ({
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || 'newest',
  }), [searchParams]);

  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      
      // Add filters to API request
      if (currentFilters.categoryId) params.append('categoryId', currentFilters.categoryId);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString());
      if (currentFilters.sort) params.append('sort', currentFilters.sort);
      params.append('limit', '1000');

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, [currentFilters]);

  // Filter products based on search query from URL
  const searchQuery = searchParams.get('search') || '';
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((product) =>
      product.name.toLowerCase().includes(query) ||
      product.category?.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // If user is logged in, show customer-focused homepage
  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-4 sm:pb-6 md:pb-8">
          {/* Welcome Section */}
          <div className="mb-8 -mt-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user.firstName || session.user.email}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Discover amazing products and start shopping
            </p>
          </div>

          {/* All Products Section */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ⭐ All Products
              </h2>
            </div>
            
            {/* Search Results Info */}
            {searchQuery && filteredProducts.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Menampilkan {filteredProducts.length} dari {products.length} produk
              </div>
            )}

            {/* No search results */}
            {searchQuery && filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 mb-4">
                <p className="text-gray-600 mb-4">
                  Tidak ada produk yang cocok dengan "{searchQuery}"
                </p>
              </div>
            )}
            
            {loadingProducts && products.length === 0 ? (
              <ProductGridSkeleton count={12} />
            ) : filteredProducts.length > 0 ? (
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
            ) : (
              !loadingProducts && !searchQuery && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No products available</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default landing page for non-logged in users
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-8">
        {/* All Products Section */}
        <div className="-mt-2">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              ⭐ All Products
            </h2>
          </div>
          
          {/* Search Results Info */}
          {searchQuery && filteredProducts.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              Menampilkan {filteredProducts.length} dari {products.length} produk
            </div>
          )}

          {/* No search results */}
          {searchQuery && filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200 mb-4">
              <p className="text-gray-600">
                Tidak ada produk yang cocok dengan "{searchQuery}"
              </p>
            </div>
          )}
          
          {loadingProducts && products.length === 0 ? (
            <ProductGridSkeleton count={12} />
          ) : filteredProducts.length > 0 ? (
            <div className="w-full w-screen -ml-[calc((100vw-100%)/2)] mb-2 sm:mb-6 md:mb-8">
              <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
                <div className="px-2 sm:px-2.5 md:px-3 pb-4">
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
          ) : (
            !loadingProducts && !searchQuery && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No products available</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

