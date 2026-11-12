import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const resolvedUrlCache = new Map<string, { resolvedUrl: string; expiresAt: number }>();

function isAllowedArchiveHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "archive.org" ||
    host.endsWith(".archive.org") ||
    host === "catbox.moe" ||
    host.endsWith(".catbox.moe") ||
    host === "strikinglycdn.com" ||
    host.endsWith(".strikinglycdn.com") ||
    host === "vcdn.cloud" ||
    host.endsWith(".vcdn.cloud")
  );
}

async function fetchUpstreamAudio(
  rawUrl: string,
  rangeHeader: string | null,
  method: string
): Promise<Response> {
  const now = Date.now();
  const cached = resolvedUrlCache.get(rawUrl);
  const targetUrl =
    cached && cached.expiresAt > now ? cached.resolvedUrl : rawUrl;

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const urlToTry = attempt === 0 ? targetUrl : rawUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) IELTSNova/1.0",
        Accept: "audio/*,*/*;q=0.8",
      };
      if (rangeHeader) {
        headers["Range"] = rangeHeader;
      }
      const upstream = await fetch(urlToTry, {
        method,
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (upstream.ok || upstream.status === 206) {
        if (upstream.url && upstream.url !== rawUrl) {
          resolvedUrlCache.set(rawUrl, {
            resolvedUrl: upstream.url,
            expiresAt: Date.now() + 15 * 60_000,
          });
        }
        return upstream;
      }
      if (attempt === 1) return upstream;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Upstream fetch failed");
}

async function handleProxy(req: NextRequest, method: "GET" | "HEAD") {
  const rawUrl = req.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing audio URL" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid audio URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !isAllowedArchiveHost(parsed.hostname)) {
    return NextResponse.json({ error: "Disallowed audio host" }, { status: 403 });
  }

  try {
    const range = req.headers.get("range");
    const upstream = await fetchUpstreamAudio(parsed.toString(), range, method);

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { error: `Upstream audio status ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const outHeaders = new Headers();
    const passHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ];
    for (const h of passHeaders) {
      const v = upstream.headers.get(h);
      if (v) outHeaders.set(h, v);
    }
    if (!outHeaders.has("content-type")) {
      outHeaders.set("content-type", "audio/mpeg");
    }
    if (!outHeaders.has("accept-ranges")) {
      outHeaders.set("accept-ranges", "bytes");
    }
    outHeaders.set("cache-control", "public, max-age=86400");

    return new NextResponse(method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to stream audio from upstream archive." },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req, "GET");
}

export async function HEAD(req: NextRequest) {
  return handleProxy(req, "HEAD");
}
