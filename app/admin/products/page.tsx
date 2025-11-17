import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminProductsClient from './AdminProductsClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

async function getInitialProducts() {
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            isPrimary: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
    }),
    prisma.product.count(),
  ]);

  const mappedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price.toString(),
    salePrice: product.salePrice?.toString() || null,
    stockQuantity: product.stockQuantity,
    brand: product.brand,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    category: product.category || { id: 'uncategorized', name: 'Uncategorized' },
    images: product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
    })),
  }));

  return {
    products: mappedProducts,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/products');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { products, totalCount, totalPages } = await getInitialProducts();

  return (
    <AdminProductsClient
      initialProducts={products}
      initialPagination={{
        page: 1,
        limit: PAGE_SIZE,
        totalPages,
        totalCount,
      }}
    />
  );
}

