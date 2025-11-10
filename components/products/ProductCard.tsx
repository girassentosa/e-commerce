'use client';

/**
 * ProductCard Component - Clean & Attractive Design
 * Redesigned sesuai spec: Rating di atas, social proof, hover zoom, dll
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Flame } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);

  // Calculate discount percentage
  const discountPercentage = product.salePrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  
  // Social proof - sold count (mock data, bisa diganti dengan real data)
  const soldCount = product.reviewCount ? Math.max(product.reviewCount * 3, 10) : Math.floor(Math.random() * 100) + 10;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0) {
      await addToCart(product.id, 1);
    }
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

  const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);

  return (
    <div 
      className="group relative bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-[1.02] hover:shadow-md transition-all duration-200 p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Link Wrapper */}
      <Link href={`/products/${product.slug}`} className="block">
        
        {/* ==================== IMAGE SECTION ==================== */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg mb-3">
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
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-1" />
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              </div>
            );
          })()}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
              -{discountPercentage}%
            </div>
          )}

          {/* Low Stock Badge */}
          {product.stock > 0 && product.stock <= 10 && (
            <div 
              className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm" 
              style={{ marginTop: hasDiscount ? '32px' : '0' }}
            >
              Only {product.stock} left
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
              <div className="bg-white px-3 py-1.5 rounded shadow-md">
                <span className="text-gray-900 font-semibold text-sm">Out of Stock</span>
              </div>
            </div>
          )}

          {/* Wishlist Button - Always Visible */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 z-10 p-2 rounded-full shadow-md transition-all ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Add to Cart Button - Hover Overlay (Optional, bisa dihapus kalau mau di bawah aja) */}
          <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-200 ${
            isHovered && product.stock > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-white text-gray-900 hover:bg-blue-600 hover:text-white font-semibold py-2 text-xs transition-colors shadow-md"
              size="sm"
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* ==================== CONTENT SECTION ==================== */}
        <div className="space-y-2">
          
          {/* Rating & Review Count - DI ATAS NAMA */}
          {ratingNum > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(ratingNum)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 fill-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                ({ratingNum.toFixed(1)})
              </span>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-gray-500">
                  {product.reviewCount} reviews
                </span>
              )}
            </div>
          )}

          {/* Product Name - Max 2 Lines */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Short Description - Optional */}
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-1 leading-tight">
              {product.description}
            </p>
          )}

          {/* Price Display */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-bold text-blue-600">
              ${parseFloat(displayPrice).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ${parseFloat(product.price).toFixed(2)}
              </span>
            )}
          </div>

          {/* Social Proof - 🔥 Sold Count */}
          {soldCount > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-medium">
                {soldCount}+ sold
              </span>
            </div>
          )}

        </div>
      </Link>

      {/* ==================== BUTTONS SECTION (Alternative: di bawah card) ==================== */}
      {/* Uncomment jika mau Add to Cart button selalu visible di bawah, bukan overlay */}
      {/* 
      <div className="mt-3 pt-3 border-t border-gray-100">
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2 text-sm transition-colors"
          size="sm"
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" />
          Add to Cart
        </Button>
      </div>
      */}
    </div>
  );
}
