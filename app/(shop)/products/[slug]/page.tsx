'use client';

/**
 * Product Detail Page - Modern E-Commerce Layout
 * 2 Column: 60% Image Gallery + 40% Product Info
 * Inspired by Shopee/Tokopedia
 */

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  ChevronLeft,
  ShieldCheck,
  RotateCcw,
  Truck,
  Star,
  ZoomIn,
  Play,
  Heart,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useCart } from '@/contexts/CartContext';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { useSession } from 'next-auth/react';
import { ProductCard } from '@/components/products/ProductCard';
import { useRef } from 'react';
import { SwipeGesture } from '@/components/mobile/SwipeGesture';
import { useCurrency } from '@/hooks/useCurrency';

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
  salesCount?: number;
  isFeatured: boolean;
  isActive: boolean;
  specifications: any;
  createdAt: string;
}

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment: string | null;
  userName: string;
  createdAt: string;
  images?: string[] | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string;
    avatarUrl?: string | null;
  };
}

function ProductDetailPageContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { addItem: addToCart, itemCount } = useCart();
  const { refreshLastViewed } = useLastViewed();
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const slug = params?.slug || '';

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'cart' | 'buy-now' | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
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

  // Fetch reviews when product is loaded
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return;
      
      try {
        const response = await fetch(`/api/products/${product.id}/reviews?limit=50`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform review data to match Review interface
          const transformedReviews = data.data.map((review: any) => ({
            id: review.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            userName: review.user 
              ? `${review.user.firstName || ''} ${review.user.lastName || ''}`.trim() || review.user.email
              : 'Anonymous',
            createdAt: review.createdAt,
            images: review.images,
            user: review.user ? {
              firstName: review.user.firstName,
              lastName: review.user.lastName,
              email: review.user.email,
              avatarUrl: review.user.avatarUrl,
            } : undefined,
          }));
          setReviews(transformedReviews);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [product?.id]);

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

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    
    // Read color and size from URL query params
    const colorParam = searchParams?.get('color');
    const sizeParam = searchParams?.get('size');
    const actionParam = searchParams?.get('action');
    
    if (colorParam) {
      setSelectedColor(colorParam);
    } else {
      setSelectedColor(null);
    }
    
    if (sizeParam) {
      setSelectedSize(sizeParam);
    } else {
      setSelectedSize(null);
    }
    
    // Auto-open sheet if action is specified
    if (actionParam === 'buy-now') {
      setSheetMode('buy-now');
    } else if (colorParam || sizeParam) {
      // If variant is selected, open cart sheet
      setSheetMode('cart');
    } else {
      setSheetMode(null);
    }
  }, [product?.id, searchParams]);

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

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;
  const ratingNum = typeof product.rating === 'string' ? parseFloat(product.rating) : (product.rating || 0);
  
  // Get real-time sold count from product data
  const soldCount = product.salesCount || 0;
  
  // Format terjual: jika >= 1000 jadi 2 angka + " RB", jika < 1000 tampilkan angka biasa
  const formatSoldCount = (count: number): string => {
    if (count >= 1000) {
      // Ambil 2 angka pertama dari ratusan (untuk 1000-9999) atau ribuan (untuk 10000+)
      if (count >= 10000) {
        // Untuk 10000+, ambil 2 digit pertama dari ribuan
        const firstTwo = Math.floor(count / 1000);
        return `${firstTwo} RB+`;
      } else {
        // Untuk 1000-9999, ambil 2 digit pertama dari ratusan
        const firstTwo = Math.floor(count / 100);
        return `${firstTwo} RB+`;
      }
    }
    return `${count}`;
  };
  
  const formattedSold = formatSoldCount(soldCount);

  // ===== Delivery Guarantee (3-5 business days) =====
  const addBusinessDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    let remaining = days;
    while (remaining > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay(); // 0 = Sun, 6 = Sat
      if (day !== 0 && day !== 6) {
        remaining -= 1;
      }
    }
    return d;
  };

  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const formatDateRangeId = (start: Date, end: Date): string => {
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    if (sameMonth) {
      return `${start.getDate()} - ${end.getDate()} ${monthNamesId[end.getMonth()]}`;
    }
    return `${start.getDate()} ${monthNamesId[start.getMonth()]} - ${end.getDate()} ${monthNamesId[end.getMonth()]}`;
  };

  const deliveryStart = addBusinessDays(new Date(), 3);
  const deliveryEnd = addBusinessDays(new Date(), 5);
  const deliveryGuaranteeText = `Garansi tiba ${formatDateRangeId(deliveryStart, deliveryEnd)}`;

  const policyDetails = [
    {
      title: '15 Hari Pengembalian',
      description: 'Ajukan retur dalam 15 hari jika produk tidak sesuai ekspektasi Anda.'
    },
    {
      title: '100% Original',
      description: 'Produk dijamin asli dengan dukungan supplier resmi dan garansi pabrikan.'
    },
    {
      title: 'COD-Cek-dulu',
      description: 'Periksa barang terlebih dahulu sebelum melakukan pembayaran COD.'
    },
    {
      title: 'Proteksi Kerusakan',
      description: 'Penggantian atau pengembalian dana jika barang diterima dalam kondisi rusak.'
    },
  ];
  const allImages = product
    ? [
        product.imageUrl,
        ...(product.images || []).filter((img) => img && img !== product.imageUrl),
      ].filter((img): img is string => typeof img === 'string' && img.trim() !== '')
    : [];

  const imageUrl = allImages[selectedImage] || allImages[0] || null;

  const colorOptions = [
    {
      id: 'color-hitam',
      label: 'Hitam',
      value: 'hitam',
      image: imageUrl || undefined,
    },
    {
      id: 'color-putih',
      label: 'Putih',
      value: 'putih',
      image: imageUrl || undefined,
    },
    {
      id: 'color-biru',
      label: 'Biru Navy',
      value: 'biru-navy',
      image: imageUrl || undefined,
    },
    {
      id: 'color-merah',
      label: 'Merah Maroon',
      value: 'merah-maroon',
      image: imageUrl || undefined,
    },
  ];

  const sizeOptions = ['M', 'L', 'XL', 'XXL'];

  const clampQuantity = (value: number) => {
    if (product.stock <= 0) {
      return 1;
    }
    return Math.min(Math.max(value, 1), product.stock);
  };

  const unitPriceRaw = Number.parseFloat(displayPrice || '0');
  const unitPrice = Number.isFinite(unitPriceRaw) ? unitPriceRaw : 0;
  const totalPrice = unitPrice * clampQuantity(quantity);

  const isSheetOpen = sheetMode !== null;
  const isBuyNowMode = sheetMode === 'buy-now';
  const sheetPrimaryLabel = isBuyNowMode ? 'Beli Sekarang' : 'Simpan ke Keranjang';
  const sheetLoadingLabel = isBuyNowMode ? 'Memproses...' : 'Menyimpan...';

  const isSaveDisabled = actionLoading || !selectedColor || !selectedSize || quantity < 1;

  const openSheet = (mode: 'cart' | 'buy-now') => {
    if (isOutOfStock) {
      showToast('Produk sedang habis stok', 'error');
      return;
    }
    if (!selectedColor && colorOptions.length > 0) {
      setSelectedColor(colorOptions[0].value);
    }
    if (!selectedSize && sizeOptions.length > 0) {
      setSelectedSize(sizeOptions[0]);
    }
    setQuantity((prev) => clampQuantity(prev || 1));
    setSheetMode(mode);
  };

  const handleOpenAddToCart = () => openSheet('cart');
  const handleOpenBuyNow = () => openSheet('buy-now');

  const handleCloseSheet = () => {
    if (actionLoading) return;
    setSheetMode(null);
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => clampQuantity((prev || 1) - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => clampQuantity((prev || 1) + 1));
  };

  const handleSheetAction = async () => {
    if (!product || product.stock === 0 || !sheetMode) return;

    if (!selectedColor || !selectedSize) {
      showToast('Silakan pilih warna dan ukuran terlebih dahulu.', 'error');
      return;
    }

    if (sheetMode === 'buy-now') {
      // Get current image URL based on selectedImage index
      const currentImageUrl = allImages[selectedImage] || allImages[0] || null;
      const query = new URLSearchParams({
        flow: 'buy-now',
        productId: product.id,
        quantity: clampQuantity(quantity).toString(),
        color: selectedColor,
        size: selectedSize,
      });
      // Add imageUrl to query params if available
      if (currentImageUrl) {
        query.set('imageUrl', currentImageUrl);
      }
      setSheetMode(null);
      await router.push(`/checkout?${query.toString()}`);
      return;
    }

    setActionLoading(true);
    try {
      // Get current image URL based on selectedImage index
      const currentImageUrl = allImages[selectedImage] || allImages[0] || null;
      await addToCart(product.id, clampQuantity(quantity), undefined, selectedColor, selectedSize, currentImageUrl || undefined);
      showToast('Produk berhasil masuk ke keranjang', 'success');
      setSheetMode(null);
    } catch (error) {
      showToast('Gagal menambahkan ke keranjang', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuyNowNavigation = () => {
    if (isOutOfStock || !product) {
      showToast('Produk sedang habis stok', 'error');
      return;
    }
    router.push(`/products/${product.slug}/buy-now`);
  };

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

      <div className="max-w-[1440px] mx-auto px-0 sm:px-6 py-0 sm:py-6 pb-28 sm:pb-28">
        {/* Main Product Section - Full Width */}
        <div className="mb-12">
          
          {/* Product Image - Full Width Card */}
          <div className="bg-white rounded-none sm:rounded-xl overflow-hidden border-0 sm:border sm:border-gray-200 mb-0">
            <div ref={galleryRef} className="relative aspect-square overflow-hidden bg-gray-50 rounded-none sm:rounded-t-xl">
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
                  <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    -{discountPercentage}%
                  </div>
                )}

                {/* Navigation Arrow */}
                {allImages.length > 1 && (isHeaderSolid || selectedImage !== 0) && (
                  <button
                    onClick={() => setSelectedImage(selectedImage === 0 ? allImages.length - 1 : selectedImage - 1)}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all z-20"
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
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
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
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="bg-white rounded-none sm:rounded-xl border-0 sm:border sm:border-gray-200">
            <div className="p-4 sm:p-6">
              {/* Price */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                  <span className="text-3xl font-bold text-blue-600">
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  {/* Sold Count & Love Icon */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-sm font-semibold text-gray-600 leading-none">
                      {formattedSold} Terjual
                    </span>
                    <Heart className="w-[14px] h-[14px] text-red-500 fill-red-500 flex-shrink-0" />
                  </div>
                </div>
                {hasDiscount && (
                  <p className="text-xs text-green-600 font-semibold">
                    You save {formatPrice(parseFloat(product.price) - parseFloat(product.salePrice!))} ({discountPercentage}% off)
                  </p>
                )}
              </div>

              {/* Product Title with Brand (expandable) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsTitleExpanded((v) => !v)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsTitleExpanded((v) => !v);
                  }
                }}
                aria-expanded={isTitleExpanded}
                className="w-full flex items-center gap-2 text-left cursor-pointer focus:outline-none focus-visible:ring-0 border-t border-gray-200 pt-4"
              >
                <h1 className={`!text-base sm:!text-lg font-bold text-gray-900 leading-tight ${isTitleExpanded ? '' : 'truncate'} flex-1`}>
                  {product.brand ? `${product.brand} - ${product.name}` : product.name}
                </h1>
                <ChevronDown className={`ml-auto w-4 h-4 text-gray-400 transition-transform ${isTitleExpanded ? 'rotate-180' : ''}`} />
              </div>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 space-y-4 border-t border-gray-200">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="!w-[18px] !h-[18px] text-green-600 flex-shrink-0" />
                    <span className="!text-sm text-gray-700 !font-semibold">Secure Payment</span>
                    <ChevronRight className="ml-auto w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsPolicyModalOpen(true)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setIsPolicyModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
                    aria-label="Lihat detail kebijakan"
                  >
                    <RotateCcw className="!w-[18px] !h-[18px] text-blue-600 flex-shrink-0" />
                    <span className="!text-sm text-gray-700 !font-semibold truncate">
                      15 Hari Pengembalian • 100% Original • COD-Cek-dulu • proteks kerusakan
                    </span>
                    <ChevronRight className="ml-auto w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2.5">
                    <Truck className="!w-[18px] !h-[18px] text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="!text-sm text-gray-700 !font-semibold">{deliveryGuaranteeText}</p>
                      <p className="!text-[10px] text-gray-500">Dapatkan voucher s/d Rp10.000% jika pesanan terlambat</p>
                    </div>
                    <ChevronRight className="ml-2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="border-t border-gray-200 mt-4 pt-4">
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

                <div className="px-0 sm:px-1 pt-4">
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
                              {/* User Info with Avatar */}
                              <div className="flex items-center gap-3 mb-2">
                                {review.user?.avatarUrl ? (
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                                    <Image
                                      src={review.user.avatarUrl}
                                      alt={review.userName}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                    {review.userName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 truncate">{review.userName}</span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                      {new Date(review.createdAt).toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {/* Rating Stars - Below Name */}
                                  <div className="flex items-center gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                        className={`w-3.5 h-3.5 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              </div>
                              
                              {/* Review Content */}
                              {review.title && (
                                <p className="text-sm font-medium text-gray-900 mb-1">{review.title}</p>
                              )}
                              {review.comment && (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                              )}
                              {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                  {review.images.map((imgUrl: string, idx: number) => (
                                    <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-gray-300">
                                      <Image
                                        src={imgUrl}
                                        alt={`Review photo ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
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
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="px-4 sm:px-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Related Products</h2>
              {product.category && (
                <Link 
                  href={`/products?categoryId=${product.category.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-2 sm:gap-x-4 gap-y-4 sm:gap-y-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isSheetOpen && (
        <div className="fixed inset-0 z-[65] flex flex-col">
          <div className="absolute inset-0 bg-black/40" onClick={handleCloseSheet}></div>
          <div className="relative mt-auto bg-white rounded-t-3xl shadow-2xl border border-gray-100">
            <button
              type="button"
              onClick={handleCloseSheet}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Tutup panel aksi produk"
              disabled={actionLoading}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="py-2 flex justify-center">
              <div className="h-1.5 w-16 rounded-full bg-gray-200"></div>
            </div>
            <div className="pb-[max(env(safe-area-inset-bottom),24px)] overflow-y-auto max-h-[80vh]">
              <div className="sticky top-0 z-10 bg-white px-5 py-4 border-t border-b border-gray-200 flex gap-3 items-center">
                {imageUrl ? (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-sm flex-shrink-0">
                    No Image
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{product.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-base font-bold text-blue-600">{formatPrice(totalPrice)}</p>
                    <span className="text-xs font-semibold text-gray-500">Qty: {quantity}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{product.stock > 0 ? `Stok: ${product.stock}` : 'Stok habis'}</p>
                </div>
              </div>

              <div className="border-b border-gray-200 divide-y divide-gray-100 bg-white rounded-b-3xl">
                <div className="px-5 py-4 bg-white">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">Warna</p>
                      <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 w-full px-1">
                        {colorOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedColor(option.value)}
                            className={`option-flat-btn inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs leading-none whitespace-nowrap border ${
                              selectedColor === option.value
                                ? 'text-blue-700 font-semibold border-blue-500 bg-blue-50'
                                : 'text-gray-700 border-transparent'
                            }`}
                          >
                            {option.image ? (
                              <div className="relative w-5 h-5 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image src={option.image} alt={option.label} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-md bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 flex-shrink-0">
                                N/A
                              </div>
                            )}
                            <span className="font-medium">{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Ukuran</p>
                      <p className="text-xs text-gray-500 mt-1">Pilih ukuran yang tersedia</p>
                      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 w-full px-1 mt-3">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`option-flat-btn inline-flex flex-shrink-0 items-center justify-center rounded-md px-3 py-1 text-sm leading-none whitespace-nowrap border ${
                              selectedSize === size
                                ? 'text-blue-700 font-semibold border-blue-500 bg-blue-50'
                                : 'text-gray-700 border-transparent'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Jumlah</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDecreaseQuantity}
                        disabled={quantity <= 1}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg font-bold transition ${
                          quantity <= 1
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-100'
                            : 'border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                        }`}
                      >
                        -
                      </button>
                      <span className="min-w-[32px] text-center text-base font-semibold text-gray-900">{quantity}</span>
                      <button
                        type="button"
                        onClick={handleIncreaseQuantity}
                        disabled={quantity >= product.stock}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-lg font-bold transition ${
                          quantity >= product.stock
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-100'
                            : 'border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-white">
                  <button
                    type="button"
                    onClick={handleSheetAction}
                    disabled={isSaveDisabled || actionLoading}
                    className={`w-full h-11 rounded-lg font-semibold text-sm transition-colors ${
                      isSaveDisabled || actionLoading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {actionLoading ? sheetLoadingLabel : sheetPrimaryLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsPolicyModalOpen(false)}
          ></div>
          <div className="relative mt-auto bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-hidden">
            <div className="relative flex items-center justify-center px-6 pt-5 pb-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-500 tracking-wide uppercase">Jaminan Shohope</span>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pb-6 overflow-y-auto">
              <div className="py-4">
                <div className="w-full bg-white border border-gray-200 rounded-none">
                  {policyDetails.map((item, index) => (
                    <div
                      key={item.title}
                      className={`px-6 py-4 bg-white ${index > 0 ? 'border-t border-gray-200' : ''}`}
                    >
                      <p className="text-sm font-semibold text-gray-900 mb-1">{item.title}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar: Cart Add + Buy Now */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),0px)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddToCart}
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
              onClick={handleOpenBuyNow}
              disabled={product.stock === 0}
              className={`flex-1 h-12 sm:h-12 rounded-xl font-semibold text-base transition-colors ${
                product.stock === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {product.stock === 0 ? 'Stok Habis' : 'Beli Sekarang'}
            </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ProductDetailPageContent />
    </Suspense>
  );
}
