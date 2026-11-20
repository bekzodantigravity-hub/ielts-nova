import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  shouldUseSecureCookie,
  verifySessionToken,
} from "@/lib/auth-token";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow public assets & auth endpoints
  if (
    pathname === "/tests/listening-v5-t09-map.png" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/evaluate-writing")
  ) {
    return NextResponse.next();
  }

  // Fast path: Verify real signed HMAC session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(sessionToken);

  if (user) {
    return NextResponse.next();
  }

  // Optional Supabase session fallback if present
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (hasSupabaseCookie) {
    try {
      const { supabaseResponse, user: supabaseUser } = await updateSession(request);
      if (supabaseUser) {
        return supabaseResponse;
      }
    } catch {
      // Fall through to auth redirect
    }
  }

  // Strictly redirect unauthenticated visitors to sign-in/register modal on "/"
  // Never auto-provision a default/shared account!
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("auth", "required");
  const fullNext = `${pathname}${search}`;
  if (fullNext.startsWith("/")) {
    redirectUrl.searchParams.set("next", fullNext);
  }

  const response = NextResponse.redirect(redirectUrl);
  if (sessionToken) {
    // Clear any stale/invalid/legacy candidate-default cookie immediately
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/test/:path*", "/tests/:path*"],
};
