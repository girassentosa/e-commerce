'use client';

import Link from 'next/link';
import { Heart, Eye, RotateCcw, ChevronRight } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';

export default function ActivitiesPage() {
  const { count: wishlistCount } = useWishlist();

  return (
    <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-0 pb-4 sm:pb-6 md:pb-8">
      <div className="-mt-2">
        {/* Activity Cards - Full Width */}
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)] mb-2 sm:mb-6 md:mb-8">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="px-2 sm:px-2.5 md:px-3 pb-2 sm:pb-3 md:pb-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}

