/**
 * API Helper Functions
 * Shared utilities untuk API routes
 */

import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return null;
  }

  return {
    id: token.id as string,
    email: token.email as string,
    role: token.role as string,
    firstName: token.firstName as string | null,
    lastName: token.lastName as string | null,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  return user !== null;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getAuthUser(request);
  return user?.role === 'ADMIN';
}

/**
 * Require authentication (throw if not authenticated)
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Require admin role (throw if not admin)
 */
export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return user;
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
}

