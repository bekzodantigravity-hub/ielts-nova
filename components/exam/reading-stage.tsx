"use client";

import { AlertTriangle, CheckCircle2, GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadingPassageData } from "@/lib/exam-types";
import {
  type PassageHighlight,
  ReadingHighlightPane,
} from "./reading-highlight-pane";

interface ReadingStageProps {
  passages: ReadingPassageData[];
  answers: Record<string, string>;
  onChangeAnswer: (qNum: number, value: string) => void;
  onToggleMultiTwo: (q1: number, q2: number, letter: string) => void;
  highlights: PassageHighlight[];
  onChangeHighlights: (next: PassageHighlight[]) => void;
  onFinishReading: () => void;
}

export function ReadingStage({
  passages,
  answers,
  onChangeAnswer,
  onToggleMultiTwo,
  highlights,
  onChangeHighlights,
  onFinishReading,
}: ReadingStageProps) {
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [splitPercent, setSplitPercent] = useState(50);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onPointerMove = useCallback((e: MouseEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.min(72, Math.max(28, pct)));
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

  const answeredCount = Array.from({ length: 40 }, (_, i) => i + 1).filter(
    (n) => Boolean((answers[String(n)] || "").trim())
  ).length;

  const toggleMultiTwo = (qPair: [number, number], letter: string) => {
    onToggleMultiTwo(qPair[0], qPair[1], letter);
  };

  const getPassageIdxForQuestion = (qNum: number) => {
    const idx = passages.findIndex(
      (p) => qNum >= p.questionRange[0] && qNum <= p.questionRange[1]
    );
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#09090b] text-zinc-100">
      {/* Passage Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#111113] px-5 py-2">
        <div className="flex items-center gap-1.5">
          {passages.map((p, idx) => (
            <button
              key={p.passage}
              type="button"
              data-testid={`reading-passage-tab-${p.passage}`}
              onClick={() => setActivePassageIdx(idx)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activePassageIdx === idx
                  ? "border border-zinc-600 bg-zinc-800 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              Passage {p.passage}{" "}
              <span className="ml-1 font-mono text-[10px] text-zinc-500">
                ({p.questionRange[0]}–{p.questionRange[1]})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] text-zinc-500 md:inline">
            Matnni belgilab Highlight / Note qo&apos;shishingiz mumkin
          </span>
          <span className="font-mono text-xs text-zinc-400">
            Javoblar: <strong className="text-white">{answeredCount}</strong> / 40
          </span>
          <button
            type="button"
            data-testid="submit-reading-btn"
            onClick={() => setConfirmSubmitOpen(true)}
            className="cursor-pointer rounded-md border border-zinc-600 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-zinc-800"
          >
            Submit Reading
          </button>
        </div>
      </div>

      {/* Draggable Split-Screen Pane */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        {/* Left: Passage with CDI Highlight + Notes */}
        <div
          style={{ width: undefined }}
          className="h-1/2 min-h-0 w-full border-b border-zinc-800 lg:h-full lg:border-r lg:border-b-0"
          ref={(el) => {
            if (el && window.innerWidth >= 1024) {
              el.style.width = `${splitPercent}%`;
            }
          }}
        >
          <ReadingHighlightPane
            passageNumber={currentPassage.passage}
            title={currentPassage.title}
            subtitle={currentPassage.subtitle}
            timeHint={currentPassage.timeHint}
            paragraphs={currentPassage.paragraphs}
            highlights={highlights}
            onChangeHighlights={onChangeHighlights}
          />
        </div>

        {/* Center Draggable Divider (Desktop) */}
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={startDrag}
          title="O'lchamni o'zgartirish uchun suring"
          className="hidden w-2 shrink-0 cursor-col-resize items-center justify-center bg-[#141417] text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300 lg:flex"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Right: Questions Panel */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#09090b] px-5 py-6">
          <div className="mx-auto max-w-2xl space-y-6 pb-8">
            {currentPassage.sections.map((sec, sIdx) => {
              if (sec.kind === "note_completion") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                      <h3 className="mb-3 text-center text-sm font-bold text-white">
                        {sec.boxTitle}
                      </h3>
                      <div className="space-y-2.5">
                        {sec.groups.map((grp, gIdx) => (
                          <div key={gIdx} className="space-y-2">
                            {grp.lines.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className={`flex flex-wrap items-center gap-1.5 text-sm leading-7 text-zinc-200 ${
                                  line.indent ? "pl-6" : ""
                                }`}
                              >
                                <span className="text-zinc-500">
                                  {line.indent ? "–" : "•"}
                                </span>
                                {line.prefix && <span>{line.prefix}</span>}
                                {line.questionNumber !== undefined && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                      {line.questionNumber}
                                    </span>
                                    <input
                                      type="text"
                                      data-testid={`exam-r-q-${line.questionNumber}`}
                                      autoComplete="off"
                                      spellCheck={false}
                                      value={
                                        answers[String(line.questionNumber)] || ""
                                      }
                                      onChange={(e) =>
                                        onChangeAnswer(
                                          line.questionNumber!,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Q${line.questionNumber}`}
                                      className="w-36 rounded border border-zinc-700 bg-[#09090b] px-2.5 py-0.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
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

              if (sec.kind === "tfng") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 space-y-3">
                      {sec.items.map((item) => {
                        const val = (answers[String(item.number)] || "").toUpperCase();
                        return (
                          <div
                            key={item.number}
                            className="rounded-lg border border-zinc-800 bg-[#18181b] p-3.5"
                          >
                            <p className="text-sm text-zinc-100">
                              <span className="mr-2 inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                {item.number}
                              </span>
                              {item.statement}
                            </p>
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  data-testid={`exam-r-q-${item.number}-${opt.replace(/\s+/g, "_")}`}
                                  onClick={() =>
                                    onChangeAnswer(item.number, opt)
                                  }
                                  className={`cursor-pointer rounded border px-3 py-1.5 font-mono text-xs font-bold transition ${
                                    val === opt
                                      ? "border-white bg-white text-zinc-950"
                                      : "border-zinc-700 bg-[#09090b] text-zinc-300 hover:border-zinc-500"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (sec.kind === "matching_headings") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                      <p className="mb-2 text-xs font-bold tracking-wider text-zinc-300 uppercase">
                        {sec.boxTitle}
                      </p>
                      <div className="space-y-1.5 text-sm text-zinc-200">
                        {sec.headings.map((h) => (
                          <div key={h.key} className="flex gap-2.5">
                            <span className="w-6 shrink-0 font-mono font-bold text-white">
                              {h.key}
                            </span>
                            <span>{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {sec.items.map((item) => {
                        const val = (answers[String(item.number)] || "").toLowerCase();
                        return (
                          <div
                            key={item.number}
                            className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#18181b] px-3.5 py-2.5"
                          >
                            <span className="text-sm font-semibold text-white">
                              <span className="mr-2 inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold">
                                {item.number}
                              </span>
                              {item.label}
                            </span>
                            <select
                              data-testid={`exam-r-q-${item.number}`}
                              value={val}
                              onChange={(e) =>
                                onChangeAnswer(item.number, e.target.value)
                              }
                              className="cursor-pointer rounded border border-zinc-700 bg-[#09090b] px-3 py-1.5 font-mono text-xs font-bold text-white focus:border-white focus:outline-none"
                            >
                              <option value="">Tanlang...</option>
                              {sec.headings.map((h) => (
                                <option key={h.key} value={h.key}>
                                  {h.key} — {h.text}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (sec.kind === "multi_two") {
                const [q1, q2] = sec.questionNumbers;
                const selected = [
                  (answers[String(q1)] || "").toUpperCase(),
                  (answers[String(q2)] || "").toUpperCase(),
                ].filter(Boolean);
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {q1} and {q2}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>
                    <p className="mt-2.5 text-sm font-semibold text-white">
                      {sec.prompt}
                    </p>
                    <p className="mt-1 font-mono text-xs text-zinc-400">
                      Tanlangan: {selected.length} / 2{" "}
                      {selected.length > 0 ? `(${selected.join(", ")})` : ""}
                    </p>
                    <div className="mt-3 space-y-2">
                      {sec.options.map((opt) => {
                        const checked = selected.includes(opt.key);
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            data-testid={`exam-r-q-${q1}-${q2}-${opt.key}`}
                            onClick={() =>
                              toggleMultiTwo(sec.questionNumbers, opt.key)
                            }
                            className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition ${
                              checked
                                ? "border-white bg-zinc-800 font-semibold text-white"
                                : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:border-zinc-600"
                            }`}
                          >
                            <span
                              className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                                checked
                                  ? "bg-white text-zinc-950"
                                  : "border border-zinc-700 text-zinc-400"
                              }`}
                            >
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

              if (sec.kind === "summary_input") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                      <h3 className="mb-3 text-center text-sm font-bold text-white">
                        {sec.title}
                      </h3>
                      <div className="space-y-3 text-sm leading-8 text-zinc-200">
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
                                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
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
                                    placeholder={`Q${seg.questionNumber}`}
                                    className="w-32 rounded border border-zinc-700 bg-[#09090b] px-2 py-0.5 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
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

              if (sec.kind === "matching_paragraph") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 space-y-2.5">
                      {sec.items.map((item) => {
                        const val = (answers[String(item.number)] || "").toUpperCase();
                        return (
                          <div
                            key={item.number}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#18181b] p-3.5"
                          >
                            <p className="flex-1 text-sm text-zinc-100">
                              <span className="mr-2 inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                {item.number}
                              </span>
                              {item.statement}
                            </p>
                            <select
                              data-testid={`exam-r-q-${item.number}`}
                              value={val}
                              onChange={(e) =>
                                onChangeAnswer(item.number, e.target.value)
                              }
                              className="cursor-pointer rounded border border-zinc-700 bg-[#09090b] px-3 py-1.5 font-mono text-xs font-bold text-white focus:border-white focus:outline-none"
                            >
                              <option value="">A–I</option>
                              {sec.letters.map((l) => (
                                <option key={l} value={l}>
                                  Paragraph {l}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (sec.kind === "matching_endings") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 space-y-2.5">
                      {sec.items.map((item) => {
                        const val = (answers[String(item.number)] || "").toUpperCase();
                        return (
                          <div
                            key={item.number}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#18181b] px-3.5 py-2.5"
                          >
                            <span className="flex-1 text-sm text-zinc-100">
                              <span className="mr-2 inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                {item.number}
                              </span>
                              {item.stem}
                            </span>
                            <select
                              data-testid={`exam-r-q-${item.number}`}
                              value={val}
                              onChange={(e) =>
                                onChangeAnswer(item.number, e.target.value)
                              }
                              className="cursor-pointer rounded border border-zinc-700 bg-[#09090b] px-3 py-1.5 font-mono text-xs font-bold text-white focus:border-white focus:outline-none"
                            >
                              <option value="">A–G</option>
                              {sec.endings.map((end) => (
                                <option key={end.key} value={end.key}>
                                  {end.key}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                      <div className="space-y-1.5 text-sm text-zinc-200">
                        {sec.endings.map((end) => (
                          <div key={end.key} className="flex gap-2.5">
                            <span className="w-5 shrink-0 font-mono font-bold text-white">
                              {end.key}
                            </span>
                            <span>{end.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (sec.kind === "summary_box") {
                return (
                  <div
                    key={sIdx}
                    className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                  >
                    <p className="font-mono text-xs font-bold text-zinc-400">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                    <div className="mt-4 space-y-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                      {sec.blocks.map((blk, bIdx) => (
                        <div key={bIdx}>
                          <h4 className="mb-1.5 text-sm font-bold text-white">
                            {blk.heading}
                          </h4>
                          <p className="text-sm leading-8 text-zinc-200">
                            {blk.segments.map((seg, i) =>
                              seg.type === "text" ? (
                                <span key={i}>{seg.value}</span>
                              ) : (
                                <span
                                  key={i}
                                  className="mx-1 inline-flex items-center gap-1 align-middle"
                                >
                                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                    {seg.questionNumber}
                                  </span>
                                  <select
                                    data-testid={`exam-r-q-${seg.questionNumber}`}
                                    value={
                                      (
                                        answers[String(seg.questionNumber)] || ""
                                      ).toUpperCase()
                                    }
                                    onChange={(e) =>
                                      onChangeAnswer(
                                        seg.questionNumber,
                                        e.target.value
                                      )
                                    }
                                    className="cursor-pointer rounded border border-zinc-700 bg-[#09090b] px-2 py-0.5 font-mono text-xs font-bold text-white focus:border-white focus:outline-none"
                                  >
                                    <option value="">A–F</option>
                                    {sec.wordBox.map((w) => (
                                      <option key={w.key} value={w.key}>
                                        {w.key} — {w.text}
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

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-[#141417] p-3 text-sm sm:grid-cols-3">
                      {sec.wordBox.map((w) => (
                        <div key={w.key} className="flex gap-2 text-zinc-200">
                          <span className="font-mono font-bold text-white">
                            {w.key}
                          </span>
                          <span>{w.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>

      {/* Bottom 1–40 Question Palette */}
      <div className="border-t border-zinc-800 bg-[#111113] px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((qNum) => {
            const pIdx = getPassageIdxForQuestion(qNum);
            const isAnswered = Boolean((answers[String(qNum)] || "").trim());
            const inCurrent = pIdx === activePassageIdx;
            return (
              <button
                key={qNum}
                type="button"
                onClick={() => setActivePassageIdx(pIdx)}
                className={`h-6 w-6 cursor-pointer rounded font-mono text-[10px] font-bold transition ${
                  isAnswered
                    ? "bg-white text-zinc-950"
                    : inCurrent
                      ? "border border-zinc-600 bg-zinc-900 text-zinc-200"
                      : "border border-zinc-800 bg-[#09090b] text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {qNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Submit Reading Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#141417] p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="h-5 w-5 text-zinc-300" />
              <h3 className="text-base font-bold">
                Reading bo&apos;limini yakunlash
              </h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
              Siz 40 ta savoldan{" "}
              <strong className="text-white">{answeredCount}</strong> tasiga
              javob berdingiz. Tasdiqlasangiz darhol Writing Task 1 (20:00)
              bo&apos;limiga o&apos;tiladi.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
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
