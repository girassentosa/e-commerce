/**
 * Admin Order Detail API
 * GET /api/admin/orders/[orderNumber] - Get order detail (Admin only)
 * PATCH /api/admin/orders/[orderNumber] - Update order status (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Update order status schema
 */
const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/admin/orders/[orderNumber]
 * Get order detail by order number (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { orderNumber } = await params;

    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    imageUrl: true,
                    altText: true,
                  },
                },
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
          },
        },
        shippingAddress: {
          where: {
            orderId: { not: null },
          },
          take: 1,
        },
        paymentTransactions: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching admin order detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[orderNumber]
 * Update order status (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { orderNumber } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateOrderStatusSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    // Check if order exists with items
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Track if status is changing
    const isStatusChanging = status && status !== existingOrder.status;
    const oldStatus = existingOrder.status;
    const newStatus = status || oldStatus;

    // Update order and salesCount in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const updateData: any = {};
      if (status) {
        updateData.status = status;
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const updated = await tx.order.update({
        where: { orderNumber },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update salesCount based on status change
      // salesCount hanya dihitung dari order yang statusnya DELIVERED
      if (isStatusChanging) {
        console.log('Order status changing:', {
          orderNumber,
          oldStatus,
          newStatus,
          itemsCount: existingOrder.items.length,
        });

        // Case 1: Status changed to DELIVERED (from non-DELIVERED)
        if (newStatus === 'DELIVERED' && oldStatus !== 'DELIVERED') {
          console.log('Incrementing salesCount for DELIVERED order');
          // Increment salesCount for each item
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                salesCount: {
                  increment: item.quantity,
                },
              },
            });
            console.log(`Incremented salesCount for product ${item.productId} by ${item.quantity}`);
          }
        }
        // Case 2: Status changed from DELIVERED to non-DELIVERED (CANCELLED/REFUNDED)
        else if (oldStatus === 'DELIVERED' && newStatus !== 'DELIVERED' && (newStatus === 'CANCELLED' || newStatus === 'REFUNDED')) {
          console.log('Decrementing salesCount for cancelled/refunded order');
          // Decrement salesCount for each item
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                salesCount: {
                  decrement: item.quantity,
                },
              },
            });
            console.log(`Decremented salesCount for product ${item.productId} by ${item.quantity}`);
          }
        }
        // Case 3: Status changed from CANCELLED/REFUNDED back to DELIVERED
        else if ((oldStatus === 'CANCELLED' || oldStatus === 'REFUNDED') && newStatus === 'DELIVERED') {
          console.log('Incrementing salesCount for order changed back to DELIVERED');
          // Increment salesCount for each item
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                salesCount: {
                  increment: item.quantity,
                },
              },
            });
            console.log(`Incremented salesCount for product ${item.productId} by ${item.quantity}`);
          }
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

