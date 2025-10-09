import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Skip authentication check for login page
    if (pathname === '/admin/login') {
      console.log('[Auth] Allowing access to login page');
      return NextResponse.next();
    }

    try {
      // Validate environment variables
      if (!process.env.NEXTAUTH_SECRET) {
        console.error('[Auth] NEXTAUTH_SECRET is not set');
        throw new Error('NEXTAUTH_SECRET is not configured');
      }

      // Explicitly validate session token
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Redirect if no valid token
      if (!token) {
        console.log('[Auth] No valid token found, redirecting to login');
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      console.log('[Auth] Valid token found, allowing access to:', pathname);
      return NextResponse.next();
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
