'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, Eye, RotateCcw, ChevronRight } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';

export default function ActivitiesPage() {
  const router = useRouter();
  const { count: wishlistCount } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-1 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Aktifitas Saya</h1>
        <div className="w-5 h-5"></div> {/* Spacer untuk balance */}
      </div>

      {/* Activity Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/favorite?from=activities" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
          <div className="flex-shrink-0">
            <Heart className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
          </div>
          <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Favorite Saya</p>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Link>

        <Link href="/last-viewed?from=activities" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
          <div className="flex-shrink-0">
            <Eye className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
          </div>
          <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Terakhir Dilihat</p>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Link>

        <Link href="/buy-again?from=activities" className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all group">
          <div className="flex-shrink-0">
            <RotateCcw className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
          </div>
          <p className="text-xs text-gray-700 font-medium leading-tight flex-1">Beli Lagi</p>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

