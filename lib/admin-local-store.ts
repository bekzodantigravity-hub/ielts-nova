"use client";

export type PlanType = "free" | "pro" | "elite";

export interface AdminUserRow {
  id: string;
  email: string;
  password: string;
  phone: string;
  name: string;
  plan: PlanType;
  role: "user" | "admin";
  birthYear: number | null;
  age: number | null;
  goal: string;
  targetBand: number;
  attemptsCount: number;
  inProgressCount: number;
  createdAt: string;
  updatedAt: string;
}

const USERS_STORAGE_KEY = "ielts_nova_admin_users_v1";
const DELETED_STORAGE_KEY = "ielts_nova_admin_deleted_v1";
const ADMIN_SESSION_STORAGE_KEY = "ielts_nova_admin_session_v1";
const APP_STATE_STORAGE_KEY = "ielts-nova-state-v4";

function normalizePlan(raw: unknown): PlanType {
  if (raw === "pro" || raw === "elite" || raw === "free") return raw;
  return "free";
}

export function getDeletedEmails(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function addDeletedEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const norm = email.trim().toLowerCase();
    const list = getDeletedEmails();
    if (!list.includes(norm)) {
      list.push(norm);
      window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {}
}

function removeDeletedEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    const norm = email.trim().toLowerCase();
    const list = getDeletedEmails().filter((e) => e !== norm);
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function getLocalAdminUsers(): AdminUserRow[] {
  if (typeof window === "undefined") return [];
  try {
    const deleted = new Set(getDeletedEmails());
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    const list: AdminUserRow[] = raw ? JSON.parse(raw) : [];
    const byEmail = new Map<string, AdminUserRow>();

    if (Array.isArray(list)) {
      for (const u of list) {
        if (!u || typeof u.email !== "string") continue;
        const norm = u.email.trim().toLowerCase();
        if (!norm || deleted.has(norm)) continue;
        byEmail.set(norm, {
          ...u,
          email: norm,
          plan: normalizePlan(u.plan),
          role: u.role === "admin" ? "admin" : "user",
        });
      }
    }

    // Also inspect current browser session in ielts-nova-state-v4
    try {
      const appRaw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
      if (appRaw) {
        const appParsed = JSON.parse(appRaw) as {
          authUser?: {
            sub?: string;
            email?: string;
            name?: string;
            phone?: string;
            plan?: PlanType;
            role?: "user" | "admin";
            birthYear?: number;
            age?: number;
            goal?: string;
            targetBand?: number;
          } | null;
          profile?: {
            name?: string;
            phone?: string;
            plan?: PlanType;
            targetBand?: number;
            birthYear?: number;
            age?: number;
            goal?: string;
          };
          attempts?: unknown[];
          inProgress?: Record<string, unknown>;
        };
        const au = appParsed?.authUser;
        if (au && typeof au.email === "string" && au.email.includes("@")) {
          const norm = au.email.trim().toLowerCase();
          if (!deleted.has(norm) && !byEmail.has(norm)) {
            const now = new Date().toISOString();
            byEmail.set(norm, {
              id: au.sub || `usr_${Math.random().toString(36).slice(2, 10)}`,
              email: norm,
              password: "",
              phone: au.phone || appParsed.profile?.phone || "",
              name: au.name || appParsed.profile?.name || norm.split("@")[0],
              plan: normalizePlan(au.plan || appParsed.profile?.plan),
              role: au.role === "admin" ? "admin" : "user",
              birthYear: au.birthYear ?? appParsed.profile?.birthYear ?? null,
              age: au.age ?? appParsed.profile?.age ?? null,
              goal: au.goal || appParsed.profile?.goal || "",
              targetBand: au.targetBand ?? appParsed.profile?.targetBand ?? 7.5,
              attemptsCount: Array.isArray(appParsed.attempts)
                ? appParsed.attempts.length
                : 0,
              inProgressCount: appParsed.inProgress
                ? Object.keys(appParsed.inProgress).length
                : 0,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }
    } catch {}

    return Array.from(byEmail.values()).sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLocalAdminUsers(users: AdminUserRow[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

export function syncActiveAppStatePlan(email: string, patch: Partial<AdminUserRow>): void {
  if (typeof window === "undefined") return;
  try {
    const norm = email.trim().toLowerCase();
    const appRaw = window.localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (!appRaw) return;
    const appParsed = JSON.parse(appRaw);
    if (
      appParsed?.authUser &&
      typeof appParsed.authUser.email === "string" &&
      appParsed.authUser.email.trim().toLowerCase() === norm
    ) {
      if (patch.plan) {
        appParsed.authUser.plan = patch.plan;
        if (appParsed.profile) appParsed.profile.plan = patch.plan;
      }
      if (patch.name) {
        appParsed.authUser.name = patch.name;
        if (appParsed.profile) appParsed.profile.name = patch.name;
      }
      if (patch.phone !== undefined) {
        appParsed.authUser.phone = patch.phone;
        if (appParsed.profile) appParsed.profile.phone = patch.phone;
      }
      if (typeof patch.targetBand === "number") {
        appParsed.authUser.targetBand = patch.targetBand;
        if (appParsed.profile) appParsed.profile.targetBand = patch.targetBand;
      }
      window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(appParsed));
    }
  } catch {}
}

export function upsertLocalAdminUser(
  input: Partial<AdminUserRow> & { email: string },
  originalEmail?: string
): AdminUserRow[] {
  const list = getLocalAdminUsers();
  const byEmail = new Map<string, AdminUserRow>();
  for (const u of list) {
    byEmail.set(u.email.trim().toLowerCase(), u);
  }

  const oldKey = (originalEmail || input.email).trim().toLowerCase();
  const nextKey = input.email.trim().toLowerCase();
  const existing = byEmail.get(oldKey) || byEmail.get(nextKey);
  const now = new Date().toISOString();

  const updated: AdminUserRow = {
    id:
      input.id ||
      existing?.id ||
      `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: nextKey,
    password:
      input.password !== undefined && input.password !== ""
        ? input.password
        : existing?.password || "",
    phone:
      input.phone !== undefined ? input.phone : existing?.phone || "",
    name:
      input.name?.trim() ||
      existing?.name ||
      nextKey
        .split("@")[0]
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()) ||
      "Candidate",
    plan: normalizePlan(input.plan ?? existing?.plan ?? "free"),
    role: input.role ?? existing?.role ?? "user",
    birthYear:
      input.birthYear !== undefined
        ? input.birthYear
        : existing?.birthYear ?? null,
    age: input.age !== undefined ? input.age : existing?.age ?? null,
    goal: input.goal !== undefined ? input.goal : existing?.goal || "",
    targetBand:
      typeof input.targetBand === "number"
        ? input.targetBand
        : existing?.targetBand ?? 7.5,
    attemptsCount:
      typeof input.attemptsCount === "number"
        ? input.attemptsCount
        : existing?.attemptsCount ?? 0,
    inProgressCount:
      typeof input.inProgressCount === "number"
        ? input.inProgressCount
        : existing?.inProgressCount ?? 0,
    createdAt: existing?.createdAt || input.createdAt || now,
    updatedAt: now,
  };

  if (oldKey !== nextKey) {
    byEmail.delete(oldKey);
  }
  byEmail.set(nextKey, updated);
  removeDeletedEmail(nextKey);

  const nextList = Array.from(byEmail.values()).sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
  saveLocalAdminUsers(nextList);
  syncActiveAppStatePlan(nextKey, updated);
  return nextList;
}

export function deleteLocalAdminUser(email: string): AdminUserRow[] {
  const norm = email.trim().toLowerCase();
  addDeletedEmail(norm);
  const nextList = getLocalAdminUsers().filter(
    (u) => u.email.trim().toLowerCase() !== norm
  );
  saveLocalAdminUsers(nextList);
  return nextList;
}

export function mergeServerAndLocalUsers(
  serverUsers: AdminUserRow[]
): AdminUserRow[] {
  const deleted = new Set(getDeletedEmails());
  const localUsers = getLocalAdminUsers();
  const byEmail = new Map<string, AdminUserRow>();

  for (const u of localUsers) {
    const norm = u.email.trim().toLowerCase();
    if (!deleted.has(norm)) {
      byEmail.set(norm, u);
    }
  }

  for (const s of serverUsers) {
    const norm = s.email.trim().toLowerCase();
    if (deleted.has(norm)) continue;
    const loc = byEmail.get(norm);
    byEmail.set(norm, {
      ...s,
      email: norm,
      password: s.password || loc?.password || "",
      phone: s.phone || loc?.phone || "",
      plan: normalizePlan(s.plan || loc?.plan),
      role: s.role === "admin" || loc?.role === "admin" ? "admin" : "user",
    });
  }

  const merged = Array.from(byEmail.values()).sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
  );
  saveLocalAdminUsers(merged);
  return merged;
}

export function getSavedAdminSession(): { email: string; password?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      email?: string;
      password?: string;
      exp?: number;
    };
    if (
      !parsed ||
      typeof parsed.email !== "string" ||
      !parsed.email ||
      (typeof parsed.exp === "number" && parsed.exp < Date.now())
    ) {
      return null;
    }
    return { email: parsed.email, password: parsed.password };
  } catch {
    return null;
  }
}

export function saveAdminSession(email: string, password?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      })
    );
  } catch {}
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {}
}
