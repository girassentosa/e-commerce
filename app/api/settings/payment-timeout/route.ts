import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/payment-timeout
 * Get payment timeout in minutes from settings (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'paymentTimeoutHours' },
    });

    if (!setting) {
      // Default to 1440 minutes (24 hours) if not set
      return NextResponse.json({
        success: true,
        data: 1440,
      });
    }

    let timeoutMinutes = 1440; // Default fallback (24 hours in minutes)
    try {
      const parsed = JSON.parse(setting.value);
      timeoutMinutes = typeof parsed === 'number' ? parsed : parseInt(setting.value, 10) || 1440;
    } catch (e) {
      // If parsing fails, try direct parseInt
      timeoutMinutes = parseInt(setting.value, 10) || 1440;
    }

    // Ensure minimum 1 minute
    if (timeoutMinutes < 1) {
      timeoutMinutes = 1440;
    }

    return NextResponse.json({
      success: true,
      data: timeoutMinutes,
    });
  } catch (error) {
    console.error('Error fetching payment timeout:', error);
    // Return default 1440 minutes (24 hours) on error
    return NextResponse.json({
      success: true,
      data: 1440,
    });
  }
}

