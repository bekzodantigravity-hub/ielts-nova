"use client";

import { AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";
import { countWords } from "@/lib/exam-grading";
import type {
  ExamWritingMode,
  WritingTask1Config,
  WritingTask2Config,
} from "@/lib/exam-types";
import { Task1Chart } from "./task1-chart";

interface WritingStageProps {
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
  const [activeTask, setActiveTask] = useState<1 | 2>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasTask2 = writingMode === "task1_and_task2" && Boolean(task2);
  const wordCount1 = countWords(task1Text);
  const wordCount2 = countWords(task2Text);
  const activeWordCount = activeTask === 1 ? wordCount1 : wordCount2;
  const activeMinWords = activeTask === 1 ? task1.minWords : task2?.minWords ?? 250;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#09090b] text-zinc-100">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-[#111113] px-5 py-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTask(1)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold transition ${
              activeTask === 1
                ? "border border-zinc-600 bg-zinc-800 text-white"
                : "border border-transparent text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            Writing Task 1 ({wordCount1} so&apos;z)
          </button>
          {hasTask2 && (
            <button
              type="button"
              onClick={() => setActiveTask(2)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-bold transition ${
                activeTask === 2
                  ? "border border-zinc-600 bg-zinc-800 text-white"
                  : "border border-transparent text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Writing Task 2 ({wordCount2} so&apos;z)
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-400">
            So&apos;zlar soni:{" "}
            <strong
              data-testid="writing-word-count"
              className={
                activeWordCount >= activeMinWords ? "text-white" : "text-zinc-300"
              }
            >
              {activeWordCount}
            </strong>{" "}
            / {activeMinWords}+
          </span>
          <button
            type="button"
            data-testid="submit-exam-btn"
            disabled={submitting}
            onClick={() => setConfirmOpen(true)}
            className="cursor-pointer rounded-md bg-white px-4 py-1.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {submitting ? "Yuborilmoqda..." : "Submit Exam"}
          </button>
        </div>
      </div>

      {/* Split Screen: Left Prompt + HD Chart, Right Writing Editor */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Left Pane */}
        <div className="overflow-y-auto border-b border-zinc-800 bg-[#0e0e11] p-6 lg:border-r lg:border-b-0">
          {activeTask === 1 ? (
            <div className="mx-auto max-w-2xl space-y-5">
              <div className="rounded-lg border border-zinc-700 bg-[#141417] p-5">
                <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <span className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-white uppercase">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    {task1.title}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    20 minutes · min {task1.minWords} words
                  </span>
                </div>
                <div className="space-y-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-line">
                  {task1.prompt}
                </div>
              </div>

              <Task1Chart config={task1} />
            </div>
          ) : (
            task2 && (
              <div className="mx-auto max-w-2xl">
                <div className="rounded-lg border border-zinc-700 bg-[#141417] p-5">
                  <div className="mb-3 flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                      {task2.title}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      40 minutes · min {task2.minWords} words
                    </span>
                  </div>
                  <div className="space-y-3 text-sm leading-relaxed text-zinc-200 whitespace-pre-line">
                    {task2.prompt}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Pane: Official CDI Text Editor */}
        <div className="flex min-h-[340px] flex-col bg-[#09090b] p-6">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold tracking-wider text-zinc-400 uppercase">
              {activeTask === 1 ? "Task 1 Response" : "Task 2 Response"}
            </span>
            <span className="font-mono text-xs text-zinc-500">
              Word Count: <strong className="text-zinc-200">{activeWordCount}</strong>
            </span>
          </div>

          <textarea
            data-testid={
              activeTask === 1 ? "writing-task1-textarea" : "writing-task2-textarea"
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
            className="min-h-0 flex-1 resize-none rounded-lg border border-zinc-700 bg-[#111113] p-5 font-sans text-[15px] leading-7 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
          />

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Copy / Paste bloklangan · Avtomatik saqlanmoqda</span>
            <span>
              Insho domla tomonidan qo&apos;lda tekshirilib baholanadi
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Submit Exam Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-[#141417] p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-white">
              <AlertTriangle className="h-5 w-5 text-zinc-300" />
              <h3 className="text-base font-bold">
                Imtihonni yakunlash va yuborish
              </h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">
              Writing Task 1 so&apos;zlar soni:{" "}
              <strong className="text-white">{wordCount1}</strong>.
              Tasdiqlasangiz Listening, Reading va Writing javoblaringiz rasmiy
              ravishda o&apos;quv markaz bazasiga yuboriladi.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
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
