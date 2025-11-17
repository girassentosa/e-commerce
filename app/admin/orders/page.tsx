import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminOrdersClient from './AdminOrdersClient';

const PAGE_SIZE = 20;

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
    items: {
      take: 1;
      include: {
        product: {
          select: {
            id: true;
            name: true;
            images: {
              take: 1;
              orderBy: { sortOrder: 'asc' };
              select: { imageUrl: true };
            };
          };
        };
      };
    };
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

async function getInitialOrders() {
  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          take: 1,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
    }),
    prisma.order.count(),
  ]);

  const mappedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total.toString(),
    currency: order.currency,
    createdAt: order.createdAt.toISOString(),
    user: {
      id: order.user.id,
      email: order.user.email,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
    },
    items: order.items.map((item) => ({
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        images: item.product.images.map((img) => ({
          imageUrl: img.imageUrl,
        })),
      },
    })),
    _count: order._count,
  }));

  return {
    orders: mappedOrders,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/orders');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { orders, totalCount, totalPages } = await getInitialOrders();

  return (
    <AdminOrdersClient
      initialOrders={orders}
      initialPagination={{
        page: 1,
        limit: PAGE_SIZE,
        totalPages,
        totalCount,
      }}
    />
  );
}

