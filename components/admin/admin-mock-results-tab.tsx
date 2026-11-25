"use client";

import {
  Check,
  Download,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Task1Chart } from "@/components/exam/task1-chart";
import { MOCK_1_WRITING_TASK1 } from "@/lib/exam-mock1";
import { downloadSubmissionPdfReport } from "@/lib/exam-pdf";
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
];

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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<"listening" | "reading" | "writing">(
    "listening"
  );

  // Teacher manual writing grading state
  const [writingBandDraft, setWritingBandDraft] = useState<string>("");
  const [feedbackDraft, setFeedbackDraft] = useState<string>("");
  const [savingGrade, setSavingGrade] = useState(false);

  const loadResults = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/exams/results", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        submissions?: ExamSubmissionRecord[];
      };
      if (data.ok && Array.isArray(data.submissions)) {
        setSubmissions(data.submissions);
      }
    } catch {
      // keep existing
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResults(false);
  }, [loadResults]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.mockTitle.toLowerCase().includes(q)
    );
  }, [submissions, query]);

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
    setWritingBandDraft(
      sub.writingBand !== null ? sub.writingBand.toFixed(1) : ""
    );
    setFeedbackDraft(sub.teacherFeedback || "");
  };

  const handleSaveWritingGrade = async () => {
    if (!selected) return;
    setSavingGrade(true);
    try {
      const bandVal =
        writingBandDraft.trim() === "" ? null : Number(writingBandDraft);
      const res = await fetch("/api/admin/exams/results", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          writingBand: bandVal,
          teacherFeedback: feedbackDraft.trim(),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        submission?: ExamSubmissionRecord;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Saqlab bo'lmadi.");
      }
      onToast("ok", "Writing Task 1 bahosi saqlandi!");
      await loadResults(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      const res = await fetch("/api/admin/exams/results", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (selectedId === id) setSelectedId(null);
        onToast("ok", "Natija o'chirildi.");
      }
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Mock Natijalari &amp; Reyting Jadvali
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Eng yuqori balldan 1-o&apos;rindan tartiblangan. Har bir o&apos;quvchi
            ustiga bosib 1–40 Answer Sheet, xatolar tahlili, Writing baholash va
            PDF hisobotni oching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O'quvchi ismini qidiring..."
              className="w-56 rounded-lg border border-zinc-800 bg-[#111113] py-2 pr-3 pl-8 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
          </div>
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

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#111113]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#18181b] font-mono text-[11px] tracking-wider text-zinc-400 uppercase">
              <th className="px-4 py-3">O&apos;rin</th>
              <th className="px-4 py-3">Ism-Familiya</th>
              <th className="px-4 py-3">Sana va Soat</th>
              <th className="px-4 py-3">Listening</th>
              <th className="px-4 py-3">Reading</th>
              <th className="px-4 py-3">Writing Task 1</th>
              <th className="px-4 py-3">Tab-Cheat</th>
              <th className="px-4 py-3 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Natijalar yuklanmoqda...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-zinc-500">
                  Hozircha topshirilgan Mock imtihon natijalari yo&apos;q.
                </td>
              </tr>
            ) : (
              filtered.map((sub, idx) => (
                <tr
                  key={sub.id}
                  data-testid={`mock-result-row-${idx}`}
                  className="transition hover:bg-[#18181b]/70"
                >
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    <span className="inline-flex items-center gap-1">
                      {idx === 0 && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openInspector(sub, "listening")}
                      className="cursor-pointer text-left font-bold text-white underline-offset-2 hover:underline"
                    >
                      {sub.fullName}
                    </button>
                    <p className="text-[11px] text-zinc-500">{sub.mockTitle}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                    {new Date(sub.submittedAt).toLocaleString("uz-UZ")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openInspector(sub, "listening")}
                      className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] px-2.5 py-1 font-mono font-bold text-white hover:border-zinc-400"
                    >
                      Band {sub.listening.band.toFixed(1)}{" "}
                      <span className="text-zinc-400">
                        ({sub.listening.rawScore}/40)
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openInspector(sub, "reading")}
                      className="cursor-pointer rounded border border-zinc-700 bg-[#18181b] px-2.5 py-1 font-mono font-bold text-white hover:border-zinc-400"
                    >
                      Band {sub.reading.band.toFixed(1)}{" "}
                      <span className="text-zinc-400">
                        ({sub.reading.rawScore}/40)
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      data-testid={`open-writing-grade-${idx}`}
                      onClick={() => openInspector(sub, "writing")}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:border-white"
                    >
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      <span>
                        {sub.writingBand !== null
                          ? `Band ${sub.writingBand.toFixed(1)}`
                          : "Ko'rish / Baholash"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {sub.tabSwitchCount === 0 ? (
                      <span className="font-mono text-zinc-400">0 marta</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded border border-red-900/70 bg-red-950/40 px-2 py-0.5 font-mono font-bold text-red-300">
                        <ShieldAlert className="h-3 w-3" />
                        {sub.tabSwitchCount} marta chiqqan
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => downloadSubmissionPdfReport(sub)}
                        title="Download PDF"
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
              ))
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
                  OFFICIAL CANDIDATE ANALYSIS
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white">
                  {selected.fullName}
                </h3>
                <p className="font-mono text-[11px] text-zinc-400">
                  {selected.mockTitle} ·{" "}
                  {new Date(selected.submittedAt).toLocaleString("uz-UZ")} ·
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
                  <span>Download PDF</span>
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
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-[#111113] px-6 py-2.5">
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
                Writing Task 1 (
                {selected.writingBand !== null
                  ? `Band ${selected.writingBand.toFixed(1)}`
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
                  </div>

                  {/* Right: Manual Teacher Grading Panel (NO AI!) */}
                  <div className="space-y-4 lg:col-span-5">
                    <div className="rounded-xl border border-zinc-700 bg-[#141417] p-5">
                      <p className="font-mono text-[11px] font-bold tracking-widest text-zinc-400 uppercase">
                        DOMLA BAHOLASHI (QO&apos;LDA)
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        AI baholash o&apos;chirilgan. Inshoni o&apos;qib rasmiy Band
                        ballini va izohingizni saqlang.
                      </p>

                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Writing Task 1 Band balli
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
                        onClick={() => void handleSaveWritingGrade()}
                        className="mt-4 w-full cursor-pointer rounded-lg bg-white py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
                      >
                        {savingGrade ? "Saqlanmoqda..." : "Ballni saqlash"}
                      </button>

                      {selected.gradedAt && (
                        <p className="mt-3 font-mono text-[10px] text-zinc-500">
                          Oxirgi baholash:{" "}
                          {new Date(selected.gradedAt).toLocaleString("uz-UZ")} (
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
