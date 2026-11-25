"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListeningPartData } from "@/lib/exam-types";
import { type ExamTheme, QuestionHighlightArea } from "./question-highlight-area";

interface ListeningStageProps {
  theme: ExamTheme;
  parts: ListeningPartData[];
  answers: Record<string, string>;
  onChangeAnswer: (qNum: number, value: string) => void;
  onToggleMultiTwo: (q1: number, q2: number, letter: string) => void;
  audioPartIndex: number;
  audioCurrentTime: number;
  audioStarted: boolean;
  transferSecondsLeft: number | null;
  onAudioProgress: (
    partIndex: number,
    currentTime: number,
    started: boolean
  ) => void;
  onStartTransferTimer: () => void;
  onFinishListening: () => void;
}

function formatMMSS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function ListeningStage({
  theme,
  parts,
  answers,
  onChangeAnswer,
  onToggleMultiTwo,
  audioPartIndex,
  audioCurrentTime,
  audioStarted,
  transferSecondsLeft,
  onAudioProgress,
  onStartTransferTimer,
  onFinishListening,
}: ListeningStageProps) {
  const isDark = theme === "dark";
  const [activePartIdx, setActivePartIdx] = useState(
    Math.min(Math.max(0, audioPartIndex), parts.length - 1)
  );
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [displayTime, setDisplayTime] = useState(audioCurrentTime);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPartIdxRef = useRef(audioPartIndex);
  const expectedTimeRef = useRef(audioCurrentTime);
  const initTriggeredRef = useRef(false);

  useEffect(() => {
    currentPartIdxRef.current = audioPartIndex;
  }, [audioPartIndex]);

  const stopAudioImmediately = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.removeAttribute("src");
      el.load();
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      stopAudioImmediately();
    };
  }, [stopAudioImmediately]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playPartAt = useCallback(
    async (partIdx: number, startSec: number) => {
      const el = audioRef.current;
      const partObj = parts[partIdx];
      if (!el || !partObj) return;

      currentPartIdxRef.current = partIdx;
      expectedTimeRef.current = startSec;
      setActivePartIdx(partIdx);

      if (!el.src.endsWith(partObj.audioUrl)) {
        el.src = partObj.audioUrl;
        el.load();
      }
      el.volume = volume;

      const seekAndPlay = async () => {
        try {
          if (startSec > 0.5) {
            el.currentTime = startSec;
          }
        } catch {}

        try {
          await el.play();
          setIsPlaying(true);
          setAutoplayBlocked(false);
          onAudioProgress(partIdx, startSec, true);
        } catch {
          setIsPlaying(false);
          setAutoplayBlocked(true);
          onAudioProgress(partIdx, startSec, true);
        }
      };

      if (el.readyState >= 1) {
        await seekAndPlay();
      } else {
        const onMeta = () => {
          el.removeEventListener("loadedmetadata", onMeta);
          void seekAndPlay();
        };
        el.addEventListener("loadedmetadata", onMeta);
      }
    },
    [parts, volume, onAudioProgress]
  );

  // AUTO-START Listening audio immediately when entering Stage 1 (no "Start Listening" button!)
  useEffect(() => {
    if (transferSecondsLeft !== null || initTriggeredRef.current) return;
    initTriggeredRef.current = true;
    void playPartAt(audioPartIndex, audioCurrentTime);
  }, [audioPartIndex, audioCurrentTime, transferSecondsLeft, playPartAt]);

  // If browser blocked unmuted autoplay on Proctor auto-start or F5 refresh, unlock on first click/key anywhere
  useEffect(() => {
    if (!autoplayBlocked || transferSecondsLeft !== null) return;
    const unlock = () => {
      void playPartAt(currentPartIdxRef.current, expectedTimeRef.current);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [autoplayBlocked, transferSecondsLeft, playPartAt]);

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !isPlaying) return;
    const t = el.currentTime;
    if (Math.abs(t - expectedTimeRef.current) > 2.5) {
      el.currentTime = expectedTimeRef.current;
      return;
    }
    expectedTimeRef.current = t;
    setDisplayTime(t);
    if (Number.isFinite(el.duration)) {
      setAudioDuration(el.duration);
    }
    onAudioProgress(currentPartIdxRef.current, t, true);
  };

  const handlePauseGuard = () => {
    const el = audioRef.current;
    if (el && isPlaying && !el.ended && transferSecondsLeft === null) {
      void el.play().catch(() => {});
    }
  };

  const handleAudioEnded = () => {
    const nextIdx = currentPartIdxRef.current + 1;
    if (nextIdx < parts.length) {
      expectedTimeRef.current = 0;
      setDisplayTime(0);
      void playPartAt(nextIdx, 0);
    } else {
      setIsPlaying(false);
      // Automatically grant 2:00 minutes to review answers after Part 4 ends
      onStartTransferTimer();
    }
  };

  const handleConfirmFinish = () => {
    setConfirmSubmitOpen(false);
    stopAudioImmediately();
    onFinishListening();
  };

  const currentPart = parts[activePartIdx] || parts[0];
  const nextPreloadPart = parts[audioPartIndex + 1];

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
      {/* Hidden Continuous 4-Part Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePauseGuard}
        onEnded={handleAudioEnded}
        onLoadedMetadata={(e) => {
          const dur = (e.currentTarget as HTMLAudioElement).duration;
          if (Number.isFinite(dur)) setAudioDuration(dur);
        }}
      />
      {isPlaying && nextPreloadPart && (
        <audio src={nextPreloadPart.audioUrl} preload="auto" className="hidden" />
      )}

      {/* Official CDI Part Sub-Banner (Matches Screenshot 3 & 4) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-6 py-2.5 ${
          isDark
            ? "border-[#1e3a63] bg-[#102340] text-[#f1f5f9]"
            : "border-[#e5e7eb] bg-[#f3f4f6] text-[#111827]"
        }`}
      >
        <div>
          <p className="text-sm font-bold">Part {currentPart.part}</p>
          <p
            className={`text-xs ${
              isDark ? "text-[#94a3b8]" : "text-[#4b5563]"
            }`}
          >
            Listen and answer questions {currentPart.questionRange[0]}–
            {currentPart.questionRange[1]}.
          </p>
        </div>

        {/* Volume ONLY (and 2:00 review countdown when all 4 parts finish) */}
        <div className="flex flex-wrap items-center gap-3">
          {transferSecondsLeft !== null && (
            <span
              data-testid="listening-transfer-banner"
              className={`rounded-md border px-3 py-1 font-mono text-xs font-bold ${
                isDark
                  ? "border-amber-500/50 bg-amber-950/50 text-amber-200"
                  : "border-amber-400 bg-amber-50 text-amber-900"
              }`}
            >
              Audio tugadi · Tekshirish vaqti: {formatMMSS(transferSecondsLeft)}
            </span>
          )}

          {/* Volume Control */}
          <div
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1 ${
              isDark
                ? "border-[#284773] bg-[#091529]"
                : "border-[#d1d5db] bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setVolume((v) => (v > 0 ? 0 : 1))}
              aria-label="Ovoz"
              className="cursor-pointer opacity-80 hover:opacity-100"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1.5 w-20 cursor-pointer accent-[#2563eb]"
            />
            <span className="w-8 text-right font-mono text-[11px] opacity-75">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tiny Autoplay Unlock Notice ONLY if browser blocked silent unmuted autoplay */}
      {autoplayBlocked && transferSecondsLeft === null && (
        <div
          onClick={() =>
            void playPartAt(currentPartIdxRef.current, expectedTimeRef.current)
          }
          className={`cursor-pointer border-b px-6 py-2 text-center text-xs font-semibold ${
            isDark
              ? "border-amber-500/40 bg-amber-950/60 text-amber-200"
              : "border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          Brauzer ovozni avtomatik yoqishni kutmoqda — Listening audioni
          boshlash uchun istalgan joyni bosing.
        </div>
      )}

      {/* Main Listening Questions Canvas (Highlight enabled!) */}
      <QuestionHighlightArea
        theme={theme}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-6"
      >
        <div className="mx-auto max-w-4xl space-y-6 pb-12">
          {currentPart.sections.map((sec, sIdx) => {
            if (sec.kind === "note_box") {
              return (
                <div key={sIdx} className="space-y-3">
                  <div>
                    <p className="text-sm font-bold">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p
                      className={`mt-0.5 text-sm ${
                        isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                      }`}
                    >
                      {sec.instruction}
                    </p>
                  </div>

                  <div
                    className={`rounded border p-6 ${
                      isDark
                        ? "border-[#284773] bg-[#0e203b]"
                        : "border-[#d1d5db] bg-white"
                    }`}
                  >
                    <h3 className="mb-5 text-center text-base font-bold">
                      {sec.boxTitle}
                    </h3>
                    <div className="space-y-4">
                      {sec.groups.map((grp, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                          {grp.heading && (
                            <h4 className="text-sm font-bold">{grp.heading}</h4>
                          )}
                          {grp.lines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className="flex flex-wrap items-center gap-2 text-[15px] leading-7"
                            >
                              {line.bullet && (
                                <span className="mr-1 opacity-60">•</span>
                              )}
                              {line.label && (
                                <span
                                  className={`w-44 shrink-0 font-medium ${
                                    isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                                  }`}
                                >
                                  {line.label}
                                </span>
                              )}
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
                                    data-testid={`exam-l-q-${line.questionNumber}`}
                                    autoComplete="off"
                                    spellCheck={false}
                                    value={answers[String(line.questionNumber)] || ""}
                                    onChange={(e) =>
                                      onChangeAnswer(
                                        line.questionNumber!,
                                        e.target.value
                                      )
                                    }
                                    placeholder={String(line.questionNumber)}
                                    className={`w-44 rounded border px-2.5 py-1 text-sm font-medium focus:outline-none ${
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

            if (sec.kind === "table") {
              return (
                <div key={sIdx} className="space-y-3">
                  <div>
                    <p className="text-sm font-bold">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p
                      className={`mt-0.5 text-sm ${
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
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr
                          className={`border-b text-xs font-bold ${
                            isDark
                              ? "border-[#284773] bg-[#102340] text-white"
                              : "border-[#d1d5db] bg-[#f3f4f6] text-[#111827]"
                          }`}
                        >
                          {sec.headers.map((h, i) => (
                            <th
                              key={i}
                              className={`px-4 py-3 ${
                                i > 0
                                  ? isDark
                                    ? "border-l border-[#284773]"
                                    : "border-l border-[#d1d5db]"
                                  : ""
                              }`}
                            >
                              {h}
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
                        {sec.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="px-4 py-3 font-semibold">
                              {row.category}
                            </td>
                            <td
                              className={`border-l px-4 py-3 ${
                                isDark ? "border-[#1e3a63]" : "border-[#e5e7eb]"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.recommendation.prefix && (
                                  <span>{row.recommendation.prefix}</span>
                                )}
                                {row.recommendation.questionNumber !==
                                  undefined && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                        isDark
                                          ? "border-[#476899] bg-[#091529] text-white"
                                          : "border-[#9ca3af] bg-white text-[#111827]"
                                      }`}
                                    >
                                      {row.recommendation.questionNumber}
                                    </span>
                                    <input
                                      type="text"
                                      data-testid={`exam-l-q-${row.recommendation.questionNumber}`}
                                      autoComplete="off"
                                      spellCheck={false}
                                      value={
                                        answers[
                                          String(
                                            row.recommendation.questionNumber
                                          )
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        onChangeAnswer(
                                          row.recommendation.questionNumber!,
                                          e.target.value
                                        )
                                      }
                                      placeholder={String(
                                        row.recommendation.questionNumber
                                      )}
                                      className={`w-36 rounded border px-2 py-1 text-sm focus:outline-none ${
                                        isDark
                                          ? "border-[#2c4a75] bg-[#060f1e] text-white focus:border-[#60a5fa]"
                                          : "border-[#9ca3af] bg-white text-[#111827] focus:border-[#2563eb]"
                                      }`}
                                    />
                                  </span>
                                )}
                                {row.recommendation.suffix && (
                                  <span>{row.recommendation.suffix}</span>
                                )}
                              </div>
                            </td>
                            <td
                              className={`border-l px-4 py-3 ${
                                isDark ? "border-[#1e3a63]" : "border-[#e5e7eb]"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.preference.prefix && (
                                  <span>{row.preference.prefix}</span>
                                )}
                                {row.preference.questionNumber !==
                                  undefined && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                        isDark
                                          ? "border-[#476899] bg-[#091529] text-white"
                                          : "border-[#9ca3af] bg-white text-[#111827]"
                                      }`}
                                    >
                                      {row.preference.questionNumber}
                                    </span>
                                    <input
                                      type="text"
                                      data-testid={`exam-l-q-${row.preference.questionNumber}`}
                                      autoComplete="off"
                                      spellCheck={false}
                                      value={
                                        answers[
                                          String(row.preference.questionNumber)
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        onChangeAnswer(
                                          row.preference.questionNumber!,
                                          e.target.value
                                        )
                                      }
                                      placeholder={String(
                                        row.preference.questionNumber
                                      )}
                                      className={`w-36 rounded border px-2 py-1 text-sm focus:outline-none ${
                                        isDark
                                          ? "border-[#2c4a75] bg-[#060f1e] text-white focus:border-[#60a5fa]"
                                          : "border-[#9ca3af] bg-white text-[#111827] focus:border-[#2563eb]"
                                      }`}
                                    />
                                  </span>
                                )}
                                {row.preference.suffix && (
                                  <span>{row.preference.suffix}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            if (sec.kind === "mcq") {
              return (
                <div key={sIdx} className="space-y-4">
                  <div>
                    <p className="text-sm font-bold">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p
                      className={`mt-0.5 text-sm ${
                        isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                      }`}
                    >
                      {sec.instruction}
                    </p>
                    {sec.title && (
                      <h3 className="mt-3 text-base font-bold">{sec.title}</h3>
                    )}
                  </div>

                  <div className="space-y-5">
                    {sec.items.map((item) => {
                      const val = (answers[String(item.number)] || "").toUpperCase();
                      return (
                        <div key={item.number} className="space-y-2">
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
                            <p className="font-medium leading-6">{item.prompt}</p>
                          </div>

                          <div className="space-y-1.5 pl-9">
                            {item.options.map((opt) => {
                              const active = val === opt.key;
                              return (
                                <label
                                  key={opt.key}
                                  data-testid={`exam-l-q-${item.number}-${opt.key}`}
                                  onClick={() =>
                                    onChangeAnswer(item.number, opt.key)
                                  }
                                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 text-sm transition ${
                                    active
                                      ? isDark
                                        ? "bg-[#152d52] font-semibold text-white"
                                        : "bg-[#eff6ff] font-semibold text-[#111827]"
                                      : isDark
                                        ? "text-[#cbd5e1] hover:bg-[#102340]"
                                        : "text-[#374151] hover:bg-[#f9fafb]"
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
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
                                  <span className="font-mono text-xs font-bold">
                                    {opt.key}
                                  </span>
                                  <span>{opt.text}</span>
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

            if (sec.kind === "multi_two") {
              const [q1, q2] = sec.questionNumbers;
              const selected = [
                (answers[String(q1)] || "").toUpperCase(),
                (answers[String(q2)] || "").toUpperCase(),
              ].filter(Boolean);
              return (
                <div key={sIdx} className="space-y-3 pt-2">
                  <div>
                    <p className="text-sm font-bold">
                      Questions {q1} and {q2}
                    </p>
                    <p
                      className={`mt-0.5 text-sm ${
                        isDark ? "text-[#cbd5e1]" : "text-[#374151]"
                      }`}
                    >
                      {sec.instruction}
                    </p>
                    <p className="mt-2 text-[15px] font-semibold">{sec.prompt}</p>
                    <p
                      className={`mt-0.5 font-mono text-xs ${
                        isDark ? "text-[#94a3b8]" : "text-[#6b7280]"
                      }`}
                    >
                      Tanlangan: {selected.length} / 2{" "}
                      {selected.length > 0 ? `(${selected.join(", ")})` : ""}
                    </p>
                  </div>

                  <div className="space-y-1.5 pl-2">
                    {sec.options.map((opt) => {
                      const checked = selected.includes(opt.key);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          data-testid={`exam-l-q-${q1}-${q2}-${opt.key}`}
                          onClick={() =>
                            onToggleMultiTwo(q1, q2, opt.key)
                          }
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2 text-left text-sm transition ${
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

            if (sec.kind === "matching") {
              return (
                <div key={sIdx} className="space-y-3 pt-2">
                  <div>
                    <p className="text-sm font-bold">
                      Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                    </p>
                    <p className="mt-1 text-sm font-medium">{sec.prompt}</p>
                    <p
                      className={`mt-0.5 text-xs ${
                        isDark ? "text-[#94a3b8]" : "text-[#4b5563]"
                      }`}
                    >
                      {sec.instruction}
                    </p>
                  </div>

                  {/* Clean Reference Box */}
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
                      {sec.options.map((opt) => (
                        <div key={opt.key} className="flex gap-2.5">
                          <span className="w-5 shrink-0 font-mono font-bold">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Official CDI Matching Matrix Grid (Matches Screenshot 7!) */}
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
                          <th className="px-3.5 py-2.5 text-left font-bold">
                            Item
                          </th>
                          {sec.options.map((opt) => (
                            <th
                              key={opt.key}
                              className={`w-11 border-l py-2.5 text-center font-mono text-xs font-bold ${
                                isDark ? "border-[#284773]" : "border-[#d1d5db]"
                              }`}
                            >
                              {opt.key}
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
                              <td className="px-3.5 py-2.5">
                                <span
                                  className={`mr-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 font-mono text-xs font-bold ${
                                    isDark
                                      ? "border-[#476899] bg-[#091529] text-white"
                                      : "border-[#9ca3af] bg-white text-[#111827]"
                                  }`}
                                >
                                  {item.number}
                                </span>
                                <span className="font-medium">{item.label}</span>
                              </td>
                              {sec.options.map((opt) => {
                                const active = val === opt.key;
                                return (
                                  <td
                                    key={opt.key}
                                    className={`border-l p-0 text-center ${
                                      isDark
                                        ? "border-[#1e3a63]"
                                        : "border-[#e5e7eb]"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      data-testid={`exam-l-q-${item.number}-${opt.key}`}
                                      onClick={() =>
                                        onChangeAnswer(item.number, opt.key)
                                      }
                                      aria-label={`Q${item.number} ${opt.key}`}
                                      className={`flex h-10 w-full cursor-pointer items-center justify-center transition ${
                                        active
                                          ? isDark
                                            ? "bg-[#1d4ed8]/40 text-white"
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

            return null;
          })}
        </div>
      </QuestionHighlightArea>

      {/* Official CDI Bottom Navigation Bar (Matches Screenshot 3 & 4!) */}
      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2 ${
          isDark
            ? "border-[#1d3456] bg-[#091529] text-white"
            : "border-[#e5e7eb] bg-white text-[#111827]"
        }`}
      >
        {/* Floating Prev/Next Part Arrows */}
        <div className="absolute -top-11 right-4 flex items-center gap-1.5">
          <button
            type="button"
            disabled={activePartIdx === 0}
            onClick={() => setActivePartIdx((i) => Math.max(0, i - 1))}
            aria-label="Oldingi qism"
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
            disabled={activePartIdx >= parts.length - 1}
            onClick={() =>
              setActivePartIdx((i) => Math.min(parts.length - 1, i + 1))
            }
            aria-label="Keyingi qism"
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
          {parts.map((p, idx) => {
            const isCurrent = idx === activePartIdx;
            const partCount = countInRange(p.questionRange[0], p.questionRange[1]);
            const totalInPart = p.questionRange[1] - p.questionRange[0] + 1;

            return (
              <div key={p.part} className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid={`listening-part-tab-${p.part}`}
                  onClick={() => setActivePartIdx(idx)}
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
                  Part {p.part}
                </button>
                {isCurrent ? (
                  <div className="flex items-center gap-1">
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
          data-testid="submit-listening-btn"
          onClick={() => setConfirmSubmitOpen(true)}
          className={`cursor-pointer rounded-md px-5 py-2 text-xs font-bold transition ${
            isDark
              ? "bg-white text-[#091529] hover:bg-slate-200"
              : "bg-[#111827] text-white hover:bg-[#1f2937]"
          }`}
        >
          Submit Listening
        </button>
      </div>

      {/* Confirm Submit Modal */}
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
                Listening bo&apos;limini yakunlash
              </h3>
            </div>
            <p
              className={`mt-2.5 text-sm leading-relaxed ${
                isDark ? "text-[#cbd5e1]" : "text-[#4b5563]"
              }`}
            >
              Siz 40 ta savoldan <strong>{answeredCount}</strong> tasiga javob
              belgiladingiz. Tasdiqlasangiz audio darhol to&apos;xtaydi va
              Reading (60:00) bo&apos;limiga o&apos;tiladi.
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
                data-testid="confirm-submit-listening-btn"
                onClick={handleConfirmFinish}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold ${
                  isDark
                    ? "bg-white text-[#091529] hover:bg-slate-200"
                    : "bg-[#111827] text-white hover:bg-[#1f2937]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ha, Readingga o&apos;tish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
