import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's previously purchased products (from completed orders)
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

    // Get completed orders (SHIPPED or DELIVERED) with items
    const completedOrders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['SHIPPED', 'DELIVERED'],
        },
      },
      include: {
        items: {
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
                _count: {
                  select: {
                    reviews: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50 orders
    });

    // Extract unique products from order items
    // Use Map to track unique products by productId, keeping the most recent purchase
    const productMap = new Map<string, {
      productId: string;
      purchasedAt: Date;
      product: any;
    }>();

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.id;
        
        // If product not in map, or this order is more recent, add/update it
        if (!productMap.has(productId) || 
            order.createdAt > productMap.get(productId)!.purchasedAt) {
          productMap.set(productId, {
            productId: productId,
            purchasedAt: order.createdAt,
            product: item.product,
          });
        }
      });
    });

    // Convert map to array and sort by most recently purchased
    const buyAgainItems = Array.from(productMap.values())
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
      .slice(0, 50); // Limit to 50 unique products

    // Transform to match frontend interface (similar to last-viewed)
    const transformed = buyAgainItems.map((item, index) => ({
      id: `buy-again-${item.productId}-${index}`, // Unique ID for each item
      productId: item.productId,
      purchasedAt: item.purchasedAt.toISOString(),
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        description: item.product.description || null,
        price: item.product.price.toString(),
        salePrice: item.product.salePrice?.toString() || null,
        stockQuantity: item.product.stockQuantity,
        category: item.product.category,
        images: item.product.images.map((img: any) => ({
          imageUrl: img.imageUrl,
        })),
        brand: item.product.brand || null,
        rating: item.product.ratingAverage?.toString() || null,
        reviewCount: item.product._count?.reviews || 0,
        isFeatured: item.product.isFeatured || false,
      },
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
    });
  } catch (error) {
    console.error('Error fetching buy again products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch buy again products',
      },
      { status: 500 }
    );
  }
}

