/**
 * ProductSkeleton Component
 * Loading skeleton untuk ProductCard
 * Ditampilkan saat data sedang loading
 */

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />
      
      {/* Content Skeleton */}
      <div className="p-4">
        {/* Category */}
        <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
        
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        
        {/* Rating */}
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
        
        {/* Price */}
        <div className="h-6 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}

