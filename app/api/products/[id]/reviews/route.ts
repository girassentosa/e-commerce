/**
 * Product Reviews API Routes
 * GET /api/products/[id]/reviews - Get reviews for a product
 * POST /api/products/[id]/reviews - Create a review (customer only, after order)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { buildPaginationMeta } from '@/lib/api-helpers';

/**
 * Review creation schema
 */
const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  orderId: z.string().optional(),
});

/**
 * GET /api/products/[id]/reviews
 * Get reviews for a product with pagination and filters
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - rating: Filter by rating (1-5)
 * - sortBy: Sort by (newest, helpful, rating) (default: newest)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Build where clause
    const where: any = {
      productId,
    };

    if (rating && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }

    // Build orderBy clause
    let orderBy: any = {};
    if (sortBy === 'helpful') {
      orderBy = { helpfulCount: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else {
      // Default: newest
      orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    // Fetch reviews with user info
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a review for a product (customer only, after order)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = createReviewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { rating, title, comment, orderId } = validationResult.data;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId: session.user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: 'You have already reviewed this product' },
        { status: 409 }
      );
    }

    // If orderId is provided, verify that the user has ordered this product
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId: session.user.id,
          items: {
            some: {
              productId,
            },
          },
        },
      });

      if (order) {
        isVerifiedPurchase = true;
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId: session.user.id,
        rating,
        title: title || null,
        comment: comment || null,
        orderId: orderId || null,
        isVerifiedPurchase,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update product rating average and count
    const allReviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    const ratingCount = allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: averageRating,
        ratingCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

