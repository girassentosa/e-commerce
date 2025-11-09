import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToCloudinary, uploadFromUrlToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

/**
 * Helper function to download image from URL
 */
async function downloadImageFromUrl(url: string): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error('URL does not point to an image');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file size (2MB max for avatars)
    if (buffer.length > 2 * 1024 * 1024) {
      throw new Error('Image size must be less than 2MB');
    }

    // Get extension from content type or URL
    let extension = 'jpg';
    if (contentType.includes('png')) extension = 'png';
    else if (contentType.includes('gif')) extension = 'gif';
    else if (contentType.includes('webp')) extension = 'webp';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
    else {
      // Try to get extension from URL
      const urlMatch = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
      if (urlMatch) {
        extension = urlMatch[1].toLowerCase();
      }
    }

    return { buffer, contentType, extension };
  } catch (error: any) {
    throw new Error(`Failed to download image from URL: ${error.message}`);
  }
}

/**
 * POST /api/profile/avatar
 * Upload avatar image or download from URL
 * Supports both file upload and URL download
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
    const file = formData.get('file') as File | null;
    const imageUrl = formData.get('url') as string | null;

    let buffer: Buffer;
    let extension: string;
    let filename: string;

    // Handle URL download
    if (imageUrl) {
      // Validate URL
      try {
        new URL(imageUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL format' },
          { status: 400 }
        );
      }

      // Download image from URL
      const { buffer: downloadedBuffer, extension: downloadedExtension } = await downloadImageFromUrl(imageUrl);
      buffer = downloadedBuffer;
      extension = downloadedExtension;

      // Generate unique filename
      const timestamp = Date.now();
      filename = `avatar-${session.user.id}-${timestamp}.${extension}`;
    }
    // Handle file upload
    else if (file) {
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

      // Generate unique filename
      const timestamp = Date.now();
      extension = file.name.split('.').pop() || 'jpg';
      filename = `avatar-${session.user.id}-${timestamp}.${extension}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      return NextResponse.json(
        { success: false, error: 'No file or URL provided' },
        { status: 400 }
      );
    }

    // Get old avatar URL before updating (we keep it for history)
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    let publicUrl: string;
    let finalFilename: string;

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured()) {
      // Use Cloudinary for production
      try {
        let uploadResult;
        
        if (imageUrl) {
          // Upload from URL to Cloudinary
          uploadResult = await uploadFromUrlToCloudinary(imageUrl, 'avatars');
        } else {
          // Upload file buffer to Cloudinary
          uploadResult = await uploadToCloudinary(buffer, 'avatars');
        }

        publicUrl = uploadResult.secure_url;
        finalFilename = uploadResult.public_id;
      } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to upload to Cloudinary' },
          { status: 500 }
        );
      }
    } else {
      // Fallback to local storage (for development)
      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'images', 'avatars');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Save new file
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);

      // Return public URL
      publicUrl = `/images/avatars/${filename}`;
      finalFilename = filename;

      // Note: We don't delete old avatar files in local storage either
      // to keep history. Old photos remain accessible.
    }

    // Update user avatar URL in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatarUrl: publicUrl,
      },
    });

    // Note: We intentionally DON'T delete old avatar files
    // This ensures old photos remain accessible for history
    // Old photos are kept in Cloudinary/local storage

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: finalFilename,
      },
      message: 'Avatar uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

