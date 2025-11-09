import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Validate file size (5MB max)
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
 * POST /api/admin/upload
 * Upload image file to server or download from URL (Admin only)
 * Supports both file upload and URL download
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
      const randomString = Math.random().toString(36).substring(2, 8);
      filename = `product-${timestamp}-${randomString}.${extension}`;
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
      extension = file.name.split('.').pop() || 'jpg';
      filename = `product-${timestamp}-${randomString}.${extension}`;

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      return NextResponse.json(
        { success: false, error: 'No file or URL provided' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured()) {
      // Use Cloudinary for production
      try {
        let uploadResult;
        
        if (imageUrl) {
          // Upload from URL to Cloudinary
          uploadResult = await uploadFromUrlToCloudinary(imageUrl, 'products');
        } else {
          // Upload file buffer to Cloudinary
          uploadResult = await uploadToCloudinary(buffer, 'products');
        }

        return NextResponse.json({
          success: true,
          data: {
            url: uploadResult.secure_url,
            filename: uploadResult.public_id,
          },
        });
      } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json(
          { success: false, error: error.message || 'Failed to upload to Cloudinary' },
          { status: 500 }
        );
      }
    } else {
      // Fallback to local storage (for development only)
      // ⚠️ WARNING: This will NOT work in production (Vercel, Netlify, etc.)
      // Production platforms have read-only file system
      
      // Check if we're in production
      // Use multiple checks to detect production environment
      const isProduction = 
        process.env.NODE_ENV === 'production' || 
        process.env.VERCEL_ENV === 'production' ||
        process.env.VERCEL === '1';
      
      if (isProduction) {
        // In production, Cloudinary is REQUIRED
        // Log detailed debug info
        console.error('❌ [Upload] Production upload failed - Cloudinary not configured');
        console.error('🔍 [Upload] Environment check:', {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL: process.env.VERCEL,
          has_cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
          has_api_key: !!process.env.CLOUDINARY_API_KEY,
          has_api_secret: !!process.env.CLOUDINARY_API_SECRET,
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cloudinary is required in production. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables in your hosting platform (Vercel/Netlify/etc) and redeploy.' 
          },
          { status: 500 }
        );
      }

      // Only allow local storage in development
      try {
        // Create upload directory if it doesn't exist
        const uploadDir = join(process.cwd(), 'public', 'images', 'products');
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Save file
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
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
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

    // Note: We don't delete images to keep old photos accessible
    // This is intentional - old photos should remain in storage
    
    // If using local storage, we can optionally delete local files
    // But for Cloudinary, we keep all photos (don't delete)
    if (imageUrl && imageUrl.startsWith('/images/')) {
      // Only delete local files if not using Cloudinary
      if (!isCloudinaryConfigured()) {
        const normalizedPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        const filepath = join(process.cwd(), 'public', normalizedPath);
        
        if (existsSync(filepath)) {
          await unlink(filepath);
          console.log('✅ [DELETE UPLOAD] Deleted local image file:', imageUrl);
        }
      }
    }

    // Always return success - we keep old photos in Cloudinary
    return NextResponse.json({
      success: true,
      message: 'Image deletion handled (old photos are kept for history)',
    });
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

