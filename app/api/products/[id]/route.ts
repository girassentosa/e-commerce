/**
 * Product Detail API Routes
 * GET /api/products/[id] - Get single product
 * PUT /api/products/[id] - Update product (Admin only)
 * DELETE /api/products/[id] - Delete product (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProductSchema } from '@/lib/validations/product';
import { requireAdmin } from '@/lib/api-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

/**
 * GET /api/products/[id]
 * Get single product detail
 * For public users: only returns active products
 * For admin users: returns all products (active or inactive)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is admin
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    // Find product
    // For public users: only show active products
    // For admin users: show all products
    const product = await prisma.product.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { isActive: true }), // Only filter isActive for non-admin users
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        variants: true,
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            wishlists: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Increment views count (fire and forget - don't wait)
    prisma.product
      .update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to update views:', err));

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Update product (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    await requireAdmin(request);

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = updateProductSchema.parse(body);

    // Check if slug is being changed and already exists
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'A product with this slug already exists',
          },
          { status: 400 }
        );
      }
    }

    // Check if SKU is being changed and already exists
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (skuExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'A product with this SKU already exists',
          },
          { status: 400 }
        );
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.slug && { slug: validatedData.slug }),
        ...(validatedData.categoryId && { categoryId: validatedData.categoryId }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.price && { price: validatedData.price }),
        ...(validatedData.salePrice !== undefined && { salePrice: validatedData.salePrice }),
        ...(validatedData.stockQuantity !== undefined && { stockQuantity: validatedData.stockQuantity }),
        ...(validatedData.lowStockThreshold !== undefined && { lowStockThreshold: validatedData.lowStockThreshold }),
        ...(validatedData.sku !== undefined && { sku: validatedData.sku }),
        ...(validatedData.brand !== undefined && { brand: validatedData.brand }),
        ...(validatedData.weight !== undefined && { weight: validatedData.weight }),
        ...(validatedData.isFeatured !== undefined && { isFeatured: validatedData.isFeatured }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.metaTitle !== undefined && { metaTitle: validatedData.metaTitle }),
        ...(validatedData.metaDescription !== undefined && { metaDescription: validatedData.metaDescription }),
        updatedAt: new Date(),
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    // Authorization error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login',
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

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

    // Database or unknown error
    console.error('Error updating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update product',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products/[id]
 * Delete product (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    await requireAdmin(request);

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Delete product (cascade delete will handle images, variants, etc.)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    // Authorization error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login',
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

    // Database or unknown error
    console.error('Error deleting product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete product',
      },
      { status: 500 }
    );
  }
}

