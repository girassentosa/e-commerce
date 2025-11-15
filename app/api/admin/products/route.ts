import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/products
 * Get all products with pagination, search, and filters (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication and authorization
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || ''; // 'active', 'inactive', or ''
    const featured = searchParams.get('featured') || ''; // 'true', 'false', or ''
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {};

    // Search by name, SKU, or brand
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Filter by status
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Filter by featured
    if (featured === 'true') {
      where.isFeatured = true;
    } else if (featured === 'false') {
      where.isFeatured = false;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              isPrimary: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            take: 1,
          },
          _count: {
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder as 'asc' | 'desc',
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        products: products.map((product) => ({
          ...product,
          price: product.price.toString(),
          salePrice: product.salePrice?.toString() || null,
          weight: product.weight?.toString() || null,
          ratingAverage: product.ratingAverage.toString(),
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Create a new product (Admin only)
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

    const body = await request.json();

    // Validate required fields
    const {
      categoryId,
      name,
      slug,
      description,
      price,
      stockQuantity,
      sku,
      brand,
      isFeatured,
      isActive,
      images,
    } = body;

    if (!categoryId || !name || !slug || !price || stockQuantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        categoryId,
        name,
        slug,
        sku,
        description,
        price,
        salePrice: body.salePrice || null,
        stockQuantity,
        lowStockThreshold: body.lowStockThreshold || 10,
        weight: body.weight || null,
        brand,
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        specifications: body.specifications && Object.keys(body.specifications).length > 0 
          ? body.specifications 
          : null,
        images: images?.length
          ? {
              create: images.map((img: any, index: number) => ({
                imageUrl: img.imageUrl,
                altText: img.altText || name,
                isPrimary: index === 0,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        price: product.price.toString(),
        salePrice: product.salePrice?.toString() || null,
        weight: product.weight?.toString() || null,
        ratingAverage: product.ratingAverage.toString(),
      },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

