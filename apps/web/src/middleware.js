import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

/**
 * Lightweight edge redirect based on session-cookie presence. This is a UX
 * optimisation only — the real authorization check happens server-side in the
 * (app) layout via auth.api.getSession.
 */
const APP_PREFIXES = ['/home', '/my-tasks', '/projects', '/notes', '/trash', '/task'];
const AUTH_PATHS = ['/login', '/signup'];

export function middleware(request) {
  // Dev-only bypass: let every route through (getSession synthesises a user).
  if (process.env.DEV_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  const isAppPage = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (!hasSession && isAppPage) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/home/:path*',
    '/my-tasks/:path*',
    '/projects/:path*',
    '/notes/:path*',
    '/trash/:path*',
    '/task/:path*',
    '/login',
    '/signup',
  ],
};
