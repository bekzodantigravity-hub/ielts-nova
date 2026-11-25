"use client";

import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";
import { countWords } from "@/lib/exam-grading";
import type {
  ExamWritingMode,
  WritingTask1Config,
  WritingTask2Config,
} from "@/lib/exam-types";
import type { ExamTheme } from "./question-highlight-area";
import { Task1Chart } from "./task1-chart";

interface WritingStageProps {
  theme: ExamTheme;
  writingMode: ExamWritingMode;
  task1: WritingTask1Config;
  task2?: WritingTask2Config | null;
  task1Text: string;
  task2Text: string;
  onChangeTask1: (val: string) => void;
  onChangeTask2: (val: string) => void;
  submitting: boolean;
  onSubmitExam: () => void;
}

export function WritingStage({
  theme,
  writingMode,
  task1,
  task2,
  task1Text,
  task2Text,
  onChangeTask1,
  onChangeTask2,
  submitting,
  onSubmitExam,
}: WritingStageProps) {
  const isDark = theme === "dark";
  const [activeTask, setActiveTask] = useState<1 | 2>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasTask2 = writingMode === "task1_and_task2" && Boolean(task2);
  const wordCount1 = countWords(task1Text);
  const wordCount2 = countWords(task2Text);
  const activeWordCount = activeTask === 1 ? wordCount1 : wordCount2;
  const activeMinWords =
    activeTask === 1 ? task1.minWords : task2?.minWords ?? 250;

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${
        isDark ? "bg-[#0b192f] text-[#f1f5f9]" : "bg-white text-[#111827]"
      }`}
    >
      {/* Official CDI Sub-Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-6 py-2.5 ${
          isDark
            ? "border-[#1e3a63] bg-[#102340] text-[#f1f5f9]"
            : "border-[#e5e7eb] bg-[#f3f4f6] text-[#111827]"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTask(1)}
            className={`cursor-pointer rounded px-3 py-1 text-xs font-bold ${
              activeTask === 1
                ? isDark
                  ? "bg-[#1e3a63] text-white"
                  : "bg-[#111827] text-white"
                : isDark
                  ? "text-[#94a3b8] hover:text-white"
                  : "text-[#4b5563] hover:text-[#111827]"
            }`}
          >
            Writing Task 1 ({wordCount1} so&apos;z)
          </button>
          {hasTask2 && (
            <button
              type="button"
              onClick={() => setActiveTask(2)}
              className={`cursor-pointer rounded px-3 py-1 text-xs font-bold ${
                activeTask === 2
                  ? isDark
                    ? "bg-[#1e3a63] text-white"
                    : "bg-[#111827] text-white"
                  : isDark
                    ? "text-[#94a3b8] hover:text-white"
                    : "text-[#4b5563] hover:text-[#111827]"
              }`}
            >
              Writing Task 2 ({wordCount2} so&apos;z)
            </button>
          )}
        </div>

        <span className="font-mono text-xs">
          So&apos;zlar soni:{" "}
          <strong data-testid="writing-word-count">{activeWordCount}</strong> /{" "}
          {activeMinWords}+
        </span>
      </div>

      {/* Split Screen: Left Prompt + HD Chart, Right Editor */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div
          className={`overflow-y-auto border-b p-6 lg:border-r lg:border-b-0 ${
            isDark
              ? "border-[#1e3a63] bg-[#0b192f]"
              : "border-[#e5e7eb] bg-white"
          }`}
        >
          {activeTask === 1 ? (
            <div className="mx-auto max-w-2xl space-y-5">
              <div
                className={`rounded border p-5 ${
                  isDark
                    ? "border-[#284773] bg-[#0e203b]"
                    : "border-[#d1d5db] bg-[#f9fafb]"
                }`}
              >
                <div
                  className={`mb-3 flex items-center justify-between border-b pb-2.5 ${
                    isDark ? "border-[#1e3a63]" : "border-[#e5e7eb]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase">
                    <FileText className="h-4 w-4 opacity-70" />
                    {task1.title}
                  </span>
                  <span className="font-mono text-[11px] opacity-75">
                    20 minutes · min {task1.minWords} words
                  </span>
                </div>
                <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
                  {task1.prompt}
                </div>
              </div>

              <Task1Chart config={task1} />
            </div>
          ) : (
            task2 && (
              <div className="mx-auto max-w-2xl">
                <div
                  className={`rounded border p-5 ${
                    isDark
                      ? "border-[#284773] bg-[#0e203b]"
                      : "border-[#d1d5db] bg-[#f9fafb]"
                  }`}
                >
                  <div
                    className={`mb-3 flex items-center justify-between border-b pb-2.5 ${
                      isDark ? "border-[#1e3a63]" : "border-[#e5e7eb]"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold tracking-widest uppercase">
                      {task2.title}
                    </span>
                    <span className="font-mono text-[11px] opacity-75">
                      40 minutes · min {task2.minWords} words
                    </span>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line">
                    {task2.prompt}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div
          className={`flex min-h-[340px] flex-col p-6 ${
            isDark ? "bg-[#091529]" : "bg-[#f9fafb]"
          }`}
        >
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-mono font-bold tracking-wider uppercase opacity-75">
              {activeTask === 1 ? "Task 1 Response" : "Task 2 Response"}
            </span>
            <span className="font-mono opacity-80">
              Word Count: <strong>{activeWordCount}</strong>
            </span>
          </div>

          <textarea
            data-testid={
              activeTask === 1
                ? "writing-task1-textarea"
                : "writing-task2-textarea"
            }
            value={activeTask === 1 ? task1Text : task2Text}
            onChange={(e) =>
              activeTask === 1
                ? onChangeTask1(e.target.value)
                : onChangeTask2(e.target.value)
            }
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            spellCheck={false}
            autoComplete="off"
            placeholder="Write your response here..."
            className={`min-h-0 flex-1 resize-none rounded border p-5 font-sans text-[15px] leading-7 focus:outline-none ${
              isDark
                ? "border-[#2c4a75] bg-[#060f1e] text-white placeholder:text-[#475569] focus:border-[#60a5fa]"
                : "border-[#9ca3af] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb]"
            }`}
          />

          <div className="mt-2.5 flex items-center justify-between text-[11px] opacity-70">
            <span>Copy / Paste bloklangan · Avtomatik saqlanmoqda</span>
            <span>Insho domla tomonidan qo&apos;lda tekshiriladi</span>
          </div>
        </div>
      </div>

      {/* Bottom Official CDI Bar */}
      <div
        className={`flex items-center justify-between border-t px-5 py-2.5 ${
          isDark
            ? "border-[#1d3456] bg-[#091529]"
            : "border-[#e5e7eb] bg-white"
        }`}
      >
        <span className="font-mono text-xs opacity-75">
          Writing Task 1 · {wordCount1} words
        </span>
        <button
          type="button"
          data-testid="submit-exam-btn"
          disabled={submitting}
          onClick={() => setConfirmOpen(true)}
          className={`cursor-pointer rounded-md px-5 py-2 text-xs font-bold transition disabled:opacity-50 ${
            isDark
              ? "bg-white text-[#091529] hover:bg-slate-200"
              : "bg-[#111827] text-white hover:bg-[#1f2937]"
          }`}
        >
          {submitting ? "Yuborilmoqda..." : "Submit Exam"}
        </button>
      </div>

      {/* Confirm Submit Exam Modal */}
      {confirmOpen && (
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
                Imtihonni yakunlash va yuborish
              </h3>
            </div>
            <p
              className={`mt-2.5 text-sm leading-relaxed ${
                isDark ? "text-[#cbd5e1]" : "text-[#4b5563]"
              }`}
            >
              Writing Task 1 so&apos;zlar soni: <strong>{wordCount1}</strong>.
              Tasdiqlasangiz Listening, Reading va Writing javoblaringiz rasmiy
              ravishda o&apos;quv markaz bazasiga yuboriladi.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className={`cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold ${
                  isDark
                    ? "border-[#2c4a75] text-[#cbd5e1] hover:bg-[#152d52]"
                    : "border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]"
                }`}
              >
                Davom etish
              </button>
              <button
                type="button"
                data-testid="confirm-submit-exam-btn"
                disabled={submitting}
                onClick={() => {
                  setConfirmOpen(false);
                  onSubmitExam();
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-bold disabled:opacity-50 ${
                  isDark
                    ? "bg-white text-[#091529] hover:bg-slate-200"
                    : "bg-[#111827] text-white hover:bg-[#1f2937]"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ha, Imtihonni Yuborish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
