import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type UserPlan = "free" | "pro" | "elite";
export type UserRole = "user" | "admin";

export interface StoredUser {
  id: string;
  email: string;
  password?: string;
  phone?: string;
  name: string;
  plan?: UserPlan;
  role?: UserRole;
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  examDate?: string | null;
  dailyGoal?: number;
  picture?: string;
  provider: "google";
  inProgress?: Record<
    string,
    { answered: number; total: number; updatedAt: number }
  >;
  attempts?: unknown[];
  activity?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
  deletedEmails?: string[];
}

// On Vercel serverless functions, process.cwd() is read-only (/var/task);
// store in os.tmpdir() safely while keeping .data/users.json locally.
const DB_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "ielts-nova-data")
  : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "users.json");

declare global {
  // eslint-disable-next-line no-var
  var __ieltsNovaUsersDbCache: DatabaseSchema | undefined;
}

export function normalizePlan(raw: unknown): UserPlan {
  if (raw === "pro" || raw === "elite" || raw === "free") {
    return raw;
  }
  return "free";
}

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = globalThis.__ieltsNovaUsersDbCache || {
        users: {},
        deletedEmails: [],
      };
      writeDbFile(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw || !raw.trim()) {
      return globalThis.__ieltsNovaUsersDbCache || { users: {}, deletedEmails: [] };
    }
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed || typeof parsed !== "object" || !parsed.users) {
      return { users: {}, deletedEmails: [] };
    }
    if (!Array.isArray(parsed.deletedEmails)) {
      parsed.deletedEmails = [];
    }
    globalThis.__ieltsNovaUsersDbCache = parsed;
    return parsed;
  } catch {
    return globalThis.__ieltsNovaUsersDbCache || { users: {}, deletedEmails: [] };
  }
}

function writeDbFile(data: DatabaseSchema): void {
  globalThis.__ieltsNovaUsersDbCache = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const serialized = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(DB_FILE, serialized, "utf8");
    } catch {
      const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
      fs.writeFileSync(tempFile, serialized, "utf8");
      try {
        fs.copyFileSync(tempFile, DB_FILE);
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      } catch {}
    }
  } catch (err) {
    console.error("Failed to write users database:", err);
  }
}

export function isUserDeleted(email: string): boolean {
  const norm = email.trim().toLowerCase();
  const db = ensureDbFile();
  return Array.isArray(db.deletedEmails) && db.deletedEmails.includes(norm);
}

export function findUserByEmail(email: string): StoredUser | null {
  const norm = email.trim().toLowerCase();
  const db = ensureDbFile();
  const user = db.users[norm];
  if (!user) return null;
  return {
    ...user,
    plan: normalizePlan(user.plan),
    role: user.role === "admin" ? "admin" : "user",
  };
}

export function listAllUsers(): StoredUser[] {
  const db = ensureDbFile();
  return Object.values(db.users)
    .map((u) => ({
      ...u,
      plan: normalizePlan(u.plan),
      role: (u.role === "admin" ? "admin" : "user") as UserRole,
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
}

export function updateUserProfileAndData(
  email: string,
  patch: Partial<Omit<StoredUser, "id" | "email" | "createdAt">>
): StoredUser | null {
  const norm = email.trim().toLowerCase();
  const db = ensureDbFile();
  const existing = db.users[norm];
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: StoredUser = {
    ...existing,
    ...patch,
    plan: patch.plan ? normalizePlan(patch.plan) : normalizePlan(existing.plan),
    updatedAt: now,
  };

  db.users[norm] = updated;
  writeDbFile(db);
  return updated;
}

export function adminUpdateUser(
  originalEmail: string,
  patch: {
    email?: string;
    password?: string;
    phone?: string;
    name?: string;
    plan?: UserPlan;
    role?: UserRole;
    targetBand?: number;
    goal?: string;
    birthYear?: number;
    age?: number;
  }
): { ok: true; user: StoredUser } | { ok: false; error: string } {
  const oldKey = originalEmail.trim().toLowerCase();
  const db = ensureDbFile();
  const now = new Date().toISOString();
  const existing: StoredUser = db.users[oldKey] || {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: oldKey,
    name:
      patch.name?.trim() ||
      oldKey
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Candidate",
    plan: "free",
    role: "user",
    targetBand: 7.5,
    provider: "google",
    createdAt: now,
    updatedAt: now,
  };

  const nextEmail = patch.email ? patch.email.trim().toLowerCase() : oldKey;
  if (!nextEmail || !nextEmail.includes("@")) {
    return { ok: false, error: "Email manzili noto'g'ri formatda." };
  }

  if (nextEmail !== oldKey && db.users[nextEmail]) {
    return {
      ok: false,
      error: "Bu email manzili boshqa foydalanuvchiga biriktirilgan.",
    };
  }

  const nextName =
    patch.name !== undefined
      ? patch.name.trim() || existing.name
      : existing.name;
  const updated: StoredUser = {
    ...existing,
    email: nextEmail,
    name: nextName,
    password:
      patch.password !== undefined ? patch.password.trim() : existing.password,
    phone: patch.phone !== undefined ? patch.phone.trim() : existing.phone,
    plan: patch.plan ? normalizePlan(patch.plan) : normalizePlan(existing.plan),
    role: patch.role ?? existing.role ?? "user",
    targetBand:
      typeof patch.targetBand === "number" && !Number.isNaN(patch.targetBand)
        ? patch.targetBand
        : existing.targetBand,
    goal: patch.goal !== undefined ? patch.goal.trim() : existing.goal,
    birthYear:
      typeof patch.birthYear === "number"
        ? patch.birthYear
        : existing.birthYear,
    age: typeof patch.age === "number" ? patch.age : existing.age,
    picture:
      patch.name !== undefined && nextName !== existing.name
        ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nextName)}&backgroundColor=059669`
        : existing.picture,
    updatedAt: now,
  };

  if (nextEmail !== oldKey) {
    delete db.users[oldKey];
  }
  db.users[nextEmail] = updated;
  if (Array.isArray(db.deletedEmails)) {
    db.deletedEmails = db.deletedEmails.filter((e) => e !== nextEmail);
  }
  writeDbFile(db);
  return { ok: true, user: updated };
}

export function deleteUserByEmail(email: string): boolean {
  const norm = email.trim().toLowerCase();
  const db = ensureDbFile();
  if (db.users[norm]) {
    delete db.users[norm];
  }
  if (!Array.isArray(db.deletedEmails)) {
    db.deletedEmails = [];
  }
  if (!db.deletedEmails.includes(norm)) {
    db.deletedEmails.push(norm);
  }
  writeDbFile(db);
  return true;
}

export function upsertUser(user: {
  email: string;
  password?: string;
  phone?: string;
  name?: string;
  plan?: UserPlan;
  role?: UserRole;
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  examDate?: string | null;
  dailyGoal?: number;
  picture?: string;
  inProgress?: Record<
    string,
    { answered: number; total: number; updatedAt: number }
  >;
  attempts?: unknown[];
  activity?: Record<string, number>;
}): StoredUser {
  const norm = user.email.trim().toLowerCase();
  const db = ensureDbFile();
  const now = new Date().toISOString();

  const existing = db.users[norm];
  const calculatedAge =
    user.age ??
    (user.birthYear ? new Date().getFullYear() - user.birthYear : existing?.age);

  const fallbackName =
    user.name?.trim() ||
    existing?.name ||
    norm
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Candidate";

  const updated: StoredUser = {
    id: existing?.id || `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: norm,
    password: user.password?.trim() || existing?.password,
    phone: user.phone !== undefined ? user.phone.trim() : existing?.phone,
    name: fallbackName,
    plan: user.plan ? normalizePlan(user.plan) : normalizePlan(existing?.plan),
    role: user.role ?? existing?.role ?? "user",
    birthYear: user.birthYear ?? existing?.birthYear,
    age: calculatedAge,
    goal:
      user.goal ||
      existing?.goal ||
      "Chet elda ta'lim (Bakalavr / Magistratura)",
    targetBand: user.targetBand ?? existing?.targetBand ?? 7.5,
    examDate:
      user.examDate !== undefined
        ? user.examDate
        : (existing?.examDate ?? null),
    dailyGoal: user.dailyGoal ?? existing?.dailyGoal ?? 40,
    picture: user.picture || existing?.picture,
    provider: "google",
    inProgress: user.inProgress || existing?.inProgress || {},
    attempts: user.attempts || existing?.attempts || [],
    activity: user.activity || existing?.activity || {},
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  db.users[norm] = updated;
  if (Array.isArray(db.deletedEmails)) {
    db.deletedEmails = db.deletedEmails.filter((e) => e !== norm);
  }
  writeDbFile(db);
  return updated;
}
