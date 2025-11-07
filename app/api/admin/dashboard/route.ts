import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics for admin
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all stats in parallel
    const [
      totalSalesData,
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // Total sales in last 30 days
      prisma.order.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
      // Total orders count
      prisma.order.count(),
      // Total active products
      prisma.product.count({
        where: { isActive: true },
      }),
      // Total users
      prisma.user.count(),
      // Recent 5 orders
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
      // Low stock products
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

    const stats = {
      totalSales: Number(totalSalesData._sum.total || 0),
      totalOrders,
      totalProducts,
      totalUsers,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        total: order.total.toString(),
      })),
      lowStockProducts,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

