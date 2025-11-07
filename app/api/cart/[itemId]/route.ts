/**
 * Cart Item API Routes
 * PUT /api/cart/[itemId] - Update item quantity
 * DELETE /api/cart/[itemId] - Remove item from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateCartItemSchema } from '@/lib/validations/cart';
import { z } from 'zod';

/**
 * PUT /api/cart/[itemId]
 * Update cart item quantity
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15+)
    const { itemId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateCartItemSchema.parse(body);

    // Get cart item with product and cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check stock availability
    if (cartItem.product.stockQuantity < validatedData.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${cartItem.product.stockQuantity} items available in stock`,
        },
        { status: 400 }
      );
    }

    // Update cart item
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: validatedData.quantity },
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
        variant: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart item updated',
      data: updatedItem,
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

    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[itemId]
 * Remove item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Await params (Next.js 15+)
    const { itemId } = await params;

    // Get cart item with cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (cartItem.cart.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}

