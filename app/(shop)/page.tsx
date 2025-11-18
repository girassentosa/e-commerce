import { Suspense } from 'react';
import HomePageClient from './HomePageClient';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getStoreSettingsServer } from '@/lib/settings';

export const revalidate = 60;

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

function mapProduct(product: ProductRecord) {
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const imageUrls = product.images
    .map((img) => img.imageUrl)
    .filter((url): url is string => Boolean(url));

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() || null,
    imageUrl: primaryImage?.imageUrl || null,
    images: imageUrls,
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
    salesCount: product.salesCount,
  };
}

export default async function HomePage() {
  const [productsRaw, categories, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 24,
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
    getStoreSettingsServer(),
  ]);

  const products = productsRaw.map(mapProduct);
  const currency = settings.currency || 'IDR';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat halaman...</p>
          </div>
        </div>
      }
    >
      <HomePageClient
        initialProducts={products}
        initialCategories={categories}
        initialCurrency={currency}
      />
    </Suspense>
  );
}

