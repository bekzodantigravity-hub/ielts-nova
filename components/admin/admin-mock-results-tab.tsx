"use client";

import {
  Building2,
  CalendarClock,
  Check,
  Database,
  Download,
  FileDown,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Task1Chart } from "@/components/exam/task1-chart";
import {
  compareSubmissionsForRank,
  computeOverallBandSummary,
  formatTashkentDateTime,
  getSubmissionSessionInfo,
} from "@/lib/exam-grading";
import { MOCK_1_WRITING_TASK1 } from "@/lib/exam-mock1";
import {
  downloadGroupResultsPdfReport,
  downloadSubmissionPdfReport,
} from "@/lib/exam-pdf";
import {
  getArchivedSubmissions,
  getSavedCentreName,
  markSubmissionDeletedLocally,
  mergeServerAndArchivedSubmissions,
  saveArchivedSubmissions,
  saveCentreName,
  upsertArchivedSubmission,
} from "@/lib/exam-results-store";
import type {
  ExamSubmissionRecord,
  SectionGradeReport,
} from "@/lib/exam-types";

interface AdminMockResultsTabProps {
  onToast: (type: "ok" | "err", text: string) => void;
}

const BAND_OPTIONS = [
  "",
  "9.0",
  "8.5",
  "8.0",
  "7.5",
  "7.0",
  "6.5",
  "6.0",
  "5.5",
  "5.0",
  "4.5",
  "4.0",
  "3.5",
  "3.0",
  "2.5",
  "2.0",
];

interface SessionGroupItem {
  key: string;
  label: string;
  dateLabel: string;
  timeLabel: string;
  mockTitle: string;
  sortTs: number;
  count: number;
}

function SectionAnalysisView({ section }: { section: SectionGradeReport }) {
  return (
    <div className="space-y-5">
      {/* Part & Question Type Analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-4">
          <p className="font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Bo&apos;limlar (Part / Passage) bo&apos;yicha natija
          </p>
          <div className="mt-3 space-y-2.5">
            {section.byPart.map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{p.label}</span>
                  <span className="font-mono text-zinc-300">
                    {p.correct}/{p.total} ({p.accuracy}%) ·{" "}
                    <span className="text-red-400">{p.wrong} xato</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-white"
                    style={{ width: `${p.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-[#18181b] p-4">
          <p className="font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Savol turlari bo&apos;yicha xatolar tahlili (eng ko&apos;p xatodan)
          </p>
          <div className="mt-3 space-y-2.5">
            {section.byType.map((t) => (
              <div key={t.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">{t.label}</span>
                  <span className="font-mono text-zinc-400">
                    <strong className={t.wrong > 0 ? "text-red-400" : "text-zinc-200"}>
                      {t.wrong} xato
                    </strong>{" "}
                    ({t.correct}/{t.total})
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-zinc-300"
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1-40 Side-by-Side Answer Sheet */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#141417]">
        <div className="border-b border-zinc-800 bg-[#18181b] px-4 py-2.5">
          <p className="font-mono text-xs font-bold tracking-wider text-zinc-200 uppercase">
            1–40 Yonma-yon Answer Sheet ({section.rawScore}/{section.total} · Band{" "}
            {section.band.toFixed(1)})
          </p>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-[#18181b] font-mono text-[11px] uppercase text-zinc-400">
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Bo&apos;lim / Savol turi</th>
                <th className="px-3 py-2.5">O&apos;quvchi javobi</th>
                <th className="px-3 py-2.5">Rasmiy to&apos;g&apos;ri javob</th>
                <th className="px-3 py-2.5 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {section.details.map((row) => (
                <tr
                  key={row.number}
                  className={
                    row.isCorrect ? "bg-[#0f0f12]" : "bg-red-950/15"
                  }
                >
                  <td className="px-3 py-2 font-mono font-bold text-zinc-300">
                    {row.number}
                  </td>
                  <td className="px-3 py-2 text-zinc-400">
                    <span className="font-semibold text-zinc-200">
                      {row.partLabel}
                    </span>{" "}
                    · {row.questionType}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-white">
                    {row.studentAnswer || (
                      <span className="text-zinc-600">— (bo&apos;sh)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold text-zinc-300">
                    {row.correctAnswer}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                        <Check className="h-3 w-3" />
                        TO&apos;G&apos;RI
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-red-900/70 bg-red-950/40 px-2 py-0.5 font-mono text-[10px] font-bold text-red-300">
                        <X className="h-3 w-3" />
                        XATO
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminMockResultsTab({ onToast }: AdminMockResultsTabProps) {
  const [submissions, setSubmissions] = useState<ExamSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<string>("archive");
  const [query, setQuery] = useState("");
  const [selectedSessionKey, setSelectedSessionKey] = useState<string>("all");
  const [centreName, setCentreName] = useState<string>("IELTS Nova Learning Centre");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<"listening" | "reading" | "writing">(
    "listening"
  );

  // Teacher manual grading state (Writing + Speaking)
  const [writingBandDraft, setWritingBandDraft] = useState<string>("");
  const [writingT2BandDraft, setWritingT2BandDraft] = useState<string>("");
  const [speakingBandDraft, setSpeakingBandDraft] = useState<string>("");
  const [feedbackDraft, setFeedbackDraft] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Instant hydration from persistent local archive so reload/redeploy NEVER wipes results
  useEffect(() => {
    setCentreName(getSavedCentreName());
    const cached = getArchivedSubmissions();
    if (cached.length > 0) {
      setSubmissions(cached);
      setLoading(false);
    }
  }, []);

  const loadResults = useCallback(async (silent = false) => {
    if (!silent) setLoading((prev) => prev && getArchivedSubmissions().length === 0);
    try {
      const res = await fetch("/api/admin/exams/results", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        submissions?: ExamSubmissionRecord[];
        storageMode?: string;
      };
      if (data.storageMode) setStorageMode(data.storageMode);
      if (data.ok && Array.isArray(data.submissions)) {
        const { merged, missingOnServer } = mergeServerAndArchivedSubmissions(
          data.submissions
        );
        setSubmissions(merged);

        // Automatically restore archived submissions back to server if serverless cold-start cleared /tmp
        if (missingOnServer.length > 0) {
          void fetch("/api/admin/exams/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              action: "sync",
              submissions: missingOnServer,
            }),
          }).catch(() => {});
        }
      }
    } catch {
      // keep existing durable archived results
      const cached = getArchivedSubmissions();
      if (cached.length > 0) setSubmissions(cached);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResults(false);
    const id = setInterval(() => void loadResults(true), 10000);
    return () => clearInterval(id);
  }, [loadResults]);

  // Group all saved results by exact date & time session (newest first)
  const sessions = useMemo<SessionGroupItem[]>(() => {
    const map = new Map<string, SessionGroupItem>();
    for (const sub of submissions) {
      const info = getSubmissionSessionInfo(sub);
      const existing = map.get(info.sessionKey);
      if (existing) {
        existing.count += 1;
        if (info.sortTs > existing.sortTs) existing.sortTs = info.sortTs;
      } else {
        map.set(info.sessionKey, {
          key: info.sessionKey,
          label: info.sessionLabel,
          dateLabel: info.dateLabel,
          timeLabel: info.timeLabel,
          mockTitle: info.mockTitle,
          sortTs: info.sortTs,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.sortTs - a.sortTs);
  }, [submissions]);

  // If the selected session was deleted/emptied, reset to "all"
  useEffect(() => {
    if (
      selectedSessionKey !== "all" &&
      !sessions.some((s) => s.key === selectedSessionKey)
    ) {
      setSelectedSessionKey("all");
    }
  }, [sessions, selectedSessionKey]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.key === selectedSessionKey) || null,
    [sessions, selectedSessionKey]
  );

  const sessionSubmissions = useMemo(() => {
    const base =
      selectedSessionKey === "all"
        ? submissions
        : submissions.filter(
            (s) => getSubmissionSessionInfo(s).sessionKey === selectedSessionKey
          );
    return [...base].sort(compareSubmissionsForRank);
  }, [submissions, selectedSessionKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessionSubmissions;
    return sessionSubmissions.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.mockTitle.toLowerCase().includes(q) ||
        formatTashkentDateTime(s.submittedAt).label.toLowerCase().includes(q)
    );
  }, [sessionSubmissions, query]);

  // Summary metrics for active session / table
  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return {
        students: 0,
        gradedCount: 0,
        full4Count: 0,
        avgBand: 0,
        topBand: 0,
      };
    }
    const summaries = filtered.map((s) => computeOverallBandSummary(s));
    const full4Count = summaries.filter((s) => s.isFull4Skill).length;
    const writingCount = summaries.filter((s) => s.writingBand !== null).length;
    const avgBand =
      summaries.reduce((acc, s) => acc + s.overall, 0) / filtered.length;
    const topBand = Math.max(...summaries.map((s) => s.overall));
    return {
      students: filtered.length,
      gradedCount: full4Count > 0 ? full4Count : writingCount,
      full4Count,
      avgBand,
      topBand,
    };
  }, [filtered]);

  const selected = useMemo(
    () => submissions.find((s) => s.id === selectedId) || null,
    [submissions, selectedId]
  );

  const openInspector = (
    sub: ExamSubmissionRecord,
    initialTab: "listening" | "reading" | "writing" = "listening"
  ) => {
    setSelectedId(sub.id);
    setModalTab(initialTab);
    const t1Val = sub.writingTask1Band ?? sub.writingBand;
    setWritingBandDraft(
      typeof t1Val === "number" ? t1Val.toFixed(1) : ""
    );
    setWritingT2BandDraft(
      typeof sub.writingTask2Band === "number"
        ? sub.writingTask2Band.toFixed(1)
        : ""
    );
    setSpeakingBandDraft(
      typeof sub.speakingBand === "number" ? sub.speakingBand.toFixed(1) : ""
    );
    setFeedbackDraft(sub.teacherFeedback || "");
  };

  const handleQuickSpeakingChange = async (
    sub: ExamSubmissionRecord,
    rawVal: string
  ) => {
    const speakingVal = rawVal.trim() === "" ? null : Number(rawVal);
    setSavingRowId(sub.id);
    try {
      const res = await fetch("/api/admin/exams/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: sub.id,
          speakingBand: speakingVal,
          fallbackRecord: sub,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        submission?: ExamSubmissionRecord;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.error || "Speaking ballini saqlab bo'lmadi.");
      }
      const next = upsertArchivedSubmission(data.submission);
      setSubmissions(next);
      onToast("ok", `${sub.fullName} — Speaking balli saqlandi!`);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setSavingRowId(null);
    }
  };

  const handleSaveTeacherGrades = async () => {
    if (!selected) return;
    setSavingGrade(true);
    try {
      const t1Val =
        writingBandDraft.trim() === "" ? null : Number(writingBandDraft);
      const t2Val =
        writingT2BandDraft.trim() === "" ? null : Number(writingT2BandDraft);
      const spVal =
        speakingBandDraft.trim() === "" ? null : Number(speakingBandDraft);

      const res = await fetch("/api/admin/exams/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: selected.id,
          writingBand: t1Val,
          writingTask1Band: t1Val,
          writingTask2Band: t2Val,
          speakingBand: spVal,
          teacherFeedback: feedbackDraft.trim(),
          fallbackRecord: selected,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        submission?: ExamSubmissionRecord;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.submission) {
        throw new Error(data.error || "Saqlab bo'lmadi.");
      }
      const next = upsertArchivedSubmission(data.submission);
      setSubmissions(next);
      onToast("ok", "Baholar va izoh doimiy saqlandi!");
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      markSubmissionDeletedLocally(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);

      await fetch("/api/admin/exams/results", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id }),
      });
      onToast("ok", "Natija o'chirildi.");
    } catch {}
  };

  const handleDownloadGroupPdf = () => {
    if (filtered.length === 0) {
      onToast("err", "Yuklab olish uchun natijalar mavjud emas.");
      return;
    }
    const label = activeSession
      ? activeSession.label
      : `Barcha sessiyalar (${filtered.length} ta)`;
    const title = activeSession
      ? activeSession.mockTitle
      : filtered[0]?.mockTitle || "Official CDI IELTS Mock";

    downloadGroupResultsPdfReport(filtered, {
      centreName,
      sessionTitle: title,
      sessionDateTimeLabel: label,
    });
    onToast(
      "ok",
      `Guruh PDF hisoboti (${filtered.length} nafar o'quvchi) yuklab olindi!`
    );
  };

  const handleExportArchiveJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      centreName,
      submissions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ielts_nova_results_backup_${formatTashkentDateTime(new Date().toISOString()).dayKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("ok", `Zaxira fayl (${submissions.length} ta natija) yuklab olindi.`);
  };

  const handleImportArchiveJson = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        submissions?: ExamSubmissionRecord[];
        centreName?: string;
      };
      const imported = Array.isArray(parsed)
        ? (parsed as ExamSubmissionRecord[])
        : Array.isArray(parsed?.submissions)
          ? parsed.submissions
          : [];
      if (imported.length === 0) {
        onToast("err", "Zaxira faylda natijalar topilmadi.");
        return;
      }
      if (parsed?.centreName) {
        setCentreName(parsed.centreName);
        saveCentreName(parsed.centreName);
      }
      const { merged } = mergeServerAndArchivedSubmissions(imported);
      saveArchivedSubmissions(merged);
      setSubmissions(merged);
      await fetch("/api/admin/exams/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "sync", submissions: merged }),
      }).catch(() => {});
      onToast("ok", `${imported.length} ta natija arxivga tiklandi!`);
    } catch {
      onToast("err", "JSON zaxira faylni o'qib bo'lmadi.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Group PDF Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Mock Natijalari &amp; Doimiy Arxiv Jadvali
            </h2>
            <span
              data-testid="results-persistence-badge"
              className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-[#18181b] px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-300"
            >
              <Database className="h-3 w-3 text-zinc-400" />
              {storageMode === "supabase"
                ? "Supabase Cloud + Arxiv"
                : storageMode === "kv"
                  ? "Cloud KV + Arxiv"
                  : "Doimiy Arxiv Faol"}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Barcha natijalar sana va soat sessiyasi bo&apos;yicha doimiy saqlanadi
            (sahifa yangilanganda o&apos;chib ketmaydi). Istalgan sessiyaning barcha
            o&apos;quvchilarini o&apos;rinlari va ballari bilan bitta PDF qilib yuklab
            oling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="download-group-pdf-btn"
            disabled={filtered.length === 0}
            onClick={handleDownloadGroupPdf}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileDown className="h-4 w-4" />
            <span>
              Guruh PDF yuklab olish ({filtered.length} ta)
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportArchiveJson}
            disabled={submissions.length === 0}
            title="Arxivni JSON backup qilib yuklab olish"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#111113] px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Backup</span>
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            title="JSON zaxira fayldan tiklash"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#111113] px-2.5 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Tiklash</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={(e) => void handleImportArchiveJson(e)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => void loadResults(false)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#111113] px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Session / Date-Time Grouping Strip + Centre Title Setting */}
      <div className="rounded-xl border border-zinc-800 bg-[#111113] p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-zinc-400" />
            <span className="font-mono text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
              Imtihon Sessiyalari (Sana va Soat bo&apos;yicha)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <Building2 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                data-testid="pdf-centre-name-input"
                value={centreName}
                onChange={(e) => {
                  setCentreName(e.target.value);
                  saveCentreName(e.target.value);
                }}
                placeholder="PDF markaz nomi..."
                title="PDF hisobot sarlavhasidagi o'quv markaz nomi"
                className="w-56 rounded-lg border border-zinc-800 bg-[#18181b] py-1.5 pr-3 pl-8 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-2 left-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="O'quvchi ismini qidiring..."
                className="w-48 rounded-lg border border-zinc-800 bg-[#18181b] py-1.5 pr-3 pl-8 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clickable Date & Time Session Chips */}
        <div
          data-testid="exam-sessions-strip"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            data-testid="session-filter-all"
            onClick={() => setSelectedSessionKey("all")}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              selectedSessionKey === "all"
                ? "border-white bg-white text-zinc-950"
                : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:border-zinc-600 hover:text-white"
            }`}
          >
            Barcha natijalar ({submissions.length})
          </button>

          {sessions.map((sess, sIdx) => (
            <button
              key={sess.key}
              type="button"
              data-testid={`session-filter-${sIdx}`}
              onClick={() => setSelectedSessionKey(sess.key)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                selectedSessionKey === sess.key
                  ? "border-white bg-white text-zinc-950"
                  : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:border-zinc-600 hover:text-white"
              }`}
            >
              <span className="font-mono">{sess.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                  selectedSessionKey === sess.key
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {sess.count} ta
              </span>
            </button>
          ))}
        </div>

        {/* 4 Summary KPI Cards (mirrors the Group PDF report header!) */}
        <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-800 bg-[#16161a] px-3.5 py-2.5">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              O&apos;quvchilar
            </p>
            <p
              data-testid="kpi-total-students"
              className="mt-1 font-mono text-xl font-bold text-white"
            >
              {stats.students}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#16161a] px-3.5 py-2.5">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              {stats.full4Count > 0 ? "To'liq 4-Skill" : "Writing Baholangan"}
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              {stats.gradedCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#16161a] px-3.5 py-2.5">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              O&apos;rtacha Band
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              {stats.students > 0 ? `~${stats.avgBand.toFixed(1)}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-[#16161a] px-3.5 py-2.5">
            <p className="font-mono text-[10px] tracking-wider text-zinc-500 uppercase">
              Eng Yuqori Band
            </p>
            <p className="mt-1 font-mono text-xl font-bold text-white">
              {stats.students > 0 ? stats.topBand.toFixed(1) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#111113]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#18181b] font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
              <th className="px-3.5 py-3">#</th>
              <th className="px-3.5 py-3">Ism-Familiya</th>
              <th className="px-3.5 py-3">Sana va Soat</th>
              <th className="px-3.5 py-3">Listening</th>
              <th className="px-3.5 py-3">Reading</th>
              <th className="px-3.5 py-3">Speaking</th>
              <th className="px-3.5 py-3">Writing</th>
              <th className="px-3.5 py-3 text-center">Overall</th>
              <th className="px-3.5 py-3">Tab</th>
              <th className="px-3.5 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-zinc-500">
                  Natijalar yuklanmoqda...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-zinc-500">
                  Hozircha topshirilgan Mock imtihon natijalari yo&apos;q.
                </td>
              </tr>
            ) : (
              filtered.map((sub, idx) => {
                const summary = computeOverallBandSummary(sub);
                const dt = formatTashkentDateTime(sub.submittedAt);
                const sessInfo = getSubmissionSessionInfo(sub);
                return (
                  <tr
                    key={sub.id}
                    data-testid={`mock-result-row-${idx}`}
                    className="transition hover:bg-[#18181b]/70"
                  >
                    <td className="px-3.5 py-3 font-mono font-bold text-white">
                      <span className="inline-flex items-center gap-1">
                        {idx === 0 && (
                          <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        )}
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => openInspector(sub, "listening")}
                        className="cursor-pointer text-left font-bold text-white underline-offset-2 hover:underline"
                      >
                        {sub.fullName}
                      </button>
                      <p className="text-[11px] text-zinc-500">
                        {sub.mockTitle}
                      </p>
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[11px] text-zinc-300">
                      <div>{dt.date}</div>
                      <div className="text-[10px] text-zinc-500">
                        {dt.time} · Sessiya: {sessInfo.timeLabel}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => openInspector(sub, "listening")}
                        className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] px-2.5 py-1 font-mono font-bold text-white hover:border-zinc-400"
                      >
                        {sub.listening.band.toFixed(1)}{" "}
                        <span className="text-zinc-400">
                          (L{sub.listening.rawScore})
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        onClick={() => openInspector(sub, "reading")}
                        className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] px-2.5 py-1 font-mono font-bold text-white hover:border-zinc-400"
                      >
                        {sub.reading.band.toFixed(1)}{" "}
                        <span className="text-zinc-400">
                          (R{sub.reading.rawScore})
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-3">
                      <select
                        aria-label={`${sub.fullName} Speaking band`}
                        data-testid={`speaking-band-select-${idx}`}
                        disabled={savingRowId === sub.id}
                        value={
                          summary.speakingBand !== null
                            ? summary.speakingBand.toFixed(1)
                            : ""
                        }
                        onChange={(e) =>
                          void handleQuickSpeakingChange(sub, e.target.value)
                        }
                        className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] px-2 py-1 font-mono text-xs font-bold text-white focus:border-white focus:outline-none disabled:opacity-50"
                      >
                        {BAND_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b === "" ? "—" : b}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3.5 py-3">
                      <button
                        type="button"
                        data-testid={`open-writing-grade-${idx}`}
                        onClick={() => openInspector(sub, "writing")}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-xs font-semibold text-white hover:border-white"
                      >
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        <span>
                          {summary.writingBand !== null
                            ? `${summary.writingBand.toFixed(1)} (T1)`
                            : "Baholash"}
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        data-testid={`overall-band-${idx}`}
                        className="inline-flex min-w-[44px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1 font-mono text-sm font-extrabold text-white"
                      >
                        {summary.overall.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {sub.tabSwitchCount === 0 ? (
                        <span className="font-mono text-zinc-500">0</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border border-red-900/70 bg-red-950/40 px-2 py-0.5 font-mono text-[11px] font-bold text-red-300">
                          <ShieldAlert className="h-3 w-3" />
                          {sub.tabSwitchCount}
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => downloadSubmissionPdfReport(sub)}
                          title="Shaxsiy PDF hisobot (1-40 tahlil + insho)"
                          className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] p-1.5 text-zinc-300 hover:border-white hover:text-white"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSubmission(sub.id)}
                          title="O'chirish"
                          className="cursor-pointer rounded border border-zinc-800 bg-[#18181b] p-1.5 text-zinc-500 hover:border-red-800 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Candidate Inspection Modal */}
      {selected && (
        <div
          data-testid="mock-result-detail-modal"
          onClick={() => setSelectedId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-700 bg-[#09090b] shadow-2xl"
          >
            {/* Modal Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#111113] px-6 py-4">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                  OFFICIAL CANDIDATE ANALYSIS · OVERALL{" "}
                  {computeOverallBandSummary(selected).overall.toFixed(1)}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white">
                  {selected.fullName}
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  {selected.mockTitle} ·{" "}
                  {formatTashkentDateTime(selected.submittedAt).label} ·
                  Tab-Cheat: {selected.tabSwitchCount} marta
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="download-result-pdf-btn"
                  onClick={() => downloadSubmissionPdfReport(selected)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Shaxsiy PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="cursor-pointer rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-[#111113] px-6 py-2.5">
              <button
                type="button"
                data-testid="inspector-tab-listening"
                onClick={() => setModalTab("listening")}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  modalTab === "listening"
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:text-white"
                }`}
              >
                Listening 1–40 (Band {selected.listening.band.toFixed(1)} ·{" "}
                {selected.listening.rawScore}/40)
              </button>
              <button
                type="button"
                data-testid="inspector-tab-reading"
                onClick={() => setModalTab("reading")}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  modalTab === "reading"
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:text-white"
                }`}
              >
                Reading 1–40 (Band {selected.reading.band.toFixed(1)} ·{" "}
                {selected.reading.rawScore}/40)
              </button>
              <button
                type="button"
                data-testid="inspector-tab-writing"
                onClick={() => setModalTab("writing")}
                className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  modalTab === "writing"
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:text-white"
                }`}
              >
                Writing &amp; Speaking (
                {selected.writingBand !== null
                  ? `W ${selected.writingBand.toFixed(1)}`
                  : `${selected.writingTask1WordCount} so'z`}
                )
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {modalTab === "listening" && (
                <SectionAnalysisView section={selected.listening} />
              )}

              {modalTab === "reading" && (
                <SectionAnalysisView section={selected.reading} />
              )}

              {modalTab === "writing" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Left: Prompt + HD Chart + Student Essay */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="rounded-lg border border-zinc-800 bg-[#141417] p-4">
                      <p className="font-mono text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                        WRITING TASK 1 SAVOLI VA GRAFIGI
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-300 whitespace-pre-line">
                        {MOCK_1_WRITING_TASK1.prompt}
                      </p>
                      <div className="mt-3">
                        <Task1Chart config={MOCK_1_WRITING_TASK1} compact />
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-[#141417] p-5">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                        <span className="font-mono text-xs font-bold text-white uppercase">
                          O&apos;quvchi inshosi (Task 1)
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          So&apos;zlar soni:{" "}
                          <strong className="text-white">
                            {selected.writingTask1WordCount}
                          </strong>
                        </span>
                      </div>
                      <div className="mt-3 text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
                        {selected.writingTask1Text || (
                          <span className="italic text-zinc-500">
                            O&apos;quvchi matn yozmagan.
                          </span>
                        )}
                      </div>
                    </div>

                    {selected.writingTask2Text && (
                      <div className="rounded-lg border border-zinc-800 bg-[#141417] p-5">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                          <span className="font-mono text-xs font-bold text-white uppercase">
                            O&apos;quvchi inshosi (Task 2)
                          </span>
                          <span className="font-mono text-xs text-zinc-400">
                            So&apos;zlar soni:{" "}
                            <strong className="text-white">
                              {selected.writingTask2WordCount || 0}
                            </strong>
                          </span>
                        </div>
                        <div className="mt-3 text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
                          {selected.writingTask2Text}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Manual Teacher Grading Panel (NO AI!) */}
                  <div className="space-y-4 lg:col-span-5">
                    <div className="rounded-xl border border-zinc-700 bg-[#141417] p-5">
                      <p className="font-mono text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                        DOMLA BAHOLASHI (QO&apos;LDA)
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        AI baholash o&apos;chirilgan. Writing va Speaking
                        ballarini kiriting — Overall Band va Guruh PDF avtomatik
                        yangilanadi.
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300">
                            Writing Task 1 Band
                          </label>
                          <select
                            data-testid="teacher-writing-band-select"
                            value={writingBandDraft}
                            onChange={(e) => setWritingBandDraft(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-[#09090b] px-3 py-2.5 font-mono text-sm font-bold text-white focus:border-white focus:outline-none"
                          >
                            {BAND_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                {b === "" ? "Baholanmagan" : `Band ${b}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-zinc-300">
                            Speaking Band
                          </label>
                          <select
                            data-testid="teacher-speaking-band-select"
                            value={speakingBandDraft}
                            onChange={(e) => setSpeakingBandDraft(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-[#09090b] px-3 py-2.5 font-mono text-sm font-bold text-white focus:border-white focus:outline-none"
                          >
                            {BAND_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                {b === "" ? "Kiritilmagan" : `Band ${b}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selected.writingTask2Text && (
                        <div className="mt-3">
                          <label className="block text-xs font-semibold text-zinc-300">
                            Writing Task 2 Band (2x vazn)
                          </label>
                          <select
                            value={writingT2BandDraft}
                            onChange={(e) => setWritingT2BandDraft(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-[#09090b] px-3 py-2.5 font-mono text-sm font-bold text-white focus:border-white focus:outline-none"
                          >
                            {BAND_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                {b === "" ? "Baholanmagan" : `Band ${b}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-zinc-300">
                          O&apos;qituvchi izohi (Teacher Feedback)
                        </label>
                        <textarea
                          rows={5}
                          data-testid="teacher-writing-feedback-input"
                          value={feedbackDraft}
                          onChange={(e) => setFeedbackDraft(e.target.value)}
                          placeholder="Task Achievement, Coherence, Lexical Resource, Grammar bo'yicha izoh yozing..."
                          className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-[#09090b] p-3 text-xs leading-relaxed text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        data-testid="save-teacher-writing-grade-btn"
                        disabled={savingGrade}
                        onClick={() => void handleSaveTeacherGrades()}
                        className="mt-4 w-full cursor-pointer rounded-lg bg-white py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {savingGrade ? "Saqlanmoqda..." : "Ballarni saqlash"}
                      </button>

                      {selected.gradedAt && (
                        <p className="mt-3 font-mono text-[10px] text-zinc-500">
                          Oxirgi baholash:{" "}
                          {formatTashkentDateTime(selected.gradedAt).label} (
                          {selected.gradedBy})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
