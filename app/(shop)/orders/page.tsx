import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStoreSettingsServer } from '@/lib/settings';
import OrdersPageClient from './OrdersPageClient';
import { Loader } from '@/components/ui/Loader';

export const dynamic = 'force-dynamic';

type PageSearchParams = Record<string, string | string[] | undefined>;

type OrderRecord = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
            images: {
              take: 1;
              orderBy: { sortOrder: 'asc' };
              select: {
                imageUrl: true;
                altText: true;
              };
            };
          };
        };
        variant: true;
      };
    };
    shippingAddress: {
      where: {
        orderId: { not: null };
      };
      take: 1;
    };
  };
}>;

function toStringValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? undefined;
}

function mapOrder(order: OrderRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    subtotal: order.subtotal.toString(),
    tax: order.tax.toString(),
    shippingCost: order.shippingCost.toString(),
    serviceFee: order.serviceFee?.toString(),
    paymentFee: order.paymentFee?.toString(),
    discount: order.discount.toString(),
    total: order.total.toString(),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paymentChannel: order.paymentChannel,
    paidAt: order.paidAt?.toISOString() || null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price.toString(),
      total: item.total.toString(),
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      selectedImageUrl: item.selectedImageUrl,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        images: item.product.images.map((img) => ({
          imageUrl: img.imageUrl,
          altText: img.altText,
        })),
      },
      variant: item.variant ? {
        id: item.variant.id,
        productId: item.variant.productId,
        name: item.variant.name,
        value: item.variant.value,
        priceModifier: item.variant.priceModifier.toString(),
        stockQuantity: item.variant.stockQuantity,
      } : null,
    })),
    shippingAddress: order.shippingAddress.map((addr) => ({
      id: addr.id,
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
    })),
  };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: PageSearchParams | Promise<PageSearchParams>;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/orders');
  }

  // Resolve searchParams if it's a Promise (Next.js 15+)
  const params = searchParams instanceof Promise ? await searchParams : searchParams;

  const limit = 10;
  const page = Math.max(
    1,
    parseInt(toStringValue(params.page) || '1', 10) || 1,
  );

  const status = toStringValue(params.status);
  const paymentStatus = toStringValue(params.paymentStatus);

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.OrderWhereInput = {
    userId: session.user.id,
  };

  // Filter by status if provided
  // Valid OrderStatus values: PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  if (status && ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) {
    where.status = status as any;
  }

  // Filter by payment status if provided
  if (paymentStatus && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
    where.paymentStatus = paymentStatus as any;
  }

  // Fetch orders and settings in parallel
  const [ordersRaw, total, settings] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    imageUrl: true,
                    altText: true,
                  },
                },
              },
            },
            variant: true,
          },
        },
        shippingAddress: {
          where: {
            orderId: { not: null },
          },
          take: 1,
        },
      },
    }),
    prisma.order.count({ where }),
    getStoreSettingsServer(),
  ]);

  const orders = ordersRaw.map(mapOrder);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currency = settings.currency || 'IDR';

  // Create unique key based on filters and page to force re-render with new data
  const componentKey = `orders-${status || 'all'}-${paymentStatus || 'all'}-page-${page}`;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Memuat daftar pesanan...</p>
          </div>
        </div>
      }
    >
      <OrdersPageClient
        key={componentKey}
        ordersData={{
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        }}
        initialCurrency={currency}
      />
    </Suspense>
  );
}
