import { type NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  shouldUseSecureCookie,
  signSessionToken,
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
  expires_in?: string | number;
  error?: string;
  error_description?: string;
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
    accessToken?: string;
    credential?: string;
    email?: string;
    password?: string;
    name?: string;
    birthYear?: number;
    age?: number;
    goal?: string;
    targetBand?: number;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // 1. Direct Google Account Sign-In / Onboarding (email + optional password + profile)
  const rawEmail = body.email?.trim();
  if (rawEmail) {
    let email = rawEmail.toLowerCase();
    if (!email.includes("@")) {
      email = `${email}@gmail.com`;
    }

    const nameFromEmail = email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const chosenName = body.name?.trim() || nameFromEmail || "Candidate";

    const birthYear =
      typeof body.birthYear === "number" && !isNaN(body.birthYear)
        ? body.birthYear
        : undefined;

    const age =
      typeof body.age === "number" && !isNaN(body.age)
        ? body.age
        : birthYear
          ? new Date().getFullYear() - birthYear
          : undefined;

    const goal = body.goal?.trim() || undefined;
    const targetBand =
      typeof body.targetBand === "number" && !isNaN(body.targetBand)
        ? body.targetBand
        : undefined;

    // Persist to database (.data/users.json)
    const stored = upsertUser({
      email,
      password: body.password?.trim(),
      name: chosenName,
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
  }

  // 2. Google OAuth Token flow (GIS popup / ID token)
  const accessToken = body.accessToken?.trim();
  const credential = body.credential?.trim();

  if (!accessToken && !credential) {
    return NextResponse.json(
      { error: "Google hisobi yoki elektron pochta kiritilmadi." },
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
      birthYear: existing?.birthYear,
      age: existing?.age,
      goal: existing?.goal,
      targetBand: existing?.targetBand,
    });

    const { token, user } = await signSessionToken({
      sub: stored.id,
      email: stored.email,
      name: stored.name,
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
