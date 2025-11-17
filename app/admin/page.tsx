import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

type DashboardStats = {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: string;
    status: string;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
};

async function getDashboardStats(): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalSalesData,
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.product.count({
      where: { isActive: true },
    }),
    prisma.user.count(),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      take: 10,
      orderBy: { stockQuantity: 'asc' },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    }),
  ]);

  return {
    totalSales: Number(totalSalesData._sum.total || 0),
    totalOrders,
    totalProducts,
    totalUsers,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total.toString(),
      createdAt: order.createdAt.toISOString(),
    })),
    lowStockProducts,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const stats = await getDashboardStats();

  return (
    <AdminDashboardClient
      initialStats={stats}
      userEmail={session.user.email}
      generatedAt={new Date().toISOString()}
    />
  );
}

