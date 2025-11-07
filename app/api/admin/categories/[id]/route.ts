import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * PUT /api/admin/categories/[id]
 * Update category (Admin only)
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

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: body.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Category with this slug already exists' },
          { status: 409 }
        );
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.parentId !== undefined && { parentId: body.parentId }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      include: {
        parent: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Hard delete - permanently delete category and image file (Admin only)
 * This will:
 * - Delete category image file from disk (if exists)
 * - Delete the category itself
 * - All data can be reused (slug can be used again)
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

    console.log('🗑️  [DELETE CATEGORY] Starting hard delete for category ID:', id);

    // Get category with image before deleting
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${productsCount} product(s). Please reassign or delete products first.`,
        },
        { status: 400 }
      );
    }

    // Check if category has subcategories
    const childrenCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category with ${childrenCount} subcategorie(s). Please delete subcategories first.`,
        },
        { status: 400 }
      );
    }

    console.log('📊 [DELETE CATEGORY] Category found:', category.name);
    console.log('📊 [DELETE CATEGORY] Image URL:', category.imageUrl || 'No image');

    // Delete image file from disk if exists
    let imageDeleted = false;
    if (category.imageUrl && category.imageUrl.startsWith('/images/')) {
      try {
        // Normalize path - remove leading slash if present
        const normalizedPath = category.imageUrl.startsWith('/')
          ? category.imageUrl.substring(1)
          : category.imageUrl;
        const filepath = join(process.cwd(), 'public', normalizedPath);

        console.log('🔍 [DELETE CATEGORY] Checking image file:', category.imageUrl);
        console.log('🔍 [DELETE CATEGORY] Full path:', filepath);

        if (existsSync(filepath)) {
          await unlink(filepath);
          imageDeleted = true;
          console.log('✅ [DELETE CATEGORY] Deleted image file:', category.imageUrl);
        } else {
          console.log('⚠️  [DELETE CATEGORY] Image file not found (already deleted?):', category.imageUrl);
        }
      } catch (error: any) {
        console.error('❌ [DELETE CATEGORY] Failed to delete image file:', category.imageUrl);
        console.error('❌ [DELETE CATEGORY] Error details:', error.message);
        // Continue with category deletion even if image deletion fails
      }
    }

    // Delete category from database
    await prisma.category.delete({
      where: { id },
    });

    console.log('✅ [DELETE CATEGORY] Category deleted from database');

    return NextResponse.json({
      success: true,
      message: 'Category permanently deleted successfully',
      data: {
        deletedCategory: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        },
        imageDeleted,
        note: 'Category deleted. Slug can now be reused.',
      },
    });
  } catch (error: any) {
    console.error('❌ [DELETE CATEGORY] Error deleting category:', error);
    console.error('❌ [DELETE CATEGORY] Error details:', error.message);

    // Check if category not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

