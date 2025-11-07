import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/users/[id]
 * Get single user by ID (Admin only)
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user (Admin only)
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness if changed
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Validate role if provided
    if (body.role && body.role !== 'ADMIN' && body.role !== 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (body.email !== undefined) updateData.email = body.email;
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Hash password if provided
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Hard delete - permanently delete user and all related data (Admin only)
 * This will:
 * - Delete user avatar file from disk (if exists)
 * - Delete all user orders (cascade)
 * - Delete all user cart items (cascade)
 * - Delete all user wishlist items (cascade)
 * - Delete all user reviews (cascade)
 * - Delete all user shipping addresses (cascade)
 * - Delete all user notifications (cascade)
 * - Delete the user itself
 * - All data can be reused (email can be used again)
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

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    console.log('🗑️  [DELETE USER] Starting hard delete for user ID:', id);

    // Get user with avatar before deleting
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('📊 [DELETE USER] User found:', user.email);
    console.log('📊 [DELETE USER] Avatar URL:', user.avatarUrl || 'No avatar');

    // Delete avatar file from disk if exists
    let avatarDeleted = false;
    if (user.avatarUrl && user.avatarUrl.startsWith('/images/')) {
      try {
        // Normalize path - remove leading slash if present
        const normalizedPath = user.avatarUrl.startsWith('/')
          ? user.avatarUrl.substring(1)
          : user.avatarUrl;
        const filepath = join(process.cwd(), 'public', normalizedPath);

        console.log('🔍 [DELETE USER] Checking avatar file:', user.avatarUrl);
        console.log('🔍 [DELETE USER] Full path:', filepath);

        if (existsSync(filepath)) {
          await unlink(filepath);
          avatarDeleted = true;
          console.log('✅ [DELETE USER] Deleted avatar file:', user.avatarUrl);
        } else {
          console.log('⚠️  [DELETE USER] Avatar file not found (already deleted?):', user.avatarUrl);
        }
      } catch (error: any) {
        console.error('❌ [DELETE USER] Failed to delete avatar file:', user.avatarUrl);
        console.error('❌ [DELETE USER] Error details:', error.message);
        // Continue with user deletion even if avatar deletion fails
      }
    }

    // Delete user from database (cascade will handle related data)
    // This will automatically delete:
    // - Cart (cascade)
    // - Order (cascade) - WARNING: Historical order data will be lost
    // - Review (cascade) - WARNING: Customer reviews will be lost
    // - Wishlist (cascade)
    // - ShippingAddress (cascade)
    // - Notification (cascade)
    await prisma.user.delete({
      where: { id },
    });

    console.log('✅ [DELETE USER] User deleted from database');
    console.log('✅ [DELETE USER] All related data cascade deleted');

    return NextResponse.json({
      success: true,
      message: 'User permanently deleted successfully',
      data: {
        deletedUser: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        avatarDeleted,
        note: 'All related data (orders, cart, wishlist, reviews, addresses, notifications) have been deleted. Email can now be reused.',
      },
    });
  } catch (error: any) {
    console.error('❌ [DELETE USER] Error deleting user:', error);
    console.error('❌ [DELETE USER] Error details:', error.message);
    console.error('❌ [DELETE USER] Error stack:', error.stack);

    // Check if user not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

