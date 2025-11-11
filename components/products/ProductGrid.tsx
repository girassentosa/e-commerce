/**
 * ProductGrid Component
 * Grid layout untuk menampilkan multiple products
 * Responsive: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
 */

import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  salePrice?: string | null;
  imageUrl?: string | null;
  images?: string[] | Array<{ imageUrl: string; altText?: string | null }>;
  stock?: number;
  stockQuantity?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: string | null;
  rating?: string | number | null;
  reviewCount?: number;
  isFeatured?: boolean;
}

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ 
  products, 
  columns = 4,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-8 bg-gray-100 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      </div>
    );
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridColsClass[columns]} gap-0 sm:gap-2 md:gap-3`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}

