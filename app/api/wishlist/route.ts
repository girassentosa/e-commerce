/**
 * Wishlist API Routes
 * GET /api/wishlist - Get user's wishlist
 * POST /api/wishlist - Add item to wishlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addToWishlistSchema } from '@/lib/validations/wishlist';
import { z } from 'zod';

/**
 * GET /api/wishlist
 * Fetch user's wishlist
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

    // Get wishlist items
    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: 'desc' },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                imageUrl: true,
                altText: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: wishlistItems,
      count: wishlistItems.length,
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Add item to wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addToWishlistSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already in wishlist (use unique constraint)
    const existingItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: validatedData.productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: 'Product is already in wishlist' },
        { status: 400 }
      );
    }

    // Create wishlist item
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              take: 1,
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlistItem,
    });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

