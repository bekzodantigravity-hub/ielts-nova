import { type NextRequest, NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/auth-token";
import { findUserByEmail } from "@/lib/users-db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const rawEmail = body.email?.trim().toLowerCase() || "";
    if (!rawEmail || !rawEmail.includes("@")) {
      return NextResponse.json(
        { error: "To'g'ri email manzilini kiriting." },
        { status: 400 }
      );
    }

    const exists =
      Boolean(findUserByEmail(rawEmail)) || rawEmail === getAdminEmail();
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json(
      { error: "So'rovni tekshirib bo'lmadi." },
      { status: 400 }
    );
  }
}
