import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";
import { findUserByEmail } from "@/lib/users-db";

export const dynamic = "force-dynamic";

// Security fix: NEVER expose all server users publicly!
// Only return the caller's own currently authenticated session account.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionUser = await verifySessionToken(token);
  if (!sessionUser) {
    return NextResponse.json({ accounts: [] });
  }

  const stored = findUserByEmail(sessionUser.email);
  return NextResponse.json({
    accounts: [
      {
        id: stored?.id || sessionUser.sub,
        email: sessionUser.email,
        name: stored?.name || sessionUser.name,
        phone: stored?.phone || sessionUser.phone,
        plan: stored?.plan || sessionUser.plan || "free",
        picture: stored?.picture || sessionUser.picture,
        targetBand: stored?.targetBand ?? sessionUser.targetBand,
        goal: stored?.goal || sessionUser.goal,
        lastActive: stored?.updatedAt,
      },
    ],
  });
}
