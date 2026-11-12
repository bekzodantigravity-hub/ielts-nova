import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  shouldUseSecureCookie,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-token";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Allow public assets
  if (
    pathname === "/tests/listening-v5-t09-map.png" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/api/evaluate-writing")
  ) {
    return NextResponse.next();
  }

  // Fast path: Verify local HMAC session token in memory (0ms, zero network calls)
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionToken(sessionToken);

  if (user) {
    return NextResponse.next();
  }

  // Check if a Supabase auth cookie exists before calling remote Supabase
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
      // Fall through to instant local provisioning
    }
  }

  // Provision instant default local session token if none exists
  const { token } = await signSessionToken({
    sub: "candidate-default",
    email: "candidate@ieltsnova.uz",
    name: "Bekzod",
    targetBand: 7.5,
  });
  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/test/:path*", "/tests/:path*"],
};
