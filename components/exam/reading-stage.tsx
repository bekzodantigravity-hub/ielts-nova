"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  MoveHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadingPassageData } from "@/lib/exam-types";
import { type ExamTheme, QuestionHighlightArea } from "./question-highlight-area";
import {
  type PassageHighlight,
  ReadingHighlightPane,
} from "./reading-highlight-pane";

interface ReadingStageProps {
  theme: ExamTheme;
  passages: ReadingPassageData[];
  answers: Record<string, string>;
  onChangeAnswer: (qNum: number, value: string) => void;
  onToggleMultiTwo: (q1: number, q2: number, letter: string) => void;
  highlights: PassageHighlight[];
  onChangeHighlights: (next: PassageHighlight[]) => void;
  onFinishReading: () => void;
}

export function ReadingStage({
  theme,
  passages,
  answers,
  onChangeAnswer,
  onToggleMultiTwo,
  highlights,
  onChangeHighlights,
  onFinishReading,
}: ReadingStageProps) {
  const isDark = theme === "dark";
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDesktop, setIsDesktop] = useState(true);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const onPointerMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.min(70, Math.max(30, pct)));
  }, []);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const startDrag = () => {
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const currentPassage = passages[activePassageIdx] || passages[0];

  const countInRange = (start: number, end: number) => {
    let c = 0;
    for (let q = start; q <= end; q++) {
      if ((answers[String(q)] || "").trim()) c++;
    }
    return c;
  };
  const answeredCount = countInRange(1, 40);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${
        isDark ? "bg-[#0b192f] text-[#f1f5f9]" : "bg-white text-[#111827]"
      }`}
    >
      {/* Official CDI Part Sub-Banner (Matches Screenshot 3, 6, 7) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-6 py-2.5 ${
          isDark
            ? "border-[#1e3a63] bg-[#102340] text-[#f1f5f9]"
            : "border-[#e5e7eb] bg-[#f3f4f6] text-[#111827]"
        }`}
      >
        <div>
          <p className="text-sm font-bold">Part {currentPassage.passage}</p>
          <p
            className={`text-xs ${
              isDark ? "text-[#94a3b8]" : "text-[#4b5563]"
            }`}
          >
            Read the text and answer questions {currentPassage.questionRange[0]}
            –{currentPassage.questionRange[1]}.
          </p>
        </div>

        <span
          className={`hidden text-xs md:inline ${
            isDark ? "text-[#94a3b8]" : "text-[#6b7280]"
          }`}
        >
          Matnni belgilang → Highlight (
          {isDark ? "olovrang" : "sariq-olovrang"}) / Note
        </span>
      </div>

      {/* Draggable Split-Screen Pane (Matches Screenshot 3, 6, 7!) */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        {/* Left: Passage with Official CDI Highlight + Notes */}
        <div
          style={isDesktop ? { width: `${splitPercent}%` } : undefined}
          className={`h-1/2 min-h-0 w-full border-b lg:h-full lg:shrink-0 lg:border-r lg:border-b-0 ${
            isDark ? "border-[#1e3a63]" : "border-[#e5e7eb]"
          }`}
        >
          <ReadingHighlightPane
            theme={theme}
            passageNumber={currentPassage.passage}
            title={currentPassage.title}
            subtitle={currentPassage.subtitle}
            paragraphs={currentPassage.paragraphs}
            highlights={highlights}
            onChangeHighlights={onChangeHighlights}
          />
        </div>

        {/* Center Draggable Divider with ↔ Handle (Matches Screenshot 3, 6, 7) */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={startDrag}
          title="O'lchamni o'zgartirish uchun suring"
          className={`relative hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center lg:flex ${
            isDark
              ? "bg-[#162d50] hover:bg-[#2563eb]"
              : "bg-[#e5e7eb] hover:bg-[#93c5fd]"
          }`}
        >
          <div
            className={`flex h-7 w-7 items-center justify-center rounded border shadow-xs ${
              isDark
                ? "border-[#2c4a75] bg-[#102340] text-[#cbd5e1]"
                : "border-[#d1d5db] bg-white text-[#4b5563]"
            }`}
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Right: Clean Official CDI Questions Panel (Highlight enabled!) */}
        <QuestionHighlightArea
          theme={theme}
          className={`min-h-0 flex-1 overflow-y-auto px-6 py-6 ${
            isDark ? "bg-[#0b192f]" : "bg-white"
          }`}
        >
          <div className="mx-auto max-w-2xl space-y-8 pb-12">
            {currentPassage.sections.map((sec, sIdx) => {
              // 1. NOTE COMPLETION (Q1–6)
              if (sec.kind === "note_completion") {
                return (
                  <div key={sIdx} className="space-y-3">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    <div
                      className={`rounded border p-5 ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-white"
                      }`}
                    >
                      <h4 className="mb-4 text-center text-sm font-bold">
                        {sec.boxTitle}
                      </h4>
                      <div className="space-y-2.5">
                        {sec.groups.map((grp, gIdx) => (
                          <div key={gIdx} className="space-y-2">
                            {grp.lines.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className={`flex flex-wrap items-center gap-1.5 text-[14.5px] leading-7 ${
                                  line.indent ? "pl-6" : ""
                                }`}
                              >
                                <span className="opacity-60">
                                  {line.indent ? "–" : "•"}
                                </span>
                                {line.prefix && <span>{line.prefix}</span>}
                                {line.questionNumber !== undefined && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                        isDark
                                          ? "border-[#476899] bg-[#091529] text-white"
                                          : "border-[#9ca3af] bg-white text-[#111827]"
                                      }`}
                                    >
                                      {line.questionNumber}
                                    </span>
                                    <input
                                      type="text"
                                      data-testid={`exam-r-q-${line.questionNumber}`}
                                      autoComplete="off"
                                      spellCheck={false}
                                      value={
                                        answers[String(line.questionNumber)] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        onChangeAnswer(
                                          line.questionNumber!,
                                          e.target.value
                                        )
                                      }
                                      placeholder={String(line.questionNumber)}
                                      className={`w-36 rounded border px-2.5 py-0.5 text-sm font-medium focus:outline-none ${
                                        isDark
                                          ? "border-[#2c4a75] bg-[#060f1e] text-white placeholder:text-[#475569] focus:border-[#60a5fa]"
                                          : "border-[#9ca3af] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb]"
                                      }`}
                                    />
                                  </span>
                                )}
                                {line.suffix && <span>{line.suffix}</span>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. TRUE / FALSE / NOT GIVEN (Q7–13 — EXACT SCREENSHOT 3 STYLE!)
              if (sec.kind === "tfng") {
                return (
                  <div key={sIdx} className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        Do the following statements agree with the information
                        given in Reading Passage {currentPassage.passage}?
                      </p>
                      <div
                        className={`pt-1 text-xs leading-5 ${
                          isDark ? "text-[#94a3b8]" : "text-[#4b5563]"
                        }`}
                      >
                        <p>
                          <strong
                            className={isDark ? "text-white" : "text-[#111827]"}
                          >
                            TRUE
                          </strong>{" "}
                          if the statement agrees with the information
                        </p>
                        <p>
                          <strong
                            className={isDark ? "text-white" : "text-[#111827]"}
                          >
                            FALSE
                          </strong>{" "}
                          if the statement contradicts the information
                        </p>
                        <p>
                          <strong
                            className={isDark ? "text-white" : "text-[#111827]"}
                          >
                            NOT GIVEN
                          </strong>{" "}
                          if there is no information on this
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {sec.items.map((item) => {
                        const val = (
                          answers[String(item.number)] || ""
                        ).toUpperCase();
                        return (
                          <div key={item.number} className="space-y-2.5">
                            <div className="flex items-start gap-2.5 text-[15px]">
                              <span
                                className={`mt-0.5 inline-flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                  isDark
                                    ? "border-[#476899] bg-[#091529] text-white"
                                    : "border-[#9ca3af] bg-white text-[#111827]"
                                }`}
                              >
                                {item.number}
                              </span>
                              <p className="leading-6">{item.statement}</p>
                            </div>

                            <div className="space-y-1.5 pl-9">
                              {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => {
                                const active = val === opt;
                                return (
                                  <label
                                    key={opt}
                                    data-testid={`exam-r-q-${item.number}-${opt.replace(/\s+/g, "_")}`}
                                    onClick={() =>
                                      onChangeAnswer(item.number, opt)
                                    }
                                    className={`flex w-fit cursor-pointer items-center gap-2.5 rounded px-2 py-1 text-sm transition ${
                                      active
                                        ? isDark
                                          ? "font-bold text-white"
                                          : "font-bold text-[#111827]"
                                        : isDark
                                          ? "text-[#cbd5e1] hover:text-white"
                                          : "text-[#374151] hover:text-[#111827]"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                        active
                                          ? "border-[#2563eb] bg-[#2563eb]"
                                          : isDark
                                            ? "border-[#476899]"
                                            : "border-[#9ca3af]"
                                      }`}
                                    >
                                      {active && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                      )}
                                    </span>
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // 3. MATCHING HEADINGS (Q14–20 — CLEAN CDI MATRIX GRID LIKE SCREENSHOT 7!)
              if (sec.kind === "matching_headings") {
                return (
                  <div key={sIdx} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    {/* Clean List of Headings Reference Box */}
                    <div
                      className={`rounded border p-4 text-sm ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-[#f9fafb]"
                      }`}
                    >
                      <p className="mb-2 text-xs font-bold tracking-wider uppercase">
                        {sec.boxTitle}
                      </p>
                      <div className="space-y-1">
                        {sec.headings.map((h) => (
                          <div key={h.key} className="flex gap-2.5">
                            <span className="w-6 shrink-0 font-mono font-bold">
                              {h.key}
                            </span>
                            <span>{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Official CDI Matching Table Matrix */}
                    <div
                      className={`overflow-x-auto rounded border ${
                        isDark ? "border-[#284773]" : "border-[#d1d5db]"
                      }`}
                    >
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr
                            className={`border-b ${
                              isDark
                                ? "border-[#284773] bg-[#102340] text-white"
                                : "border-[#d1d5db] bg-[#f3f4f6] text-[#111827]"
                            }`}
                          >
                            <th className="px-3 py-2.5 text-left font-bold">
                              Paragraph
                            </th>
                            {sec.headings.map((h) => (
                              <th
                                key={h.key}
                                className={`w-9 border-l py-2.5 text-center font-mono text-xs font-bold ${
                                  isDark
                                    ? "border-[#284773]"
                                    : "border-[#d1d5db]"
                                }`}
                              >
                                {h.key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isDark
                              ? "divide-[#1e3a63] bg-[#0e203b]"
                              : "divide-[#e5e7eb] bg-white"
                          }`}
                        >
                          {sec.items.map((item) => {
                            const val = (
                              answers[String(item.number)] || ""
                            ).toLowerCase();
                            return (
                              <tr key={item.number}>
                                <td className="px-3 py-2 font-medium whitespace-nowrap">
                                  <span
                                    className={`mr-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                      isDark
                                        ? "border-[#476899] bg-[#091529] text-white"
                                        : "border-[#9ca3af] bg-white text-[#111827]"
                                    }`}
                                  >
                                    {item.number}
                                  </span>
                                  {item.label}
                                </td>
                                {sec.headings.map((h) => {
                                  const active = val === h.key;
                                  return (
                                    <td
                                      key={h.key}
                                      className={`border-l p-0 text-center ${
                                        isDark
                                          ? "border-[#1e3a63]"
                                          : "border-[#e5e7eb]"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        data-testid={`exam-r-q-${item.number}-${h.key}`}
                                        onClick={() =>
                                          onChangeAnswer(item.number, h.key)
                                        }
                                        aria-label={`Q${item.number} ${h.key}`}
                                        className={`flex h-10 w-full cursor-pointer items-center justify-center transition ${
                                          active
                                            ? isDark
                                              ? "bg-[#1d4ed8]/45 text-white"
                                              : "bg-[#dbeafe] text-[#1d4ed8]"
                                            : isDark
                                              ? "hover:bg-[#152d52]"
                                              : "hover:bg-[#f3f4f6]"
                                        }`}
                                      >
                                        {active ? (
                                          <Check className="h-4 w-4 stroke-[2.5]" />
                                        ) : (
                                          <span
                                            className={`h-3.5 w-3.5 rounded-full border ${
                                              isDark
                                                ? "border-[#3a5c8d]"
                                                : "border-[#d1d5db]"
                                            }`}
                                          />
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // 4. CHOOSE TWO LETTERS (Q21–22)
              if (sec.kind === "multi_two") {
                const [q1, q2] = sec.questionNumbers;
                const selected = [
                  (answers[String(q1)] || "").toUpperCase(),
                  (answers[String(q2)] || "").toUpperCase(),
                ].filter(Boolean);
                return (
                  <div key={sIdx} className="space-y-3">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {q1} and {q2}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                      <p className="mt-2 text-[15px] font-semibold">
                        {sec.prompt}
                      </p>
                      <p
                        className={`mt-0.5 font-mono text-xs ${
                          isDark ? "text-[#94a3b8]" : "text-[#6b7280]"
                        }`}
                      >
                        Tanlangan: {selected.length} / 2{" "}
                        {selected.length > 0 ? `(${selected.join(", ")})` : ""}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      {sec.options.map((opt) => {
                        const checked = selected.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            data-testid={`exam-r-q-${q1}-${q2}-${opt.key}`}
                            onClick={() => onToggleMultiTwo(q1, q2, opt.key)}
                            className={`flex w-full cursor-pointer items-center gap-3 rounded border px-3.5 py-2.5 text-left text-sm transition ${
                              checked
                                ? isDark
                                  ? "border-[#60a5fa] bg-[#152d52] font-semibold text-white"
                                  : "border-[#2563eb] bg-[#eff6ff] font-semibold text-[#111827]"
                                : isDark
                                  ? "border-[#1f3a63] bg-[#0e203b] text-[#cbd5e1] hover:border-[#3a5c8d]"
                                  : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                            }`}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-[#2563eb] bg-[#2563eb] text-white"
                                  : isDark
                                    ? "border-[#476899]"
                                    : "border-[#9ca3af]"
                              }`}
                            >
                              {checked && <Check className="h-3 w-3" />}
                            </span>
                            <span className="font-mono text-xs font-bold">
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // 5. SUMMARY INPUT COMPLETION (Q23–26)
              if (sec.kind === "summary_input") {
                return (
                  <div key={sIdx} className="space-y-3">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    <div
                      className={`rounded border p-5 ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-white"
                      }`}
                    >
                      <h4 className="mb-3 text-center text-sm font-bold">
                        {sec.title}
                      </h4>
                      <div className="space-y-3 text-[14.5px] leading-8">
                        {sec.paragraphs.map((segs, pIdx) => (
                          <p key={pIdx}>
                            {segs.map((seg, i) =>
                              seg.type === "text" ? (
                                <span key={i}>{seg.value}</span>
                              ) : (
                                <span
                                  key={i}
                                  className="mx-1 inline-flex items-center gap-1 align-middle"
                                >
                                  <span
                                    className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded border px-1 font-mono text-[11px] font-bold ${
                                      isDark
                                        ? "border-[#476899] bg-[#091529] text-white"
                                        : "border-[#9ca3af] bg-white text-[#111827]"
                                    }`}
                                  >
                                    {seg.questionNumber}
                                  </span>
                                  <input
                                    type="text"
                                    data-testid={`exam-r-q-${seg.questionNumber}`}
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={
                                      answers[String(seg.questionNumber)] || ""
                                    }
                                    onChange={(e) =>
                                      onChangeAnswer(
                                        seg.questionNumber,
                                        e.target.value
                                      )
                                    }
                                    placeholder={String(seg.questionNumber)}
                                    className={`w-32 rounded border px-2 py-0.5 text-sm font-medium focus:outline-none ${
                                      isDark
                                        ? "border-[#2c4a75] bg-[#060f1e] text-white focus:border-[#60a5fa]"
                                        : "border-[#9ca3af] bg-white text-[#111827] focus:border-[#2563eb]"
                                    }`}
                                  />
                                </span>
                              )
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // 6. MATCHING PARAGRAPH INFORMATION (Q27–32 — OFFICIAL CDI MATRIX GRID LIKE SCREENSHOT 7!)
              if (sec.kind === "matching_paragraph") {
                return (
                  <div key={sIdx} className="space-y-3">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    <div
                      className={`overflow-x-auto rounded border ${
                        isDark ? "border-[#284773]" : "border-[#d1d5db]"
                      }`}
                    >
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr
                            className={`border-b ${
                              isDark
                                ? "border-[#284773] bg-[#102340] text-white"
                                : "border-[#d1d5db] bg-[#f3f4f6] text-[#111827]"
                            }`}
                          >
                            <th className="px-3 py-2.5 text-left font-bold">
                              Statement
                            </th>
                            {sec.letters.map((l) => (
                              <th
                                key={l}
                                className={`w-8 border-l py-2.5 text-center font-mono text-xs font-bold ${
                                  isDark
                                    ? "border-[#284773]"
                                    : "border-[#d1d5db]"
                                }`}
                              >
                                {l}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isDark
                              ? "divide-[#1e3a63] bg-[#0e203b]"
                              : "divide-[#e5e7eb] bg-white"
                          }`}
                        >
                          {sec.items.map((item) => {
                            const val = (
                              answers[String(item.number)] || ""
                            ).toUpperCase();
                            return (
                              <tr key={item.number}>
                                <td className="px-3 py-2.5 text-[13.5px] leading-5">
                                  <span
                                    className={`mr-2 inline-flex h-5 min-w-[24px] items-center justify-center rounded border px-1 font-mono text-[11px] font-bold ${
                                      isDark
                                        ? "border-[#476899] bg-[#091529] text-white"
                                        : "border-[#9ca3af] bg-white text-[#111827]"
                                    }`}
                                  >
                                    {item.number}
                                  </span>
                                  {item.statement}
                                </td>
                                {sec.letters.map((l) => {
                                  const active = val === l;
                                  return (
                                    <td
                                      key={l}
                                      className={`border-l p-0 text-center ${
                                        isDark
                                          ? "border-[#1e3a63]"
                                          : "border-[#e5e7eb]"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        data-testid={`exam-r-q-${item.number}-${l}`}
                                        onClick={() =>
                                          onChangeAnswer(item.number, l)
                                        }
                                        aria-label={`Q${item.number} ${l}`}
                                        className={`flex h-11 w-full cursor-pointer items-center justify-center transition ${
                                          active
                                            ? isDark
                                              ? "bg-[#1d4ed8]/45 text-white"
                                              : "bg-[#dbeafe] text-[#1d4ed8]"
                                            : isDark
                                              ? "hover:bg-[#152d52]"
                                              : "hover:bg-[#f3f4f6]"
                                        }`}
                                      >
                                        {active ? (
                                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                        ) : (
                                          <span
                                            className={`h-3 w-3 rounded-full border ${
                                              isDark
                                                ? "border-[#3a5c8d]"
                                                : "border-[#d1d5db]"
                                            }`}
                                          />
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // 7. MATCHING SENTENCE ENDINGS (Q33–37 — OFFICIAL CDI MATRIX GRID LIKE SCREENSHOT 7!)
              if (sec.kind === "matching_endings") {
                return (
                  <div key={sIdx} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    {/* Endings Reference Box */}
                    <div
                      className={`rounded border p-4 text-sm ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-[#f9fafb]"
                      }`}
                    >
                      <div className="space-y-1">
                        {sec.endings.map((end) => (
                          <div key={end.key} className="flex gap-2.5">
                            <span className="w-5 shrink-0 font-mono font-bold">
                              {end.key}
                            </span>
                            <span>{end.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Matrix Grid */}
                    <div
                      className={`overflow-x-auto rounded border ${
                        isDark ? "border-[#284773]" : "border-[#d1d5db]"
                      }`}
                    >
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr
                            className={`border-b ${
                              isDark
                                ? "border-[#284773] bg-[#102340] text-white"
                                : "border-[#d1d5db] bg-[#f3f4f6] text-[#111827]"
                            }`}
                          >
                            <th className="px-3 py-2.5 text-left font-bold">
                              Statement
                            </th>
                            {sec.endings.map((end) => (
                              <th
                                key={end.key}
                                className={`w-9 border-l py-2.5 text-center font-mono text-xs font-bold ${
                                  isDark
                                    ? "border-[#284773]"
                                    : "border-[#d1d5db]"
                                }`}
                              >
                                {end.key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${
                            isDark
                              ? "divide-[#1e3a63] bg-[#0e203b]"
                              : "divide-[#e5e7eb] bg-white"
                          }`}
                        >
                          {sec.items.map((item) => {
                            const val = (
                              answers[String(item.number)] || ""
                            ).toUpperCase();
                            return (
                              <tr key={item.number}>
                                <td className="px-3 py-2.5 text-[13.5px] leading-5">
                                  <span
                                    className={`mr-2 inline-flex h-5 min-w-[24px] items-center justify-center rounded border px-1 font-mono text-[11px] font-bold ${
                                      isDark
                                        ? "border-[#476899] bg-[#091529] text-white"
                                        : "border-[#9ca3af] bg-white text-[#111827]"
                                    }`}
                                  >
                                    {item.number}
                                  </span>
                                  {item.stem}
                                </td>
                                {sec.endings.map((end) => {
                                  const active = val === end.key;
                                  return (
                                    <td
                                      key={end.key}
                                      className={`border-l p-0 text-center ${
                                        isDark
                                          ? "border-[#1e3a63]"
                                          : "border-[#e5e7eb]"
                                      }`}
                                    >
                                      <button
                                        type="button"
                                        data-testid={`exam-r-q-${item.number}-${end.key}`}
                                        onClick={() =>
                                          onChangeAnswer(item.number, end.key)
                                        }
                                        aria-label={`Q${item.number} ${end.key}`}
                                        className={`flex h-10 w-full cursor-pointer items-center justify-center transition ${
                                          active
                                            ? isDark
                                              ? "bg-[#1d4ed8]/45 text-white"
                                              : "bg-[#dbeafe] text-[#1d4ed8]"
                                            : isDark
                                              ? "hover:bg-[#152d52]"
                                              : "hover:bg-[#f3f4f6]"
                                        }`}
                                      >
                                        {active ? (
                                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                        ) : (
                                          <span
                                            className={`h-3 w-3 rounded-full border ${
                                              isDark
                                                ? "border-[#3a5c8d]"
                                                : "border-[#d1d5db]"
                                            }`}
                                          />
                                        )}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // 8. SUMMARY BOX WITH INLINE COMPACT DROPDOWNS (Q38–40 — EXACT SCREENSHOT 6 STYLE!)
              if (sec.kind === "summary_box") {
                return (
                  <div key={sIdx} className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold">
                        Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                        }`}
                      >
                        {sec.instruction}
                      </p>
                    </div>

                    {/* Clean 2-Column Word List Box at Top (Screenshot 6!) */}
                    <div
                      className={`grid grid-cols-2 gap-x-6 gap-y-1.5 rounded border p-4 text-sm ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-[#f9fafb]"
                      }`}
                    >
                      {sec.wordBox.map((w) => (
                        <div key={w.key} className="flex gap-2.5">
                          <span className="w-4 shrink-0 font-mono font-bold">
                            {w.key}
                          </span>
                          <span>{w.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bordered Summary Card with Compact Single-Letter Dropdowns (Screenshot 6!) */}
                    <div
                      className={`space-y-4 rounded border p-5 ${
                        isDark
                          ? "border-[#284773] bg-[#0e203b]"
                          : "border-[#d1d5db] bg-white"
                      }`}
                    >
                      {sec.blocks.map((blk, bIdx) => (
                        <div key={bIdx}>
                          <h4 className="mb-2 text-center text-sm font-bold">
                            {blk.heading}
                          </h4>
                          <p className="text-[14.5px] leading-9">
                            {blk.segments.map((seg, i) =>
                              seg.type === "text" ? (
                                <span key={i}>{seg.value}</span>
                              ) : (
                                <span
                                  key={i}
                                  className="mx-1 inline-flex items-center gap-1 align-middle"
                                >
                                  <span
                                    className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1 font-mono text-xs font-bold ${
                                      isDark
                                        ? "border-[#476899] bg-[#091529] text-white"
                                        : "border-[#9ca3af] bg-white text-[#111827]"
                                    }`}
                                  >
                                    {seg.questionNumber}
                                  </span>
                                  <select
                                    data-testid={`exam-r-q-${seg.questionNumber}`}
                                    value={
                                      (
                                        answers[String(seg.questionNumber)] ||
                                        ""
                                      ).toUpperCase()
                                    }
                                    onChange={(e) =>
                                      onChangeAnswer(
                                        seg.questionNumber,
                                        e.target.value
                                      )
                                    }
                                    className={`h-7 w-16 cursor-pointer rounded border px-2 font-mono text-xs font-bold focus:outline-none ${
                                      isDark
                                        ? "border-[#2c4a75] bg-[#060f1e] text-white focus:border-[#60a5fa]"
                                        : "border-[#9ca3af] bg-white text-[#111827] focus:border-[#2563eb]"
                                    }`}
                                  >
                                    <option value=""></option>
                                    {sec.wordBox.map((w) => (
                                      <option key={w.key} value={w.key}>
                                        {w.key}
                                      </option>
                                    ))}
                                  </select>
                                </span>
                              )
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </QuestionHighlightArea>
      </div>

      {/* Official CDI Bottom Navigation Bar (Matches Screenshot 3, 6, 7!) */}
      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2 ${
          isDark
            ? "border-[#1d3456] bg-[#091529] text-white"
            : "border-[#e5e7eb] bg-white text-[#111827]"
        }`}
      >
        {/* Floating Prev/Next Passage Arrows */}
        <div className="absolute -top-11 right-4 flex items-center gap-1.5">
          <button
            type="button"
            disabled={activePassageIdx === 0}
            onClick={() => setActivePassageIdx((i) => Math.max(0, i - 1))}
            aria-label="Oldingi matn"
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded shadow-md transition disabled:opacity-40 ${
              isDark
                ? "bg-[#1e3a63] text-white hover:bg-[#2a4d80]"
                : "bg-[#4b5563] text-white hover:bg-[#374151]"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={activePassageIdx >= passages.length - 1}
            onClick={() =>
              setActivePassageIdx((i) => Math.min(passages.length - 1, i + 1))
            }
            aria-label="Keyingi matn"
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded shadow-md transition disabled:opacity-40 ${
              isDark
                ? "bg-white text-[#091529] hover:bg-slate-200"
                : "bg-[#111827] text-white hover:bg-[#1f2937]"
            }`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {passages.map((p, idx) => {
            const isCurrent = idx === activePassageIdx;
            const partCount = countInRange(p.questionRange[0], p.questionRange[1]);
            const totalInPart = p.questionRange[1] - p.questionRange[0] + 1;

            return (
              <div key={p.passage} className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid={`reading-passage-tab-${p.passage}`}
                  onClick={() => setActivePassageIdx(idx)}
                  className={`cursor-pointer text-xs font-bold ${
                    isCurrent
                      ? isDark
                        ? "text-white"
                        : "text-[#111827]"
                      : isDark
                        ? "text-[#94a3b8] hover:text-white"
                        : "text-[#6b7280] hover:text-[#111827]"
                  }`}
                >
                  Part {p.passage}
                </button>
                {isCurrent ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from(
                      { length: totalInPart },
                      (_, k) => p.questionRange[0] + k
                    ).map((qNum) => {
                      const answered = Boolean(
                        (answers[String(qNum)] || "").trim()
                      );
                      return (
                        <span
                          key={qNum}
                          className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1 font-mono text-[11px] font-bold ${
                            answered
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : isDark
                                ? "border-[#3a5c8d] bg-[#0e203b] text-[#cbd5e1]"
                                : "border-[#d1d5db] bg-white text-[#374151]"
                          }`}
                        >
                          {qNum}
                        </span>
                      );
                    })}
                    <span
                      className={`ml-1 font-mono text-[11px] ${
                        isDark ? "text-[#94a3b8]" : "text-[#6b7280]"
                      }`}
                    >
                      {partCount} of {totalInPart}
                    </span>
                  </div>
                ) : (
                  <span
                    className={`font-mono text-[11px] ${
                      isDark ? "text-[#64748b]" : "text-[#9ca3af]"
                    }`}
                  >
                    {partCount} of {totalInPart}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          data-testid="submit-reading-btn"
          onClick={() => setConfirmSubmitOpen(true)}
          className={`cursor-pointer rounded-md px-5 py-2 text-xs font-bold transition ${
            isDark
              ? "bg-white text-[#091529] hover:bg-slate-200"
              : "bg-[#111827] text-white hover:bg-[#1f2937]"
          }`}
        >
          Submit Reading
        </button>
      </div>

      {/* Confirm Submit Reading Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${
              isDark
                ? "border-[#284773] bg-[#0e203b] text-white"
                : "border-[#d1d5db] bg-white text-[#111827]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold">
                Reading bo&apos;limini yakunlash
              </h3>
            </div>
            <p
              className={`mt-2.5 text-sm leading-relaxed ${
                isDark ? "text-[#cbd5e1]" : "text-[#4b5563]"
              }`}
            >
              Siz 40 ta savoldan <strong>{answeredCount}</strong> tasiga javob
              berdingiz. Tasdiqlasangiz darhol Writing Task 1 (20:00)
              bo&apos;limiga o&apos;tiladi.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className={`cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold ${
                  isDark
                    ? "border-[#2c4a75] text-[#cbd5e1] hover:bg-[#152d52]"
                    : "border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]"
                }`}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                data-testid="confirm-submit-reading-btn"
                onClick={() => {
                  setConfirmSubmitOpen(false);
                  onFinishReading();
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold ${
                  isDark
                    ? "bg-white text-[#091529] hover:bg-slate-200"
                    : "bg-[#111827] text-white hover:bg-[#1f2937]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ha, Writingga o&apos;tish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
