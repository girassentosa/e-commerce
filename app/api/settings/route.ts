import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings
 * Get public settings (no auth required)
 * Returns only general settings that can be displayed publicly
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';

    const settings = await prisma.setting.findMany({
      where: {
        category: category,
      },
      select: {
        key: true,
        value: true,
      },
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
      data: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

