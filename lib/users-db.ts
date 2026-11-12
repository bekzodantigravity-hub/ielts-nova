import fs from "node:fs";
import path from "node:path";

export interface StoredUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  examDate?: string | null;
  dailyGoal?: number;
  picture?: string;
  provider: "google";
  inProgress?: Record<string, { answered: number; total: number; updatedAt: number }>;
  attempts?: unknown[];
  activity?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: Record<string, StoredUser>;
}

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "users.json");

function ensureDbFile(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { users: {} };
      writeDbFile(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw || !raw.trim()) {
      return { users: {} };
    }
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return { users: {} };
  }
}

function writeDbFile(data: DatabaseSchema): void {
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
        try { fs.unlinkSync(tempFile); } catch {}
      } catch {}
    }
  } catch (err) {
    console.error("Failed to write users database:", err);
  }
}

export function findUserByEmail(email: string): StoredUser | null {
  const norm = email.trim().toLowerCase();
  const db = ensureDbFile();
  return db.users[norm] || null;
}

export function listAllUsers(): StoredUser[] {
  const db = ensureDbFile();
  return Object.values(db.users).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
    updatedAt: now,
  };

  db.users[norm] = updated;
  writeDbFile(db);
  return updated;
}

export function upsertUser(user: {
  email: string;
  password?: string;
  name?: string;
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  examDate?: string | null;
  dailyGoal?: number;
  picture?: string;
  inProgress?: Record<string, { answered: number; total: number; updatedAt: number }>;
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
    norm.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Candidate";

  const updated: StoredUser = {
    id: existing?.id || `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: norm,
    password: user.password || existing?.password,
    name: fallbackName,
    birthYear: user.birthYear ?? existing?.birthYear,
    age: calculatedAge,
    goal: user.goal || existing?.goal || "Chet elda ta'lim (Bakalavr / Magistratura)",
    targetBand: user.targetBand ?? existing?.targetBand ?? 7.5,
    examDate: user.examDate !== undefined ? user.examDate : existing?.examDate ?? null,
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
  writeDbFile(db);
  return updated;
}
