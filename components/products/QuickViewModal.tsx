'use client';

/**
 * Quick View Modal Component
 * Lihat detail produk tanpa pindah halaman
 * Mobile: Slide from bottom
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Heart, Star, Plus, Minus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/hooks/useCurrency';

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
  } | null;
  brand?: string | null;
  rating?: number | null;
  reviewCount?: number;
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string, quantity: number) => Promise<void>;
  onToggleWishlist?: (productId: string) => Promise<void>;
  isWishlisted?: boolean;
}

export function QuickViewModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}: QuickViewModalProps) {
  const { formatPrice } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice!)) / parseFloat(product.price)) * 100)
    : 0;

  const allImages = [
    product.imageUrl,
    ...(product.images || []).filter(img => img && img !== product.imageUrl),
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');

  const handleAddToCart = async () => {
    if (!onAddToCart || product.stock === 0) return;
    setLoading(true);
    try {
      await onAddToCart(product.id, quantity);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!onToggleWishlist) return;
    await onToggleWishlist(product.id);
  };

  const ratingNum = typeof product.rating === 'number' ? product.rating : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div 
          className="bg-white w-full sm:max-w-4xl sm:rounded-2xl overflow-hidden pointer-events-auto scale-in max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-gray-900">Quick View</h2>
            <div className="flex items-center gap-2">
              <Link
                href={`/products/${product.slug}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Full Details"
              >
                <ExternalLink className="w-5 h-5 text-gray-600" />
              </Link>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid sm:grid-cols-2 gap-6 p-4 sm:p-6">
            {/* Left: Images */}
            <div className="space-y-3">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {allImages[selectedImage] ? (
                  <Image
                    src={allImages[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                    -{discountPercentage}%
                  </div>
                )}

                {/* Wishlist */}
                {onToggleWishlist && (
                  <button
                    onClick={handleToggleWishlist}
                    className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all ${
                      isWishlisted
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImage === index
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              {/* Category */}
              {product.category && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                  {product.category.name}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h3>

              {/* Brand */}
              {product.brand && (
                <p className="text-sm text-gray-600">
                  Brand: <span className="font-semibold">{product.brand}</span>
                </p>
              )}

              {/* Rating */}
              {ratingNum > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(ratingNum)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{ratingNum.toFixed(1)}</span>
                  {product.reviewCount && product.reviewCount > 0 && (
                    <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              {product.stock === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 font-semibold">Out of stock</p>
                </div>
              ) : product.stock <= 10 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-600 font-semibold">
                    Only {product.stock} left in stock!
                  </p>
                </div>
              ) : (
                <p className="text-sm text-green-600 font-semibold">✓ In stock</p>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Quantity */}
              {product.stock > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 py-2 text-base font-semibold min-w-[50px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || loading}
                  className="w-full py-3 text-base font-bold"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {loading ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Link
                  href={`/products/${product.slug}`}
                  className="block w-full py-3 text-center border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

