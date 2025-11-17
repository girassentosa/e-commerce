import { Suspense } from 'react';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import ProductsPageClient from './ProductsPageClient';

export const dynamic = 'force-dynamic';

type PageSearchParams = Record<string, string | string[] | undefined>;

type ProductRecord = Prisma.ProductGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
        slug: true;
      };
    };
    images: {
      select: {
        imageUrl: true;
        isPrimary: true;
      };
    };
    _count: {
      select: {
        reviews: true;
      };
    };
  };
}>;

function toStringValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

function mapProduct(product: ProductRecord) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() || null,
    imageUrl: primaryImage?.imageUrl || null,
    images: product.images
      .map((img) => img.imageUrl)
      .filter((url): url is string => Boolean(url)),
    stock: product.stockQuantity,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        }
      : null,
    brand: product.brand,
    rating: product.ratingAverage ? Number(product.ratingAverage) : null,
    reviewCount: product._count.reviews,
    isFeatured: product.isFeatured,
    salesCount: product.salesCount,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const limit = 12;
  const page = Math.max(
    1,
    parseInt(toStringValue(searchParams.page) || '1', 10) || 1,
  );

  const categoryId = toStringValue(searchParams.categoryId);
  const sort = (toStringValue(searchParams.sort) || 'newest') as
    | 'newest'
    | 'price_asc'
    | 'price_desc';
  const searchQuery = toStringValue(searchParams.search);
  const minPriceValue = toStringValue(searchParams.minPrice);
  const maxPriceValue = toStringValue(searchParams.maxPrice);
  const minPrice = minPriceValue ? parseFloat(minPriceValue) : undefined;
  const maxPrice = maxPriceValue ? parseFloat(maxPriceValue) : undefined;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

  if (sort === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sort === 'price_desc') {
    orderBy = { price: 'desc' };
  } else {
    orderBy = { createdAt: 'desc' };
  }

  const skip = (page - 1) * limit;

  const [productsRaw, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            imageUrl: true,
            isPrimary: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  const products = productsRaw.map(mapProduct);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Create unique key based on categoryId and page to force re-render with new data
  const componentKey = `products-${categoryId || 'all'}-page-${page}`;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat daftar produk...</p>
          </div>
        </div>
      }
    >
      <ProductsPageClient
        key={componentKey}
        productsData={{
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        }}
        categories={categories}
      />
    </Suspense>
  );
}

