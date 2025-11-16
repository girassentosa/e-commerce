'use client';

/**
 * Wishlist Page
 * Display user's saved/favorite products
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Search } from 'lucide-react';

export default function WishlistPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, count, loading, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/wishlist');
    return null;
  }

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  // Empty wishlist state
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <Heart className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
        <p className="text-gray-600 mb-8">
          Save your favorite items to your wishlist and shop them later.
        </p>
        <Link href="/products">
          <Button size="lg">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    setActionLoading(productId);
    await addToCart(productId, 1);
    setActionLoading(null);
  };

  // Handle remove from wishlist
  const handleRemove = async (productId: string) => {
    setActionLoading(productId);
    await removeItem(productId);
    setActionLoading(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Favorite Saya</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:opacity-70 transition-opacity">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <Link href="/cart" className="p-2 hover:opacity-70 transition-opacity">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
          </Link>
          <button className="text-xs text-gray-700 font-medium hover:text-gray-900 transition-colors">
            Ubah
          </button>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2 md:gap-3">
        {items.map((item) => {
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
              className="wishlist-product-card bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow relative group"
            >
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                  <Loader />
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(product.id)}
                disabled={isLoading}
                className="absolute top-2 right-2 z-20 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                title="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>

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
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2 min-h-[2rem] sm:min-h-[3rem]">
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
                  disabled={isLoading || isOutOfStock}
                  className="w-full"
                  size="sm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Shopping Link */}
      <div className="mt-12 mb-0 text-center">
        <Link href="/products">
          <Button variant="outline" size="lg">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

