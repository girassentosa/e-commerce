import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const shippingSettingsSchema = z.object({
  freeShippingThreshold: z.number().nullable().optional(),
  defaultShippingCost: z.number().nullable().optional(),
});

/**
 * PUT /api/admin/products/[id]/shipping
 * Update shipping settings for a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();
    const validatedData = shippingSettingsSchema.parse(body);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update product shipping settings
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        freeShippingThreshold: validatedData.freeShippingThreshold !== undefined 
          ? validatedData.freeShippingThreshold 
          : product.freeShippingThreshold,
        defaultShippingCost: validatedData.defaultShippingCost !== undefined 
          ? validatedData.defaultShippingCost 
          : product.defaultShippingCost,
      },
      select: {
        id: true,
        name: true,
        freeShippingThreshold: true,
        defaultShippingCost: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error: any) {
    console.error('Error updating product shipping settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update shipping settings' },
      { status: 500 }
    );
  }
}

