/**
 * Review Helpful API Route
 * POST /api/reviews/[id]/helpful - Mark review as helpful
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/reviews/[id]/helpful
 * Increment helpful count for a review
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

    const { id: reviewId } = await params;

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      );
    }

    // Increment helpful count
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        helpfulCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review marked as helpful',
      data: {
        helpfulCount: updatedReview.helpfulCount,
      },
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}

