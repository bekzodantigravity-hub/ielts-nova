import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createDefaultMock1, DEFAULT_EXAM_PASSWORD, MOCK_1_ID } from "./exam-mock1";
import type {
  ExamRoomStatus,
  ExamStartMode,
  ExamSubmissionRecord,
  ExamWritingMode,
  LobbyParticipant,
  MockExamConfig,
  MockExamPublicPayload,
  TeacherAccount,
} from "./exam-types";

interface ExamDatabaseSchema {
  mocks: Record<string, MockExamConfig>;
  lobby: Record<string, LobbyParticipant>;
  submissions: Record<string, ExamSubmissionRecord>;
  teachers: Record<string, TeacherAccount>;
}

const DB_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "ielts-nova-data")
  : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "cdi-exams.json");

declare global {
  // eslint-disable-next-line no-var
  var __ieltsNovaCdiExamDb: ExamDatabaseSchema | undefined;
  // eslint-disable-next-line no-var
  var __ieltsNovaSupabaseExamUnavailableUntil: number | undefined;
}

function getSupabase() {
  if (
    globalThis.__ieltsNovaSupabaseExamUnavailableUntil &&
    Date.now() < globalThis.__ieltsNovaSupabaseExamUnavailableUntil
  ) {
    return null;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !key || url.includes("your-project") || key.includes("your-anon")) {
    return null;
  }
  try {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

function markSupabaseTemporarilyUnavailable() {
  globalThis.__ieltsNovaSupabaseExamUnavailableUntil = Date.now() + 60_000;
}

function createInitialDb(): ExamDatabaseSchema {
  const mock1 = createDefaultMock1();
  return {
    mocks: { [mock1.id]: mock1 },
    lobby: {},
    submissions: {},
    teachers: {
      "teacher-super-1": {
        id: "teacher-super-1",
        name: "Bekzod (Super Admin)",
        email: "admin@ieltsnova.uz",
        role: "super_admin",
        createdAt: new Date().toISOString(),
      },
    },
  };
}

function readLocalDb(): ExamDatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = globalThis.__ieltsNovaCdiExamDb || createInitialDb();
      writeLocalDb(initial);
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf8");
    if (!raw || !raw.trim()) {
      const initial = globalThis.__ieltsNovaCdiExamDb || createInitialDb();
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<ExamDatabaseSchema>;
    const fallback = createInitialDb();
    const db: ExamDatabaseSchema = {
      mocks: parsed.mocks && Object.keys(parsed.mocks).length > 0 ? parsed.mocks : fallback.mocks,
      lobby: parsed.lobby || {},
      submissions: parsed.submissions || {},
      teachers:
        parsed.teachers && Object.keys(parsed.teachers).length > 0
          ? parsed.teachers
          : fallback.teachers,
    };
    if (!db.mocks[MOCK_1_ID]) {
      db.mocks[MOCK_1_ID] = createDefaultMock1();
    }
    globalThis.__ieltsNovaCdiExamDb = db;
    return db;
  } catch {
    if (!globalThis.__ieltsNovaCdiExamDb) {
      globalThis.__ieltsNovaCdiExamDb = createInitialDb();
    }
    return globalThis.__ieltsNovaCdiExamDb;
  }
}

function writeLocalDb(db: ExamDatabaseSchema): void {
  globalThis.__ieltsNovaCdiExamDb = db;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to persist CDI exam db locally:", err);
  }
}

export function toPublicMockPayload(mock: MockExamConfig): MockExamPublicPayload {
  const { password: _p, listeningKey: _lk, readingKey: _rk, ...rest } = mock;
  return {
    ...rest,
    hasPassword: Boolean(_p),
  };
}

export async function listMockExams(): Promise<MockExamConfig[]> {
  const db = readLocalDb();
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("cdi_mock_exams")
        .select("id, config_json, password, start_mode, status, started_at, writing_mode, title, subtitle, updated_at")
        .order("created_at", { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const merged: MockExamConfig[] = data.map((row) => {
          const cfg = (row.config_json || {}) as MockExamConfig;
          return {
            ...cfg,
            id: row.id,
            title: row.title || cfg.title,
            subtitle: row.subtitle || cfg.subtitle,
            password: row.password || cfg.password || DEFAULT_EXAM_PASSWORD,
            startMode: (row.start_mode as ExamStartMode) || cfg.startMode || "proctor",
            status: (row.status as ExamRoomStatus) || cfg.status || "waiting",
            startedAt: row.started_at ?? cfg.startedAt ?? null,
            writingMode: (row.writing_mode as ExamWritingMode) || cfg.writingMode || "task1_only",
            updatedAt: row.updated_at || cfg.updatedAt,
          };
        });
        for (const m of merged) {
          db.mocks[m.id] = m;
        }
        writeLocalDb(db);
        return merged;
      }
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return Object.values(db.mocks).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

export async function getMockExamById(mockId: string): Promise<MockExamConfig | null> {
  const all = await listMockExams();
  return all.find((m) => m.id === mockId) || null;
}

export async function saveMockExam(mock: MockExamConfig): Promise<MockExamConfig> {
  const updated: MockExamConfig = {
    ...mock,
    updatedAt: new Date().toISOString(),
  };
  const db = readLocalDb();
  db.mocks[updated.id] = updated;
  writeLocalDb(db);

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from("cdi_mock_exams").upsert({
        id: updated.id,
        title: updated.title,
        subtitle: updated.subtitle,
        password: updated.password,
        start_mode: updated.startMode,
        status: updated.status,
        started_at: updated.startedAt,
        writing_mode: updated.writingMode,
        config_json: updated,
        updated_at: updated.updatedAt,
      });
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return updated;
}

export async function createNewMockExam(input: {
  title: string;
  subtitle?: string;
  password?: string;
  startMode?: ExamStartMode;
  writingMode?: ExamWritingMode;
  readingDurationSeconds?: number;
  writingDurationSeconds?: number;
  writingTask2Prompt?: string;
}): Promise<MockExamConfig> {
  const template = createDefaultMock1();
  const now = new Date().toISOString();
  const id = `mock-${Date.now().toString(36)}`;
  const writingMode: ExamWritingMode =
    input.writingMode === "task1_and_task2" ? "task1_and_task2" : "task1_only";
  const writingDurationSeconds =
    input.writingDurationSeconds ?? (writingMode === "task1_and_task2" ? 60 * 60 : 20 * 60);

  const created: MockExamConfig = {
    ...template,
    id,
    title: input.title.trim(),
    subtitle:
      input.subtitle?.trim() ||
      (writingMode === "task1_and_task2"
        ? "Listening (40 Q) · Reading (60:00) · Writing Task 1 + Task 2 (60:00)"
        : "Listening (40 Q) · Reading (60:00) · Writing Task 1 (20:00)"),
    password: (input.password || DEFAULT_EXAM_PASSWORD).trim().toLowerCase(),
    startMode: input.startMode === "individual" ? "individual" : "proctor",
    status: "waiting",
    startedAt: null,
    writingMode,
    readingDurationSeconds: input.readingDurationSeconds ?? 60 * 60,
    writingDurationSeconds,
    writingTask2:
      writingMode === "task1_and_task2"
        ? {
            title: "WRITING TASK 2",
            prompt:
              input.writingTask2Prompt?.trim() ||
              "You should spend about 40 minutes on this task.\n\nSome people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer.\n\nWhat, in your opinion, should be the main function of a university?\n\nWrite at least 250 words.",
            minWords: 250,
          }
        : null,
    createdAt: now,
    updatedAt: now,
  };

  return saveMockExam(created);
}

export async function deleteMockExam(mockId: string): Promise<boolean> {
  if (mockId === MOCK_1_ID) return false;
  const db = readLocalDb();
  delete db.mocks[mockId];
  writeLocalDb(db);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("cdi_mock_exams").delete().eq("id", mockId);
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return true;
}

// =========================================================================
// LOBBY MANAGEMENT (30-60 simultaneous candidates)
// =========================================================================

export async function joinExamLobby(input: {
  mockId: string;
  fullName: string;
  participantId?: string;
}): Promise<LobbyParticipant> {
  const now = new Date().toISOString();
  const id =
    input.participantId?.trim() ||
    `cand_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const participant: LobbyParticipant = {
    id,
    mockId: input.mockId,
    fullName: input.fullName.trim(),
    joinedAt: now,
    lastSeenAt: now,
    status: "waiting",
  };

  const db = readLocalDb();
  const existing = db.lobby[id];
  if (existing) {
    participant.joinedAt = existing.joinedAt;
    participant.status = existing.status;
  }
  db.lobby[id] = participant;
  writeLocalDb(db);

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from("cdi_exam_lobby").upsert({
        id: participant.id,
        mock_id: participant.mockId,
        full_name: participant.fullName,
        status: participant.status,
        joined_at: participant.joinedAt,
        last_seen_at: participant.lastSeenAt,
      });
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return participant;
}

export async function touchLobbyParticipant(
  participantId: string,
  status?: "waiting" | "in_exam" | "submitted"
): Promise<void> {
  const now = new Date().toISOString();
  const db = readLocalDb();
  if (db.lobby[participantId]) {
    db.lobby[participantId].lastSeenAt = now;
    if (status) db.lobby[participantId].status = status;
    writeLocalDb(db);
  }
  const sb = getSupabase();
  if (sb) {
    try {
      const patch: Record<string, string> = { last_seen_at: now };
      if (status) patch.status = status;
      await sb.from("cdi_exam_lobby").update(patch).eq("id", participantId);
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
}

export async function listLobbyParticipants(
  mockId: string
): Promise<LobbyParticipant[]> {
  const db = readLocalDb();
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("cdi_exam_lobby")
        .select("*")
        .eq("mock_id", mockId)
        .order("joined_at", { ascending: true });
      if (!error && Array.isArray(data)) {
        const list: LobbyParticipant[] = data.map((r) => ({
          id: r.id,
          mockId: r.mock_id,
          fullName: r.full_name,
          joinedAt: r.joined_at,
          lastSeenAt: r.last_seen_at,
          status: r.status,
        }));
        for (const p of list) db.lobby[p.id] = p;
        writeLocalDb(db);
        return list;
      }
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }

  return Object.values(db.lobby)
    .filter((p) => p.mockId === mockId)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
}

export async function clearLobbyForMock(mockId: string): Promise<void> {
  const db = readLocalDb();
  for (const [id, p] of Object.entries(db.lobby)) {
    if (p.mockId === mockId) {
      delete db.lobby[id];
    }
  }
  writeLocalDb(db);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("cdi_exam_lobby").delete().eq("mock_id", mockId);
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
}

// =========================================================================
// SUBMISSIONS & TEACHER GRADING
// =========================================================================

export async function saveExamSubmission(
  record: ExamSubmissionRecord
): Promise<ExamSubmissionRecord> {
  const db = readLocalDb();
  db.submissions[record.id] = record;
  if (db.lobby[record.participantId]) {
    db.lobby[record.participantId].status = "submitted";
    db.lobby[record.participantId].lastSeenAt = new Date().toISOString();
  }
  writeLocalDb(db);

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from("cdi_exam_submissions").upsert({
        id: record.id,
        mock_id: record.mockId,
        mock_title: record.mockTitle,
        participant_id: record.participantId,
        full_name: record.fullName,
        submitted_at: record.submittedAt,
        tab_switch_count: record.tabSwitchCount,
        listening_band: record.listening.band,
        listening_raw: record.listening.rawScore,
        reading_band: record.reading.band,
        reading_raw: record.reading.rawScore,
        writing_band: record.writingBand,
        teacher_feedback: record.teacherFeedback,
        graded_by: record.gradedBy,
        graded_at: record.gradedAt,
        payload_json: record,
      });
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return record;
}

function submissionRankScore(s: ExamSubmissionRecord): number {
  const parts = [s.listening.band, s.reading.band];
  if (typeof s.writingBand === "number") parts.push(s.writingBand);
  const avg = parts.reduce((acc, v) => acc + v, 0) / parts.length;
  return avg * 1000 + (s.listening.rawScore + s.reading.rawScore);
}

export async function listExamSubmissions(
  mockId?: string
): Promise<ExamSubmissionRecord[]> {
  const db = readLocalDb();
  const sb = getSupabase();
  if (sb) {
    try {
      let q = sb.from("cdi_exam_submissions").select("*");
      if (mockId) q = q.eq("mock_id", mockId);
      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        const list: ExamSubmissionRecord[] = data.map((row) => {
          const payload = (row.payload_json || {}) as ExamSubmissionRecord;
          return {
            ...payload,
            id: row.id,
            writingBand:
              row.writing_band !== null && row.writing_band !== undefined
                ? Number(row.writing_band)
                : payload.writingBand ?? null,
            teacherFeedback: row.teacher_feedback ?? payload.teacherFeedback ?? "",
            gradedBy: row.graded_by ?? payload.gradedBy ?? null,
            gradedAt: row.graded_at ?? payload.gradedAt ?? null,
          };
        });
        for (const s of list) db.submissions[s.id] = s;
        writeLocalDb(db);
        return list.sort((a, b) => submissionRankScore(b) - submissionRankScore(a));
      }
      if (error) markSupabaseTemporarilyUnavailable();
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }

  return Object.values(db.submissions)
    .filter((s) => (!mockId ? true : s.mockId === mockId))
    .sort((a, b) => submissionRankScore(b) - submissionRankScore(a));
}

export async function updateSubmissionWritingGrade(input: {
  id: string;
  writingBand: number | null;
  teacherFeedback: string;
  gradedBy: string;
}): Promise<ExamSubmissionRecord | null> {
  const db = readLocalDb();
  const existing = db.submissions[input.id];
  if (!existing) return null;

  const updated: ExamSubmissionRecord = {
    ...existing,
    writingBand: input.writingBand,
    teacherFeedback: input.teacherFeedback,
    gradedBy: input.gradedBy,
    gradedAt: new Date().toISOString(),
  };
  return saveExamSubmission(updated);
}

export async function deleteExamSubmission(id: string): Promise<boolean> {
  const db = readLocalDb();
  delete db.submissions[id];
  writeLocalDb(db);
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from("cdi_exam_submissions").delete().eq("id", id);
    } catch {
      markSupabaseTemporarilyUnavailable();
    }
  }
  return true;
}

// =========================================================================
// TEACHERS / CO-ADMINS
// =========================================================================

export async function listTeachers(): Promise<TeacherAccount[]> {
  const db = readLocalDb();
  return Object.values(db.teachers).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

export async function addTeacherAccount(input: {
  name: string;
  email: string;
}): Promise<TeacherAccount> {
  const db = readLocalDb();
  const id = `teacher_${Date.now().toString(36)}`;
  const item: TeacherAccount = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: "teacher",
    createdAt: new Date().toISOString(),
  };
  db.teachers[id] = item;
  writeLocalDb(db);
  return item;
}

export async function removeTeacherAccount(id: string): Promise<boolean> {
  const db = readLocalDb();
  if (db.teachers[id]?.role === "super_admin") return false;
  delete db.teachers[id];
  writeLocalDb(db);
  return true;
}
