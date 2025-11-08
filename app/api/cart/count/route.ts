import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cart/count
 * Get cart item count only (lightweight, fast query)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        data: { itemCount: 0 },
      });
    }

    const userId = session.user.id;

    // Use raw SQL query for maximum performance - single query with JOIN
    // This is faster than separate findFirst + aggregate queries
    const result = await prisma.$queryRaw<Array<{ total: bigint | null }>>`
      SELECT COALESCE(SUM(ci.quantity), 0)::bigint as total
      FROM cart_items ci
      INNER JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = ${userId}
    `;

    // Extract item count from result (PostgreSQL returns bigint)
    const itemCount = result[0]?.total ? Number(result[0].total) : 0;

    return NextResponse.json({
      success: true,
      data: { itemCount },
    });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart count' },
      { status: 500 }
    );
  }
}

