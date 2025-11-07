/**
 * Checkout Calculate API
 * POST /api/checkout/calculate - Calculate order totals
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateTotalsSchema } from '@/lib/validations/checkout';
import { z } from 'zod';

/**
 * POST /api/checkout/calculate
 * Calculate totals with discount and shipping
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
    const validatedData = calculateTotalsSchema.parse(body);

    // Get user's cart
    const cart = await prisma.cart.findFirst({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
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

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      const price = parseFloat(String(item.product.salePrice || item.product.price));
      subtotal += price * item.quantity;
    }

    // Calculate discount (simplified - no coupon system yet)
    const discount = 0;

    // Calculate tax (10%)
    const tax = subtotal * 0.1;

    // Calculate shipping ($5 if under $50, free otherwise)
    const shipping = subtotal >= 50 ? 0 : 5;

    // Calculate total
    const total = subtotal - discount + tax + shipping;

    return NextResponse.json({
      success: true,
      data: {
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        tax: tax.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
      },
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

    console.error('Error calculating totals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate totals' },
      { status: 500 }
    );
  }
}

