/**
 * Admin Orders API Routes
 * GET /api/admin/orders - List all orders with filters, search, pagination (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPaginationMeta } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/orders
 * Get all orders with filters, search, and pagination (Admin only)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search by order number, customer email, or customer name
 * - status: Filter by order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
 * - paymentStatus: Filter by payment status (PENDING, PAID, FAILED, REFUNDED)
 * - dateFrom: Filter orders from date (ISO string)
 * - dateTo: Filter orders to date (ISO string)
 * - sortBy: Sort field (createdAt, total, orderNumber) (default: createdAt)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    // Search by order number, customer email, or customer name
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Filter by order status
    if (status && ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'].includes(status)) {
      where.status = status as any;
    }

    // Filter by payment status
    if (paymentStatus && ['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(paymentStatus)) {
      where.paymentStatus = paymentStatus as any;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (sortBy === 'total') {
      orderBy.total = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'orderNumber') {
      orderBy.orderNumber = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      // Default: createdAt
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
            take: 1, // Just get first item for preview
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
                    },
                  },
                },
              },
            },
          },
          shippingAddress: {
            where: {
              orderId: { not: null },
            },
            take: 1,
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: buildPaginationMeta(page, limit, totalCount),
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

