import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient, { DashboardStats } from './DashboardClient';

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const [
    totalOrders,
    belumBayar,
    dikemas,
    dikirim,
    deliveredOrders,
    reviews,
  ] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.count({
      where: {
        userId,
        paymentStatus: 'PENDING',
      },
    }),
    prisma.order.count({
      where: {
        userId,
        status: 'PROCESSING',
      },
    }),
    prisma.order.count({
      where: {
        userId,
        status: 'SHIPPED',
      },
    }),
    prisma.order.findMany({
      where: {
        userId,
        status: 'DELIVERED',
      },
      select: {
        id: true,
      },
    }),
    prisma.review.findMany({
      where: { userId },
      select: {
        orderId: true,
      },
    }),
  ]);

  const reviewedOrderIds = new Set(reviews.map((review) => review.orderId).filter(Boolean));
  const beriPenilaian = deliveredOrders.filter((order) => !reviewedOrderIds.has(order.id)).length;

  return {
    totalOrders,
    belumBayar,
    dikemas,
    dikirim,
    beriPenilaian,
  };
}

async function getCartItemCount(userId: string): Promise<number> {
  const cartItemSum = await prisma.cartItem.aggregate({
    _sum: {
      quantity: true,
    },
    where: {
      cart: {
        userId,
      },
    },
  });

  return Number(cartItemSum._sum.quantity || 0);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const userId = session.user.id;

  const [stats, cartCount] = await Promise.all([
    getDashboardStats(userId),
    getCartItemCount(userId),
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialCartCount={cartCount}
    />
  );
}

