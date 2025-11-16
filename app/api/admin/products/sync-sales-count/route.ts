/**
 * Admin API - Sync Product Sales Count
 * POST /api/admin/products/sync-sales-count
 * Sync salesCount for all products based on DELIVERED orders (one-time sync)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/admin/products/sync-sales-count
 * Sync salesCount for all products based on DELIVERED orders
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

    console.log('Starting salesCount sync from DELIVERED orders...');

    // Get all DELIVERED orders with items
    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
      },
      include: {
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    console.log(`Found ${deliveredOrders.length} DELIVERED orders`);

    // Calculate salesCount for each product
    const salesCountMap = new Map<string, number>();

    for (const order of deliveredOrders) {
      for (const item of order.items) {
        const currentCount = salesCountMap.get(item.productId) || 0;
        salesCountMap.set(item.productId, currentCount + item.quantity);
      }
    }

    console.log(`Calculated salesCount for ${salesCountMap.size} products`);

    // Update all products in transaction
    const updateResults = await prisma.$transaction(async (tx) => {
      const results = [];

      // First, reset all salesCount to 0
      await tx.product.updateMany({
        data: {
          salesCount: 0,
        },
      });

      console.log('Reset all product salesCount to 0');

      // Then, update salesCount for products that have DELIVERED orders
      for (const [productId, salesCount] of salesCountMap.entries()) {
        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            salesCount: salesCount,
          },
          select: {
            id: true,
            name: true,
            salesCount: true,
          },
        });
        results.push(updated);
      }

      return results;
    });

    console.log('SalesCount sync completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Sales count synced successfully',
      data: {
        totalDeliveredOrders: deliveredOrders.length,
        productsUpdated: updateResults.length,
        products: updateResults,
      },
    });
  } catch (error) {
    console.error('Error syncing sales count:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync sales count',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

