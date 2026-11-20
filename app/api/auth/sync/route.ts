import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";
import { findUserByEmail, updateUserProfileAndData } from "@/lib/users-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const currentToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = await verifySessionToken(currentToken);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stored = findUserByEmail(currentUser.email);
  if (!stored) {
    return NextResponse.json({
      inProgress: {},
      attempts: [],
      activity: {},
      profile: {
        name: currentUser.name,
        birthYear: currentUser.birthYear,
        age: currentUser.age,
        goal: currentUser.goal,
        targetBand: currentUser.targetBand,
        dailyGoal: currentUser.dailyGoal,
        examDate: currentUser.examDate ?? null,
      },
    });
  }

  return NextResponse.json({
    inProgress: stored.inProgress || {},
    attempts: stored.attempts || [],
    activity: stored.activity || {},
    profile: {
      name: stored.name,
      phone: stored.phone,
      plan: stored.plan || "free",
      birthYear: stored.birthYear,
      age: stored.age,
      goal: stored.goal,
      targetBand: stored.targetBand,
      examDate: stored.examDate,
      dailyGoal: stored.dailyGoal,
    },
  });
}

export async function POST(req: NextRequest) {
  const currentToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = await verifySessionToken(currentToken);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      inProgress?: Record<string, { answered: number; total: number; updatedAt: number }>;
      attempts?: unknown[];
      activity?: Record<string, number>;
    };

    const updated = updateUserProfileAndData(currentUser.email, {
      inProgress: body.inProgress,
      attempts: body.attempts,
      activity: body.activity,
    });

    return NextResponse.json({ ok: true, updatedAt: updated?.updatedAt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
