import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/profile/avatar
 * Upload avatar image
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Get old avatar URL before updating (for cleanup)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `avatar-${session.user.id}-${timestamp}.${extension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'images', 'avatars');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save new file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/images/avatars/${filename}`;

    // Update user avatar URL in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl: publicUrl,
      },
    });

    // Delete old avatar file from disk (cleanup orphaned file)
    if (currentUser?.avatarUrl) {
      try {
        const oldFilepath = join(process.cwd(), 'public', currentUser.avatarUrl);
        if (existsSync(oldFilepath)) {
          await unlink(oldFilepath);
          console.log('✅ Deleted old avatar:', currentUser.avatarUrl);
        }
      } catch (error) {
        // Log but don't fail the request if old file deletion fails
        console.error('⚠️ Failed to delete old avatar file:', currentUser.avatarUrl, error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

