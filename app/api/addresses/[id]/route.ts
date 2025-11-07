/**
 * Shipping Address API Routes
 * GET /api/addresses/[id] - Get single address
 * PUT /api/addresses/[id] - Update address
 * DELETE /api/addresses/[id] - Delete address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateAddressSchema } from '@/lib/validations/address';
import { z } from 'zod';

/**
 * GET /api/addresses/[id]
 * Get single address
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get address
    const address = await prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/addresses/[id]
 * Update address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if address exists and ownership
    const existingAddress = await prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    if (existingAddress.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: {
          userId: session.user.id,
          orderId: null,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update address
    const address = await prisma.shippingAddress.update({
      where: { id },
      data: {
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error updating address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/addresses/[id]
 * Delete address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if address exists and ownership
    const address = await prisma.shippingAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address not found' },
        { status: 404 }
      );
    }

    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Prevent deletion if used in orders
    if (address.orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete address used in orders',
        },
        { status: 400 }
      );
    }

    // Delete address
    await prisma.shippingAddress.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

