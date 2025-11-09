'use client';

/**
 * Product Detail Page
 * Detail page untuk single product dengan card style konsisten
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Search,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { useSession } from 'next-auth/react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  salePrice: string | null;
  imageUrl: string | null;
  images: string[];
  stock: number;
  sku: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: string | null;
  rating: string | number | null;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  specifications: any;
  createdAt: string;
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const { addItem: addToCart, itemCount } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { refreshLastViewed } = useLastViewed();
  const { data: session } = useSession();
  const slug = params?.slug || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [photoCardWidth, setPhotoCardWidth] = useState<number | null>(null);
  const photoCardRef = useRef<HTMLDivElement>(null);
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const fetchProduct = async () => {
    if (!slug) return;
    
    try {
      // Fetch product by slug using dedicated API endpoint
      const response = await fetch(`/api/products/slug/${slug}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProduct(data.data);
        
        // Track product view and refresh context
        if (session?.user?.id) {
          fetch('/api/last-viewed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: data.data.id }),
          })
            .then(() => {
              // Refresh last viewed context after tracking
              refreshLastViewed();
            })
            .catch((err) => console.error('Failed to track product view:', err));
        }
      } else {
        showToast('Product not found', 'error');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product', 'error');
      router.push('/products');
    }
  };

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug, session?.user?.id]);

  // Measure photo card width and apply to details container
  // Measure only once after product loads to prevent animation
  useEffect(() => {
    if (!photoCardRef.current || !product || photoCardWidth !== null) return;

    const measureWidth = () => {
      if (photoCardRef.current) {
        // Measure width after image loads
        const width = photoCardRef.current.offsetWidth;
        if (width > 0) {
          // Set width only once to prevent re-renders and animation
          setPhotoCardWidth(width);
        }
      }
    };

    // Measure immediately if element is ready
    if (photoCardRef.current.offsetWidth > 0) {
      measureWidth();
    } else {
      // Wait for image to load
      const img = photoCardRef.current.querySelector('img');
      if (img) {
        if (img.complete) {
          measureWidth();
        } else {
          img.onload = measureWidth;
        }
      } else {
        // Fallback: measure after a short delay
        setTimeout(measureWidth, 100);
      }
    }

    // Update on window resize (only after initial measurement)
    const handleResize = () => {
      if (photoCardRef.current && photoCardWidth !== null) {
        const newWidth = photoCardRef.current.offsetWidth;
        if (newWidth > 0 && newWidth !== photoCardWidth) {
          setPhotoCardWidth(newWidth);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [product, photoCardWidth]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    setActionLoading(true);
    try {
      await addToCart(product.id, quantity);
      showToast('Added to cart', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const isWishlisted = isInWishlist(product.id);
    if (isWishlisted) {
      await removeFromWishlist(product.id);
      showToast('Removed from wishlist', 'success');
    } else {
      await addToWishlist(product.id);
      showToast('Added to wishlist', 'success');
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (!product) {
    return null;
  }

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && product.price && parseFloat(product.salePrice) < parseFloat(product.price);
  const discountPercentage = hasDiscount && product.price && product.salePrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  // Combine imageUrl and images array, removing duplicates
  // Filter out imageUrl from images array to prevent duplicate thumbnails
  const allImages = product ? [
    product.imageUrl,
    ...(product.images || []).filter(img => img && img !== product.imageUrl),
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '') : [];

  // Navigate to previous image
  const goToPreviousImage = () => {
    if (allImages.length > 0) {
      setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    }
  };

  // Navigate to next image
  const goToNextImage = () => {
    if (allImages.length > 0) {
      setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    }
  };

  const price = parseFloat(displayPrice);
  const originalPrice = product.salePrice ? parseFloat(product.price) : null;
  const imageUrl = allImages[selectedImage] || allImages[0];
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isWishlisted = isInWishlist(product.id);

  return (
    <div>
      {/* Header - Konsisten dengan favorite/last-viewed */}
      <div className="flex items-center justify-between mb-3 relative -mt-2">
        <div className="flex items-center gap-2 flex-shrink-0">
          <button 
            onClick={() => router.back()}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{product.name}</h1>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/cart" className="relative p-2 hover:opacity-70 transition-opacity">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Product Card - Style konsisten dengan favorite/last-viewed */}
      {/* Card wrapper - Centered, lebar dibatasi untuk desktop agar proporsional */}
      <div className="flex justify-center items-start mb-0 w-full">
        <div 
          ref={cardWrapperRef}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg w-full max-w-full md:max-w-[600px] lg:max-w-[700px]"
          style={photoCardWidth ? { 
            width: `${photoCardWidth}px`,
            maxWidth: `${photoCardWidth}px`,
            minWidth: `${photoCardWidth}px`,
            // Nonaktifkan semua transisi untuk mencegah animasi
            transition: 'none',
            animation: 'none'
          } : undefined}
        >
        {/* Product Image - Referensi lebar untuk container detail */}
        {/* Lebar card foto dibatasi untuk desktop agar proporsional dan tidak terlalu lebar */}
        <div 
          ref={photoCardRef}
          className="relative aspect-square md:aspect-[4/3] max-h-[300px] md:max-h-[350px] bg-gray-100 overflow-hidden w-full"
          style={{
            maxWidth: '100%'
          }}
        >
          {imageUrl && imageUrl.trim() !== '' && !imageErrors[product.id] ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
              onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Sale Badge */}
          {hasDiscount && !imageErrors[product.id] && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive">-{discountPercentage}% OFF</Badge>
            </div>
          )}

          {/* Stock Badges */}
          {isOutOfStock && !imageErrors[product.id] && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
          {isLowStock && !hasDiscount && !imageErrors[product.id] && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning">Low Stock</Badge>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Heart className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Navigation Arrows - Only show if there are multiple images */}
          {allImages.length > 1 && (
            <>
              {/* Previous Image Button - Left */}
              <button
                onClick={goToPreviousImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              {/* Next Image Button - Right */}
              <button
                onClick={goToNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </>
          )}

          {/* Thumbnail Images */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === index
                      ? 'border-blue-600'
                      : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details - Lebar mengikuti card foto, sejajar kiri */}
        <div 
          ref={detailsContainerRef}
          className="p-3 md:p-4"
          style={photoCardWidth ? { width: `${photoCardWidth}px`, minWidth: `${photoCardWidth}px` } : {}}
        >
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h2 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h2>

          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-600 mb-2">{product.brand}</p>
          )}

          {/* Price */}
          <div className="mb-2">
            {originalPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-red-600">
                  ${price.toFixed(2)}
                </span>
                <span className="text-base text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock ? (
            <p className="text-xs text-red-600 mb-3">Out of stock</p>
          ) : isLowStock ? (
            <p className="text-xs text-orange-600 mb-3">
              Only {product.stock} left
            </p>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3">
              <Check className="w-3.5 h-3.5" />
              <span>In stock ({product.stock} available)</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h3>
              <p className="text-xs text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-900 mb-1.5">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                    className="p-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button - Width sesuai dengan lebar card foto */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || actionLoading}
            className="w-full"
            size="md"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {actionLoading ? 'Adding...' : 'Add to Cart'}
          </Button>

          {/* Product Info */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <dl className="space-y-1.5 text-xs">
              {product.sku && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">SKU:</dt>
                  <dd className="font-medium">{product.sku}</dd>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Category:</dt>
                  <dd className="font-medium">{product.category.name}</dd>
                </div>
              )}
              {product.brand && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Brand:</dt>
                  <dd className="font-medium">{product.brand}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
