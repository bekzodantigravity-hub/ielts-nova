import fs from "node:fs";
import path from "node:path";

const GOOGLE_CLIENT_ID_REGEX =
  /^[0-9]{6,}-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/;

export function isValidGoogleClientId(value: string): boolean {
  return GOOGLE_CLIENT_ID_REGEX.test(value.trim());
}

function readDotEnvKey(filePath: string, key: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const k = trimmed.slice(0, idx).trim();
      if (k === key) {
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1).trim();
        }
        return val || null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveGoogleClientId(): string | null {
  const fromEnv =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  if (fromEnv && isValidGoogleClientId(fromEnv)) {
    return fromEnv;
  }

  const cwd = process.cwd();
  for (const fname of [".env.local", ".env"]) {
    const p = path.join(cwd, fname);
    const v =
      readDotEnvKey(p, "NEXT_PUBLIC_GOOGLE_CLIENT_ID") ||
      readDotEnvKey(p, "GOOGLE_CLIENT_ID");
    if (v && isValidGoogleClientId(v)) {
      return v;
    }
  }
  return null;
}

export function saveGoogleClientIdToEnvLocal(clientId: string): void {
  const clean = clientId.trim();
  if (!isValidGoogleClientId(clean)) {
    throw new Error("Invalid Google OAuth Client ID format.");
  }

  const envLocalPath = path.join(process.cwd(), ".env.local");
  let existing = "";
  try {
    if (fs.existsSync(envLocalPath)) {
      existing = fs.readFileSync(envLocalPath, "utf8");
    }
  } catch {
    existing = "";
  }

  const lines = existing ? existing.split(/\r?\n/) : [];
  let updated = false;
  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_GOOGLE_CLIENT_ID=")) {
      updated = true;
      return `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clean}`;
    }
    return line;
  });

  if (!updated) {
    if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push(`NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clean}`);
  }

  fs.writeFileSync(envLocalPath, `${nextLines.join("\n").trim()}\n`, "utf8");
  const envTarget = process.env as Record<string, string | undefined>;
  envTarget["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] = clean;
}
