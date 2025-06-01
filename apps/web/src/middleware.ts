import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * NOTE: The (auth) and (dashboard) folders are Next.js route groups.
 * They GROUP pages but DO NOT add to the URL path.
 * So (auth)/login/page.tsx → URL is /login  (NOT /auth/login)
 * And (dashboard)/dashboard/page.tsx → URL is /dashboard
 */

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/sso-callback',
  // Public marketing pages
  '/',
  '/pricing',
  '/compare',
  '/security',
  '/privacy',
  '/compliance',
  '/status',
  '/demo',
  '/legal',
  '/docs',
  '/onboarding',
];

// Pages authenticated users should not see (redirect them to dashboard)
const AUTH_ONLY_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always pass through static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const accessToken   = request.cookies.get('access_token')?.value;
  const isAuthenticated = !!accessToken;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  // Logged-in users visiting /login or /register → send to dashboard
  if (isAuthenticated && AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated users visiting protected pages → send to /login
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
