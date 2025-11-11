'use client';

/**
 * Product Detail Page - Modern E-Commerce Layout
 * 2 Column: 60% Image Gallery + 40% Product Info
 * Inspired by Shopee/Tokopedia
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  ZoomIn,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { useSession } from 'next-auth/react';
import { ProductCard } from '@/components/products/ProductCard';
import { useRef } from 'react';
import { SwipeGesture } from '@/components/mobile/SwipeGesture';

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

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
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
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  // Sentinel diletakkan setelah area gambar untuk mendeteksi scroll melewati hero
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Ref ke kontainer gambar utama untuk fallback perhitungan manual
  const galleryRef = useRef<HTMLDivElement | null>(null);

  // Fetch product
  useEffect(() => {
  const fetchProduct = async () => {
    if (!slug) return;
    
    try {
      const response = await fetch(`/api/products/slug/${slug}`);
      const data = await response.json();

      if (data.success && data.data) {
        setProduct(data.data);
        
          // Track product view
        if (session?.user?.id) {
          fetch('/api/last-viewed', {
            method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: data.data.id }),
          })
              .then(() => refreshLastViewed())
              .catch((err) => console.error('Failed to track:', err));
          }

          // Fetch related products
          if (data.data.category?.id) {
            fetch(`/api/products?categoryId=${data.data.category.id}&limit=6`)
              .then(res => res.json())
              .then(data => {
                if (data.products) {
                  setRelatedProducts(data.products.filter((p: Product) => p.id !== data.data.id).slice(0, 6));
                }
              });
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

      fetchProduct();
  }, [slug, session?.user?.id]);

  // Observe sentinel untuk toggle header (solid saat sentinel terlihat di viewport)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Saat sentinel memasuki viewport (artinya kita sudah melewati area gambar), jadikan header solid
        setIsHeaderSolid(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        // Naikkan trigger sedikit agar terasa natural (kompensasi tinggi header ~56px)
        rootMargin: '-56px 0px 0px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef]);

  // Fallback: gunakan scroll listener berbasis posisi gallery jika IO tidak memicu dengan benar
  useEffect(() => {
    const handleScroll = () => {
      // Muncul segera setelah ada pergerakan scroll kecil
      if (window.scrollY > 4) {
        setIsHeaderSolid(true);
        return;
      }
      // Jika belum scroll, jatuhkan ke perhitungan posisi gallery
      const g = galleryRef.current;
      if (!g) {
        setIsHeaderSolid(false);
        return;
      }
      const rect = g.getBoundingClientRect();
      const headerHeight = 56; // ~ h-14
      const solid = rect.bottom <= headerHeight;
      setIsHeaderSolid((prev) => (prev !== solid ? solid : prev));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    setActionLoading(true);
    try {
      await addToCart(product.id, quantity);
      showToast('Added to cart successfully!', 'success');
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product || product.stock === 0) return;
    setActionLoading(true);
    try {
      await addToCart(product.id, quantity);
      router.push('/checkout');
    } catch (error) {
      showToast('Failed to process', 'error');
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = !!product.salePrice && product.price && parseFloat(product.salePrice) < parseFloat(product.price);
  const discountPercentage = hasDiscount && product.price && product.salePrice
    ? Math.round(((parseFloat(product.price) - parseFloat(product.salePrice)) / parseFloat(product.price)) * 100)
    : 0;

  const allImages = [
    product.imageUrl,
    ...(product.images || []).filter(img => img && img !== product.imageUrl),
  ].filter((img): img is string => typeof img === 'string' && img.trim() !== '');

  const imageUrl = allImages[selectedImage] || allImages[0];
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isWishlisted = isInWishlist(product.id);
  const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Transparent→Solid Sticky Header */}
      <div
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          isHeaderSolid
            ? 'bg-white/95 backdrop-blur border-gray-200 shadow-sm'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-3">
          <button 
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/products');
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                isHeaderSolid ? 'text-red-600 hover:bg-gray-100' : 'text-red-500 hover:bg-white/10'
              }`}
              aria-label="Back"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5 drop-shadow" />
          </button>
            {/* Title appears only when solid */}
            <div className="flex-1 min-w-0">
              {isHeaderSolid && (
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {product.name}
                </div>
              )}
        </div>
            <Link
              href="/cart"
              className={`relative p-2 rounded-lg transition-colors ${
                isHeaderSolid ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 drop-shadow" />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center font-bold shadow">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-6 sm:py-8 pb-28 sm:pb-28">
        {/* Main Product Section - 2 Columns */}
        <div className="grid lg:grid-cols-[60%_40%] gap-8 mb-12">
          
          {/* LEFT: Image Gallery (60%) */}
          <div className="space-y-4">
            {/* Main Image */}
            <div ref={galleryRef} className="relative bg-white rounded-xl overflow-hidden border border-gray-200 aspect-square lg:aspect-[4/3]">
              <SwipeGesture
                onSwipeLeft={() => {
                  if (allImages.length < 2) return;
                  setSelectedImage((selectedImage + 1) % allImages.length);
                }}
                onSwipeRight={() => {
                  if (allImages.length < 2) return;
                  setSelectedImage((selectedImage - 1 + allImages.length) % allImages.length);
                }}
                className="relative w-full h-full"
              >
                {imageUrl && !imageErrors[product.id] ? (
                  <div 
                    className="relative w-full h-full cursor-zoom-in"
                    onClick={() => setIsZoomed(!isZoomed)}
                  >
            <Image
              src={imageUrl}
              alt={product.name}
                      draggable={false}
              fill
                      className={`object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
              priority
              onError={() => setImageErrors(prev => ({ ...prev, [product.id]: true }))}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    {!isZoomed && (
                      <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-md">
                        <ZoomIn className="w-5 h-5 text-gray-700" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-2" />
                      <span className="text-gray-400">No Image</span>
                    </div>
            </div>
          )}

          {/* Sale Badge */}
                {hasDiscount && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg">
                    -{discountPercentage}% OFF
            </div>
          )}

                {/* Single Navigation Arrow (Left only)
                    Tampil saat mulai scroll (header solid) ATAU ketika user sudah bergeser ke gambar lain */}
                {allImages.length > 1 && (isHeaderSolid || selectedImage !== 0) && (
          <button
                    onClick={() => setSelectedImage(selectedImage === 0 ? allImages.length - 1 : selectedImage - 1)}
                    className="absolute left-2 sm:left-3 lg:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 md:p-3 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all z-20"
                    data-no-swipe="true"
                aria-label="Previous image"
              >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </button>
                )}
              </SwipeGesture>
            </div>

            {/* Sentinel untuk scroll detection */}
            <div ref={sentinelRef} className="h-px w-full"></div>

            {/* Thumbnails */}
          {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === index
                        ? 'border-blue-600 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
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

          {/* RIGHT: Product Info (40%) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Category */}
          {product.category && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold mb-3">
                  {product.category.name}
                </span>
              )}

              {/* Product Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

          {/* Brand */}
          {product.brand && (
                <p className="text-sm text-gray-600 mb-4">Brand: <span className="font-semibold">{product.brand}</span></p>
              )}

              {/* Rating & Reviews */}
              {ratingNum > 0 && (
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(ratingNum)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 fill-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {ratingNum.toFixed(1)}
                </span>
                  {product.reviewCount > 0 && (
                    <span className="text-sm text-gray-600">
                      ({product.reviewCount} reviews)
                </span>
                  )}
              </div>
              )}

              {/* Price - SUPER PROMINENT */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-blue-600">
                    ${parseFloat(displayPrice).toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-400 line-through">
                      ${parseFloat(product.price).toFixed(2)}
              </span>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-green-600 font-semibold">
                    You save ${(parseFloat(product.price) - parseFloat(product.salePrice!)).toFixed(2)} ({discountPercentage}% off)
                  </p>
            )}
          </div>

          {/* Stock Status */}
          {isOutOfStock ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-red-600 font-semibold">Out of stock</p>
                </div>
          ) : isLowStock ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-orange-600 font-semibold">
                    ⚠️ Only {product.stock} left in stock - Order soon!
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600 mb-6">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">In stock ({product.stock} available)</span>
            </div>
          )}

          {/* Quantity Selector */}
          {product.stock > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border-2 border-gray-300 rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                        <Minus className="w-4 h-4" />
                  </button>
                      <span className="px-6 py-2 text-lg font-semibold min-w-[60px] text-center">
                        {quantity}
                      </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                        <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

              {/* CTA Buttons */}
              <div className="space-y-3 mb-6">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || actionLoading}
                  className="w-full py-4 text-base font-bold bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || actionLoading}
                  className="w-full py-4 text-base font-bold bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  Buy Now
          </Button>
                <button
                  onClick={handleToggleWishlist}
                  className={`w-full py-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                    isWishlisted
                      ? 'bg-red-50 border-red-500 text-red-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-4 h-4 inline-block mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 mb-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 font-medium">Secure Payment</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <RotateCcw className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">14 Days Return</span>
                </div>
                <div className="flex items-center gap-2 text-xs col-span-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Free Shipping</p>
                    <p className="text-gray-500 text-[10px]">Estimated delivery: 3-5 business days</p>
                  </div>
                </div>
              </div>

          {/* Product Info */}
              {(product.sku || product.brand) && (
                <div className="pt-6 border-t border-gray-200">
                  <dl className="space-y-2 text-sm">
              {product.sku && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">SKU:</dt>
                        <dd className="font-semibold text-gray-900">{product.sku}</dd>
                </div>
              )}
              {product.brand && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Brand:</dt>
                        <dd className="font-semibold text-gray-900">{product.brand}</dd>
                </div>
              )}
            </dl>
          </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl border border-gray-200 mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'description'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'specifications'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Reviews ({product.reviewCount || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                {product.description ? (
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description available</p>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <dt className="text-sm font-semibold text-gray-900 mb-1">{key}</dt>
                        <dd className="text-sm text-gray-700">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-gray-500 italic">No specifications available</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold">{review.userName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              {product.category && (
                <Link 
                  href={`/products?categoryId=${product.category.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar: Cart Add + Buy Now */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),0px)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || actionLoading}
              className={`relative flex items-center justify-center rounded-xl min-w-[52px] h-12 sm:min-w-[56px] sm:h-12 transition-colors border-2 ${
                product.stock === 0 || actionLoading
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
              aria-label="Tambah ke Keranjang"
              title="Tambah ke Keranjang"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0 || actionLoading}
              className={`flex-1 h-12 sm:h-12 rounded-xl font-semibold text-base transition-colors ${
                product.stock === 0 || actionLoading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {product.stock === 0 ? 'Stok Habis' : actionLoading ? 'Memproses...' : 'Beli Sekarang'}
            </button>
        </div>
        </div>
      </div>
    </div>
  );
}
