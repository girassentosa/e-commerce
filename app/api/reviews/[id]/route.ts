/**
 * Review Management API Routes
 * PUT /api/reviews/[id] - Update review (customer own review)
 * DELETE /api/reviews/[id] - Delete review (customer own review or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Update review schema
 */
const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
});

/**
 * PUT /api/reviews/[id]
 * Update review (customer own review only)
 */
export async function PUT(
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

    const { id: reviewId } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateReviewSchema.safeParse(body);
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

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        productId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check ownership (customer can only update their own review)
    if (existingReview.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only update your own reviews' },
        { status: 403 }
      );
    }

    const { rating, title, comment } = validationResult.data;

    // Update review
    const updateData: any = {};
    if (rating !== undefined) {
      updateData.rating = rating;
    }
    if (title !== undefined) {
      updateData.title = title || null;
    }
    if (comment !== undefined) {
      updateData.comment = comment || null;
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
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

    // Update product rating average if rating changed
    if (rating !== undefined) {
      const allReviews = await prisma.review.findMany({
        where: { productId: existingReview.productId },
        select: { rating: true },
      });

      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;
      const ratingCount = allReviews.length;

      await prisma.product.update({
        where: { id: existingReview.productId },
        data: {
          ratingAverage: averageRating,
          ratingCount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Delete review (customer own review or admin)
 */
export async function DELETE(
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

    const { id: reviewId } = await params;

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        userId: true,
        productId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check ownership (customer can only delete their own review, admin can delete any)
    if (existingReview.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only delete your own reviews' },
        { status: 403 }
      );
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update product rating average and count
    const allReviews = await prisma.review.findMany({
      where: { productId: existingReview.productId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allReviews.length;
      const ratingCount = allReviews.length;

      await prisma.product.update({
        where: { id: existingReview.productId },
        data: {
          ratingAverage: averageRating,
          ratingCount,
        },
      });
    } else {
      // No reviews left, reset to 0
      await prisma.product.update({
        where: { id: existingReview.productId },
        data: {
          ratingAverage: 0,
          ratingCount: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}

