/**
 * Checkout API
 * POST /api/checkout - Create order from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations/checkout';
import { z } from 'zod';

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * POST /api/checkout
 * Create order from cart items
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
    const validatedData = checkoutSchema.parse(body);

    // Get user's cart with items
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

    // Validate address
    const address = await prisma.shippingAddress.findUnique({
      where: { id: validatedData.addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid address' },
        { status: 400 }
      );
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (!item.product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `Product ${item.product.name} is no longer available`,
          },
          { status: 400 }
        );
      }

      if (item.product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${item.product.name}`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      const price = parseFloat(String(item.product.salePrice || item.product.price));
      subtotal += price * item.quantity;
    }

    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = subtotal >= 50 ? 0 : 5; // Free shipping over $50
    const discount = 0; // No coupon yet
    const total = subtotal - discount + tax + shippingCost;

    // Generate unique order number
    let orderNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      orderNumber = generateOrderNumber();
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate order number' },
        { status: 500 }
      );
    }

    // Create order with items in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          orderNumber: orderNumber!,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: validatedData.paymentMethod,
          subtotal,
          tax,
          shippingCost,
          discount,
          total,
          notes: validatedData.notes || null,
          // Create order items
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.product.salePrice || item.product.price,
              total: parseFloat(String(item.product.salePrice || item.product.price)) * item.quantity,
            })),
          },
          // Link shipping address
          shippingAddress: {
            create: {
              userId: session.user.id,
              fullName: address.fullName,
              phone: address.phone,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              isDefault: false,
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      // Update product stock and sales count
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
            salesCount: {
              increment: item.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
        orderNumber: order.orderNumber,
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

    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

