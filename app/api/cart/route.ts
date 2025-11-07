/**
 * Cart API Routes
 * GET /api/cart - Get user's cart
 * POST /api/cart - Add item to cart
 * DELETE /api/cart - Clear entire cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addToCartSchema } from '@/lib/validations/cart';
import { z } from 'zod';

/**
 * GET /api/cart
 * Fetch user's cart with all items
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

    // Get cart (use findFirst because userId is not unique)
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
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
            variant: true,
          },
        },
      },
    });

    // If no cart exists, create empty one
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
        include: {
          items: {
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
              variant: true,
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      const price = parseFloat(String(item.product.salePrice || item.product.price));
      return sum + (price * item.quantity);
    }, 0);

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        cart,
        subtotal: subtotal.toFixed(2),
        itemCount,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Add item to cart
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
    const validatedData = addToCartSchema.parse(body);

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not found or unavailable' },
        { status: 404 }
      );
    }

    // Check stock availability
    if (product.stockQuantity < validatedData.quantity) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock' },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: validatedData.productId,
        variantId: validatedData.variantId || null,
      },
    });

    let cartItem;

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + validatedData.quantity;

      // Check stock for new quantity
      if (product.stockQuantity < newQuantity) {
        return NextResponse.json(
          { success: false, error: 'Cannot add more items - insufficient stock' },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          variantId: validatedData.variantId,
          quantity: validatedData.quantity,
          price: product.salePrice || product.price,
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
          variant: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
      data: cartItem,
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

    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Clear entire cart
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cart
    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        message: 'Cart is already empty',
      });
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}

