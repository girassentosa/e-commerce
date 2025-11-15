import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/products/[id]
 * Get single product by ID (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: true,
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: product.price.toString(),
        salePrice: product.salePrice?.toString() || null,
        weight: product.weight?.toString() || null,
        ratingAverage: product.ratingAverage.toString(),
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]
 * Update product (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existingProduct.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: body.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Product with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Use transaction to update product and images atomically
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // 1. Update product basic info
      const product = await tx.product.update({
        where: { id },
        data: {
          ...(body.categoryId && { categoryId: body.categoryId }),
          ...(body.name && { name: body.name }),
          ...(body.slug && { slug: body.slug }),
          ...(body.sku !== undefined && { sku: body.sku }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.price !== undefined && { price: body.price }),
          ...(body.salePrice !== undefined && { salePrice: body.salePrice }),
          ...(body.stockQuantity !== undefined && { stockQuantity: body.stockQuantity }),
          ...(body.lowStockThreshold !== undefined && { lowStockThreshold: body.lowStockThreshold }),
          ...(body.weight !== undefined && { weight: body.weight }),
          ...(body.brand !== undefined && { brand: body.brand }),
          ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.specifications !== undefined && { 
            specifications: body.specifications && Object.keys(body.specifications).length > 0 
              ? body.specifications 
              : null 
          }),
        },
      });

      // 2. Handle images if provided
      if (body.images !== undefined) {
        // Get old images before deleting from DB
        const oldImages = await tx.productImage.findMany({
          where: { productId: id },
          select: { imageUrl: true },
        });

        // Get list of new image URLs that will be saved
        const newImageUrls = body.images && body.images.length > 0
          ? body.images.map((img: any) => img.imageUrl)
          : [];

        console.log('📊 [UPDATE PRODUCT] Product ID:', id);
        console.log('📊 [UPDATE PRODUCT] Old images in DB:', oldImages.map(img => img.imageUrl));
        console.log('📊 [UPDATE PRODUCT] New images to save:', newImageUrls);

        // Delete all existing images from database FIRST
        await tx.productImage.deleteMany({
          where: { productId: id },
        });
        console.log('✅ [UPDATE PRODUCT] Deleted all old images from DB');

        // Delete old image files from disk (cleanup orphaned files)
        // Only delete files that are NOT in the new images list
        const filesToDelete: string[] = [];
        const filesToKeep: string[] = [];

        for (const oldImage of oldImages) {
          // Skip if this old image is being kept (exists in new images)
          if (newImageUrls.includes(oldImage.imageUrl)) {
            filesToKeep.push(oldImage.imageUrl);
            console.log('⏭️  [UPDATE PRODUCT] Keeping image (exists in new list):', oldImage.imageUrl);
            continue;
          }

          filesToDelete.push(oldImage.imageUrl);
        }

        console.log('🗑️  [UPDATE PRODUCT] Files to delete from disk:', filesToDelete);
        console.log('💾 [UPDATE PRODUCT] Files to keep:', filesToKeep);

        // Delete files from disk
        for (const imageUrl of filesToDelete) {
          try {
            // Normalize path - remove leading slash if present
            const normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
            const filepath = join(process.cwd(), 'public', normalizedPath);
            
            console.log('🔍 [UPDATE PRODUCT] Checking file:', imageUrl);
            console.log('🔍 [UPDATE PRODUCT] Full path:', filepath);
            
            if (existsSync(filepath)) {
              await unlink(filepath);
              console.log('✅ [UPDATE PRODUCT] Deleted old image file:', imageUrl);
            } else {
              console.log('⚠️  [UPDATE PRODUCT] File not found (already deleted?):', imageUrl);
              console.log('⚠️  [UPDATE PRODUCT] Expected path:', filepath);
            }
          } catch (error: any) {
            // Log but don't fail the transaction if file deletion fails
            console.error('❌ [UPDATE PRODUCT] Failed to delete image file:', imageUrl);
            console.error('❌ [UPDATE PRODUCT] Error details:', error.message);
            console.error('❌ [UPDATE PRODUCT] Error stack:', error.stack);
          }
        }

        // Create new images if any
        if (body.images && body.images.length > 0) {
          await tx.productImage.createMany({
            data: body.images.map((img: any, index: number) => ({
              productId: id,
              imageUrl: img.imageUrl,
              altText: img.altText || '',
              sortOrder: index,
              isPrimary: index === 0,
            })),
          });
        }
      }

      // 3. Return product with updated images
      return await tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        price: updatedProduct.price.toString(),
        salePrice: updatedProduct.salePrice?.toString() || null,
        weight: updatedProduct.weight?.toString() || null,
        ratingAverage: updatedProduct.ratingAverage.toString(),
      },
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[id]
 * Partial update (e.g., toggle status) (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProduct,
        price: updatedProduct.price.toString(),
        salePrice: updatedProduct.salePrice?.toString() || null,
        weight: updatedProduct.weight?.toString() || null,
        ratingAverage: updatedProduct.ratingAverage.toString(),
      },
    });
  } catch (error) {
    console.error('Error patching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Hard delete - permanently delete product and all related data (Admin only)
 * This will:
 * - Delete all product images from database and disk
 * - Delete all product variants
 * - Delete all cart items referencing this product
 * - Delete all wishlist items referencing this product
 * - Delete all reviews for this product
 * - Delete all order items referencing this product (historical data will be lost)
 * - Delete the product itself
 * - All data can be reused (slug, SKU, etc. can be used again)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;

    console.log('🗑️  [DELETE PRODUCT] Starting hard delete for product ID:', id);

    // Get product with images before deleting
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    console.log('📊 [DELETE PRODUCT] Product found:', product.name);
    console.log('📊 [DELETE PRODUCT] Images to delete:', product.images.length);

    // Get all image URLs before deleting from database
    const imageUrls = product.images.map((img) => img.imageUrl);
    console.log('📊 [DELETE PRODUCT] Image URLs:', imageUrls);

    // Delete product from database (cascade will handle related data)
    // This will automatically delete:
    // - ProductImage (cascade)
    // - ProductVariant (cascade)
    // - CartItem (cascade)
    // - OrderItem (cascade) - WARNING: Historical order data will be lost
    // - Review (cascade) - WARNING: Customer reviews will be lost
    // - Wishlist (cascade)
    await prisma.product.delete({
      where: { id },
    });

    console.log('✅ [DELETE PRODUCT] Product deleted from database');
    console.log('✅ [DELETE PRODUCT] All related data cascade deleted');

    // Delete all image files from disk
    const deletedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (const imageUrl of imageUrls) {
      try {
        // Normalize path - remove leading slash if present
        const normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        const filepath = join(process.cwd(), 'public', normalizedPath);

        console.log('🔍 [DELETE PRODUCT] Checking file:', imageUrl);
        console.log('🔍 [DELETE PRODUCT] Full path:', filepath);

        if (existsSync(filepath)) {
          await unlink(filepath);
          deletedFiles.push(imageUrl);
          console.log('✅ [DELETE PRODUCT] Deleted image file:', imageUrl);
        } else {
          console.log('⚠️  [DELETE PRODUCT] File not found (already deleted?):', imageUrl);
          console.log('⚠️  [DELETE PRODUCT] Expected path:', filepath);
        }
      } catch (error: any) {
        failedFiles.push(imageUrl);
        console.error('❌ [DELETE PRODUCT] Failed to delete image file:', imageUrl);
        console.error('❌ [DELETE PRODUCT] Error details:', error.message);
        console.error('❌ [DELETE PRODUCT] Error stack:', error.stack);
      }
    }

    console.log('📊 [DELETE PRODUCT] Deleted files:', deletedFiles.length);
    console.log('📊 [DELETE PRODUCT] Failed files:', failedFiles.length);

    // Return success even if some files failed to delete (product is already deleted from DB)
    return NextResponse.json({
      success: true,
      message: 'Product permanently deleted successfully',
      data: {
        deletedProduct: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
        },
        deletedImages: deletedFiles.length,
        failedImages: failedFiles.length,
        note: 'All related data (images, variants, cart items, wishlist, reviews, order items) have been deleted. Slug and SKU can now be reused.',
      },
    });
  } catch (error: any) {
    console.error('❌ [DELETE PRODUCT] Error deleting product:', error);
    console.error('❌ [DELETE PRODUCT] Error details:', error.message);
    console.error('❌ [DELETE PRODUCT] Error stack:', error.stack);

    // Check if product not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

