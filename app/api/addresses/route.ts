/**
 * Shipping Addresses API Routes
 * GET /api/addresses - Get user's addresses
 * POST /api/addresses - Add new address
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addAddressSchema } from '@/lib/validations/address';
import { z } from 'zod';

/**
 * GET /api/addresses
 * Get all addresses for authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all addresses for user
    const addresses = await prisma.shippingAddress.findMany({
      where: {
        userId: session.user.id,
        orderId: null, // Only get saved addresses, not order-specific ones
      },
      orderBy: [
        { isDefault: 'desc' }, // Default first
        { id: 'desc' }, // Then by ID (CUID is sequential, acts as creation time proxy)
      ],
    });

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/addresses
 * Add new address
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addAddressSchema.parse(body);

    // If this is default, set all other addresses to non-default
    if (validatedData.isDefault) {
      await prisma.shippingAddress.updateMany({
        where: {
          userId: session.user.id,
          orderId: null,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create new address
    const address = await prisma.shippingAddress.create({
      data: {
        userId: session.user.id,
        fullName: validatedData.fullName,
        phone: validatedData.phone,
        addressLine1: validatedData.addressLine1,
        addressLine2: validatedData.addressLine2 || null,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        isDefault: validatedData.isDefault,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
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

    console.error('Error adding address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add address' },
      { status: 500 }
    );
  }
}

