/**
 * Homepage - E-Commerce Customer Page
 * Clean & Minimalist Design with Advanced Filtering
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';
import { FilterBar } from '@/components/products/FilterBar';
import { FilterSidebar } from '@/components/products/FilterSidebar';
import { FilterModal } from '@/components/products/FilterModal';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Users,
  Package,
  Shirt,
  Laptop,
  Home as HomeIcon,
  Smartphone,
  Watch,
  Scissors,
  ChevronRight,
  Star,
  ArrowRight
} from 'lucide-react';

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 999999 });
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Calculate max price from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    const prices = products.map(p => parseFloat(p.salePrice || p.price));
    const max = Math.max(...prices);
    return Math.ceil(max / 100) * 100; // Round up to nearest 100
  }, [products]);

  // Initialize price range when products load
  useEffect(() => {
    if (products.length > 0 && priceRange.max === 999999) {
      setPriceRange({ min: 0, max: maxPrice });
    }
  }, [maxPrice, products.length, priceRange.max]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          // API returns { success: true, data: [...], pagination: {...} }
          const productsList = data.data || data.products || [];
          console.log('Fetched products:', productsList.length); // Debug log
          setProducts(productsList);
        } else {
          console.error('Failed to fetch products:', res.status);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category (top bar single selection)
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category?.id === selectedCategory);
    }

    // Filter by categories (sidebar multiple selection)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => 
        p.category && selectedCategories.includes(p.category.id)
      );
    }

    // Filter by price range (only if price range is set and not default)
    if (priceRange.max < 999999) {
      filtered = filtered.filter(p => {
        const price = parseFloat(p.salePrice || p.price);
        return price >= priceRange.min && price <= priceRange.max;
      });
    }

    // Filter by rating
    if (minRating !== null) {
      filtered = filtered.filter(p => {
        const rating = typeof p.rating === 'number' ? p.rating : parseFloat(String(p.rating || 0));
        return rating >= minRating;
      });
    }

    // Filter by stock
    if (inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => 
          parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price)
        );
        break;
      case 'price-high':
        filtered.sort((a, b) => 
          parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price)
        );
        break;
      case 'popular':
        filtered.sort((a, b) => {
          const aRating = a.rating ? parseFloat(String(a.rating)) : 0;
          const bRating = b.rating ? parseFloat(String(b.rating)) : 0;
          const aReviews = a.reviewCount || 0;
          const bReviews = b.reviewCount || 0;
          return (bRating * bReviews) - (aRating * aReviews);
        });
        break;
      case 'newest':
      default:
        // Already in newest order from API
        break;
    }

    return filtered;
  }, [products, selectedCategory, selectedCategories, priceRange, minRating, sortBy, inStockOnly]);

  // Get featured product (first product with image and stock)
  const featuredProduct = products.find(p => p.imageUrl && p.stock > 0) || products[0];

  // Get flash deals (products with salePrice)
  const flashDeals = products
    .filter(p => p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price))
    .slice(0, 6);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (priceRange.min > 0 || priceRange.max < maxPrice) count++;
    if (minRating !== null) count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedCategory, selectedCategories, priceRange, minRating, inStockOnly, maxPrice]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: maxPrice });
    setMinRating(null);
    setInStockOnly(false);
  };

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('fashion') || name.includes('cloth')) return Shirt;
    if (name.includes('electronic') || name.includes('laptop')) return Laptop;
    if (name.includes('home') || name.includes('furniture')) return HomeIcon;
    if (name.includes('phone') || name.includes('mobile')) return Smartphone;
    if (name.includes('watch') || name.includes('accessori')) return Watch;
    if (name.includes('beauty') || name.includes('health')) return Scissors;
    return Package;
  };

  const showFilters = products.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-6 py-6 sm:py-8">
        
        {/* ========================================
            1. HERO BANNER - MINIMALIST
        ======================================== */}
        {featuredProduct && (
          <div className="bg-white rounded-2xl overflow-hidden mb-8 border border-gray-200">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left: Product Image */}
              <div className="relative aspect-square md:aspect-[4/3] bg-gray-50">
                <Image
                  src={featuredProduct.imageUrl || '/images/placeholder.jpg'}
                  alt={featuredProduct.name}
                  fill
                  className="object-cover"
                  priority
                />
                {featuredProduct.salePrice && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold text-sm">
                    {Math.round(((parseFloat(featuredProduct.price) - parseFloat(featuredProduct.salePrice)) / parseFloat(featuredProduct.price)) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-block mb-3">
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    FEATURED PRODUCT
                  </span>
          </div>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                  {featuredProduct.name}
                </h1>
                
                {featuredProduct.description && (
                  <p className="text-gray-600 mb-6 text-sm sm:text-base line-clamp-2">
                    {featuredProduct.description}
                  </p>
                )}

                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-blue-600">
                    ${parseFloat(featuredProduct.salePrice || featuredProduct.price).toFixed(2)}
                  </span>
                  {featuredProduct.salePrice && (
                    <span className="text-lg text-gray-400 line-through">
                      ${parseFloat(featuredProduct.price).toFixed(2)}
                    </span>
                  )}
            </div>
            
                {featuredProduct.rating && (
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(featuredProduct.rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {featuredProduct.rating} {featuredProduct.reviewCount && `(${featuredProduct.reviewCount} reviews)`}
                    </span>
              </div>
            )}

                <Link
                  href={`/products/${featuredProduct.slug}`}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base"
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
              </div>
            )}
            
        {/* ========================================
            2. TRUST INDICATORS
        ======================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Free Shipping</p>
              <p className="text-xs text-gray-500">On all orders</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">100% Original</p>
              <p className="text-xs text-gray-500">Guaranteed</p>
                    </div>
                  </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">14 Days Return</p>
              <p className="text-xs text-gray-500">Easy process</p>
                </div>
              </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-purple-600" />
                </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">10,000+ Customers</p>
              <p className="text-xs text-gray-500">Trusted by many</p>
          </div>
        </div>
      </div>

        {/* ========================================
            3. CATEGORIES SECTION
        ======================================== */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shop by Category</h2>
              <Link 
                href="/products" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                See All <ChevronRight className="w-4 h-4" />
              </Link>
          </div>
          
            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
              <div className="flex lg:grid lg:grid-cols-6 xl:grid-cols-8 gap-4 pb-2">
                {categories.slice(0, 12).map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex-shrink-0 w-24 sm:w-28 lg:w-auto"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center line-clamp-2 leading-tight">
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          )}

        {/* ========================================
            4. FLASH DEALS SECTION
        ======================================== */}
        {flashDeals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Flash Deals
            </h2>

            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
              <div className="flex gap-4 pb-2">
                {flashDeals.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-48 sm:w-56">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================
          5. FILTER BAR (STICKY)
      ======================================== */}
      {showFilters && (
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          priceRange={selectedCategory ? null : (priceRange.min > 0 || priceRange.max < maxPrice ? `${priceRange.min}-${priceRange.max}` : null)}
          minRating={minRating}
          sortBy={sortBy}
          viewMode={viewMode}
          onCategoryChange={setSelectedCategory}
          onPriceRangeChange={(range) => {
            if (!range) {
              setPriceRange({ min: 0, max: maxPrice });
            } else {
              const [min, max] = range.split('-').map(Number);
              setPriceRange({ min, max });
            }
          }}
          onMinRatingChange={setMinRating}
          onSortChange={setSortBy}
          onViewModeChange={setViewMode}
          onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />
      )}

      {/* ========================================
          6. ALL PRODUCTS WITH SIDEBAR
      ======================================== */}
      <div className="max-w-[1440px] mx-auto px-6 pb-8">
        <div className="flex gap-6">
          {/* Sidebar Filters (Desktop Only) */}
          {showFilters && (
            <FilterSidebar
              categories={categories}
              selectedCategories={selectedCategories}
              priceRange={priceRange}
              maxPrice={maxPrice}
              minRating={minRating}
              inStockOnly={inStockOnly}
              onCategoriesChange={setSelectedCategories}
              onPriceRangeChange={setPriceRange}
              onMinRatingChange={setMinRating}
              onInStockOnlyChange={setInStockOnly}
              onResetFilters={handleResetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          )}

          {/* Products Grid - Always Show */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                All Products
              </h2>
              {!loadingProducts && (
                <span className="text-sm text-gray-500">
                  {filteredAndSortedProducts.length} products
                </span>
              )}
            </div>

            {loadingProducts ? (
              <ProductGridSkeleton count={12} />
            ) : filteredAndSortedProducts.length > 0 ? (
              <div className={`grid ${
                viewMode === 'grid'
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1'
              } gap-x-4 gap-y-6`}>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {products.length === 0 
                    ? 'No products available yet. Check back soon!'
                    : 'Try adjusting your filters'
                  }
                </p>
                {products.length > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <FilterModal
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          categories={categories}
          selectedCategories={selectedCategories}
          priceRange={priceRange}
          maxPrice={maxPrice}
          minRating={minRating}
          inStockOnly={inStockOnly}
          onCategoriesChange={setSelectedCategories}
          onPriceRangeChange={setPriceRange}
          onMinRatingChange={setMinRating}
          onInStockOnlyChange={setInStockOnly}
          onResetFilters={handleResetFilters}
          onApplyFilters={() => {}}
          activeFiltersCount={activeFiltersCount}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
