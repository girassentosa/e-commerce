import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics for user (order counts)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch all stats in parallel using count queries (much faster than fetching all orders)
    const [
      totalOrders,
      belumBayar,
      dikemas,
      dikirim,
      deliveredOrders,
      reviews,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: { userId },
      }),
      // Belum bayar (PENDING payment)
      prisma.order.count({
        where: {
          userId,
          paymentStatus: 'PENDING',
        },
      }),
      // Dikemas (PROCESSING status)
      prisma.order.count({
        where: {
          userId,
          status: 'PROCESSING',
        },
      }),
      // Dikirim (SHIPPED status)
      prisma.order.count({
        where: {
          userId,
          status: 'SHIPPED',
        },
      }),
      // Delivered orders (for review count)
      prisma.order.findMany({
        where: {
          userId,
          status: 'DELIVERED',
        },
        select: {
          id: true,
        },
      }),
      // User's reviews
      prisma.review.findMany({
        where: {
          userId,
        },
        select: {
          orderId: true,
        },
      }),
    ]);

    // Count orders that need review (DELIVERED but no review yet)
    const reviewedOrderIds = new Set(reviews.map((r) => r.orderId).filter(Boolean));
    const beriPenilaian = deliveredOrders.filter((o) => !reviewedOrderIds.has(o.id)).length;

    const stats = {
      totalOrders,
      belumBayar,
      dikemas,
      dikirim,
      beriPenilaian,
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

