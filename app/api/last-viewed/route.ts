import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's last viewed products
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Get last viewed products (most recent first, limit 50)
    const lastViewed = await prisma.productView.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            images: {
              take: 1,
              orderBy: {
                sortOrder: 'asc',
              },
              select: {
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: 50,
    });

    // Transform to match frontend interface
    const transformed = lastViewed.map((view) => ({
      id: view.id,
      productId: view.productId,
      viewedAt: view.viewedAt.toISOString(),
      product: {
        id: view.product.id,
        name: view.product.name,
        slug: view.product.slug,
        price: view.product.price.toString(),
        salePrice: view.product.salePrice?.toString() || null,
        stockQuantity: view.product.stockQuantity,
        category: view.product.category,
        images: view.product.images.map((img) => ({
          imageUrl: img.imageUrl,
        })),
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    console.error('Error fetching last viewed products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch last viewed products',
      },
      { status: 500 }
    );
  }
}

// POST - Track product view
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required',
        },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
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

    // Check if user already viewed this product recently (within last minute)
    // If so, just update the viewedAt timestamp
    const existingView = await prisma.productView.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
        viewedAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last 1 minute
        },
      },
    });

    if (existingView) {
      // Update existing view timestamp
      await prisma.productView.update({
        where: { id: existingView.id },
        data: { viewedAt: new Date() },
      });
    } else {
      // Delete old view for this product if exists (to keep only latest)
      await prisma.productView.deleteMany({
        where: {
          userId: session.user.id,
          productId: productId,
        },
      });

      // Create new view
      await prisma.productView.create({
        data: {
          userId: session.user.id,
          productId: productId,
          viewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Product view tracked',
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track product view',
      },
      { status: 500 }
    );
  }
}
