import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStoreSettingsServer } from '@/lib/settings';
import EditProductClient from './EditProductClient';

export const dynamic = 'force-dynamic';

async function getProductData(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: {
        orderBy: { sortOrder: 'asc' },
        select: {
          imageUrl: true,
          altText: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const productImages = product.images.map((img) => ({
    imageUrl: img.imageUrl,
    altText: img.altText || '',
  }));

  const productSpecs = (product.specifications as Record<string, string>) || {};

  return {
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    sku: product.sku || '',
    description: product.description || '',
    price: Number(product.price),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    weight: product.weight ? Number(product.weight) : null,
    brand: product.brand || '',
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    specifications: productSpecs,
    images: productImages,
    freeShippingThreshold: product.freeShippingThreshold ? Number(product.freeShippingThreshold) : null,
    defaultShippingCost: product.defaultShippingCost ? Number(product.defaultShippingCost) : null,
    serviceFee: product.serviceFee ? Number(product.serviceFee) : null,
  };
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
  return categories;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/products');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;

  const [productData, categories, settings] = await Promise.all([
    getProductData(id),
    getCategories(),
    getStoreSettingsServer(),
  ]);

  if (!productData) {
    notFound();
  }

  const currency = settings.currency || 'USD';

  return (
    <EditProductClient
      productId={id}
      initialProduct={productData}
      categories={categories}
      currency={currency}
    />
  );
}
