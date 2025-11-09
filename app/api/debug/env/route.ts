import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/debug/env
 * Debug endpoint to check environment variables (Admin only)
 * This helps troubleshoot Cloudinary configuration issues
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization (Admin only for security)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Get Cloudinary environment variables (without exposing secrets)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    return NextResponse.json({
      success: true,
      data: {
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'not-set',
          VERCEL_ENV: process.env.VERCEL_ENV || 'not-set',
          VERCEL: process.env.VERCEL || 'not-set',
        },
        cloudinary: {
          configured: !!(cloudName && apiKey && apiSecret),
          has_cloud_name: !!cloudName,
          has_api_key: !!apiKey,
          has_api_secret: !!apiSecret,
          cloud_name_length: cloudName?.length || 0,
          api_key_length: apiKey?.length || 0,
          api_secret_length: apiSecret?.length || 0,
          cloud_name_preview: cloudName ? `${cloudName.substring(0, 4)}...` : 'not-set',
          api_key_preview: apiKey ? `${apiKey.substring(0, 4)}...` : 'not-set',
        },
        is_production: 
          process.env.NODE_ENV === 'production' || 
          process.env.VERCEL_ENV === 'production' ||
          process.env.VERCEL === '1',
      },
    });
  } catch (error: any) {
    console.error('Error in debug/env:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get environment info' },
      { status: 500 }
    );
  }
}

