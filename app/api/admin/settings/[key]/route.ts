import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/settings/[key]
 * Get a specific setting by key (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { key } = await params;

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    let value;
    try {
      value = JSON.parse(setting.value);
    } catch {
      value = setting.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...setting,
        value,
      },
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch setting' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/[key]
 * Update a specific setting by key (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { key } = await params;
    const body = await request.json();
    const { value, category, description } = body;

    if (value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Value is required' },
        { status: 400 }
      );
    }

    // Convert value to string
    const stringValue = typeof value === 'string' 
      ? value 
      : JSON.stringify(value);

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: stringValue,
        ...(category && { category }),
        ...(description && { description }),
        updatedBy: session.user.id,
      },
      create: {
        key,
        value: stringValue,
        category: category || 'general',
        description: description || null,
        updatedBy: session.user.id,
      },
    });

    let parsedValue;
    try {
      parsedValue = JSON.parse(setting.value);
    } catch {
      parsedValue = setting.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...setting,
        value: parsedValue,
      },
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

