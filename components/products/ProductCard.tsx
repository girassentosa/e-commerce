'use client';

/**
 * ProductCard Component
 * Reusable card untuk menampilkan product
 * Features: Image, title, price, sale badge, rating, quick actions
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: {
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
    rating?: string | number | null;
    reviewCount?: number;
    isFeatured?: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);

  // Calculate discount percentage
  const discountPercentage = product.salePrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id, 1);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Product Link Wrapper */}
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {(() => {
            const imageUrl = product.imageUrl || product.images?.[0];
            const hasValidImage = 
              typeof imageUrl === 'string' && 
              imageUrl.trim() !== '' && 
              !imageError;
            
            return hasValidImage ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-400 text-sm">No Image</span>
              </div>
            );
          })()}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="shadow-md">
                -{discountPercentage}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="default" className="shadow-md bg-yellow-500">
                Featured
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="shadow-md">
                Out of Stock
              </Badge>
            )}
            {product.stock > 0 && product.stock <= 10 && (
              <Badge variant="warning" className="shadow-md bg-orange-500">
                Only {product.stock} left
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick Actions (visible on hover) */}
          <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-white text-gray-900 hover:bg-gray-100 shadow-md"
              size="sm"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
          )}

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => {
                  const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);
                  return (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(ratingNum)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  );
                })}
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${parseFloat(displayPrice).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${parseFloat(product.price).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

