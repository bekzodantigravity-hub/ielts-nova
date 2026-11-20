import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  isAdminCredentials,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  shouldUseSecureCookie,
  signAdminToken,
  signSessionToken,
} from "@/lib/auth-token";
import { findUserByEmail, upsertUser } from "@/lib/users-db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Admin login (email) va parolni kiriting." },
        { status: 400 }
      );
    }

    if (!isAdminCredentials(email, password)) {
      return NextResponse.json(
        { error: "Admin login yoki parol noto'g'ri!" },
        { status: 401 }
      );
    }

    const existing = findUserByEmail(email);
    const adminStored = upsertUser({
      email,
      password,
      name: existing?.name || "Bekzod (Admin)",
      phone: existing?.phone || "",
      plan: "elite",
      role: "admin",
      targetBand: existing?.targetBand ?? 8.5,
      picture:
        existing?.picture ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent("Bekzod Admin")}&backgroundColor=059669`,
    });

    const [adminToken, { token: userToken }] = await Promise.all([
      signAdminToken(email),
      signSessionToken({
        sub: adminStored.id,
        email: adminStored.email,
        name: adminStored.name,
        phone: adminStored.phone,
        plan: "elite",
        role: "admin",
        picture: adminStored.picture,
        birthYear: adminStored.birthYear,
        age: adminStored.age,
        goal: adminStored.goal,
        targetBand: adminStored.targetBand,
      }),
    ]);

    const secure = shouldUseSecureCookie(req);
    const res = NextResponse.json({
      ok: true,
      admin: {
        email: adminStored.email,
        name: adminStored.name,
      },
    });

    res.cookies.set({
      name: ADMIN_SESSION_COOKIE_NAME,
      value: adminToken,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: userToken,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "Admin avtorizatsiyada xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
