/**
 * Checkout Validation API
 * POST /api/checkout/validate - Validate cart before checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/checkout/validate
 * Validate cart items (stock, active status)
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

    // Get user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate each item
    const errors: string[] = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.product;

      // Check if product is active
      if (!product.isActive) {
        errors.push(`${product.name} is no longer available`);
        continue;
      }

      // Check stock
      if (product.stockQuantity < item.quantity) {
        errors.push(
          `${product.name}: only ${product.stockQuantity} left in stock`
        );
        continue;
      }

      // Calculate subtotal
      const price = parseFloat(String(product.salePrice || product.price));
      subtotal += price * item.quantity;
    }

    // Calculate tax and shipping
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal >= 50 ? 0 : 5; // Free shipping over $50
    const total = subtotal + tax + shipping;

    return NextResponse.json({
      success: true,
      validation: {
        valid: errors.length === 0,
        errors,
        summary: {
          itemCount: cart.items.length,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          shipping: shipping.toFixed(2),
          total: total.toFixed(2),
        },
      },
    });
  } catch (error) {
    console.error('Error validating checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate checkout' },
      { status: 500 }
    );
  }
}

