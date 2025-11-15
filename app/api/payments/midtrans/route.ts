import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

function verifySignature(body: any) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return false;
  }
  const rawSignature = `${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`;
  const expected = crypto.createHash('sha512').update(rawSignature).digest('hex');
  return expected === body.signature_key;
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

function extractPaymentChannel(body: any) {
  if (body.payment_type === 'bank_transfer') {
    if (body.va_numbers?.length) {
      return {
        vaNumber: body.va_numbers[0].va_number,
        vaBank: body.va_numbers[0].bank?.toUpperCase() || null,
      };
    }
    if (body.permata_va_number) {
      return {
        vaNumber: body.permata_va_number,
        vaBank: 'PERMATA',
      };
    }
  }

  return {
    vaNumber: null,
    vaBank: null,
  };
}

// GET handler untuk testing/debugging
export async function GET() {
  return NextResponse.json({
    message: 'Midtrans webhook endpoint',
    note: 'This endpoint only accepts POST requests from Midtrans',
    status: 'active',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log webhook received for debugging
    console.log('Midtrans webhook received:', {
      order_id: body.order_id,
      transaction_status: body.transaction_status,
      payment_type: body.payment_type,
      status_code: body.status_code,
      has_signature: !!body.signature_key,
    });

    if (!verifySignature(body)) {
      console.error('Midtrans webhook signature verification failed:', {
        order_id: body.order_id,
      });
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 403 });
    }

    const orderNumber = body.order_id;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      console.error('Midtrans webhook: Order not found:', orderNumber);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const payment = await prisma.paymentTransaction.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      console.error('Midtrans webhook: Payment record not found for order:', orderNumber);
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    const paymentStatus = mapStatus(body.transaction_status);
    const { vaNumber, vaBank } = extractPaymentChannel(body);

    // Log before update
    console.log('Midtrans webhook updating:', {
      orderNumber,
      currentPaymentStatus: order.paymentStatus,
      newPaymentStatus: paymentStatus,
      transaction_status: body.transaction_status,
    });

    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          transactionId: body.transaction_id || payment.transactionId,
          vaNumber: vaNumber || payment.vaNumber,
          vaBank: vaBank || payment.vaBank,
          qrString: body.qr_string || payment.qrString,
          qrImageUrl: body.qr_url || payment.qrImageUrl,
          paymentUrl: body.actions?.find((action: any) => action.name === 'deeplink-redirect')?.url || payment.paymentUrl,
          rawResponse: body,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus,
          transactionId: body.transaction_id || order.transactionId,
          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : order.paidAt,
        },
      }),
    ]);

    // Log after update
    console.log('Midtrans webhook update successful:', {
      orderNumber,
      paymentStatus,
      isPaid: paymentStatus === PaymentStatus.PAID,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

