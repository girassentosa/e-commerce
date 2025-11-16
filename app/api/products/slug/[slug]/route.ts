/**
 * Product by Slug API Route
 * GET /api/products/slug/[slug] - Get single product by slug (public endpoint)
 * Only returns active products for public users
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/products/slug/[slug]
 * Get single product by slug
 * For public users: only returns active products
 * For admin users: returns all products (active or inactive)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if user is admin
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN';

    // Find product by slug
    // For public users: only show active products
    // For admin users: show all products
    const product = await prisma.product.findFirst({
      where: {
        slug,
        ...(isAdmin ? {} : { isActive: true }), // Only filter isActive for non-admin users
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            isPrimary: true,
            sortOrder: true,
          },
        },
        variants: true,
        reviews: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            wishlists: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    // Increment views count (fire and forget - don't wait)
    prisma.product
      .update({
        where: { id: product.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch((err) => console.error('Failed to update views:', err));

    // Transform product to include imageUrl and images array for frontend compatibility
    const primaryImage = product.images && product.images.length > 0
      ? (product.images.find((img) => img.isPrimary) || product.images[0])
      : null;
    const { images: originalImages, _count, price: originalPrice, salePrice: originalSalePrice, ratingAverage, stockQuantity, freeShippingThreshold: originalFreeShippingThreshold, defaultShippingCost: originalDefaultShippingCost, ...rest } = product;
    
    const transformedProduct = {
      ...rest,
      imageUrl: primaryImage?.imageUrl || null, // Add imageUrl at root level (primary image)
      images: (originalImages || []).map((img) => img.imageUrl).filter((url): url is string => Boolean(url)), // Transform to array of URLs (all images), filter out null/undefined
      price: originalPrice.toString(),
      salePrice: originalSalePrice?.toString() || null,
      rating: ratingAverage.toString(),
      reviewCount: _count.reviews,
      stock: stockQuantity,
      salesCount: product.salesCount, // Add salesCount for real-time sold count
      freeShippingThreshold: originalFreeShippingThreshold?.toString() || null,
      defaultShippingCost: originalDefaultShippingCost?.toString() || null,
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}

