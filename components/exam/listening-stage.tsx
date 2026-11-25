"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Headphones,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListeningPartData } from "@/lib/exam-types";

interface ListeningStageProps {
  parts: ListeningPartData[];
  answers: Record<string, string>;
  onChangeAnswer: (qNum: number, value: string) => void;
  audioPartIndex: number;
  audioCurrentTime: number;
  audioStarted: boolean;
  transferSecondsLeft: number | null;
  onAudioProgress: (partIndex: number, currentTime: number, started: boolean) => void;
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
  parts,
  answers,
  onChangeAnswer,
  audioPartIndex,
  audioCurrentTime,
  audioStarted,
  transferSecondsLeft,
  onAudioProgress,
  onStartTransferTimer,
  onFinishListening,
}: ListeningStageProps) {
  const [activePartIdx, setActivePartIdx] = useState(
    Math.min(Math.max(0, audioPartIndex), parts.length - 1)
  );
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [needsManualResume, setNeedsManualResume] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [displayTime, setDisplayTime] = useState(audioCurrentTime);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentPartIdxRef = useRef(audioPartIndex);
  const expectedTimeRef = useRef(audioCurrentTime);
  const audioStartedRef = useRef(audioStarted);

  useEffect(() => {
    currentPartIdxRef.current = audioPartIndex;
  }, [audioPartIndex]);

  useEffect(() => {
    audioStartedRef.current = audioStarted;
  }, [audioStarted]);

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

  // Ensure audio stops if component unmounts
  useEffect(() => {
    return () => {
      stopAudioImmediately();
    };
  }, [stopAudioImmediately]);

  // Apply volume cleanly
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // If page refreshed mid-audio (audioStarted === true), prepare resume at exact timestamp
  useEffect(() => {
    if (audioStarted && !isPlaying && transferSecondsLeft === null) {
      setNeedsManualResume(true);
    }
  }, [audioStarted, isPlaying, transferSecondsLeft]);

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
          if (startSec > 0.5 && Number.isFinite(el.duration) && startSec < el.duration) {
            el.currentTime = startSec;
          } else if (startSec > 0.5) {
            el.currentTime = startSec;
          }
        } catch {}

        try {
          await el.play();
          setIsPlaying(true);
          setNeedsManualResume(false);
          onAudioProgress(partIdx, startSec, true);
        } catch {
          setIsPlaying(false);
          setNeedsManualResume(true);
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

  const handleStartOrResumeAudio = () => {
    if (transferSecondsLeft !== null) return;
    void playPartAt(audioPartIndex, audioCurrentTime);
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el || !audioStartedRef.current) return;
    const t = el.currentTime;
    // Anti-seek protection: disallow seeking backwards or jumping ahead manually
    if (Math.abs(t - expectedTimeRef.current) > 2.5 && isPlaying) {
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
    // Block pausing while audio is actively running (unless ended or submitted)
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

  const answeredCount = Array.from({ length: 40 }, (_, i) => i + 1).filter(
    (n) => Boolean((answers[String(n)] || "").trim())
  ).length;

  // Helper for Choose TWO Letters (e.g. Q25 & Q26)
  const toggleMultiTwo = (qPair: [number, number], letter: string) => {
    const [q1, q2] = qPair;
    const v1 = (answers[String(q1)] || "").toUpperCase();
    const v2 = (answers[String(q2)] || "").toUpperCase();
    const selected = [v1, v2].filter(Boolean);

    if (selected.includes(letter)) {
      const next = selected.filter((l) => l !== letter);
      onChangeAnswer(q1, next[0] || "");
      onChangeAnswer(q2, next[1] || "");
    } else {
      const next = [...selected, letter].slice(-2);
      onChangeAnswer(q1, next[0] || "");
      onChangeAnswer(q2, next[1] || "");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#09090b] text-zinc-100">
      {/* Hidden Primary Audio Element (NO autoplay, preload=auto) */}
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
      {/* Preload next audio part seamlessly */}
      {nextPreloadPart && (
        <audio src={nextPreloadPart.audioUrl} preload="auto" className="hidden" />
      )}

      {/* Listening Audio Control Strip (No seek/pause — Volume only!) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-[#111113] px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200">
            <Headphones className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wide text-white uppercase">
                Listening — Part {audioPartIndex + 1} / {parts.length}
              </span>
              {isPlaying && (
                <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE AUDIO
                </span>
              )}
              {transferSecondsLeft !== null && (
                <span className="rounded border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-200">
                  Tekshirish vaqti: {formatMMSS(transferSecondsLeft)}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-zinc-400">
              {!audioStarted
                ? "Audio boshlanmagan — tayyor bo'lganda 'Start Listening' tugmasini bosing"
                : transferSecondsLeft !== null
                  ? "Barcha 4 ta audio qism tugadi. Javoblaringizni tekshiring."
                  : `${parts[audioPartIndex]?.subtitle || ""} · ${formatMMSS(displayTime)} / ${formatMMSS(audioDuration)} (Pauza va orqaga qaytarish bloklangan)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Start / Resume Audio Button (shown ONLY before start or after F5 reload) */}
          {(!audioStarted || needsManualResume) && transferSecondsLeft === null && (
            <button
              type="button"
              data-testid="start-listening-audio-btn"
              onClick={handleStartOrResumeAudio}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>
                {audioStarted ? "Audioni davom ettirish" : "Start Listening"}
              </span>
            </button>
          )}

          {/* Volume Control ONLY */}
          <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-[#18181b] px-3 py-1.5">
            <button
              type="button"
              onClick={() => setVolume((v) => (v > 0 ? 0 : 1))}
              aria-label="Ovoz"
              className="cursor-pointer text-zinc-300 hover:text-white"
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
              className="h-1.5 w-24 cursor-pointer accent-white"
            />
            <span className="w-8 text-right font-mono text-[11px] text-zinc-400">
              {Math.round(volume * 100)}%
            </span>
          </div>

          <button
            type="button"
            data-testid="submit-listening-btn"
            onClick={() => setConfirmSubmitOpen(true)}
            className="cursor-pointer rounded-md border border-zinc-600 bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-white hover:bg-zinc-800"
          >
            Submit Listening
          </button>
        </div>
      </div>

      {/* Part Switcher Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#0d0d10] px-5 py-2">
        <div className="flex items-center gap-1.5">
          {parts.map((p, idx) => (
            <button
              key={p.part}
              type="button"
              data-testid={`listening-part-tab-${p.part}`}
              onClick={() => setActivePartIdx(idx)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                activePartIdx === idx
                  ? "border border-zinc-600 bg-zinc-800 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              Part {p.part}{" "}
              <span className="ml-1 font-mono text-[10px] text-zinc-500">
                ({p.questionRange[0]}–{p.questionRange[1]})
              </span>
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-zinc-400">
          Javob berilgan: <strong className="text-white">{answeredCount}</strong> / 40
        </span>
      </div>

      {/* Main Listening Questions Canvas */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-4xl space-y-6 pb-8">
          <div className="border-b border-zinc-800 pb-3">
            <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
              {currentPart.title} · Questions {currentPart.questionRange[0]}–
              {currentPart.questionRange[1]}
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              {currentPart.subtitle}
            </h2>
          </div>

          {currentPart.sections.map((sec, sIdx) => {
            if (sec.kind === "note_box") {
              return (
                <div
                  key={sIdx}
                  className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                >
                  <p className="text-xs font-semibold text-zinc-400">
                    Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                  <div className="mt-4 rounded-lg border border-zinc-700/80 bg-[#18181b] p-5">
                    <h3 className="mb-4 text-center text-base font-bold text-white">
                      {sec.boxTitle}
                    </h3>
                    <div className="space-y-4">
                      {sec.groups.map((grp, gIdx) => (
                        <div key={gIdx} className="space-y-2.5">
                          {grp.heading && (
                            <h4 className="text-sm font-bold text-white">
                              {grp.heading}
                            </h4>
                          )}
                          {grp.lines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className="flex flex-wrap items-center gap-2 text-sm leading-7 text-zinc-200"
                            >
                              {line.bullet && (
                                <span className="mr-1 text-zinc-500">•</span>
                              )}
                              {line.label && (
                                <span className="w-44 shrink-0 font-medium text-zinc-400">
                                  {line.label}
                                </span>
                              )}
                              {line.prefix && <span>{line.prefix}</span>}
                              {line.questionNumber !== undefined && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
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
                                    placeholder={`Q${line.questionNumber}`}
                                    className="w-44 rounded border border-zinc-700 bg-[#09090b] px-2.5 py-1 text-sm font-medium text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
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
                <div
                  key={sIdx}
                  className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                >
                  <p className="text-xs font-semibold text-zinc-400">
                    Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>

                  <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-[#18181b] text-xs font-bold tracking-wider text-zinc-300 uppercase">
                          {sec.headers.map((h, i) => (
                            <th key={i} className="px-4 py-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 bg-[#0f0f12]">
                        {sec.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="px-4 py-3 font-medium text-zinc-300">
                              {row.category}
                            </td>
                            <td className="px-4 py-3 text-zinc-200">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.recommendation.prefix && (
                                  <span>{row.recommendation.prefix}</span>
                                )}
                                {row.recommendation.questionNumber !== undefined && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
                                      {row.recommendation.questionNumber}
                                    </span>
                                    <input
                                      type="text"
                                      data-testid={`exam-l-q-${row.recommendation.questionNumber}`}
                                      autoComplete="off"
                                      spellCheck={false}
                                      value={
                                        answers[
                                          String(row.recommendation.questionNumber)
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        onChangeAnswer(
                                          row.recommendation.questionNumber!,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Q${row.recommendation.questionNumber}`}
                                      className="w-36 rounded border border-zinc-700 bg-[#09090b] px-2.5 py-1 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
                                    />
                                  </span>
                                )}
                                {row.recommendation.suffix && (
                                  <span>{row.recommendation.suffix}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-200">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {row.preference.prefix && (
                                  <span>{row.preference.prefix}</span>
                                )}
                                {row.preference.questionNumber !== undefined && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-[11px] font-bold text-white">
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
                                      placeholder={`Q${row.preference.questionNumber}`}
                                      className="w-36 rounded border border-zinc-700 bg-[#09090b] px-2.5 py-1 text-sm text-white placeholder:text-zinc-600 focus:border-white focus:outline-none"
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
                <div
                  key={sIdx}
                  className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                >
                  <p className="text-xs font-semibold text-zinc-400">
                    Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>
                  <div className="mt-4 space-y-4">
                    {sec.items.map((item) => {
                      const val = (answers[String(item.number)] || "").toUpperCase();
                      return (
                        <div
                          key={item.number}
                          className="rounded-lg border border-zinc-800 bg-[#18181b] p-4"
                        >
                          <p className="text-sm font-semibold text-white">
                            <span className="mr-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-xs text-zinc-200">
                              {item.number}
                            </span>
                            {item.prompt}
                          </p>
                          <div className="mt-3 space-y-2">
                            {item.options.map((opt) => {
                              const active = val === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  data-testid={`exam-l-q-${item.number}-${opt.key}`}
                                  onClick={() =>
                                    onChangeAnswer(item.number, opt.key)
                                  }
                                  className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition ${
                                    active
                                      ? "border-white bg-zinc-800 font-semibold text-white"
                                      : "border-zinc-800 bg-[#111113] text-zinc-300 hover:border-zinc-600"
                                  }`}
                                >
                                  <span
                                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                                      active
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
                  <p className="text-xs font-semibold text-zinc-400">
                    Questions {q1} and {q2}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">{sec.instruction}</p>
                  <p className="mt-3 text-sm font-semibold text-white">
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
                          data-testid={`exam-l-q-${q1}-${q2}-${opt.key}`}
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

            if (sec.kind === "matching") {
              return (
                <div
                  key={sIdx}
                  className="rounded-lg border border-zinc-800 bg-[#111113] p-5"
                >
                  <p className="text-xs font-semibold text-zinc-400">
                    Questions {sec.questionRange[0]}–{sec.questionRange[1]}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {sec.prompt}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{sec.instruction}</p>

                  <div className="mt-4 rounded-lg border border-zinc-700 bg-[#18181b] p-4">
                    <p className="mb-2.5 text-xs font-bold tracking-wider text-zinc-300 uppercase">
                      {sec.boxTitle}
                    </p>
                    <div className="space-y-1.5 text-sm text-zinc-200">
                      {sec.options.map((opt) => (
                        <div key={opt.key} className="flex gap-2.5">
                          <span className="w-5 shrink-0 font-mono font-bold text-white">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {sec.items.map((item) => {
                      const val = (answers[String(item.number)] || "").toUpperCase();
                      return (
                        <div
                          key={item.number}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#18181b] px-4 py-3"
                        >
                          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded bg-zinc-800 px-1.5 font-mono text-xs text-zinc-200">
                              {item.number}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {sec.options.map((opt) => (
                              <button
                                key={opt.key}
                                type="button"
                                data-testid={`exam-l-q-${item.number}-${opt.key}`}
                                onClick={() =>
                                  onChangeAnswer(item.number, opt.key)
                                }
                                className={`h-8 w-8 cursor-pointer rounded border font-mono text-xs font-bold transition ${
                                  val === opt.key
                                    ? "border-white bg-white text-zinc-950"
                                    : "border-zinc-700 bg-[#09090b] text-zinc-300 hover:border-zinc-500"
                                }`}
                              >
                                {opt.key}
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

            return null;
          })}
        </div>
      </div>

      {/* Bottom 1–40 Question Palette */}
      <div className="border-t border-zinc-800 bg-[#111113] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((qNum) => {
              const partIdx = Math.floor((qNum - 1) / 10);
              const isAnswered = Boolean((answers[String(qNum)] || "").trim());
              const inCurrentPart = partIdx === activePartIdx;
              return (
                <button
                  key={qNum}
                  type="button"
                  onClick={() => setActivePartIdx(partIdx)}
                  className={`h-6 w-6 cursor-pointer rounded font-mono text-[10px] font-bold transition ${
                    isAnswered
                      ? "bg-white text-zinc-950"
                      : inCurrentPart
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
      </div>

      {/* Confirm Submit Listening Modal */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#141417] p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="h-5 w-5 text-zinc-300" />
              <h3 className="text-base font-bold">
                Listening bo&apos;limini yakunlash
              </h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
              Siz 40 ta savoldan{" "}
              <strong className="text-white">{answeredCount}</strong> tasiga
              javob belgiladingiz. Tasdiqlasangiz audio darhol to&apos;xtaydi va
              Reading (60:00) bo&apos;limiga o&apos;tiladi. Ortga qaytib bo&apos;lmaydi.
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
                data-testid="confirm-submit-listening-btn"
                onClick={handleConfirmFinish}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
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
