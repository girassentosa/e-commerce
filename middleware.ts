/**
 * Next.js Middleware
 * Route protection dan authentication checks
 * Homepage always shows customer view (no auto-redirect for security)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/orders',
    '/profile',
    '/wishlist',
    '/checkout',
    '/admin',
  ];

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if trying to access protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes - check for ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Not logged in, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (token.role !== 'ADMIN') {
      // Logged in but not admin, redirect to home with error
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  // Homepage should always show customer view (no auto-redirect for security)
  // Admin must explicitly access /admin or login first
  // This prevents security risk if admin forgets to logout on shared computer

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
    '/checkout/:path*',
    '/admin/:path*',
  ],
};

