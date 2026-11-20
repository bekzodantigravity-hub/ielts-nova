export const SESSION_COOKIE_NAME = "ielts_nova_session";
export const ADMIN_SESSION_COOKIE_NAME = "ielts_nova_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AuthUserPlan = "free" | "pro" | "elite";
export type AuthUserRole = "user" | "admin";

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  phone?: string;
  plan?: AuthUserPlan;
  role?: AuthUserRole;
  picture?: string;
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  dailyGoal?: number;
  examDate?: string | null;
  provider: "google";
  iat: number;
  exp: number;
}

export interface AdminSessionPayload {
  email: string;
  role: "admin";
  iat: number;
  exp: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __transientAuthSessionSecret: string | undefined;
}

function getSigningSecret(): string {
  const envSecret = process.env.AUTH_SESSION_SECRET;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }
  if (!globalThis.__transientAuthSessionSecret) {
    globalThis.__transientAuthSessionSecret = `transient-${crypto.randomUUID()}-${Date.now()}`;
  }
  return globalThis.__transientAuthSessionSecret;
}

export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function isAdminCredentials(email: string, password: string): boolean {
  const adminEmail = getAdminEmail();
  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
  if (!adminEmail || !adminPassword) return false;
  return (
    email.trim().toLowerCase() === adminEmail &&
    password.trim() === adminPassword
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function importHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSigningSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSessionToken(
  payload: Omit<AuthUser, "iat" | "exp" | "provider">
): Promise<{ token: string; user: AuthUser }> {
  const nowSec = Math.floor(Date.now() / 1000);
  const user: AuthUser = {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    phone: payload.phone,
    plan: payload.plan ?? "free",
    role: payload.role ?? "user",
    picture: payload.picture,
    birthYear: payload.birthYear,
    age: payload.age,
    goal: payload.goal,
    targetBand: payload.targetBand,
    dailyGoal: payload.dailyGoal,
    examDate: payload.examDate,
    provider: "google",
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
  };

  const enc = new TextEncoder();
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(user)));
  const key = await importHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuf));

  return {
    token: `${payloadB64}.${sigB64}`,
    user,
  };
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<AuthUser | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const enc = new TextEncoder();
    const key = await importHmacKey();
    const sigBytes = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      enc.encode(payloadB64)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const parsed = JSON.parse(jsonStr) as Partial<AuthUser>;
    const nowSec = Math.floor(Date.now() / 1000);

    if (
      !parsed ||
      parsed.provider !== "google" ||
      typeof parsed.sub !== "string" ||
      !parsed.sub ||
      parsed.sub === "candidate-default" ||
      typeof parsed.email !== "string" ||
      !parsed.email ||
      parsed.email.toLowerCase() === "candidate@ieltsnova.uz" ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= nowSec
    ) {
      return null;
    }

    const plan: AuthUserPlan =
      parsed.plan === "pro" || parsed.plan === "elite" ? parsed.plan : "free";
    const role: AuthUserRole = parsed.role === "admin" ? "admin" : "user";

    return {
      sub: parsed.sub,
      email: parsed.email,
      name:
        typeof parsed.name === "string" && parsed.name
          ? parsed.name
          : parsed.email.split("@")[0],
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
      plan,
      role,
      picture: typeof parsed.picture === "string" ? parsed.picture : undefined,
      birthYear:
        typeof parsed.birthYear === "number" ? parsed.birthYear : undefined,
      age: typeof parsed.age === "number" ? parsed.age : undefined,
      goal: typeof parsed.goal === "string" ? parsed.goal : undefined,
      targetBand:
        typeof parsed.targetBand === "number" ? parsed.targetBand : undefined,
      dailyGoal:
        typeof parsed.dailyGoal === "number" ? parsed.dailyGoal : undefined,
      examDate: parsed.examDate !== undefined ? parsed.examDate : undefined,
      provider: "google",
      iat: typeof parsed.iat === "number" ? parsed.iat : nowSec,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function signAdminToken(email: string): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    role: "admin",
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
  };
  const enc = new TextEncoder();
  const payloadB64 = bytesToBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await importHmacKey();
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sigBuf));
  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const enc = new TextEncoder();
    const key = await importHmacKey();
    const sigBytes = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      enc.encode(payloadB64)
    );
    if (!valid) return null;

    const jsonStr = new TextDecoder().decode(base64UrlToBytes(payloadB64));
    const parsed = JSON.parse(jsonStr) as Partial<AdminSessionPayload>;
    const nowSec = Math.floor(Date.now() / 1000);
    const configuredAdmin = getAdminEmail();

    if (
      !parsed ||
      parsed.role !== "admin" ||
      typeof parsed.email !== "string" ||
      !parsed.email ||
      (configuredAdmin && parsed.email.toLowerCase() !== configuredAdmin) ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= nowSec
    ) {
      return null;
    }

    return {
      email: parsed.email,
      role: "admin",
      iat: typeof parsed.iat === "number" ? parsed.iat : nowSec,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function shouldUseSecureCookie(req: {
  headers: { get(name: string): string | null };
  nextUrl: { protocol: string };
}): boolean {
  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  return req.nextUrl.protocol === "https:";
}
