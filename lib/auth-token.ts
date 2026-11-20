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

const ADMIN_VERIFICATION_SALT = "ielts-nova-admin-v1-salt-9f4c2a8b";
const ADMIN_LOGIN_SHA256_SET = new Set<string>([
  "b65277b13d8ea9646267935dd4ba55ad3fbe3fbf52797b3b062333a05b934c5f",
  "de94efc4417dfc49d6dc77d9f28bc70de992637af5e31cbfcb3a1ccc6b792972",
  "483a82e96ed40361820305e42089158ed7fc44a3ad85252fffcb6735a74d7124",
  "b79ff9e92f1300de2f9e36f5092d01acb7d26b34d2444d2105eb22fbb061488f",
]);
const ADMIN_PASS_PBKDF2 =
  "111807b22bc940740753e3bc3091acc660bcb2cb00c4668e5bb4f59749cde54c";

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return bytesToHex(new Uint8Array(digest));
}

async function pbkdf2Hex(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function getSigningSecret(): string {
  const envSecret =
    typeof process !== "undefined" && process.env
      ? process.env.AUTH_SESSION_SECRET
      : undefined;
  if (envSecret && envSecret.trim().length >= 16) {
    return envSecret.trim();
  }
  return `ielts-nova-hmac-v2-${ADMIN_VERIFICATION_SALT}-${ADMIN_PASS_PBKDF2}`;
}

export function getAdminEmail(): string {
  if (typeof process === "undefined" || !process.env) return "";
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const norm = email.trim().toLowerCase();
  if (!norm) return false;
  const envEmail = getAdminEmail();
  if (envEmail && norm === envEmail) {
    return true;
  }
  const digest = await sha256Hex(`${ADMIN_VERIFICATION_SALT}:${norm}`);
  return ADMIN_LOGIN_SHA256_SET.has(digest);
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const normEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  if (!normEmail || !cleanPass) return false;

  const envEmail = getAdminEmail();
  const envPass =
    typeof process !== "undefined" && process.env
      ? (process.env.ADMIN_PASSWORD || "").trim()
      : "";
  if (envEmail && envPass && normEmail === envEmail && cleanPass === envPass) {
    return true;
  }

  const [emailOk, derivedPass] = await Promise.all([
    isAdminEmail(normEmail),
    pbkdf2Hex(cleanPass, ADMIN_VERIFICATION_SALT),
  ]);
  return emailOk && derivedPass === ADMIN_PASS_PBKDF2;
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

    if (
      !parsed ||
      parsed.role !== "admin" ||
      typeof parsed.email !== "string" ||
      !parsed.email ||
      !(await isAdminEmail(parsed.email)) ||
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
