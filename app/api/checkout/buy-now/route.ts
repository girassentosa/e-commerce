/**
 * Buy Now Checkout API
 * POST /api/checkout/buy-now - Create order directly from product (buy now flow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buyNowCheckoutSchema } from '@/lib/validations/checkout';
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
 * POST /api/checkout/buy-now
 * Create order directly from product (buy now flow)
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
    const validatedData = buyNowCheckoutSchema.parse(body);

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product is no longer available' },
        { status: 400 }
      );
    }

    // Find variant if color and size provided
    let variantId: string | null = null;
    if (validatedData.color || validatedData.size) {
      const variantConditions = [];
      if (validatedData.color) {
        variantConditions.push({
          name: 'Color',
          value: { contains: validatedData.color, mode: 'insensitive' as const },
        });
      }
      if (validatedData.size) {
        variantConditions.push({
          name: 'Size',
          value: { contains: validatedData.size, mode: 'insensitive' as const },
        });
      }

      // Try to find variant matching both conditions
      if (variantConditions.length > 0) {
        const variants = await prisma.productVariant.findMany({
          where: {
            productId: product.id,
            OR: variantConditions,
          },
        });

        // If we have both color and size, try to find one that matches both
        if (validatedData.color && validatedData.size && variants.length > 0) {
          const matchingVariant = variants.find(
            (v) =>
              (v.name === 'Color' && v.value.toLowerCase().includes(validatedData.color!.toLowerCase())) ||
              (v.name === 'Size' && v.value.toLowerCase().includes(validatedData.size!.toLowerCase()))
          );
          // For now, we'll use the first variant found or null
          // In a more complex system, you might want to find a combination variant
        }

        // Use first variant found if any
        if (variants.length > 0) {
          variantId = variants[0].id;
        }
      }
    }

    // Validate stock
    const stockToCheck = variantId
      ? product.variants.find((v) => v.id === variantId)?.stockQuantity ?? product.stockQuantity
      : product.stockQuantity;

    if (stockToCheck < validatedData.quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient stock. Only ${stockToCheck} available.`,
        },
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

    // Calculate totals
    const basePrice = parseFloat(String(product.salePrice || product.price));
    const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
    const variantPriceModifier = variant ? parseFloat(String(variant.priceModifier)) : 0;
    const unitPrice = basePrice + variantPriceModifier;
    const subtotal = unitPrice * validatedData.quantity;

    // Calculate shipping and fees (matching frontend calculation)
    const subtotalPengiriman = 15000; // Fixed shipping cost
    const biayaLayanan = 2000; // Fixed service fee
    const totalDiskonPengiriman = 0; // No shipping discount for now
    const voucherDiskon = 0; // No voucher discount for now
    const shippingCost = subtotalPengiriman;
    const discount = totalDiskonPengiriman + voucherDiskon;
    const tax = 0; // No tax for now (matching frontend)
    const total = subtotal + shippingCost + biayaLayanan - discount;

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
          // Create order item
          items: {
            create: {
              productId: product.id,
              variantId: variantId || null,
              selectedColor: validatedData.color || null,
              selectedSize: validatedData.size || null,
              selectedImageUrl: validatedData.imageUrl || null,
              productName: product.name,
              quantity: validatedData.quantity,
              price: unitPrice,
              total: subtotal,
            },
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
      if (variantId) {
        // Update variant stock if variant exists
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockQuantity: {
              decrement: validatedData.quantity,
            },
          },
        });
      }

      // Update product stock and sales count
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: {
            decrement: validatedData.quantity,
          },
          salesCount: {
            increment: validatedData.quantity,
          },
        },
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

    console.error('Error creating buy now order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

