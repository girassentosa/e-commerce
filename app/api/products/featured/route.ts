/**
 * Featured Products API Route
 * GET /api/products/featured - Get featured products
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/featured
 * Get featured products (limit 8 by default)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      orderBy: {
        salesCount: 'desc',
      },
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: {
            id: true,
            imageUrl: true,
            altText: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    // Transform products to include imageUrl and images array for frontend compatibility
    const transformedProducts = products.map((product) => {
      const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
      const { images: originalImages, _count, price: originalPrice, salePrice: originalSalePrice, ratingAverage, stockQuantity, ...rest } = product;
      
      return {
        ...rest,
        imageUrl: primaryImage?.imageUrl || null, // Add imageUrl at root level
        images: (originalImages || []).map((img) => img.imageUrl).filter((url): url is string => Boolean(url)), // Transform to array of URLs, filter out null/undefined
        price: originalPrice.toString(),
        salePrice: originalSalePrice?.toString() || null,
        rating: ratingAverage.toString(),
        reviewCount: _count.reviews,
        stock: stockQuantity,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products',
      },
      { status: 500 }
    );
  }
}

