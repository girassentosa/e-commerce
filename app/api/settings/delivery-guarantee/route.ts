/**
 * Delivery Guarantee Settings API Route
 * GET /api/settings/delivery-guarantee - Get delivery guarantee settings (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/delivery-guarantee
 * Get delivery guarantee settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get delivery guarantee settings
    const [titleSetting, descriptionSetting] = await Promise.all([
      prisma.setting.findUnique({
        where: { key: 'deliveryGuaranteeTitle' },
      }),
      prisma.setting.findUnique({
        where: { key: 'deliveryGuaranteeDescription' },
      }),
    ]);

    const title = titleSetting?.value || null;
    const description = descriptionSetting?.value || null;

    return NextResponse.json({
      success: true,
      data: {
        title,
        description,
      },
    });
  } catch (error) {
    console.error('Error fetching delivery guarantee settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch delivery guarantee settings',
      },
      { status: 500 }
    );
  }
}

