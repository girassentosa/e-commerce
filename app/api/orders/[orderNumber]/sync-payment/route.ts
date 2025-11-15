/**
 * Sync Payment Status API
 * POST /api/orders/[orderNumber]/sync-payment
 * Sync payment status from Midtrans API to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

const MIDTRANS_SANDBOX_BASE = 'https://api.sandbox.midtrans.com';
const MIDTRANS_PRODUCTION_BASE = 'https://api.midtrans.com';

function getMidtransBaseUrl() {
  const baseUrl = process.env.MIDTRANS_BASE_URL || MIDTRANS_SANDBOX_BASE;
  return baseUrl;
}

function getMidtransServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }
  return key.trim();
}

function mapStatus(transactionStatus: string): PaymentStatus {
  switch (transactionStatus) {
    case 'capture':
    case 'settlement':
      return PaymentStatus.PAID;
    case 'deny':
    case 'cancel':
    case 'expire':
    case 'failure':
      return PaymentStatus.FAILED;
    case 'refund':
      return PaymentStatus.REFUNDED;
    default:
      return PaymentStatus.PENDING;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderNumber } = await params;

    // Get order
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get payment transaction
    const payment = order.paymentTransactions?.[0];
    if (!payment || !payment.transactionId) {
      return NextResponse.json(
        { success: false, error: 'Payment transaction not found or no transaction ID' },
        { status: 404 }
      );
    }

    // Check status from Midtrans API
    const baseUrl = getMidtransBaseUrl();
    const serverKey = getMidtransServerKey();
    const authHeader = Buffer.from(`${serverKey}:`).toString('base64');

    const midtransResponse = await fetch(`${baseUrl}/v2/${payment.transactionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!midtransResponse.ok) {
      console.error('Midtrans status check failed:', {
        status: midtransResponse.status,
        orderNumber,
        transactionId: payment.transactionId,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to check status from Midtrans' },
        { status: 500 }
      );
    }

    const midtransData = await midtransResponse.json();

    console.log('Midtrans status check result:', {
      orderNumber,
      transactionId: payment.transactionId,
      transactionStatus: midtransData.transaction_status,
      statusCode: midtransData.status_code,
    });

    // Map status
    const newPaymentStatus = mapStatus(midtransData.transaction_status);

    // Update database if status changed
    if (order.paymentStatus !== newPaymentStatus) {
      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            status: newPaymentStatus,
            rawResponse: midtransData,
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: newPaymentStatus,
            transactionId: midtransData.transaction_id || order.transactionId,
            paidAt: newPaymentStatus === PaymentStatus.PAID ? new Date() : order.paidAt,
          },
        }),
      ]);

      console.log('Payment status synced:', {
        orderNumber,
        oldStatus: order.paymentStatus,
        newStatus: newPaymentStatus,
      });
    }

    // Get updated order
    const updatedOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        paymentStatus: newPaymentStatus,
        synced: order.paymentStatus !== newPaymentStatus,
      },
    });
  } catch (error) {
    console.error('Error syncing payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync payment status' },
      { status: 500 }
    );
  }
}

