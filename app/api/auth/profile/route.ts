import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  shouldUseSecureCookie,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-token";
import { updateUserProfileAndData } from "@/lib/users-db";

export async function POST(req: NextRequest) {
  const currentToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const currentUser = await verifySessionToken(currentToken);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      birthYear?: number;
      age?: number;
      goal?: string;
      targetBand?: number;
      examDate?: string | null;
      dailyGoal?: number;
    };

    const newName = body.name?.trim() || currentUser.name;
    const newBirthYear =
      typeof body.birthYear === "number" ? body.birthYear : currentUser.birthYear;
    const newAge =
      typeof body.age === "number"
        ? body.age
        : newBirthYear
          ? new Date().getFullYear() - newBirthYear
          : currentUser.age;
    const newGoal = body.goal?.trim() || currentUser.goal;
    const newTargetBand =
      typeof body.targetBand === "number" ? body.targetBand : currentUser.targetBand;
    const newExamDate =
      body.examDate !== undefined ? body.examDate : currentUser.examDate;
    const newDailyGoal =
      typeof body.dailyGoal === "number" ? body.dailyGoal : currentUser.dailyGoal;

    const updatedUser = updateUserProfileAndData(currentUser.email, {
      name: newName,
      birthYear: newBirthYear,
      age: newAge,
      goal: newGoal,
      targetBand: newTargetBand,
      examDate: newExamDate,
      dailyGoal: newDailyGoal,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { token, user } = await signSessionToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      picture: updatedUser.picture,
      birthYear: updatedUser.birthYear,
      age: updatedUser.age,
      goal: updatedUser.goal,
      targetBand: updatedUser.targetBand,
      dailyGoal: updatedUser.dailyGoal,
      examDate: updatedUser.examDate,
    });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: shouldUseSecureCookie(req),
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile." },
      { status: 500 }
    );
  }
}
