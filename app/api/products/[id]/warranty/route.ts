/**
 * Product Warranty API Route
 * GET /api/products/[id]/warranty - Get warranty information for a product
 * Returns warranty from settings if available, otherwise returns null
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/[id]/warranty
 * Get warranty information for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get productWarranty setting
    const warrantySetting = await prisma.setting.findUnique({
      where: { key: 'productWarranty' },
    });

    if (!warrantySetting) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Parse warranty data
    let warrantyData: Record<string, Array<{ title: string; description: string }>> = {};
    try {
      warrantyData = JSON.parse(warrantySetting.value);
    } catch (e) {
      console.error('Error parsing productWarranty:', e);
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Get warranty for this specific product
    const productWarranty = warrantyData[id] || null;

    return NextResponse.json({
      success: true,
      data: productWarranty,
    });
  } catch (error) {
    console.error('Error fetching product warranty:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product warranty',
      },
      { status: 500 }
    );
  }
}

