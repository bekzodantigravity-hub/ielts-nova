"use client";

import { compareSubmissionsForRank } from "./exam-grading";
import type { ExamSubmissionRecord } from "./exam-types";

const RESULTS_ARCHIVE_KEY = "ielts_nova_cdi_results_archive_v2";
const RESULTS_DELETED_KEY = "ielts_nova_cdi_results_deleted_v2";
const CENTRE_NAME_KEY = "ielts_nova_cdi_centre_name_v1";

export const DEFAULT_CENTRE_NAME = "IELTS Nova Learning Centre";

function pickFresher(
  a: ExamSubmissionRecord,
  b: ExamSubmissionRecord
): ExamSubmissionRecord {
  const aTime = a.gradedAt ? new Date(a.gradedAt).getTime() : 0;
  const bTime = b.gradedAt ? new Date(b.gradedAt).getTime() : 0;
  if (bTime > aTime) return { ...a, ...b };
  if (aTime > bTime) return { ...b, ...a };
  const aScore =
    (a.writingBand !== null ? 1 : 0) +
    (typeof a.speakingBand === "number" ? 1 : 0) +
    (a.teacherFeedback ? 1 : 0);
  const bScore =
    (b.writingBand !== null ? 1 : 0) +
    (typeof b.speakingBand === "number" ? 1 : 0) +
    (b.teacherFeedback ? 1 : 0);
  return bScore > aScore ? { ...a, ...b } : { ...b, ...a };
}

export function getDeletedSubmissionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESULTS_DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

export function markSubmissionDeletedLocally(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const deleted = new Set(getDeletedSubmissionIds());
    deleted.add(id);
    window.localStorage.setItem(
      RESULTS_DELETED_KEY,
      JSON.stringify(Array.from(deleted))
    );
    const remaining = getArchivedSubmissions().filter((s) => s.id !== id);
    saveArchivedSubmissions(remaining);
  } catch {}
}

export function getArchivedSubmissions(): ExamSubmissionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const deleted = new Set(getDeletedSubmissionIds());
    const raw = window.localStorage.getItem(RESULTS_ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ExamSubmissionRecord[])
      .filter(
        (s) =>
          s &&
          typeof s.id === "string" &&
          !deleted.has(s.id) &&
          typeof s.fullName === "string" &&
          Boolean(s.listening) &&
          Boolean(s.reading)
      )
      .sort(compareSubmissionsForRank);
  } catch {
    return [];
  }
}

export function saveArchivedSubmissions(list: ExamSubmissionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    const byId = new Map<string, ExamSubmissionRecord>();
    for (const s of list) {
      if (!s || !s.id) continue;
      byId.set(s.id, s);
    }
    window.localStorage.setItem(
      RESULTS_ARCHIVE_KEY,
      JSON.stringify(Array.from(byId.values()))
    );
  } catch {}
}

export function upsertArchivedSubmission(
  record: ExamSubmissionRecord
): ExamSubmissionRecord[] {
  const existing = getArchivedSubmissions();
  const byId = new Map<string, ExamSubmissionRecord>();
  for (const s of existing) byId.set(s.id, s);
  const prev = byId.get(record.id);
  byId.set(record.id, prev ? pickFresher(prev, record) : record);
  const next = Array.from(byId.values()).sort(compareSubmissionsForRank);
  saveArchivedSubmissions(next);
  return next;
}

export function mergeServerAndArchivedSubmissions(
  serverList: ExamSubmissionRecord[]
): {
  merged: ExamSubmissionRecord[];
  missingOnServer: ExamSubmissionRecord[];
} {
  const deleted = new Set(getDeletedSubmissionIds());
  const localList = getArchivedSubmissions();
  const serverIds = new Set(serverList.map((s) => s.id));
  const byId = new Map<string, ExamSubmissionRecord>();

  for (const loc of localList) {
    if (!deleted.has(loc.id)) {
      byId.set(loc.id, loc);
    }
  }

  for (const srv of serverList) {
    if (!srv || !srv.id || deleted.has(srv.id)) continue;
    const prev = byId.get(srv.id);
    byId.set(srv.id, prev ? pickFresher(prev, srv) : srv);
  }

  const merged = Array.from(byId.values()).sort(compareSubmissionsForRank);
  saveArchivedSubmissions(merged);

  // Any locally archived submission missing from server (e.g., after Vercel redeploy/cold-start)
  // or with newer teacher grades should be synced back up to the server.
  const missingOnServer = merged.filter((m) => {
    if (!serverIds.has(m.id)) return true;
    const srv = serverList.find((s) => s.id === m.id);
    if (!srv) return true;
    const mTime = m.gradedAt ? new Date(m.gradedAt).getTime() : 0;
    const sTime = srv.gradedAt ? new Date(srv.gradedAt).getTime() : 0;
    return mTime > sTime;
  });

  return { merged, missingOnServer };
}

export function getSavedCentreName(): string {
  if (typeof window === "undefined") return DEFAULT_CENTRE_NAME;
  try {
    const val = window.localStorage.getItem(CENTRE_NAME_KEY);
    return val && val.trim() ? val.trim() : DEFAULT_CENTRE_NAME;
  } catch {
    return DEFAULT_CENTRE_NAME;
  }
}

export function saveCentreName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const clean = name.trim() || DEFAULT_CENTRE_NAME;
    window.localStorage.setItem(CENTRE_NAME_KEY, clean);
  } catch {}
}
