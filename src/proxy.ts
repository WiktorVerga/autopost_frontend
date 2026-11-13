import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic auth check: only looks for the session cookie and redirects.
 * The real validation happens in the backend on every API call.
 */
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "autopost_session";
const AUTH_BYPASS = process.env.AUTH_BYPASS === "true";

/** Where the app starts for a signed-in user. "/" is the public landing page. */
const APP_HOME = "/dashboard";
const PUBLIC_PATHS = ["/login"];

export function proxy(request: NextRequest) {
  if (AUTH_BYPASS) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // The landing page is open to everyone, signed in or not.
  if (pathname === "/") return NextResponse.next();

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== APP_HOME) url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL(APP_HOME, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip the API rewrite, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:css|svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
