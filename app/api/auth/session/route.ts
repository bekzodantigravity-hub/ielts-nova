import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyAdminToken,
  verifySessionToken,
} from "@/lib/auth-token";
import { findUserByEmail, isUserDeleted } from "@/lib/users-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const [user, adminSession] = await Promise.all([
    verifySessionToken(token),
    verifyAdminToken(adminToken),
  ]);

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isAdmin: Boolean(adminSession),
    });
  }

  const isAdmin = Boolean(adminSession) || user.role === "admin";
  const stored = findUserByEmail(user.email);

  // If explicitly deleted by admin (or removed locally), log the user out cleanly
  if (
    !isAdmin &&
    (isUserDeleted(user.email) || (!stored && !process.env.VERCEL))
  ) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      isAdmin: false,
    });
  }

  const mergedUser = stored
    ? {
        ...user,
        sub: stored.id,
        name: stored.name || user.name,
        phone: stored.phone,
        plan: stored.plan || "free",
        role: isAdmin ? ("admin" as const) : stored.role || "user",
        picture: stored.picture || user.picture,
        birthYear: stored.birthYear ?? user.birthYear,
        age: stored.age ?? user.age,
        goal: stored.goal ?? user.goal,
        targetBand: stored.targetBand ?? user.targetBand,
        dailyGoal: stored.dailyGoal ?? user.dailyGoal,
        examDate:
          stored.examDate !== undefined ? stored.examDate : user.examDate,
      }
    : {
        ...user,
        role: isAdmin ? ("admin" as const) : "user",
      };

  return NextResponse.json({
    authenticated: true,
    user: mergedUser,
    isAdmin,
  });
}
