"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListeningStage } from "@/components/exam/listening-stage";
import type { PassageHighlight } from "@/components/exam/reading-highlight-pane";
import { ReadingStage } from "@/components/exam/reading-stage";
import { WritingStage } from "@/components/exam/writing-stage";
import { MOCK_1_ID } from "@/lib/exam-mock1";
import type {
  ExamRoomStatus,
  ExamStartMode,
  ExamWritingMode,
  MockExamPublicPayload,
} from "@/lib/exam-types";

type ExamStage =
  | "entry"
  | "lobby"
  | "listening"
  | "reading"
  | "writing"
  | "completed";

interface MockListItem {
  id: string;
  title: string;
  subtitle: string;
  startMode: ExamStartMode;
  status: ExamRoomStatus;
  startedAt: string | null;
  writingMode: ExamWritingMode;
  readingDurationSeconds: number;
  writingDurationSeconds: number;
}

interface PersistedExamState {
  mockId: string;
  participantId: string;
  fullName: string;
  stage: ExamStage;
  exam: MockExamPublicPayload;
  listeningAnswers: Record<string, string>;
  readingAnswers: Record<string, string>;
  writingTask1: string;
  writingTask2: string;
  tabSwitchCount: number;
  readingSecondsLeft: number;
  writingSecondsLeft: number;
  transferSecondsLeft: number | null;
  audioPartIndex: number;
  audioCurrentTime: number;
  audioStarted: boolean;
  highlights: PassageHighlight[];
  submissionId?: string;
  submittedAt?: string;
}

const EXAM_STORAGE_KEY = "ielts_nova_cdi_exam_state_v1";

function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function ClosedCdiExamPage() {
  const [hydrated, setHydrated] = useState(false);
  const [availableMocks, setAvailableMocks] = useState<MockListItem[]>([]);
  const [selectedMockId, setSelectedMockId] = useState(MOCK_1_ID);

  // Entry form state (NO "Login" wording)
  const [fullName, setFullName] = useState("");
  const [examPassword, setExamPassword] = useState("");
  const [joining, setJoining] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Active exam session state
  const [stage, setStage] = useState<ExamStage>("entry");
  const [participantId, setParticipantId] = useState("");
  const [exam, setExam] = useState<MockExamPublicPayload | null>(null);
  const [lobbyWaitingCount, setLobbyWaitingCount] = useState(1);

  // Answers & progress
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [writingTask1, setWritingTask1] = useState("");
  const [writingTask2, setWritingTask2] = useState("");
  const [highlights, setHighlights] = useState<PassageHighlight[]>([]);

  // Timers & audio state (persisted for F5 recovery)
  const [readingSecondsLeft, setReadingSecondsLeft] = useState(60 * 60);
  const [writingSecondsLeft, setWritingSecondsLeft] = useState(20 * 60);
  const [transferSecondsLeft, setTransferSecondsLeft] = useState<number | null>(null);
  const [audioPartIndex, setAudioPartIndex] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);

  // Anti-cheat state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabWarningVisible, setTabWarningVisible] = useState(false);
  const lastTabEventRef = useRef(0);

  // Final submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    id: string;
    submittedAt: string;
  } | null>(null);
  const submittedOnceRef = useRef(false);

  const isActiveExam =
    stage === "listening" || stage === "reading" || stage === "writing";

  // 1. Load available mocks list + restore F5 persisted state
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXAM_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedExamState;
        if (saved && saved.exam && saved.fullName && saved.stage !== "entry") {
          setSelectedMockId(saved.mockId || MOCK_1_ID);
          setParticipantId(saved.participantId || "");
          setFullName(saved.fullName);
          setExam(saved.exam);
          setStage(saved.stage);
          setListeningAnswers(saved.listeningAnswers || {});
          setReadingAnswers(saved.readingAnswers || {});
          setWritingTask1(saved.writingTask1 || "");
          setWritingTask2(saved.writingTask2 || "");
          setTabSwitchCount(saved.tabSwitchCount || 0);
          setReadingSecondsLeft(
            typeof saved.readingSecondsLeft === "number"
              ? saved.readingSecondsLeft
              : saved.exam.readingDurationSeconds || 3600
          );
          setWritingSecondsLeft(
            typeof saved.writingSecondsLeft === "number"
              ? saved.writingSecondsLeft
              : saved.exam.writingDurationSeconds || 1200
          );
          setTransferSecondsLeft(
            saved.transferSecondsLeft !== undefined
              ? saved.transferSecondsLeft
              : null
          );
          setAudioPartIndex(saved.audioPartIndex || 0);
          setAudioCurrentTime(saved.audioCurrentTime || 0);
          setAudioStarted(Boolean(saved.audioStarted));
          setHighlights(Array.isArray(saved.highlights) ? saved.highlights : []);
          if (saved.submissionId && saved.submittedAt) {
            setSubmissionReceipt({
              id: saved.submissionId,
              submittedAt: saved.submittedAt,
            });
          }
        }
      }
    } catch {}

    fetch("/api/exam/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { ok?: boolean; mocks?: MockListItem[] }) => {
        if (data.ok && Array.isArray(data.mocks) && data.mocks.length > 0) {
          setAvailableMocks(data.mocks);
        }
      })
      .catch(() => {})
      .finally(() => {
        setHydrated(true);
      });
  }, []);

  // 2. Persist full state to localStorage for seamless F5 refresh recovery
  useEffect(() => {
    if (!hydrated || !exam || stage === "entry") return;
    const snapshot: PersistedExamState = {
      mockId: exam.id,
      participantId,
      fullName,
      stage,
      exam,
      listeningAnswers,
      readingAnswers,
      writingTask1,
      writingTask2,
      tabSwitchCount,
      readingSecondsLeft,
      writingSecondsLeft,
      transferSecondsLeft,
      audioPartIndex,
      audioCurrentTime,
      audioStarted,
      highlights,
      submissionId: submissionReceipt?.id,
      submittedAt: submissionReceipt?.submittedAt,
    };
    try {
      window.localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}
  }, [
    hydrated,
    exam,
    participantId,
    fullName,
    stage,
    listeningAnswers,
    readingAnswers,
    writingTask1,
    writingTask2,
    tabSwitchCount,
    readingSecondsLeft,
    writingSecondsLeft,
    transferSecondsLeft,
    audioPartIndex,
    audioCurrentTime,
    audioStarted,
    highlights,
    submissionReceipt,
  ]);

  // 3. Proctor Lobby Sync Poller (ONLY runs while waiting in lobby — 0 load during exam!)
  useEffect(() => {
    if (stage !== "lobby" || !exam) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/exam/status?mockId=${encodeURIComponent(exam.id)}&participantId=${encodeURIComponent(participantId)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as {
          ok?: boolean;
          status?: ExamRoomStatus;
          startMode?: ExamStartMode;
          waitingCount?: number;
        };
        if (cancelled || !data.ok) return;
        if (typeof data.waitingCount === "number") {
          setLobbyWaitingCount(data.waitingCount);
        }
        if (data.startMode && data.startMode !== exam.startMode) {
          setExam((prev) =>
            prev ? { ...prev, startMode: data.startMode! } : prev
          );
        }
        if (data.status === "started" && exam.startMode === "proctor") {
          setStage("listening");
        }
      } catch {}
    };

    void poll();
    const interval = setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [stage, exam, participantId]);

  // 4. Submit entire exam to server (official 40-pt grading + Writing Task 1 -> Admin)
  const submitFinalExam = useCallback(async () => {
    if (submittedOnceRef.current || !exam) return;
    submittedOnceRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockId: exam.id,
          participantId,
          fullName,
          listeningAnswers,
          readingAnswers,
          writingTask1Text: writingTask1,
          writingTask2Text: writingTask2,
          tabSwitchCount,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        submissionId?: string;
        submittedAt?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Natijani yuborishda xatolik yuz berdi.");
      }
      setSubmissionReceipt({
        id: data.submissionId || `sub_${Date.now().toString(36)}`,
        submittedAt: data.submittedAt || new Date().toISOString(),
      });
      setStage("completed");
    } catch (err) {
      submittedOnceRef.current = false;
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Internet uzilishi yuz berdi. Qayta urinib ko'ring."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    exam,
    participantId,
    fullName,
    listeningAnswers,
    readingAnswers,
    writingTask1,
    writingTask2,
    tabSwitchCount,
  ]);

  // 5. Timers (Listening 2:00 transfer, Reading 60:00, Writing 20:00)
  useEffect(() => {
    if (stage === "listening" && transferSecondsLeft !== null) {
      if (transferSecondsLeft <= 0) {
        setTransferSecondsLeft(null);
        setStage("reading");
        return;
      }
      const id = setTimeout(
        () => setTransferSecondsLeft((s) => (s !== null ? s - 1 : null)),
        1000
      );
      return () => clearTimeout(id);
    }

    if (stage === "reading") {
      if (readingSecondsLeft <= 0) {
        setStage("writing");
        return;
      }
      const id = setTimeout(() => setReadingSecondsLeft((s) => s - 1), 1000);
      return () => clearTimeout(id);
    }

    if (stage === "writing") {
      if (writingSecondsLeft <= 0) {
        void submitFinalExam();
        return;
      }
      const id = setTimeout(() => setWritingSecondsLeft((s) => s - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [
    stage,
    transferSecondsLeft,
    readingSecondsLeft,
    writingSecondsLeft,
    submitFinalExam,
  ]);

  // 6. Strict Anti-Cheat: Copy/Paste/Cut/Ctrl+U/ContextMenu/Back + Tab-Switch Detector
  useEffect(() => {
    if (!isActiveExam) return;

    const recordTabSwitch = () => {
      const now = Date.now();
      if (now - lastTabEventRef.current < 1200) return;
      lastTabEventRef.current = now;
      setTabSwitchCount((c) => c + 1);
      setTabWarningVisible(true);
    };

    const onVisibilityChange = () => {
      if (document.hidden) recordTabSwitch();
    };

    const onBlur = () => {
      recordTabSwitch();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (
        (e.ctrlKey || e.metaKey) &&
        (key === "c" || key === "v" || key === "x" || key === "u" || key === "p")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const onContextMenu = (e: MouseEvent) => {
      // Allow right-click ONLY if user has selected text in Reading (optional), otherwise block completely
      e.preventDefault();
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Trap browser Back button
    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("paste", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("paste", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isActiveExam]);

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError(null);
    const cleanName = fullName.trim();
    const cleanPass = examPassword.trim();

    if (cleanName.length < 2) {
      setEntryError("Iltimos, ism va familiyangizni to'liq kiriting.");
      return;
    }
    if (!cleanPass) {
      setEntryError("Iltimos, imtihon parolini kiriting.");
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/exam/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockId: selectedMockId,
          fullName: cleanName,
          password: cleanPass,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        participant?: { id: string; fullName: string };
        exam?: MockExamPublicPayload;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.exam || !data.participant) {
        throw new Error(data.error || "Imtihonga kirib bo'lmadi.");
      }

      submittedOnceRef.current = false;
      setParticipantId(data.participant.id);
      setExam(data.exam);
      setReadingSecondsLeft(data.exam.readingDurationSeconds || 3600);
      setWritingSecondsLeft(data.exam.writingDurationSeconds || 1200);
      setTransferSecondsLeft(null);
      setAudioPartIndex(0);
      setAudioCurrentTime(0);
      setAudioStarted(false);
      setListeningAnswers({});
      setReadingAnswers({});
      setWritingTask1("");
      setWritingTask2("");
      setHighlights([]);
      setTabSwitchCount(0);
      setTabWarningVisible(false);
      setExamPassword("");

      // If Proctor already started the room, jump straight into Listening; otherwise enter Lobby
      if (data.exam.startMode === "proctor" && data.exam.status === "started") {
        setStage("listening");
      } else {
        setStage("lobby");
      }
    } catch (err) {
      setEntryError(
        err instanceof Error ? err.message : "Imtihonga kirishda xatolik."
      );
    } finally {
      setJoining(false);
    }
  };

  const handleResetToNewCandidate = () => {
    try {
      window.localStorage.removeItem(EXAM_STORAGE_KEY);
    } catch {}
    submittedOnceRef.current = false;
    setStage("entry");
    setExam(null);
    setParticipantId("");
    setFullName("");
    setExamPassword("");
    setSubmissionReceipt(null);
    setTabSwitchCount(0);
    setTabWarningVisible(false);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-400">
        <span className="font-mono text-xs tracking-wider uppercase">
          CDI Examination Environment yuklanmoqda...
        </span>
      </div>
    );
  }

  // =========================================================================
  // 1. ENTRY SCREEN (Strict Dark Serious UI — ZERO "Login" word)
  // =========================================================================
  if (stage === "entry") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-10 text-zinc-100">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-[#111113] px-3 py-1 font-mono text-[11px] font-semibold tracking-widest text-zinc-400 uppercase">
              <span>COMPUTER-DELIVERED IELTS</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              IELTS Nova · Rasmiy Mock Imtihon
            </h1>
            <p className="mt-1.5 text-xs text-zinc-400">
              Imtihon zaliga kirish uchun ism-familiyangiz va nazoratchi bergan
              parolni kiriting.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6 shadow-2xl">
            <form onSubmit={handleJoinExam} className="space-y-4">
              {availableMocks.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Imtihon tanlang
                  </label>
                  <select
                    value={selectedMockId}
                    onChange={(e) => setSelectedMockId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-sm font-medium text-white focus:border-zinc-500 focus:outline-none"
                  >
                    {availableMocks.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label
                  htmlFor="candidate-fullname"
                  className="block text-xs font-semibold text-zinc-300"
                >
                  Ism va Familiyangiz
                </label>
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    id="candidate-fullname"
                    data-testid="exam-fullname-input"
                    type="text"
                    required
                    autoFocus
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Sardor Alimov"
                    className="w-full rounded-lg border border-zinc-800 bg-[#18181b] py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="exam-passcode"
                  className="block text-xs font-semibold text-zinc-300"
                >
                  Imtihon paroli
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    id="exam-passcode"
                    data-testid="exam-password-input"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={examPassword}
                    onChange={(e) => setExamPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-[#18181b] py-2.5 pr-4 pl-10 font-mono text-sm tracking-widest text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {entryError && (
                <div
                  data-testid="exam-entry-error"
                  className="flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{entryError}</span>
                </div>
              )}

              <button
                type="submit"
                data-testid="exam-join-submit"
                disabled={joining}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
              >
                <span>
                  {joining ? "Tekshirilmoqda..." : "Imtihon zaliga kirish"}
                </span>
              </button>
            </form>
          </div>

          <p className="mt-5 text-center font-mono text-[11px] text-zinc-600">
            IDP / British Council CDI Standard · Listening → Reading → Writing
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. WAITING LOBBY (Proctor Start vs Individual Start)
  // =========================================================================
  if (stage === "lobby" && exam) {
    const isProctor = exam.startMode === "proctor";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-10 text-zinc-100">
        <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-[#111113] p-8 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                WAITING LOBBY · KUTISH ZALI
              </p>
              <h1 className="mt-1 text-xl font-bold text-white">{exam.title}</h1>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-[#18181b] px-3 py-1 font-mono text-xs text-zinc-300">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              <span>{lobbyWaitingCount} nomzod</span>
            </span>
          </div>

          <div className="mt-6 rounded-lg border border-zinc-800 bg-[#18181b] p-4">
            <p className="text-xs text-zinc-400">Nomzod (Candidate)</p>
            <p className="mt-0.5 text-base font-bold text-white">{fullName}</p>
          </div>

          <div className="mt-5 space-y-2.5 text-sm text-zinc-300">
            <p className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              Imtihon tartibi va qoidalar
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-800 bg-[#0d0d10] p-3">
                <p className="font-mono text-[11px] text-zinc-500">1-BOSQICH</p>
                <p className="mt-0.5 font-semibold text-white">Listening</p>
                <p className="text-xs text-zinc-400">40 savol · 4 qism audio</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-[#0d0d10] p-3">
                <p className="font-mono text-[11px] text-zinc-500">2-BOSQICH</p>
                <p className="mt-0.5 font-semibold text-white">Reading</p>
                <p className="text-xs text-zinc-400">40 savol · 60:00 daqiqa</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-[#0d0d10] p-3">
                <p className="font-mono text-[11px] text-zinc-500">3-BOSQICH</p>
                <p className="mt-0.5 font-semibold text-white">
                  {exam.writingMode === "task1_and_task2"
                    ? "Writing T1 + T2"
                    : "Writing Task 1"}
                </p>
                <p className="text-xs text-zinc-400">
                  {Math.round(exam.writingDurationSeconds / 60)}:00 daqiqa
                </p>
              </div>
            </div>
            <p className="pt-2 text-xs leading-relaxed text-zinc-400">
              • Boshqa oynaga o&apos;tish (Tab-switch), Copy/Paste va brauzer
              orqaga tugmasi qat&apos;iy nazorat qilinadi.
              <br />• Bosqichlar orasida ball ko&apos;rsatilmaydi — barcha
              natijalar yakunda markaz bazasiga yuboriladi.
            </p>
          </div>

          <div className="mt-7">
            {isProctor ? (
              <div
                data-testid="proctor-waiting-status"
                className="flex flex-col items-center justify-center rounded-lg border border-zinc-700 bg-[#18181b] px-5 py-5 text-center"
              >
                <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                  <span>
                    Nazoratchi (Domla) imtihonni boshlashini kutyapsiz...
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Domla &ldquo;Start Exam for All&rdquo; tugmasini bosishi bilan
                  imtihon avtomatik boshlanadi. Sahifani yopmang.
                </p>
              </div>
            ) : (
              <button
                type="button"
                data-testid="individual-start-exam-btn"
                onClick={() => setStage("listening")}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Exam</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. COMPLETION SCREEN (Official Closed Receipt — NO Score Exposed)
  // =========================================================================
  if (stage === "completed" && exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-10 text-zinc-100">
        <div
          data-testid="exam-completed-screen"
          className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#111113] p-8 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-zinc-700 bg-[#18181b] text-white">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="mt-5 font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
            TEST COMPLETED
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Natijalaringiz o&apos;quv markazga yuborildi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Listening, Reading va Writing Task 1 javoblaringiz muvaffaqiyatli
            saqlandi. Rasmiy natijangiz o&apos;qituvchi Writing bo&apos;limini
            tekshirgach e&apos;lon qilinadi.
          </p>

          <div className="mt-6 space-y-2 rounded-lg border border-zinc-800 bg-[#18181b] p-4 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Nomzod:</span>
              <span className="font-semibold text-white">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Imtihon:</span>
              <span className="font-semibold text-zinc-200">{exam.title}</span>
            </div>
            {submissionReceipt && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Tasdiq kodi:</span>
                <span className="font-mono text-zinc-300">
                  {submissionReceipt.id}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetToNewCandidate}
            className="mt-6 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Keyingi nomzod uchun tozalash
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. ACTIVE CDI EXAM SHELL (Listening -> Reading 60:00 -> Writing 20:00)
  // =========================================================================
  if (!exam) return null;

  const activeTimer =
    stage === "reading"
      ? formatClock(readingSecondsLeft)
      : stage === "writing"
        ? formatClock(writingSecondsLeft)
        : transferSecondsLeft !== null
          ? formatClock(transferSecondsLeft)
          : "AUDIO";

  const isTimerLow =
    (stage === "reading" && readingSecondsLeft <= 300) ||
    (stage === "writing" && writingSecondsLeft <= 180);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b] text-zinc-100 select-none">
      {/* Official Serious CDI Top Bar */}
      <header className="flex h-13 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#111113] px-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
            IELTS NOVA CDI
          </span>
          <span className="hidden h-4 w-px bg-zinc-800 sm:inline-block" />
          <span className="hidden text-xs font-medium text-zinc-400 sm:inline">
            {fullName}
          </span>
        </div>

        {/* Stage Indicator Pills (Non-clickable sequential flow) */}
        <div className="hidden items-center gap-1.5 md:flex">
          {(
            [
              { id: "listening", label: "1. Listening" },
              { id: "reading", label: "2. Reading" },
              {
                id: "writing",
                label:
                  exam.writingMode === "task1_and_task2"
                    ? "3. Writing"
                    : "3. Writing Task 1",
              },
            ] as const
          ).map((s) => (
            <span
              key={s.id}
              className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold ${
                stage === s.id
                  ? "bg-white text-zinc-950"
                  : "border border-zinc-800 bg-[#18181b] text-zinc-500"
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>

        {/* Countdown Clock & Anti-Cheat Status */}
        <div className="flex items-center gap-3">
          {tabSwitchCount > 0 && (
            <span
              data-testid="tab-switch-badge"
              className="inline-flex items-center gap-1 rounded border border-red-900/70 bg-red-950/40 px-2.5 py-1 font-mono text-[11px] font-semibold text-red-300"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Tab: {tabSwitchCount}</span>
            </span>
          )}
          <div
            data-testid="exam-timer-display"
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 font-mono text-sm font-bold ${
              isTimerLow
                ? "border-red-700 bg-red-950/50 text-red-200"
                : "border-zinc-700 bg-[#18181b] text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{activeTimer}</span>
          </div>
        </div>
      </header>

      {/* Anti-Cheat Tab Switch Warning Banner */}
      {tabWarningVisible && (
        <div
          data-testid="tab-switch-warning"
          className="flex items-center justify-between border-b border-red-900/60 bg-red-950/60 px-5 py-2 text-xs text-red-200"
        >
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Ogohlantirish: Imtihon oynasidan chiqish qayd etildi (
              {tabSwitchCount} marta). Bu ma&apos;lumot nazoratchi panelida
              ko&apos;rinadi!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTabWarningVisible(false)}
            className="cursor-pointer rounded border border-red-800 px-2 py-0.5 text-[11px] hover:bg-red-900/50"
          >
            Tushundim
          </button>
        </div>
      )}

      {/* Submit Error Banner if network hiccups at final submit */}
      {submitError && (
        <div className="flex items-center justify-between border-b border-red-800 bg-red-950 px-5 py-2 text-xs text-red-200">
          <span>{submitError}</span>
          <button
            type="button"
            onClick={() => void submitFinalExam()}
            className="cursor-pointer rounded bg-white px-3 py-1 font-bold text-zinc-950"
          >
            Qayta yuborish
          </button>
        </div>
      )}

      {/* Stage Body */}
      {stage === "listening" && (
        <ListeningStage
          parts={exam.listeningParts}
          answers={listeningAnswers}
          onChangeAnswer={(qNum, val) =>
            setListeningAnswers((prev) => ({ ...prev, [String(qNum)]: val }))
          }
          audioPartIndex={audioPartIndex}
          audioCurrentTime={audioCurrentTime}
          audioStarted={audioStarted}
          transferSecondsLeft={transferSecondsLeft}
          onAudioProgress={(pIdx, cTime, started) => {
            setAudioPartIndex(pIdx);
            setAudioCurrentTime(cTime);
            setAudioStarted(started);
          }}
          onStartTransferTimer={() => setTransferSecondsLeft(120)}
          onFinishListening={() => {
            setTransferSecondsLeft(null);
            setStage("reading");
          }}
        />
      )}

      {stage === "reading" && (
        <ReadingStage
          passages={exam.readingPassages}
          answers={readingAnswers}
          onChangeAnswer={(qNum, val) =>
            setReadingAnswers((prev) => ({ ...prev, [String(qNum)]: val }))
          }
          highlights={highlights}
          onChangeHighlights={setHighlights}
          onFinishReading={() => setStage("writing")}
        />
      )}

      {stage === "writing" && (
        <WritingStage
          writingMode={exam.writingMode}
          task1={exam.writingTask1}
          task2={exam.writingTask2}
          task1Text={writingTask1}
          task2Text={writingTask2}
          onChangeTask1={setWritingTask1}
          onChangeTask2={setWritingTask2}
          submitting={submitting}
          onSubmitExam={() => void submitFinalExam()}
        />
      )}
    </div>
  );
}
