import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/admin/upload
 * Upload image file to server (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
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

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `product-${timestamp}-${randomString}.${extension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'images', 'products');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL
    const publicUrl = `/images/products/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/upload
 * Delete uploaded image file (temporary or saved to DB)
 */
export async function DELETE(request: NextRequest) {
  let imageUrl: string | undefined;
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    imageUrl = body.imageUrl;

    if (!imageUrl || !imageUrl.startsWith('/images/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Normalize path - remove leading slash if present
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const filepath = join(process.cwd(), 'public', normalizedPath);
    
    console.log('🗑️  [DELETE UPLOAD] Deleting image:', imageUrl);
    console.log('🗑️  [DELETE UPLOAD] Normalized path:', normalizedPath);
    console.log('🗑️  [DELETE UPLOAD] Full path:', filepath);
    
    if (existsSync(filepath)) {
      await unlink(filepath);
      console.log('✅ [DELETE UPLOAD] Deleted image file:', imageUrl);
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      // File doesn't exist, but return success anyway
      console.log('⚠️  [DELETE UPLOAD] File not found (already deleted?):', imageUrl);
      console.log('⚠️  [DELETE UPLOAD] Expected path:', filepath);
      return NextResponse.json({
        success: true,
        message: 'Image already deleted or not found',
      });
    }
  } catch (error: any) {
    console.error('❌ [DELETE UPLOAD] Error deleting file:', imageUrl || 'unknown');
    console.error('❌ [DELETE UPLOAD] Error details:', error.message);
    console.error('❌ [DELETE UPLOAD] Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

