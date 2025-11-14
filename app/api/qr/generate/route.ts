import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';

/**
 * GET /api/qr/generate
 * Generate QR code image from qrString
 * This ensures the QR code is valid and can be scanned
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const qrString = searchParams.get('string');

    if (!qrString) {
      return NextResponse.json(
        { success: false, error: 'QR string is required' },
        { status: 400 }
      );
    }

    // Generate QR code as PNG buffer with high quality
    const qrCodeBuffer = await QRCode.toBuffer(qrString, {
      type: 'png',
      width: 512, // High resolution for better scanning
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for better reliability
    });

    // Return QR code image with proper headers
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(qrCodeBuffer);
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qris-qr-code.png"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

