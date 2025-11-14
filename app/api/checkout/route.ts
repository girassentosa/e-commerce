/**
 * Checkout API
 * POST /api/checkout - Create order from cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkoutSchema } from '@/lib/validations/checkout';
import { createPaymentIntent } from '@/lib/payments';
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
    const cartItemDetails = cart.items.map((item) => {
      const price = parseFloat(String(item.product.salePrice || item.product.price));
      // Include brand in product name for professional display in payment
      const productName = item.product.brand 
        ? `${item.product.brand} - ${item.product.name}`
        : item.product.name;
      return {
        id: item.productId,
        name: productName,
        price,
        quantity: item.quantity,
      };
    });

    const subtotal = cartItemDetails.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax, rounded to 2 decimals first
    const shippingCost = subtotal >= 50 ? 0 : 5; // Free shipping over $50
    const discount = 0; // No coupon yet
    const total = Math.round((subtotal - discount + tax + shippingCost) * 100) / 100; // Round to 2 decimals

    // Prepare items for Midtrans (must include tax and shipping as separate items)
    const itemsForPayment = [...cartItemDetails];
    
    // Add tax as a separate item if > 0
    if (tax > 0) {
      itemsForPayment.push({
        id: 'TAX',
        name: 'Tax (10%)',
        price: Math.round(tax), // Round to integer for Midtrans (Rupiah)
        quantity: 1,
      });
    }
    
    // Add shipping as a separate item if > 0
    if (shippingCost > 0) {
      itemsForPayment.push({
        id: 'SHIPPING',
        name: 'Shipping Cost',
        price: Math.round(shippingCost), // Round to integer for Midtrans (Rupiah)
        quantity: 1,
      });
    }
    
    // Recalculate total from rounded items to ensure consistency
    const roundedTotal = itemsForPayment.reduce((sum, item) => sum + Math.round(item.price) * item.quantity, 0);

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

    const userFullName = session.user.firstName && session.user.lastName
      ? `${session.user.firstName} ${session.user.lastName}`
      : session.user.firstName || session.user.lastName || '';
    const customerFullName = address.fullName || userFullName || '';
    const [customerFirstName, ...customerRest] = customerFullName.trim().split(' ');
    const customerLastName = customerRest.join(' ') || null;

    let paymentIntent;
    try {
      paymentIntent = await createPaymentIntent({
        method: validatedData.paymentMethod,
        orderNumber: orderNumber!,
        amount: roundedTotal, // Use rounded total to ensure consistency with Midtrans
        channel: validatedData.paymentChannel || null,
        customer: {
          firstName: customerFirstName || null,
          lastName: customerLastName,
          email: session.user.email || '',
          phone: address.phone,
        },
        items: itemsForPayment.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        shipping: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
      });
    } catch (paymentError: any) {
      console.error('Payment intent creation error:', paymentError);
      return NextResponse.json(
        {
          success: false,
          error: paymentError.message || 'Failed to initialize payment',
        },
        { status: 400 }
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
          paymentChannel: validatedData.paymentMethod === 'VIRTUAL_ACCOUNT' ? validatedData.paymentChannel : null,
          transactionId: paymentIntent.transactionId || null,
          subtotal,
          tax,
          shippingCost,
          discount,
          total: roundedTotal, // Use rounded total for consistency
          notes: validatedData.notes || null,
          // Create order items
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              selectedColor: item.selectedColor || null,
              selectedSize: item.selectedSize || null,
              selectedImageUrl: item.selectedImageUrl || null,
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
          paymentTransactions: true,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          orderId: newOrder.id,
          provider: paymentIntent.provider,
          paymentType: paymentIntent.paymentType,
          channel: paymentIntent.channel,
          amount: total,
          status: paymentIntent.status,
          transactionId: paymentIntent.transactionId,
          vaNumber: paymentIntent.vaNumber,
          vaBank: paymentIntent.vaBank,
          qrString: paymentIntent.qrString,
          qrImageUrl: paymentIntent.qrImageUrl,
          paymentUrl: paymentIntent.paymentUrl,
          instructions: paymentIntent.instructions,
          expiresAt: paymentIntent.expiresAt ? new Date(paymentIntent.expiresAt) : null,
          rawResponse: paymentIntent.rawResponse || undefined,
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
      const firstError = error.issues[0];
      const errorMessage = firstError?.message || 'Validation failed';
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error creating order:', error);
    
    // Provide more specific error message
    let errorMessage = 'Failed to create order';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Log full error for debugging
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

