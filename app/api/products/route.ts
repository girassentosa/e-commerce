/**
 * Products API Routes
 * GET /api/products - List products with filters & pagination
 * POST /api/products - Create new product (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { productQuerySchema, createProductSchema } from '@/lib/validations/product';
import { requireAdmin, buildPaginationMeta } from '@/lib/api-helpers';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * GET /api/products
 * List products dengan pagination, filters, dan search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with defaults
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '12') || 12;
    const categoryId = searchParams.get('categoryId') || undefined;
    const search = searchParams.get('search') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const brand = searchParams.get('brand') || undefined;
    const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
    const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      // Default: only show active products (unless explicitly filtered)
      isActive: isActive !== undefined ? isActive : true,
    };

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Search filter (search in name and description)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    // Brand filter
    if (brand) {
      where.brand = brand;
    }

    // Featured filter
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    // Build orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { salesCount: 'desc' };
        break;
      case 'rating':
        orderBy = { ratingAverage: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
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
          variants: {
            select: {
              id: true,
              name: true,
              value: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products to include imageUrl and images array for frontend compatibility
    const transformedProducts = products.map((product) => {
      const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
      const { images: originalImages, variants: originalVariants, _count, price: originalPrice, salePrice: originalSalePrice, ratingAverage, stockQuantity, salesCount, ...rest } = product;
      
      return {
        ...rest,
        imageUrl: primaryImage?.imageUrl || null, // Add imageUrl at root level
        images: (originalImages || []).map((img) => img.imageUrl).filter((url): url is string => Boolean(url)), // Transform to array of URLs, filter out null/undefined
        variants: (originalVariants || []).map((v) => ({
          id: v.id,
          name: v.name,
          value: v.value,
        })), // Include variants
        price: originalPrice.toString(),
        salePrice: originalSalePrice?.toString() || null,
        rating: ratingAverage.toString(),
        reviewCount: _count.reviews,
        stock: stockQuantity,
        salesCount: salesCount || 0, // Add salesCount for sold count display
      };
    });

    // Build response
    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    // Database or unknown error
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create new product (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin(request);

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = createProductSchema.parse(body);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: 'A product with this slug already exists',
        },
        { status: 400 }
      );
    }

    // Check if SKU already exists (if provided)
    if (validatedData.sku) {
      const existingSKU = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (existingSKU) {
        return NextResponse.json(
          {
            success: false,
            error: 'A product with this SKU already exists',
          },
          { status: 400 }
        );
      }
    }

    // Create product with images and variants
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        categoryId: validatedData.categoryId,
        description: validatedData.description,
        price: validatedData.price,
        salePrice: validatedData.salePrice,
        stockQuantity: validatedData.stockQuantity,
        lowStockThreshold: validatedData.lowStockThreshold,
        sku: validatedData.sku,
        brand: validatedData.brand,
        weight: validatedData.weight,
        isFeatured: validatedData.isFeatured,
        isActive: validatedData.isActive,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        // Create images if provided
        ...(validatedData.images && {
          images: {
            create: validatedData.images.map((img, index) => ({
              imageUrl: img.url,
              altText: img.altText,
              isPrimary: img.isPrimary ?? index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          },
        }),
        // Create variants if provided
        ...(validatedData.variants && {
          variants: {
            create: validatedData.variants.map((variant) => ({
              name: variant.name,
              value: variant.value,
              priceModifier: variant.priceModifier,
              stockQuantity: variant.stockQuantity,
            })),
          },
        }),
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        data: product,
      },
      { status: 201 }
    );
  } catch (error) {
    // Authorization error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please login',
        },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required',
        },
        { status: 403 }
      );
    }

    // Validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Database or unknown error
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}

