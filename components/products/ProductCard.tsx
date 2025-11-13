'use client';

/**
 * ProductCard Component - Clean & Attractive Design
 * Redesigned sesuai spec: Rating di atas, social proof, hover zoom, dll
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    images?: string[] | Array<{ imageUrl: string; altText?: string | null }>;
    stock?: number;
    stockQuantity?: number;
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
  const router = useRouter();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  

  // Support both 'stock' and 'stockQuantity' property names
  const stockCount = product.stock ?? product.stockQuantity ?? 0;

  // Calculate discount percentage
  const discountPercentage = product.salePrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  
  // Social proof - sold count (mock data, bisa diganti dengan real data)
  const soldCount = product.reviewCount ? Math.max(product.reviewCount * 3, 10) : Math.floor(Math.random() * 100) + 10;

  const toggleWishlist = async () => {
    if (isWishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (timeSinceLastTap > 0 && timeSinceLastTap < 260) {
      lastTapRef.current = 0;
      void toggleWishlist();
      return;
    }

    lastTapRef.current = now;
    clickTimeoutRef.current = setTimeout(() => {
      router.push(`/products/${product.slug}`);
      lastTapRef.current = 0;
      clickTimeoutRef.current = null;
    }, 260);
  };


  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);

  return (
    <div 
      className="relative bg-white overflow-hidden border-0 rounded-none sm:rounded-xl sm:border sm:border-gray-200"
    >
      {/* Product Link Wrapper */}
      <Link
        href={`/products/${product.slug}`}
        className="block"
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(`/products/${product.slug}`);
          }
        }}
      >
        
        {/* ==================== IMAGE SECTION ==================== */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-none sm:rounded-t-xl">
          {(() => {
            // Extract imageUrl from different formats
            let imageUrl = product.imageUrl;
            if (!imageUrl && product.images && product.images.length > 0) {
              const firstImage = product.images[0];
              imageUrl = typeof firstImage === 'string' 
                ? firstImage 
                : (firstImage as { imageUrl: string }).imageUrl;
            }
            
            const hasValidImage = 
              typeof imageUrl === 'string' && 
              imageUrl.trim() !== '' && 
              !imageError;
            
            return hasValidImage && imageUrl ? (
              <Image
                src={imageUrl as string}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover"
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
          {stockCount > 0 && stockCount <= 10 && (
            <div 
              className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm" 
              style={{ marginTop: hasDiscount ? '32px' : '0' }}
            >
              Only {stockCount} left
            </div>
          )}

          {/* Out of Stock Overlay */}
          {stockCount === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
              <div className="bg-white px-3 py-1.5 rounded shadow-md">
                <span className="text-gray-900 font-semibold text-sm">Out of Stock</span>
              </div>
            </div>
          )}

          {/* No add-to-cart overlay on card per homepage spec */}
        </div>

        {/* ==================== CONTENT SECTION ==================== */}
        <div className="p-4 space-y-2 sm:p-4">
          
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
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem]">
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
