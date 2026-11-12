"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "./i18n";
import type { ActiveSkill, TestId } from "./tests-registry";
import { addDays, dateKey, parseKey, roundBand } from "./utils";

export type ThemeMode = "light" | "dark";

export interface QuestionResultItem {
  q: number;
  part: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  flagged?: boolean;
  note?: string;
}

export interface TestAttempt {
  id: string;
  testId: TestId;
  skill: ActiveSkill;
  rawScore: number;
  total: number;
  band: number;
  timeSpentSec: number;
  submittedAt: number;
  partScores: number[];
  partTotals: number[];
  questions: QuestionResultItem[];
}

export interface InProgressMeta {
  answered: number;
  total: number;
  updatedAt: number;
}

export interface Profile {
  name: string;
  targetBand: number;
  examDate: string | null;
  dailyGoal: number;
  birthYear?: number;
  age?: number;
  goal?: string;
}

export interface ClientAuthUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google";
  birthYear?: number;
  age?: number;
  goal?: string;
  targetBand?: number;
  examDate?: string | null;
  dailyGoal?: number;
}

export interface AppState {
  theme: ThemeMode;
  lang: Lang;
  authUser: ClientAuthUser | null;
  profile: Profile;
  inProgress: Partial<Record<TestId, InProgressMeta>>;
  attempts: TestAttempt[];
  activity: Record<string, number>;
}

export const STORAGE_KEY = "ielts-nova:v2";
export const THEME_KEY = "ielts-nova:theme";

export const DEFAULT_STATE: AppState = {
  theme: "light",
  lang: "uz",
  authUser: null,
  profile: {
    name: "Candidate",
    targetBand: 7.5,
    examDate: null,
    dailyGoal: 40,
  },
  inProgress: {},
  attempts: [],
  activity: {},
};

let state: AppState = DEFAULT_STATE;
let loaded = false;
let lastRaw: string | null = null;
const listeners = new Set<() => void>();

function applyDomTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function parse(raw: string | null): AppState {
  if (!raw) {
    if (typeof window !== "undefined") {
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        return { ...DEFAULT_STATE, theme: savedTheme };
      }
    }
    return DEFAULT_STATE;
  }
  try {
    const p = JSON.parse(raw) as Partial<AppState>;
    const theme: ThemeMode = p.theme === "dark" ? "dark" : "light";
    const lang: Lang = "uz";
    const authUser =
      p.authUser &&
      p.authUser.provider === "google" &&
      typeof p.authUser.email === "string"
        ? p.authUser
        : null;
    return {
      ...DEFAULT_STATE,
      ...p,
      theme,
      lang,
      authUser,
      profile: { ...DEFAULT_STATE.profile, ...(p.profile ?? {}) },
      inProgress: p.inProgress ?? {},
      attempts: Array.isArray(p.attempts) ? p.attempts : [],
      activity: p.activity ?? {},
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleServerSync(s: AppState) {
  if (typeof window === "undefined" || !s.authUser?.email) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch("/api/auth/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inProgress: s.inProgress,
        attempts: s.attempts,
        activity: s.activity,
      }),
    }).catch(() => {});
  }, 800);
}

function persist(next: AppState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      const raw = JSON.stringify(state);
      lastRaw = raw;
      window.localStorage.setItem(STORAGE_KEY, raw);
      window.localStorage.setItem(THEME_KEY, state.theme);
      if (state.authUser?.email) {
        const emailKey = state.authUser.email.toLowerCase().trim();
        window.localStorage.setItem(`ielts-nova:account:${emailKey}`, raw);
      }
    } catch {
      /* ignore quota errors */
    }
    applyDomTheme(state.theme);
    scheduleServerSync(state);
  }
  emit();
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  lastRaw = window.localStorage.getItem(STORAGE_KEY);
  state = parse(lastRaw);
  applyDomTheme(state.theme);

  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      lastRaw = window.localStorage.getItem(STORAGE_KEY);
      state = parse(lastRaw);
      applyDomTheme(state.theme);
      emit();
    }
  });
}

export function reloadFromStorage() {
  if (typeof window === "undefined") return;
  load();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  // Window focus fires this often; skip the re-render when storage did not change.
  if (raw === lastRaw) return;
  lastRaw = raw;
  state = parse(raw);
  applyDomTheme(state.theme);
  emit();
}

function update(fn: (s: AppState) => AppState) {
  load();
  const next = fn(state);
  if (next === state) return;
  persist(next);
}

// Pulls the server copy of progress and merges it in. Only touches the store when
// the merge actually changes something (no needless persist / re-render / re-sync).
let lastServerPullAt = 0;
const SERVER_PULL_MIN_INTERVAL_MS = 30_000;

function pullServerState(emailKey: string) {
  if (typeof window === "undefined") return;
  lastServerPullAt = Date.now();
  fetch("/api/auth/sync", { cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data) return;
      update((curr) => {
        if (
          !curr.authUser ||
          curr.authUser.email.toLowerCase().trim() !== emailKey
        ) {
          return curr;
        }
        const inProgress = { ...data.inProgress, ...curr.inProgress };
        const attempts =
          Array.isArray(data.attempts) &&
          data.attempts.length > curr.attempts.length
            ? data.attempts
            : curr.attempts;
        const activity = { ...data.activity, ...curr.activity };
        if (
          attempts === curr.attempts &&
          JSON.stringify(inProgress) === JSON.stringify(curr.inProgress) &&
          JSON.stringify(activity) === JSON.stringify(curr.activity)
        ) {
          return curr;
        }
        return { ...curr, inProgress, attempts, activity };
      });
    })
    .catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => {
  load();
  return state;
};

const getServerSnapshot = () => DEFAULT_STATE;

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const actions = {
  setTheme(theme: ThemeMode) {
    update((s) => ({ ...s, theme }));
  },
  toggleTheme() {
    update((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }));
  },
  setLang(_lang?: Lang) {
    update((s) => ({ ...s, lang: "uz" }));
  },
  setAuthUser(user: ClientAuthUser | null) {
    if (!user) {
      update((s) => ({ ...s, authUser: null }));
      return;
    }

    const emailKey = user.email.toLowerCase().trim();

    // Idempotent: the dashboard re-verifies the session on mount/focus. If nothing
    // changed, do NOT rewrite localStorage, re-render every subscriber or re-sync.
    const current = state.authUser;
    if (
      current &&
      current.email.toLowerCase().trim() === emailKey &&
      JSON.stringify(current) === JSON.stringify(user)
    ) {
      if (Date.now() - lastServerPullAt > SERVER_PULL_MIN_INTERVAL_MS) {
        pullServerState(emailKey);
      }
      return;
    }

    let accountScopedState: Partial<AppState> = {};

    if (typeof window !== "undefined") {
      try {
        const savedAccount = window.localStorage.getItem(`ielts-nova:account:${emailKey}`);
        if (savedAccount) {
          accountScopedState = JSON.parse(savedAccount);
        }
      } catch {
        /* ignore parse error */
      }
    }

    update((s) => {
      const isSameUser =
        s.authUser && s.authUser.email.toLowerCase().trim() === emailKey;

      const baseInProgress = isSameUser
        ? s.inProgress
        : accountScopedState.inProgress || {};
      const baseAttempts = isSameUser
        ? s.attempts
        : accountScopedState.attempts || [];
      const baseActivity = isSameUser
        ? s.activity
        : accountScopedState.activity || {};
      const baseProfile = isSameUser
        ? s.profile
        : accountScopedState.profile || s.profile;

      return {
        ...s,
        authUser: user,
        inProgress: baseInProgress,
        attempts: baseAttempts,
        activity: baseActivity,
        profile: {
          ...baseProfile,
          name: user.name || baseProfile.name,
          birthYear: user.birthYear ?? baseProfile.birthYear,
          age: user.age ?? baseProfile.age,
          goal: user.goal ?? baseProfile.goal,
          targetBand: user.targetBand ?? baseProfile.targetBand,
          examDate:
            user.examDate !== undefined
              ? user.examDate
              : baseProfile.examDate,
          dailyGoal: user.dailyGoal ?? baseProfile.dailyGoal,
        },
      };
    });

    if (typeof window !== "undefined") {
      pullServerState(emailKey);
    }
  },
  clearAuthUser() {
    if (typeof window !== "undefined" && state.authUser?.email) {
      const emailKey = state.authUser.email.toLowerCase().trim();
      try {
        window.localStorage.setItem(
          `ielts-nova:account:${emailKey}`,
          JSON.stringify(state)
        );
      } catch {}
    }
    update((s) => ({
      ...s,
      authUser: null,
      inProgress: {},
      attempts: [],
      activity: {},
      profile: DEFAULT_STATE.profile,
    }));
  },
  setProfile(patch: Partial<Profile>) {
    update((s) => {
      const updatedProfile = { ...s.profile, ...patch };
      const updatedAuthUser =
        s.authUser && patch.name ? { ...s.authUser, name: patch.name } : s.authUser;
      return {
        ...s,
        profile: updatedProfile,
        authUser: updatedAuthUser,
      };
    });
  },
  recordProgress(testId: TestId, answered: number, total = 40) {
    update((s) => {
      const prev = s.inProgress[testId]?.answered ?? 0;
      const delta = Math.max(0, answered - prev);
      const today = dateKey();
      const nextActivity =
        delta > 0
          ? { ...s.activity, [today]: (s.activity[today] ?? 0) + delta }
          : s.activity;
      return {
        ...s,
        activity: nextActivity,
        inProgress: {
          ...s.inProgress,
          [testId]: { answered, total, updatedAt: Date.now() },
        },
      };
    });
  },
  recordAttempt(attempt: Omit<TestAttempt, "id"> & { studentName?: string }) {
    update((s) => {
      if (
        s.attempts[0] &&
        s.attempts[0].testId === attempt.testId &&
        Math.abs(s.attempts[0].submittedAt - attempt.submittedAt) < 2000
      ) {
        return s;
      }
      const nextInProgress = { ...s.inProgress };
      delete nextInProgress[attempt.testId];
      const today = dateKey();
      const answeredCount = attempt.questions.filter(
        (q) => q.userAnswer.trim() !== ""
      ).length;
      const bump = Math.max(10, answeredCount);
      const trimmedName = attempt.studentName?.trim();
      const nextProfile =
        trimmedName && (!s.profile.name || s.profile.name === "Candidate")
          ? { ...s.profile, name: trimmedName }
          : s.profile;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(
            `ielts-nova:progress:${attempt.testId}`
          );
        } catch {
          /* ignore */
        }
      }
      const { studentName: _sn, ...cleanAttempt } = attempt;
      void _sn;
      return {
        ...s,
        profile: nextProfile,
        inProgress: nextInProgress,
        attempts: [
          { ...cleanAttempt, id: `${attempt.testId}-${attempt.submittedAt}` },
          ...s.attempts,
        ],
        activity: {
          ...s.activity,
          [today]: Math.max(s.activity[today] ?? 0, bump),
        },
      };
    });
  },
  reset() {
    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith("ielts-nova:progress:")) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
      } catch {
        /* ignore */
      }
    }
    update((s) => ({
      ...DEFAULT_STATE,
      theme: s.theme,
      lang: s.lang,
      authUser: s.authUser,
      profile: s.authUser
        ? { ...DEFAULT_STATE.profile, name: s.authUser.name }
        : DEFAULT_STATE.profile,
    }));
  },
};

export function computeStreak(activity: Record<string, number>) {
  const keys = Object.keys(activity)
    .filter((k) => activity[k] > 0)
    .sort();
  const set = new Set(keys);
  const todayCount = activity[dateKey()] ?? 0;

  let cursor = todayCount > 0 ? new Date() : addDays(new Date(), -1);
  let current = 0;
  while (set.has(dateKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const d = parseKey(k);
    if (prev && Math.round((d.getTime() - prev.getTime()) / 86400000) === 1)
      run++;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best, todayCount, activeToday: todayCount > 0 };
}

export function testSummary(state: AppState, testId: TestId) {
  const attempts = state.attempts.filter((a) => a.testId === testId);
  const prog = state.inProgress[testId];
  const latest = attempts[0] ?? null;
  const bestBand =
    attempts.length > 0 ? Math.max(...attempts.map((a) => a.band)) : null;
  const status: "in_progress" | "completed" | "not_started" =
    prog && prog.answered > 0
      ? "in_progress"
      : attempts.length > 0
        ? "completed"
        : "not_started";
  return { attempts, prog, latest, bestBand, status };
}

export function overallEstimatedBand(state: AppState): number | null {
  if (state.attempts.length === 0) return null;
  const latestBySkill: Partial<Record<ActiveSkill, number>> = {};
  for (const a of state.attempts) {
    if (latestBySkill[a.skill] === undefined) {
      latestBySkill[a.skill] = a.band;
    }
  }
  const vals = Object.values(latestBySkill) as number[];
  if (vals.length === 0) return null;
  return roundBand(vals.reduce((sum, v) => sum + v, 0) / vals.length);
}
