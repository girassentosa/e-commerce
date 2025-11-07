/**
 * Admin Reviews API Routes
 * GET /api/admin/reviews - List all reviews with filters, search, pagination (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPaginationMeta } from '@/lib/api-helpers';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/reviews
 * Get all reviews with filters, search, and pagination (Admin only)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - search: Search by product name, customer email, or review title/comment
 * - rating: Filter by rating (1-5)
 * - productId: Filter by product ID
 * - userId: Filter by user ID
 * - sortBy: Sort field (createdAt, rating, helpfulCount) (default: createdAt)
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
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const productId = searchParams.get('productId') || '';
    const userId = searchParams.get('userId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.ReviewWhereInput = {};

    // Search by product name, customer email, or review title/comment
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        {
          product: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
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

    // Filter by rating
    if (rating && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }

    // Filter by product ID
    if (productId) {
      where.productId = productId;
    }

    // Filter by user ID
    if (userId) {
      where.userId = userId;
    }

    // Build orderBy clause
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'helpfulCount') {
      orderBy.helpfulCount = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      // Default: createdAt
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: buildPaginationMeta(page, limit, totalCount),
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

