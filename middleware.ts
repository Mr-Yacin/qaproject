import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Content Security Policy configuration
 * Requirements: 3.9 - XSS protection
 */
function getCSPHeader(): string {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TipTap editor requires unsafe-eval
    "style-src 'self' 'unsafe-inline'", // Tailwind and inline styles
    "img-src 'self' data: https: blob:", // Allow images from various sources
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return cspDirectives.join('; ');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Skip authentication check for login page
    if (pathname === '/admin/login') {
      console.log('[Auth] Allowing access to login page');
      const response = NextResponse.next();
      
      // Add security headers
      response.headers.set('Content-Security-Policy', getCSPHeader());
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      return response;
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
      const response = NextResponse.next();
      
      // Add security headers
      response.headers.set('Content-Security-Policy', getCSPHeader());
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      return response;
    } catch (error) {
      console.error('[Auth] Token validation error:', error);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', getCSPHeader());
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: '/admin/:path*',
};
