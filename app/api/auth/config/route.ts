import { type NextRequest, NextResponse } from "next/server";
import {
  isValidGoogleClientId,
  resolveGoogleClientId,
  saveGoogleClientIdToEnvLocal,
} from "@/lib/env-config";

export const dynamic = "force-dynamic";

let cachedSupabaseGoogle: { checkedAt: number; enabled: boolean } | null = null;

async function isSupabaseGoogleEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedSupabaseGoogle && now - cachedSupabaseGoogle.checkedAt < 60_000) {
    return cachedSupabaseGoogle.enabled;
  }
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supaUrl || !supaKey) {
    return false;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${supaUrl.replace(/\/+$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: supaKey,
        Authorization: `Bearer ${supaKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = (await res.json()) as { external?: { google?: boolean } };
    const enabled = Boolean(data?.external?.google);
    cachedSupabaseGoogle = { checkedAt: now, enabled };
    return enabled;
  } catch {
    return false;
  }
}

export async function GET() {
  const googleClientId = resolveGoogleClientId();
  const supabaseGoogleEnabled = await isSupabaseGoogleEnabled();
  return NextResponse.json({
    configured: Boolean(googleClientId),
    googleClientId,
    supabaseGoogleEnabled,
    devMode: process.env.NODE_ENV !== "production",
  });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Dynamic OAuth Client ID setup is disabled in production." },
      { status: 403 }
    );
  }

  const host = req.headers.get("host") || "";
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");
  if (!isLocal) {
    return NextResponse.json(
      { error: "Setup endpoint is restricted to localhost." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as { googleClientId?: string };
    const candidate = (body.googleClientId || "").trim();
    if (!isValidGoogleClientId(candidate)) {
      return NextResponse.json(
        {
          error:
            "Invalid Client ID. Expected format: 1234567890-abcdef.apps.googleusercontent.com",
        },
        { status: 400 }
      );
    }

    saveGoogleClientIdToEnvLocal(candidate);
    return NextResponse.json({
      ok: true,
      configured: true,
      googleClientId: candidate,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save Google Client ID." },
      { status: 500 }
    );
  }
}
