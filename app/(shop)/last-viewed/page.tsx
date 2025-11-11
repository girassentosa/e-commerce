'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Eye, Search, ArrowLeft } from 'lucide-react';
import { useLastViewed } from '@/contexts/LastViewedContext';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

function LastViewedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { items, loading } = useLastViewed();
  
  // Get search query from URL (managed by Header component)
  const searchQuery = searchParams.get('search') || '';

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/last-viewed');
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                Terakhir Dilihat
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
          Menampilkan {filteredItems.length} dari {items.length} produk yang dilihat
        </div>
      )}

      {/* Empty state - only show when not loading */}
      {!loading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="mb-6">
            <Eye className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada produk yang dilihat</h2>
          <p className="text-gray-600 mb-6">
            Produk yang Anda lihat akan muncul di sini
          </p>
          <Link href="/products">
            <Button size="lg">
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
            Tidak ada produk yang dilihat yang cocok dengan "{searchQuery}"
          </p>
          <Link
            href="/last-viewed"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Hapus pencarian
          </Link>
        </div>
      )}

      {/* Products Grid */}
      {filteredItems.length > 0 && (
        <div className="pb-4 w-screen -ml-[calc((100vw-100%)/2)] sm:w-auto sm:ml-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0 sm:gap-2 md:gap-3">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product}
              />
            ))}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

export default function LastViewedPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <LastViewedPageContent />
    </Suspense>
  );
}
