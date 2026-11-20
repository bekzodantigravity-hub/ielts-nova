import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  isAdminEmail,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  shouldUseSecureCookie,
  signAdminToken,
  signSessionToken,
  verifyAdminCredentials,
} from "@/lib/auth-token";
import { resolveGoogleClientId } from "@/lib/env-config";
import { findUserByEmail, upsertUser } from "@/lib/users-db";

interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
}

interface GoogleUserInfo {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
}

export async function POST(req: NextRequest) {
  let body: {
    mode?: "login" | "register";
    accessToken?: string;
    credential?: string;
    email?: string;
    password?: string;
    phone?: string;
    name?: string;
    birthYear?: number;
    age?: number;
    goal?: string;
    targetBand?: number;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov formati." }, { status: 400 });
  }

  // 1. Direct Email + Password Login / Registration flow
  const rawEmail = body.email?.trim();
  if (rawEmail) {
    let email = rawEmail.toLowerCase();
    if (!email.includes("@")) {
      return NextResponse.json(
        { error: "Iltimos, to'liq elektron pochta manzilini kiriting (masalan: ism@gmail.com)." },
        { status: 400 }
      );
    }

    const password = (body.password ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const mode = body.mode === "register" ? "register" : "login";
    const secure = shouldUseSecureCookie(req);

    // Check Admin login first
    if (await isAdminEmail(email)) {
      if (mode === "register") {
        return NextResponse.json(
          { error: "Bu email admin hisobiga biriktirilgan. 'Kirish' bo'limidan parolingiz bilan kiring." },
          { status: 409 }
        );
      }
      if (!(await verifyAdminCredentials(email, password))) {
        return NextResponse.json(
          { error: "Parol noto'g'ri. Iltimos, qaytadan kiriting." },
          { status: 401 }
        );
      }

      const existingAdmin = findUserByEmail(email);
      const adminStored = upsertUser({
        email,
        password,
        name: existingAdmin?.name || "Bekzod (Admin)",
        phone: existingAdmin?.phone || phone || "",
        plan: "elite",
        role: "admin",
        targetBand: existingAdmin?.targetBand ?? 8.5,
        picture:
          existingAdmin?.picture ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent("Bekzod Admin")}&backgroundColor=059669`,
      });

      const [{ token, user }, adminToken] = await Promise.all([
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
          dailyGoal: adminStored.dailyGoal,
          examDate: adminStored.examDate,
        }),
        signAdminToken(adminStored.email),
      ]);

      const res = NextResponse.json({ ok: true, user, isAdmin: true });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
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
      return res;
    }

    const existing = findUserByEmail(email);

    // REGISTER MODE: Must be a brand new email with password + name + phone
    if (mode === "register") {
      if (existing) {
        return NextResponse.json(
          {
            error:
              "Bu elektron pochta bilan hisob allaqachon mavjud. Iltimos, 'Kirish' bo'limidan parolingiz bilan kiring.",
          },
          { status: 409 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." },
          { status: 400 }
        );
      }

      const chosenName = body.name?.trim() || "";
      if (!chosenName) {
        return NextResponse.json(
          { error: "Iltimos, ism va familiyangizni kiriting." },
          { status: 400 }
        );
      }

      if (phone.replace(/\D/g, "").length < 7) {
        return NextResponse.json(
          { error: "Iltimos, to'g'ri telefon raqamingizni kiriting." },
          { status: 400 }
        );
      }

      const birthYear =
        typeof body.birthYear === "number" && !Number.isNaN(body.birthYear)
          ? body.birthYear
          : undefined;
      const age =
        typeof body.age === "number" && !Number.isNaN(body.age)
          ? body.age
          : birthYear
            ? new Date().getFullYear() - birthYear
            : undefined;
      const goal = body.goal?.trim() || undefined;
      const targetBand =
        typeof body.targetBand === "number" && !Number.isNaN(body.targetBand)
          ? body.targetBand
          : 7.5;

      const stored = upsertUser({
        email,
        password,
        phone,
        name: chosenName,
        plan: "free",
        role: "user",
        birthYear,
        age,
        goal,
        targetBand,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(chosenName)}&backgroundColor=059669`,
      });

      const { token, user } = await signSessionToken({
        sub: stored.id,
        email: stored.email,
        name: stored.name,
        phone: stored.phone,
        plan: stored.plan || "free",
        role: "user",
        picture: stored.picture,
        birthYear: stored.birthYear,
        age: stored.age,
        goal: stored.goal,
        targetBand: stored.targetBand,
        dailyGoal: stored.dailyGoal,
        examDate: stored.examDate,
      });

      const res = NextResponse.json({ ok: true, user, isAdmin: false });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return res;
    }

    // LOGIN MODE: Must already exist and match password
    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Bu elektron pochta bilan hisob topilmadi. Avval 'Ro'yxatdan o'tish' orqali yangi hisob oching.",
        },
        { status: 404 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Iltimos, hisobingiz parolini kiriting." },
        { status: 400 }
      );
    }

    if (existing.password && existing.password !== password) {
      return NextResponse.json(
        { error: "Parol noto'g'ri. Iltimos, qaytadan tekshirib kiriting." },
        { status: 401 }
      );
    }

    // If legacy account had no password yet, bind this password (>= 6 chars)
    let activeUser = existing;
    if (!existing.password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak." },
          { status: 400 }
        );
      }
      activeUser = upsertUser({
        email: existing.email,
        password,
      });
    }

    const { token, user } = await signSessionToken({
      sub: activeUser.id,
      email: activeUser.email,
      name: activeUser.name,
      phone: activeUser.phone,
      plan: activeUser.plan || "free",
      role: activeUser.role === "admin" ? "admin" : "user",
      picture: activeUser.picture,
      birthYear: activeUser.birthYear,
      age: activeUser.age,
      goal: activeUser.goal,
      targetBand: activeUser.targetBand,
      dailyGoal: activeUser.dailyGoal,
      examDate: activeUser.examDate,
    });

    const res = NextResponse.json({
      ok: true,
      user,
      isAdmin: activeUser.role === "admin",
    });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return res;
  }

  // 2. Google OAuth Token flow (GIS popup / ID token)
  const accessToken = body.accessToken?.trim();
  const credential = body.credential?.trim();

  if (!accessToken && !credential) {
    return NextResponse.json(
      { error: "Elektron pochta yoki Google tokeni kiritilmadi." },
      { status: 400 }
    );
  }

  const configuredClientId = resolveGoogleClientId();
  if (!configuredClientId) {
    return NextResponse.json(
      {
        error:
          "Google OAuth Client ID is not configured yet (NEXT_PUBLIC_GOOGLE_CLIENT_ID).",
      },
      { status: 503 }
    );
  }

  try {
    let sub = "";
    let email = "";
    let name = "";
    let picture: string | undefined;
    let verified = false;

    if (accessToken) {
      const [tokenInfoRes, userInfoRes] = await Promise.all([
        fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
          { cache: "no-store" }
        ),
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        }),
      ]);

      if (!tokenInfoRes.ok || !userInfoRes.ok) {
        return NextResponse.json(
          { error: "Google token verification failed." },
          { status: 401 }
        );
      }

      const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;
      const userInfo = (await userInfoRes.json()) as GoogleUserInfo;

      const audMatches =
        tokenInfo.aud === configuredClientId ||
        tokenInfo.azp === configuredClientId;

      if (!audMatches) {
        return NextResponse.json(
          { error: "Token audience does not match configured Google Client ID." },
          { status: 401 }
        );
      }

      sub = userInfo.sub || tokenInfo.sub || "";
      email = userInfo.email || tokenInfo.email || "";
      name =
        userInfo.name ||
        [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ") ||
        email.split("@")[0] ||
        "Candidate";
      picture = userInfo.picture;
      verified =
        userInfo.email_verified === true ||
        tokenInfo.email_verified === true ||
        tokenInfo.email_verified === "true";
    } else if (credential) {
      const idRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { cache: "no-store" }
      );
      if (!idRes.ok) {
        return NextResponse.json(
          { error: "Google ID token verification failed." },
          { status: 401 }
        );
      }
      const idInfo = (await idRes.json()) as GoogleTokenInfo;
      if (idInfo.aud !== configuredClientId) {
        return NextResponse.json(
          { error: "Google ID token audience mismatch." },
          { status: 401 }
        );
      }
      sub = idInfo.sub || "";
      email = idInfo.email || "";
      name = idInfo.name || email.split("@")[0] || "Candidate";
      picture = idInfo.picture;
      verified =
        idInfo.email_verified === true || idInfo.email_verified === "true";
    }

    if (!sub || !email || !verified) {
      return NextResponse.json(
        { error: "A verified Google account is required to sign in." },
        { status: 403 }
      );
    }

    const existing = findUserByEmail(email);
    const stored = upsertUser({
      email,
      name: name || existing?.name,
      picture: picture || existing?.picture,
      phone: existing?.phone,
      plan: existing?.plan || "free",
      birthYear: existing?.birthYear,
      age: existing?.age,
      goal: existing?.goal,
      targetBand: existing?.targetBand,
    });

    const { token, user } = await signSessionToken({
      sub: stored.id,
      email: stored.email,
      name: stored.name,
      phone: stored.phone,
      plan: stored.plan || "free",
      role: stored.role === "admin" ? "admin" : "user",
      picture: stored.picture,
      birthYear: stored.birthYear,
      age: stored.age,
      goal: stored.goal,
      targetBand: stored.targetBand,
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
  } catch {
    return NextResponse.json(
      { error: "Unable to verify Google account right now." },
      { status: 500 }
    );
  }
}
