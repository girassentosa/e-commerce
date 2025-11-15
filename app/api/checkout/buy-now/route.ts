/**
 * Buy Now Checkout API
 * POST /api/checkout/buy-now - Create order directly from product (buy now flow)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buyNowCheckoutSchema } from '@/lib/validations/checkout';
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
    const total = Math.round((subtotal + shippingCost + biayaLayanan - discount) * 100) / 100; // Round to 2 decimals

    // Prepare items for Midtrans (must include shipping and service fee as separate items)
    // Include brand in product name for professional display in payment
    const productName = product.brand 
      ? `${product.brand} - ${product.name}`
      : product.name;
    
    const itemsForPayment = [
      {
        id: product.id,
        name: productName,
        price: unitPrice,
        quantity: validatedData.quantity,
      },
    ];
    
    // Add shipping as a separate item if > 0
    if (shippingCost > 0) {
      itemsForPayment.push({
        id: 'SHIPPING',
        name: 'Shipping Cost',
        price: Math.round(shippingCost), // Round to integer for Midtrans
        quantity: 1,
      });
    }
    
    // Add service fee as a separate item if > 0
    if (biayaLayanan > 0) {
      itemsForPayment.push({
        id: 'SERVICE_FEE',
        name: 'Service Fee',
        price: Math.round(biayaLayanan), // Round to integer for Midtrans (Rupiah)
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
    // Increase timeout to 10 seconds to handle longer operations
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
          paymentTransactions: true,
        },
      });

      // Log paymentIntent untuk debugging
      console.log('PaymentIntent data (buy-now):', {
        paymentType: paymentIntent.paymentType,
        qrString: paymentIntent.qrString ? `${paymentIntent.qrString.substring(0, 30)}...` : null,
        qrImageUrl: paymentIntent.qrImageUrl ? 'EXISTS' : null,
        vaNumber: paymentIntent.vaNumber,
        vaBank: paymentIntent.vaBank,
        hasRawResponse: !!paymentIntent.rawResponse,
      });

      // Extract QR data from rawResponse if qrString/qrImageUrl is null (fallback)
      let finalQrString = paymentIntent.qrString;
      let finalQrImageUrl = paymentIntent.qrImageUrl;
      
      if ((!finalQrString || !finalQrImageUrl) && paymentIntent.rawResponse) {
        const raw = paymentIntent.rawResponse;
        console.log('Extracting from rawResponse (buy-now), raw keys:', Object.keys(raw));
        
        // Try to extract from rawResponse
        if (!finalQrString) {
          finalQrString = raw.qr_string 
            || raw.qr_code 
            || raw.qrString
            || raw.qris?.qr_string
            || raw.qris?.qr_code
            || (raw.actions?.find((a: any) => a.name === 'generate-qr-code' || a.name === 'qr-code')?.qr_string)
            || null;
          if (finalQrString) {
            console.log('Extracted qrString from rawResponse (buy-now)');
          }
        }
        
        if (!finalQrImageUrl) {
          const qrAction = raw.actions?.find((action: any) => 
            action.name === 'generate-qr-code' || 
            action.name === 'qr-code' ||
            action.name === 'qris'
          );
          finalQrImageUrl = qrAction?.url 
            || raw.qr_url 
            || raw.qrImageUrl
            || raw.qris?.qr_url
            || raw.qris?.qrImageUrl
            || null;
          if (finalQrImageUrl) {
            console.log('Extracted qrImageUrl from rawResponse (buy-now)');
          }
        }
      }

      // Log final values before saving
      console.log('Final payment transaction data (buy-now):', {
        paymentType: paymentIntent.paymentType,
        qrString: finalQrString ? `${finalQrString.substring(0, 30)}...` : null,
        qrImageUrl: finalQrImageUrl ? 'EXISTS' : null,
        vaNumber: paymentIntent.vaNumber,
        vaBank: paymentIntent.vaBank,
      });

      const paymentTx = await tx.paymentTransaction.create({
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
          qrString: finalQrString,
          qrImageUrl: finalQrImageUrl,
          paymentUrl: paymentIntent.paymentUrl,
          instructions: paymentIntent.instructions,
          expiresAt: paymentIntent.expiresAt ? new Date(paymentIntent.expiresAt) : null,
          rawResponse: paymentIntent.rawResponse || undefined,
        },
      });

      console.log('Payment transaction created (buy-now):', {
        id: paymentTx.id,
        paymentType: paymentTx.paymentType,
        qrString: paymentTx.qrString ? `${paymentTx.qrString.substring(0, 30)}...` : null,
        qrImageUrl: paymentTx.qrImageUrl ? 'EXISTS' : null,
        vaNumber: paymentTx.vaNumber,
        vaBank: paymentTx.vaBank,
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

      // Return order with payment transaction manually attached to avoid timeout
      // We already have all the data we need from newOrder and paymentTx
      return {
        ...newOrder,
        paymentTransactions: [paymentTx],
      };
    }, {
      timeout: 10000, // 10 seconds timeout
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

    console.error('Error creating buy now order:', error);
    
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

