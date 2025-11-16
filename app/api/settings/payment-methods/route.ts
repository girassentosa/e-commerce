import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/payment-methods
 * Get all active payment methods from settings
 */
export async function GET(request: NextRequest) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'paymentMethods' },
    });

    if (!setting) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    let paymentMethods = [];
    try {
      paymentMethods = JSON.parse(setting.value);
    } catch (e) {
      console.error('Error parsing paymentMethods:', e);
      paymentMethods = [];
    }

    // Filter only active payment methods
    const activeMethods = Array.isArray(paymentMethods)
      ? paymentMethods.filter((method: any) => method.isActive !== false)
      : [];

    return NextResponse.json({
      success: true,
      data: activeMethods,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

