import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

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

    // Validate file size (5MB max for review images)
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
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
 * POST /api/reviews/upload
 * Upload review image file (Authenticated users only)
 * Supports file upload only (no URL download for reviews)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication (any logged-in user can upload review images)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `review-${session.user.id}-${timestamp}-${randomString}.${fileExtension}`;

    let publicUrl: string;

    // Try Cloudinary first (production)
    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadToCloudinary(buffer, 'reviews', `review-${session.user.id}-${timestamp}`);
        publicUrl = uploadResult.secure_url;
      } catch (error: any) {
        console.error('❌ Cloudinary upload error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to upload to Cloudinary. Please try again.' 
          },
          { status: 500 }
        );
      }
    } else {
      // Fallback to local storage (development)
      try {
        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'images', 'reviews');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return public URL
        publicUrl = `/images/reviews/${filename}`;
      } catch (error: any) {
        console.error('❌ Local storage upload error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to save file to local storage. In production, Cloudinary is required. Please set Cloudinary environment variables.' 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename,
      },
      message: 'Review image uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading review image:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload review image' },
      { status: 500 }
    );
  }
}

