'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';

function LastViewedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { addItem: addToCart } = useCart();
  const { items, loading } = useLastViewed();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Get search query from URL (managed by Header component)
  const searchQuery = searchParams.get('search') || '';

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
    <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-8">

      {/* Search Results Info */}
      <div className="-mt-2">
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
          <Link
            href="/last-viewed"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Hapus pencarian
          </Link>
        </div>
      )}

      {/* Products Grid */}
      {filteredItems.length > 0 && (
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="px-2 sm:px-2.5 md:px-3 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
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
            </div>
          </div>
        </div>
      )}
      </div>
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

