/**
 * Admin Order Payment Status API
 * PATCH /api/admin/orders/[orderNumber]/payment - Update payment status (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Update payment status schema
 */
const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']),
  transactionId: z.string().optional(),
});

/**
 * PATCH /api/admin/orders/[orderNumber]/payment
 * Update payment status (Admin only)
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
    const validationResult = updatePaymentStatusSchema.safeParse(body);
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

    const { paymentStatus, transactionId } = validationResult.data;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update payment status
    const updateData: any = {
      paymentStatus,
    };

    if (transactionId !== undefined) {
      updateData.transactionId = transactionId;
    }

    const updatedOrder = await prisma.order.update({
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

    return NextResponse.json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

