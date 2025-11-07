/**
 * Admin Review Management API Route
 * DELETE /api/admin/reviews/[id] - Delete review (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/admin/reviews/[id]
 * Delete review (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id: reviewId } = await params;

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        productId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
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

