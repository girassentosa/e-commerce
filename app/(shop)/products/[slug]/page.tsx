'use client';

/**
 * Product Detail Page
 * Detail page untuk single product dengan card style konsisten
 */

import { useState, useEffect } from 'react';
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

  const allImages = product ? [
    product.imageUrl,
    ...(product.images || []),
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '') : [];

  const price = parseFloat(displayPrice);
  const originalPrice = product.salePrice ? parseFloat(product.price) : null;
  const imageUrl = allImages[selectedImage] || allImages[0];
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Konsisten dengan favorite/last-viewed */}
      <div className="flex items-center justify-between mb-4 relative">
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow mb-8">
        {/* Product Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
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

          {/* Thumbnail Images */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
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

        {/* Product Details */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>

          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-gray-600 mb-3">{product.brand}</p>
          )}

          {/* Price */}
          <div className="mb-3">
            {originalPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-600">
                  ${price.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock ? (
            <p className="text-sm text-red-600 mb-4">Out of stock</p>
          ) : isLowStock ? (
            <p className="text-sm text-orange-600 mb-4">
              Only {product.stock} left
            </p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <Check className="w-4 h-4" />
              <span>In stock ({product.stock} available)</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || actionLoading}
            className="w-full"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {actionLoading ? 'Adding...' : 'Add to Cart'}
          </Button>

          {/* Product Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dl className="space-y-2 text-sm">
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
  );
}
