'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Search, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';

function LastViewedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { addItem: addToCart, itemCount } = useCart();
  const { items, loading } = useLastViewed();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Get referrer from query params or default to dashboard
  const fromPage = searchParams?.get('from') || 'dashboard';
  
  // Handle back navigation
  const handleBack = () => {
    if (fromPage === 'activities') {
      router.push('/activities');
    } else {
      router.push('/dashboard');
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/last-viewed');
    return null;
  }

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    setActionLoading(productId);
    await addToCart(productId, 1);
    setActionLoading(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Fixed height container to prevent layout shift */}
      <div className="mb-4">
        <div className="flex items-center min-h-[48px] gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isSearchOpen ? (
              <>
                <button 
                  onClick={handleBack}
                  className="p-1 hover:opacity-70 transition-opacity"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Terakhir Dilihat</h1>
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
                  placeholder="Cari produk yang dilihat..."
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

      {/* Search Results Info */}
      {searchQuery && filteredItems.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Menampilkan {filteredItems.length} dari {items.length} produk yang dilihat
        </div>
      )}

      {/* Empty state - only show when not loading */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-6">
            <Eye className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada produk yang dilihat</h2>
          <p className="text-gray-600 mb-6">
            Produk yang Anda lihat akan muncul di sini
          </p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Jelajahi Produk
            </Button>
          </Link>
        </div>
      )}

      {/* Loading state - non-blocking */}
      {loading && items.length === 0 && (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      )}

      {/* No search results */}
      {searchQuery && filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
          <p className="text-gray-600 mb-6">
            Tidak ada produk yang dilihat yang cocok dengan "{searchQuery}"
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

      {/* Products Grid */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const { product } = item;
            const price = parseFloat(product.salePrice || product.price);
            const originalPrice = product.salePrice ? parseFloat(product.price) : null;
            const imageUrl = product.images[0]?.imageUrl;
            const isLoading = actionLoading === product.id;
            const isOutOfStock = product.stockQuantity === 0;
            const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow relative group"
              >
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                    <Loader />
                  </div>
                )}

                {/* Product Image */}
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-gray-100 overflow-hidden">
                    {imageUrl && imageUrl.trim() !== '' && !imageErrors[product.id] ? (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}

                    {/* Sale Badge */}
                    {product.salePrice && !imageErrors[product.id] && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive">Sale</Badge>
                      </div>
                    )}

                    {/* Stock Badges */}
                    {isOutOfStock && !imageErrors[product.id] && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary">Out of Stock</Badge>
                      </div>
                    )}
                    {isLowStock && !product.salePrice && !imageErrors[product.id] && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="warning">Low Stock</Badge>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2 min-h-[3rem]">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  <div className="mb-3">
                    {originalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-red-600">
                          ${price.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${originalPrice.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ${price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status Text */}
                  {isOutOfStock ? (
                    <p className="text-sm text-red-600 mb-3">Out of stock</p>
                  ) : isLowStock ? (
                    <p className="text-sm text-orange-600 mb-3">
                      Only {product.stockQuantity} left
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 mb-3">In stock</p>
                  )}

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={isOutOfStock || actionLoading === product.id}
                    className="w-full"
                    size="sm"
                  >
                    {actionLoading === product.id ? (
                      <>
                        <Loader size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LastViewedPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    }>
      <LastViewedPageContent />
    </Suspense>
  );
}

