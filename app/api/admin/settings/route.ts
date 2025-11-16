import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/settings
 * Get all settings or by category (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Transform to key-value object
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting) => {
      try {
        // Try to parse JSON, fallback to string
        settingsMap[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsMap[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: category ? settingsMap : { settings, map: settingsMap },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update settings (bulk update) (Admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    const updates = [];
    const adminId = session.user.id;

    // Map keys to categories
    const categoryMap: Record<string, string> = {
      // General
      storeName: 'general',
      storeDescription: 'general',
      contactEmail: 'general',
      contactPhone: 'general',
      storeAddress: 'general',
      currency: 'general',
      timezone: 'general',
      // Product
      defaultLowStockThreshold: 'product',
      productsPerPage: 'product',
      autoHideOutOfStock: 'product',
      productWarranty: 'product',
      deliveryGuaranteeTitle: 'product',
      deliveryGuaranteeDescription: 'product',
      // Order
      autoCancelPendingDays: 'order',
      allowOrderCancellation: 'order',
      minimumOrderAmount: 'order',
      // Payment
      paymentTimeoutHours: 'payment',
      // Shipping
      freeShippingThreshold: 'shipping',
      defaultShippingCost: 'shipping',
      // Email
      smtpHost: 'email',
      smtpPort: 'email',
      smtpUser: 'email',
      fromEmail: 'email',
      fromName: 'email',
      // SEO
      metaTitle: 'seo',
      metaDescription: 'seo',
      googleAnalyticsId: 'seo',
    };

    for (const [key, value] of Object.entries(settings)) {
      // Convert value to string (JSON stringify if object/array)
      const stringValue = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);

      const category = categoryMap[key] || 'general';

      updates.push(
        prisma.setting.upsert({
          where: { key },
          update: {
            value: stringValue,
            category,
            updatedBy: adminId,
          },
          create: {
            key,
            value: stringValue,
            category,
            updatedBy: adminId,
          },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

