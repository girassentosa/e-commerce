'use client';

/**
 * Product Detail Page
 * Detail page untuk single product dengan full info, images, reviews, etc
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  ChevronRight,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewSummary } from '@/components/reviews/ReviewSummary';
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
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { data: session } = useSession();
  const slug = params?.slug || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewKey, setReviewKey] = useState(0); // Force re-render ReviewList

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // Fetch product by slug using dedicated API endpoint
      const response = await fetch(`/api/products/slug/${slug}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProduct(data.data);
      } else {
        showToast('Product not found', 'error');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      showToast('Failed to load product', 'error');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    await addToCart(product.id, quantity);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const isWishlisted = isInWishlist(product.id);
    if (isWishlisted) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description || '',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice!)) / parseFloat(product.price)) * 100)
    : 0;

  const allImages = [
    product.imageUrl,
    ...(product.images || []),
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/products" className="hover:text-gray-900">
            Products
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="hover:text-gray-900"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge variant="destructive" className="shadow-md">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                {product.isFeatured && (
                  <Badge variant="default" className="shadow-md bg-yellow-500">
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      ${
                        selectedImage === index
                          ? 'border-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
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

          {/* Product Info Section */}
          <div className="space-y-6">
            {/* Title and Brand */}
            <div>
              {product.brand && (
                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);
                      return (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(ratingNum)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-600">
                    {typeof product.rating === 'string' 
                      ? parseFloat(product.rating).toFixed(1) 
                      : (product.rating || 0).toFixed(1)} ({product.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900">
                ${parseFloat(displayPrice).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-gray-500 line-through">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    In Stock ({product.stock} available)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <span className="font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div>
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
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-6 py-2 font-medium">{quantity}</span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={handleToggleWishlist}
                variant="outline"
                size="lg"
                className={product && isInWishlist(product.id) ? 'border-red-500 text-red-500' : ''}
              >
                <Heart
                  className="w-5 h-5"
                  fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </Button>
              <Button onClick={handleShare} variant="outline" size="lg">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Free shipping on orders over $50</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>1 year warranty</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <span>30 days return policy</span>
              </div>
            </div>

            {/* Product Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Product Information</h3>
              <dl className="space-y-2">
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">SKU:</dt>
                    <dd className="font-medium">{product.sku}</dd>
                  </div>
                )}
                {product.category && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium">{product.category.name}</dd>
                  </div>
                )}
                {product.brand && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Brand:</dt>
                    <dd className="font-medium">{product.brand}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-gray-200 pt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
          
          {/* Review Summary */}
          {product && (
            <ReviewSummary
              averageRating={typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0)}
              totalReviews={product.reviewCount || 0}
            />
          )}

          {/* Write Review Button */}
          {session && !showReviewForm && (
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => setShowReviewForm(true)}
              >
                Write a Review
              </Button>
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && product && (
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
              <ReviewForm
                productId={product.id}
                productName={product.name}
                initialData={editingReview}
                onSubmit={async (data) => {
                  try {
                    const url = editingReview
                      ? `/api/reviews/${editingReview.id}`
                      : `/api/products/${product.id}/reviews`;
                    const method = editingReview ? 'PUT' : 'POST';

                    const response = await fetch(url, {
                      method,
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(data),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Failed to submit review');
                    }

                    showToast(
                      editingReview ? 'Review updated successfully!' : 'Review submitted successfully!',
                      'success'
                    );

                    setShowReviewForm(false);
                    setEditingReview(null);
                    setReviewKey((prev) => prev + 1); // Force ReviewList refresh
                    fetchProduct(); // Refresh product to update rating
                  } catch (error: any) {
                    console.error('Error submitting review:', error);
                    showToast(error.message || 'Failed to submit review', 'error');
                  }
                }}
                onCancel={() => {
                  setShowReviewForm(false);
                  setEditingReview(null);
                }}
              />
            </div>
          )}
        </div>

        {/* Reviews List */}
        {product && (
          <ReviewList
            key={reviewKey}
            productId={product.id}
            onEdit={(review) => {
              setEditingReview(review);
              setShowReviewForm(true);
            }}
            onDelete={async (reviewId) => {
              try {
                const response = await fetch(`/api/reviews/${reviewId}`, {
                  method: 'DELETE',
                });

                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.error || 'Failed to delete review');
                }

                showToast('Review deleted successfully!', 'success');
                setReviewKey((prev) => prev + 1); // Force ReviewList refresh
                fetchProduct(); // Refresh product to update rating
              } catch (error: any) {
                console.error('Error deleting review:', error);
                showToast(error.message || 'Failed to delete review', 'error');
              }
            }}
            showActions={!!session}
          />
        )}
      </div>
    </div>
  );
}

