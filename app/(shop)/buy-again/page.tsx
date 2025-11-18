'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { RotateCcw, ShoppingCart, Search, ArrowLeft } from 'lucide-react';
import { useBuyAgain } from '@/contexts/BuyAgainContext';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

function BuyAgainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { items, loading } = useBuyAgain();
  
  // Get search query from URL (managed by Header component)
  const searchQuery = searchParams.get('search') || '';

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/buy-again');
    return null;
  }

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(query) ||
      item.product.category?.name.toLowerCase().includes(query)
    );
  });

  // Handle back button
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Konsisten dengan halaman lainnya */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 sm:px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                Beli Lagi
              </h1>
              <div className="w-9 h-9 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-1 sm:px-3 md:px-4 pt-4 pb-8">

      {/* Search Results Info */}
      <div className="-mt-2">
      {searchQuery && filteredItems.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Menampilkan {filteredItems.length} dari {items.length} produk yang dibeli
        </div>
      )}

      {/* Empty state - only show when not loading */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-6">
            <RotateCcw className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada produk yang dibeli</h2>
          <p className="text-gray-600 mb-6">
            Produk yang sudah Anda beli dan selesai akan muncul di sini
          </p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Jelajahi Produk
            </Button>
          </Link>
        </div>
      )}

      {/* Loading state - non-blocking */}
      {loading && items.length === 0 && (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      )}

      {/* No search results */}
      {searchQuery && filteredItems.length === 0 && items.length > 0 && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada hasil</h2>
          <p className="text-gray-600 mb-6">
            Tidak ada produk yang dibeli yang cocok dengan "{searchQuery}"
          </p>
          <Link
            href="/buy-again"
            className="text-indigo-600 font-medium"
          >
            Hapus pencarian
          </Link>
        </div>
      )}

      {/* Products Grid */}
      {filteredItems.length > 0 && (
        <div className="pb-4 w-screen -ml-[calc((100vw-100%)/2)] sm:w-auto sm:ml-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 sm:gap-2 md:gap-3">
            {filteredItems.map((item) => {
              // Transform product data to match ProductCard interface
              const productData = {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                description: item.product.description || null,
                price: item.product.price,
                salePrice: item.product.salePrice || null,
                imageUrl: item.product.images?.[0]?.imageUrl || null,
                images: item.product.images || [],
                stock: item.product.stockQuantity,
                stockQuantity: item.product.stockQuantity,
                category: item.product.category,
                brand: item.product.brand || null,
                rating: item.product.rating || null,
                reviewCount: item.product.reviewCount || 0,
                isFeatured: item.product.isFeatured || false,
              };

              return (
                <ProductCard
                  key={item.id}
                  product={productData}
                />
              );
            })}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

export default function BuyAgainPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    }>
      <BuyAgainPageContent />
    </Suspense>
  );
}

