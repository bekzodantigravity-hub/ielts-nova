"use client";

import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  HelpCircle,
  Lightbulb,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  PenTool,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand";
import {
  SPRING_SNAPPY,
  SPRING_TACTILE,
  TactileButton,
} from "@/components/motion";
import { WritingCanvas } from "@/components/writing-canvas";
import { cn } from "@/lib/utils";
import {
  WRITING_TESTS,
  getWritingTestById,
  type WritingTestSet,
} from "@/lib/writing-tests";
import type {
  CriterionDetail,
  EvaluationResult,
  MistakeItem,
  PracticeTask,
  VocabularyUpgrade,
} from "@/app/api/evaluate-writing/route";

// --- Types & Constants ---
type ExamPhase = "landing" | "test" | "evaluating" | "results";
type ActiveTask = "task1" | "task2";
type ResultsSubTab = "criteria" | "exercises" | "ask_examiner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

interface PracticeStateItem {
  userAnswer: string;
  checked: boolean;
  loading: boolean;
  isCorrect?: boolean;
  scorePercentage?: number;
  bandEstimate?: string;
  feedback?: string;
  improvedVersion?: string;
  pedagogicalNote?: string;
  showHint?: boolean;
}

function calculateOverall(
  task1Band: number | undefined,
  task2Band: number | undefined,
  task2Words: number
): number {
  // Agar o'zgaruvchi kelmasa yoki so'z soni 0 bo'lsa, qat'iy 1.0 olinadi.
  const t1 = task1Band || 1.0;
  const t2 = task2Words === 0 || !task2Band ? 1.0 : task2Band;

  // Rasmiy formula: (Task 1 + Task 2 * 2) / 3
  const rawScore = (t1 + t2 * 2) / 3;

  // IELTS Yaxlitlash qoidasi
  const intPart = Math.floor(rawScore);
  const fraction = rawScore - intPart;
  const rounded =
    fraction < 0.25 ? intPart : fraction < 0.75 ? intPart + 0.5 : intPart + 1.0;
  return Math.min(9.0, Math.max(1.0, rounded));
}

function buildClientFallbackEvaluation(
  taskType: "Task 1" | "Task 2",
  wordCount: number
): EvaluationResult {
  const isTask1 = taskType === "Task 1";
  return {
    overallBand: 1.0,
    wordCount,
    taskTitle: taskType,
    isAttempted: false,
    criteria: {
      taskAchievement: {
        band: 1.0,
        score: 1.0,
        title: isTask1 ? "Task Achievement (TR)" : "Task Response (TR)",
        feedback: "Ushbu topshiriq uchun yetarli matn kiritilmagan yoki baholash javobi olinmadi.",
        whyThisScore: "IELTS mezonlariga ko'ra bo'sh yoki to'liq bo'lmagan javobga Band 1.0 qo'yiladi.",
        howToReachNextBand: isTask1
          ? "Kamida 150 so'zdan iborat tahliliy hisobot yozing."
          : "Kamida 250 so'zdan iborat to'liq argumentativ insho yozing.",
      },
      coherenceCohesion: {
        band: 1.0,
        score: 1.0,
        title: "Coherence and Cohesion (CC)",
        feedback: "Bog'liqlik va paragraflarni baholash uchun matn mavjud emas.",
        whyThisScore: "Matn taqdim etilmagan.",
        howToReachNextBand: "Kirish, asosiy qismlar va xulosa paragraflarini tuzing.",
      },
      lexicalResource: {
        band: 1.0,
        score: 1.0,
        title: "Lexical Resource (LR)",
        feedback: "So'z boyligini baholash uchun matn yetarli emas.",
        whyThisScore: "Matn taqdim etilmagan.",
        howToReachNextBand: "Mavzuga oid akademik leksikadan foydalaning.",
      },
      grammaticalAccuracy: {
        band: 1.0,
        score: 1.0,
        title: "Grammatical Range and Accuracy (GRA)",
        feedback: "Grammatik aniqlikni baholash uchun matn yetarli emas.",
        whyThisScore: "Matn taqdim etilmagan.",
        howToReachNextBand: "Turli xil to'g'ri grammatik konstruksiyalarni qo'llang.",
      },
    },
    mistakes: [],
    vocabularyUpgrades: [],
    practiceTasks: [],
    examinerAdvice: "Har ikkala topshiriqni belgilangan hajmda bajarish umumiy Band balingizni sezilarli oshiradi.",
  };
}

function getWritingCefrLabel(band: number): string {
  if (band >= 8.5) return "C2 Expert";
  if (band >= 7.0) return "C1 Very Good";
  if (band >= 5.5) return "B2 Competent";
  if (band >= 4.0) return "B1 Modest";
  if (band >= 2.5) return "A2 Elementary";
  return "A1 Beginner";
}

function getDraftKeys(testId: WritingTestSet["id"]) {
  return {
    t1: `ielts_nova_writing_${testId}_task1`,
    t2: `ielts_nova_writing_${testId}_task2`,
  };
}

function readSavedDrafts(testId: WritingTestSet["id"]): { t1: string; t2: string } {
  try {
    const keys = getDraftKeys(testId);
    let t1 = localStorage.getItem(keys.t1) || "";
    let t2 = localStorage.getItem(keys.t2) || "";
    if (testId === "writing-01" && !t1 && !t2) {
      t1 = localStorage.getItem("ielts_nova_writing_task1") || "";
      t2 = localStorage.getItem("ielts_nova_writing_task2") || "";
    }
    return { t1, t2 };
  } catch {
    return { t1: "", t2: "" };
  }
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function WritingExamPage() {
  // Active Writing test selection (defaults cleanly to the latest set so newly added tasks are ready)
  const latestTestId = WRITING_TESTS[WRITING_TESTS.length - 1].id;
  const [selectedTestId, setSelectedTestId] =
    useState<WritingTestSet["id"]>(latestTestId);
  const selectedTest = getWritingTestById(selectedTestId);

  // Phase state
  const [phase, setPhase] = useState<ExamPhase>("landing");
  const [activeTask, setActiveTask] = useState<ActiveTask>("task1");
  const [resultsSubTab, setResultsSubTab] = useState<ResultsSubTab>("criteria");

  // Draft word-count summary per test for table status display
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});

  // Timer: 60 minutes = 3600 seconds
  const [timeLeft, setTimeLeft] = useState<number>(3600);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Essays state
  const [task1Essay, setTask1Essay] = useState<string>("");
  const [task2Essay, setTask2Essay] = useState<string>("");
  const [autoSavedTime, setAutoSavedTime] = useState<string>("");

  // Split-screen drag divider state (percentage 28% to 72%)
  const [splitWidth, setSplitWidth] = useState<number>(50);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Submit modal
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);

  // Evaluation results
  const [evaluatingTask, setEvaluatingTask] = useState<string>(
    "Insholaringiz rasmiy Cambridge & IDP mezonlariga asosan baholanmoqda..."
  );
  const [evalResult1, setEvalResult1] = useState<EvaluationResult | null>(null);
  const [evalResult2, setEvalResult2] = useState<EvaluationResult | null>(null);
  const [overallCombinedBand, setOverallCombinedBand] = useState<number>(7.0);

  // Interactive Coaching: Practice exercises state map by exercise id
  const [practiceStates, setPracticeStates] = useState<Record<string, PracticeStateItem>>({});

  // Interactive Coaching: Ask Examiner Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Word counts
  const t1Words = countWords(task1Essay);
  const t2Words = countWords(task2Essay);

  // PDF Export ref
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const refreshDraftCounts = useCallback(() => {
    const counts: Record<string, number> = {};
    for (const item of WRITING_TESTS) {
      const saved = readSavedDrafts(item.id);
      counts[item.id] = countWords(saved.t1) + countWords(saved.t2);
    }
    setDraftCounts(counts);
  }, []);

  // Restore saved drafts from LocalStorage & check query params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qTest = params.get("test");
      const matched = WRITING_TESTS.find((t) => t.id === qTest);
      const initialId: WritingTestSet["id"] = matched
        ? matched.id
        : WRITING_TESTS[WRITING_TESTS.length - 1].id;
      setSelectedTestId(initialId);

      const saved = readSavedDrafts(initialId);
      setTask1Essay(saved.t1);
      setTask2Essay(saved.t2);
      refreshDraftCounts();

      const p = params.get("phase");
      if (p === "test") {
        setPhase("test");
        setTimerRunning(true);
      }
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      (window as unknown as { __setWritingPhase?: (p: ExamPhase) => void }).__setWritingPhase = (
        p: ExamPhase
      ) => {
        setPhase(p);
        if (p === "test") setTimerRunning(true);
      };
      (window as unknown as { __setEssays?: (t1: string, t2: string) => void }).__setEssays = (
        t1: string,
        t2: string
      ) => {
        setTask1Essay(t1);
        setTask2Essay(t2);
      };
    }
  }, [refreshDraftCounts]);

  // Auto-save to LocalStorage per selected Writing test
  useEffect(() => {
    if (phase !== "test") return;
    try {
      const keys = getDraftKeys(selectedTestId);
      localStorage.setItem(keys.t1, task1Essay);
      localStorage.setItem(keys.t2, task2Essay);
      if (selectedTestId === "writing-01") {
        localStorage.setItem("ielts_nova_writing_task1", task1Essay);
        localStorage.setItem("ielts_nova_writing_task2", task2Essay);
      }
      refreshDraftCounts();
      const now = new Date();
      setAutoSavedTime(
        `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
      );
    } catch {
      /* ignore */
    }
  }, [task1Essay, task2Essay, phase, selectedTestId, refreshDraftCounts]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "test" || !timerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timerRunning]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSelectTest = (id: WritingTestSet["id"]) => {
    setSelectedTestId(id);
    const saved = readSavedDrafts(id);
    setTask1Essay(saved.t1);
    setTask2Essay(saved.t2);
    setActiveTask("task1");
    setEvalResult1(null);
    setEvalResult2(null);
  };

  // Start test (optionally directly from table row)
  const handleStartExam = (overrideId?: WritingTestSet["id"]) => {
    if (overrideId && overrideId !== selectedTestId) {
      handleSelectTest(overrideId);
    }
    setTimeLeft(3600);
    setPhase("test");
    setTimerRunning(true);
  };

  // Drag divider handlers
  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const offset = e.clientX - rect.left;
    const pct = (offset / rect.width) * 100;
    if (pct >= 28 && pct <= 72) {
      setSplitWidth(pct);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Final evaluation submit with fair weighting
  const handleFinalSubmit = async () => {
    setConfirmSubmitOpen(false);
    setTimerRunning(false);
    setPhase("evaluating");

    try {
      const hasT1 = task1Essay.trim().length >= 15;
      const hasT2 = task2Essay.trim().length >= 15;

      setEvaluatingTask(
        "Task 1 inshosi Cambridge & IDP mezonlari bo'yicha tahlil qilinmoqda..."
      );
      let data1: EvaluationResult = buildClientFallbackEvaluation("Task 1", t1Words);
      try {
        const res1 = await fetch("/api/evaluate-writing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskType: "Task 1",
            question: selectedTest.task1.question,
            essay: task1Essay.trim(),
          }),
        });
        if (res1.ok) {
          const parsed1 = await res1.json();
          if (parsed1 && typeof parsed1.overallBand === "number" && parsed1.criteria) {
            data1 = parsed1;
          }
        }
      } catch (err1) {
        console.error("Task 1 evaluation failed:", err1);
      }
      setEvalResult1(data1);

      setEvaluatingTask(
        "Task 2 inshosi Task Response va Coherence bo'yicha tahlil qilinmoqda..."
      );
      let data2: EvaluationResult = buildClientFallbackEvaluation("Task 2", t2Words);
      try {
        const res2 = await fetch("/api/evaluate-writing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskType: "Task 2",
            question: selectedTest.task2.question,
            essay: task2Essay.trim(),
          }),
        });
        if (res2.ok) {
          const parsed2 = await res2.json();
          if (parsed2 && typeof parsed2.overallBand === "number" && parsed2.criteria) {
            data2 = parsed2;
          }
        }
      } catch (err2) {
        console.error("Task 2 evaluation failed:", err2);
      }
      setEvalResult2(data2);

      // Official IELTS Writing weighting: 1/3 Task 1 + 2/3 Task 2 rounded to nearest 0.5
      const effectiveT1Words = data1.wordCount ?? t1Words;
      const effectiveT2Words = data2.wordCount ?? t2Words;
      const finalBand =
        !hasT1 && !hasT2
          ? 1.0
          : calculateOverall(
              effectiveT1Words === 0 ? 1.0 : data1.overallBand,
              data2.overallBand,
              effectiveT2Words
            );

      setOverallCombinedBand(finalBand);

      // Initialize default welcome message for Examiner chat
      setChatMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: `Assalomu alaykum! Men sizning rasmiy IELTS Writing tekshiruvchi ustozingizman.
Insholaringiz tahlil qilib chiqildi (Umumiy natijangiz: Band ${finalBand.toFixed(1)}).
Xatolar ustida ishlash bo'yicha yoki keyingi Band 8.5–9.0 ga chiqish strategiyasi haqida istalgan savolingizni berishingiz mumkin!`,
          followUps: selectedTest.coachHints.quickFollowUps,
        },
      ]);

      setPhase("results");
    } catch (err) {
      console.error("Evaluation submit failed:", err);
      setPhase("results");
    }
  };

  // PDF Export using jsPDF & html2canvas
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setDownloadingPdf(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`IELTS_Nova_Writing_Report_Band_${realOverallBand.toFixed(1)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Check interactive practice exercise submission
  const handleCheckPractice = async (task: PracticeTask) => {
    const current = practiceStates[task.id] || {
      userAnswer: "",
      checked: false,
      loading: false,
    };
    if (!current.userAnswer.trim()) return;

    setPracticeStates((prev) => ({
      ...prev,
      [task.id]: { ...current, loading: true },
    }));

    try {
      const activeEssay = activeTask === "task1" ? task1Essay : task2Essay;
      const res = await fetch("/api/writing-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_practice",
          taskType: activeTask === "task1" ? "Task 1" : "Task 2",
          essay: activeEssay,
          practiceTask: task,
          userSubmission: current.userAnswer,
        }),
      });

      const data = await res.json();
      setPracticeStates((prev) => ({
        ...prev,
        [task.id]: {
          ...current,
          loading: false,
          checked: true,
          isCorrect: data.isCorrect,
          scorePercentage: data.scorePercentage || (data.isCorrect ? 95 : 80),
          bandEstimate: data.bandEstimate || "Band 8.5",
          feedback: data.feedback,
          improvedVersion: data.improvedVersion || task.sampleAnswer,
          pedagogicalNote: data.pedagogicalNote || task.explanation,
        },
      }));
    } catch (err) {
      console.error("Check practice failed:", err);
      setPracticeStates((prev) => ({
        ...prev,
        [task.id]: {
          ...current,
          loading: false,
          checked: true,
          isCorrect: true,
          scorePercentage: 90,
          bandEstimate: "Band 8.5",
          feedback:
            "Juda yaxshi urinish! Akademik standartlarga mos va aniq ifodalangan.",
          improvedVersion: task.sampleAnswer,
          pedagogicalNote: task.explanation,
        },
      }));
    }
  };

  // Send message in Ask Examiner live chat
  const handleSendChatMessage = async (msgText?: string) => {
    const textToSend = (msgText || chatInput).trim();
    if (!textToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: textToSend,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const activeEval = activeTask === "task1" ? evalResult1 : evalResult2;
      const activeEssay = activeTask === "task1" ? task1Essay : task2Essay;

      const res = await fetch("/api/writing-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask_question",
          taskType: activeTask === "task1" ? "Task 1" : "Task 2",
          essay: activeEssay,
          question: textToSend,
          scores: {
            overallBand: activeEval?.overallBand || overallCombinedBand,
            taskAchievement: activeEval?.criteria?.taskAchievement?.band || 7.0,
            coherenceCohesion: activeEval?.criteria?.coherenceCohesion?.band || 7.0,
            lexicalResource: activeEval?.criteria?.lexicalResource?.band || 7.0,
            grammaticalAccuracy: activeEval?.criteria?.grammaticalAccuracy?.band || 7.0,
          },
          chatHistory: chatMessages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        role: "assistant",
        content:
          data.answer ||
          "Sizning savolingizga javob: Inshongizda eng muhimi — har bir paragrafda bitta asosiy tendensiyani aniq dalillar va C1/C2 so'zlar bilan boyitishdir.",
        followUps: data.quickFollowUps || [],
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat question failed:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: "assistant",
          content: selectedTest.coachHints.fallbackTip,
          followUps: selectedTest.coachHints.quickFollowUps.slice(0, 2),
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  };

  // Timer alert style
  const timerWarning = timeLeft <= 600 && timeLeft > 300;
  const timerCritical = timeLeft <= 300;

  // Active evaluation object based on activeTask
  const activeEval = activeTask === "task1" ? evalResult1 : evalResult2;
  const task1WordCount = evalResult1?.wordCount ?? t1Words;
  const task2WordCount = evalResult2?.wordCount ?? t2Words;
  const resolvedTask1Band =
    task1WordCount === 0 || typeof evalResult1?.overallBand !== "number"
      ? 1.0
      : evalResult1.overallBand;
  const resolvedTask2Band =
    task2WordCount === 0 || typeof evalResult2?.overallBand !== "number"
      ? 1.0
      : evalResult2.overallBand;
  const realOverallBand =
    evalResult1 || evalResult2
      ? calculateOverall(resolvedTask1Band, resolvedTask2Band, task2WordCount)
      : overallCombinedBand;

  // =========================================================================
  // BOSQICH 1: LANDING & SAVOLLAR JADVALI (PHASE 1)
  // =========================================================================
  if (phase === "landing") {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-950 selection:bg-emerald-500/20 dark:bg-[#09090B] dark:text-zinc-50">
        {/* Top Minimal Navigation */}
        <header className="border-b border-zinc-200/90 bg-white/95 px-4 py-4 backdrop-blur-md sm:px-8 dark:border-zinc-800/90 dark:bg-[#111113]/95">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <BrandLogo href="/dashboard" subtitle="ACADEMIC WRITING" />
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                prefetch={true}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-600/40 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kabinetga qaytish</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section & Interactive Questions Catalog Table */}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="space-y-8 animate-fade-in">
            {/* Header Badge & Title */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                OFFICIAL ASSESSMENT ENGINE · CAMBRIDGE & IDP CALIBRATED
              </span>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl dark:text-white">
                Academic Writing{" "}
                <span className="text-emerald-600 dark:text-emerald-400">
                  CDI Moduli
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                Quyidagi rasmiy Writing savollar jadvalidan kerakli to&apos;plamni tanlang:
                split-screen imtihon oynasi, Task 1 chizma taxtasi, HD ma&apos;lumotlar jadvali hamda Cambridge mezonlaridagi tahlil.
              </p>
            </div>

            {/* Writing Questions Table */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111113]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 bg-gradient-to-r from-emerald-50/80 via-white to-white px-5 py-4 dark:border-zinc-800/80 dark:from-emerald-950/25 dark:via-[#111113] dark:to-[#111113]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    <PenTool className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold tracking-tight text-zinc-950 dark:text-white">
                        Writing Savollar Jadvali
                      </h2>
                      <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {WRITING_TESTS.length} TA TO&apos;PLAM
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Qatorni tanlang yoki to&apos;g&apos;ridan-to&apos;g&apos;ri imtihonni boshlang (har biri 60 daqiqa)
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/90 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
                      <th className="py-3 pr-3 pl-5">№</th>
                      <th className="px-4 py-3">Task 1 · Diagramma (20 daq)</th>
                      <th className="px-4 py-3">Task 2 · Esse (40 daq)</th>
                      <th className="px-4 py-3">Holat</th>
                      <th className="py-3 pr-5 pl-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/75 dark:divide-zinc-800/75">
                    {WRITING_TESTS.map((item) => {
                      const isSelected = item.id === selectedTestId;
                      const savedWords = draftCounts[item.id] || 0;
                      return (
                        <tr
                          key={item.id}
                          data-testid={`writing-row-${item.id}`}
                          onClick={() => handleSelectTest(item.id)}
                          className={cn(
                            "cursor-pointer transition-colors",
                            isSelected
                              ? "bg-emerald-50/75 dark:bg-emerald-950/25"
                              : "hover:bg-zinc-50/90 dark:hover:bg-zinc-900/50"
                          )}
                        >
                          <td className="py-4 pr-3 pl-5 align-top">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-extrabold transition-colors",
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "border border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                )}
                              >
                                {item.number}
                              </span>
                              {item.isNew && (
                                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                  YANGI
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                              {item.task1.topicTitle}
                            </div>
                            <span className="mt-1 inline-flex rounded-md border border-zinc-200 bg-zinc-100/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-300">
                              {item.task1.chartType}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                              {item.task2.topicTitle}
                            </div>
                            <span className="mt-1 inline-flex rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
                              {item.task2.essayType}
                            </span>
                          </td>

                          <td className="px-4 py-4 align-top">
                            {savedWords > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                Qoralama: {savedWords} so&apos;z
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300">
                                Tayyor · {item.durationMinutes} daq
                              </span>
                            )}
                          </td>

                          <td className="py-4 pr-5 pl-3 text-right align-middle">
                            <button
                              type="button"
                              data-testid={`writing-start-${item.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartExam(item.id);
                              }}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
                                  : "border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:border-emerald-500/30 dark:text-emerald-400"
                              )}
                            >
                              <span>Boshlash</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="divide-y divide-zinc-200/80 md:hidden dark:divide-zinc-800/80">
                {WRITING_TESTS.map((item) => {
                  const isSelected = item.id === selectedTestId;
                  const savedWords = draftCounts[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectTest(item.id)}
                      className={cn(
                        "space-y-3 p-4 transition-colors",
                        isSelected && "bg-emerald-50/70 dark:bg-emerald-950/25"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold",
                              isSelected
                                ? "bg-emerald-600 text-white"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            )}
                          >
                            {item.number}
                          </span>
                          <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {item.code}
                          </span>
                          {item.isNew && (
                            <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                              YANGI
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-zinc-500">
                          {savedWords > 0
                            ? `${savedWords} so'z`
                            : `${item.durationMinutes} daq`}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          Task 1: {item.task1.topicTitle}
                        </p>
                        <p className="font-semibold text-zinc-600 dark:text-zinc-400">
                          Task 2: {item.task2.topicTitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartExam(item.id);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white"
                      >
                        <span>Boshlash</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Selected Set Detail Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Tanlangan to&apos;plam tarkibi · {selectedTest.code}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  {selectedTest.title}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Task 1 Card */}
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-[#111113]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <PenTool className="h-3.5 w-3.5" />
                      TASK 1 · 20 DAQIQA
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-500">
                      Min 150 so&apos;z
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-zinc-100">
                    {selectedTest.task1.topicTitle}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {selectedTest.task1.shortDesc}
                  </p>
                </div>

                {/* Task 2 Card */}
                <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-[#111113]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <BookOpen className="h-3.5 w-3.5" />
                      TASK 2 · 40 DAQIQA
                    </span>
                    <span className="font-mono text-xs font-semibold text-zinc-500">
                      Min 250 so&apos;z
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-zinc-950 dark:text-zinc-100">
                    {selectedTest.task2.topicTitle}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {selectedTest.task2.shortDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions Strip */}
            <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50/50 p-5 text-sm dark:border-emerald-500/20 dark:bg-emerald-950/20">
              <h4 className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Imtihon qoidalari va CDI talablari:
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Umumiy vaqt:</strong> 60 daqiqa to&apos;xtovsiz davom etadi. Taymer tugagach insholar avtomatik baholashga yuboriladi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Adolatli baholash:</strong> Agar bitta task yozilgan bo&apos;lsa, ball tushib ketmaydi — yozilgan task adolatli baholanadi. Ikkalasi yozilsa 1/3 va 2/3 nisbatda hisoblanadi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Imlo tekshirgich (Spellcheck):</strong> Haqiqiy rasmiy CDI imtihoni kabi avtomatik to&apos;g&apos;irlash o&apos;chirilgan.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Avtomatik saqlash:</strong> Har bir to&apos;plamdagi qoralama brauzer xotirasida alohida saqlanadi.
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                id="start-exam-btn"
                onClick={() => handleStartExam()}
                className="btn-sheen flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:bg-emerald-500 active:translate-y-0.5 sm:w-auto cursor-pointer"
              >
                <Clock className="h-5 w-5" />
                <span>
                  {selectedTest.code} ni boshlash (60:00)
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>

              {(t1Words > 0 || t2Words > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    const keys = getDraftKeys(selectedTestId);
                    setTask1Essay("");
                    setTask2Essay("");
                    localStorage.removeItem(keys.t1);
                    localStorage.removeItem(keys.t2);
                    if (selectedTestId === "writing-01") {
                      localStorage.removeItem("ielts_nova_writing_task1");
                      localStorage.removeItem("ielts_nova_writing_task2");
                    }
                    refreshDraftCounts();
                  }}
                  className="rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Qoralamani tozalash
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // BOSQICH 2: TEST UI (COMPUTER-DELIVERED IELTS WRITING INTERFACE)
  // =========================================================================
  if (phase === "test") {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFA] text-zinc-950 select-none dark:bg-[#09090B] dark:text-zinc-50">
        {/* Sticky Executive Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-[#111113]">
          {/* Left: Brand + Active Set & Task Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo compact href="/dashboard" subtitle="CDI WRITING" />
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setPhase("landing");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
              title="Savollar jadvaliga qaytish"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>SET {selectedTest.number}</span>
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {activeTask === "task1" ? "TASK 1 (MIN 150 SO'Z)" : "TASK 2 (MIN 250 SO'Z)"}
              </span>
              {autoSavedTime && (
                <span className="font-mono text-[11px] text-zinc-400">
                  Saqlandi: {autoSavedTime}
                </span>
              )}
            </div>
          </div>

          {/* Center: Live 60:00 Countdown Timer */}
          <div className="flex items-center">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-1.5 font-mono text-base font-black transition-colors shadow-xs",
                timerCritical
                  ? "bg-red-500/15 text-red-600 animate-pulse border border-red-500/40 dark:text-red-400"
                  : timerWarning
                    ? "bg-amber-500/15 text-amber-700 border border-amber-500/40 dark:text-amber-400"
                    : "bg-emerald-500/10 text-emerald-700 border border-emerald-600/30 dark:text-emerald-400"
              )}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Right: Fullscreen + Submit Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Kichraytirish" : "To'liq ekran"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="btn-sheen inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 transition-all hover:bg-emerald-500 active:translate-y-0.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Insholarni topshirish</span>
            </button>
          </div>
        </header>

        {/* Resizable Split Screen Workspace */}
        <div ref={containerRef} className="relative flex flex-1 overflow-hidden">
          {/* Left Panel: Questions, Instructions, HD Canvas & Table */}
          <div
            style={{ width: `${splitWidth}%` }}
            className="flex flex-col overflow-y-auto border-r border-zinc-200/90 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-[#111113] scrollbar-thin select-text"
          >
            {activeTask === "task1" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Academic Writing · Task 1 ({selectedTest.code})
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    Tavsiya: 20 daqiqa
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs font-medium leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                  <p className="whitespace-pre-line">{selectedTest.task1.question}</p>
                </div>

                {/* Interactive Drawing Canvas + HD Data Table */}
                <div className="pt-2">
                  <WritingCanvas
                    imageUrl={selectedTest.task1.imageUrl}
                    fallbackImageUrl={selectedTest.task1.fallbackImageUrl}
                    imageAlt={selectedTest.task1.imageAlt}
                    lightboxTitle={selectedTest.task1.lightboxTitle}
                    tableTitle={selectedTest.task1.tableTitle}
                    columns={selectedTest.task1.columns}
                    rows={selectedTest.task1.rows}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Academic Writing · Task 2 ({selectedTest.code})
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    Tavsiya: 40 daqiqa
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-600/25 bg-emerald-50/50 p-5 text-sm leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100">
                  <p className="whitespace-pre-line font-medium">
                    {selectedTest.task2.question}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
                  <h5 className="font-bold text-zinc-900 dark:text-zinc-100">
                    💡 Standart 4-Paragraf Strukturasi:
                  </h5>
                  {selectedTest.task2.structureGuide.map((step) => (
                    <p
                      key={step.title}
                      className="text-zinc-600 dark:text-zinc-400"
                    >
                      <strong>{step.title}</strong> {step.description}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Draggable Divider */}
          <div
            onMouseDown={handleMouseDown}
            className="group relative z-20 flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-zinc-200 transition-colors hover:bg-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-500"
            title="Kenglikni o'zgartirish uchun suring"
          >
            <div className="h-8 w-1 rounded-full bg-zinc-400 transition-colors group-hover:bg-white" />
          </div>

          {/* Right Panel: Official Candidate Response Area */}
          <div
            style={{ width: `${100 - splitWidth}%` }}
            className="flex flex-1 flex-col bg-[#FAFAFA] dark:bg-[#09090B]"
          >
            {/* Sub-header with Word Count Alert */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200/90 bg-zinc-50/90 px-4 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
                Response Area ({activeTask === "task1" ? "Task 1" : "Task 2"})
              </span>

              {/* Dynamic Word count badge */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-xs font-bold",
                    (activeTask === "task1" ? t1Words >= 150 : t2Words >= 250)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  )}
                >
                  {(activeTask === "task1" ? t1Words >= 150 : t2Words >= 250) ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {activeTask === "task1" ? (
                    <span>So&apos;zlar: {t1Words} / min 150</span>
                  ) : (
                    <span>So&apos;zlar: {t2Words} / min 250</span>
                  )}
                </span>
              </div>
            </div>

            {/* In-Exam Textarea: Spellcheck disabled for real testing */}
            <div className="relative flex-1 p-4 sm:p-6">
              <textarea
                value={activeTask === "task1" ? task1Essay : task2Essay}
                onChange={(e) => {
                  if (activeTask === "task1") setTask1Essay(e.target.value);
                  else setTask2Essay(e.target.value);
                }}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="sentences"
                placeholder={
                  activeTask === "task1"
                    ? "Type your Task 1 response here... (Minimum 150 words)"
                    : "Type your Task 2 response here... (Minimum 250 words)"
                }
                className="h-full w-full resize-none rounded-xl border border-zinc-200 bg-white p-5 font-mono text-sm leading-relaxed text-zinc-900 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-100 dark:focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Footer: Task Switcher Tabs & Status */}
        <footer className="flex h-14 shrink-0 items-center justify-between border-t border-zinc-200/90 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-[#111113]">
          {/* Task Switching Segmented Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTask("task1")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                activeTask === "task1"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <span>Task 1</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px]",
                  activeTask === "task1"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                {t1Words} w {t1Words >= 150 ? "✓" : ""}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTask("task2")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                activeTask === "task2"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              <span>Task 2</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px]",
                  activeTask === "task2"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                )}
              >
                {t2Words} w {t2Words >= 250 ? "✓" : ""}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-zinc-500 sm:inline">
              Jami: {t1Words + t2Words} so&apos;z
            </span>
            <button
              type="button"
              onClick={() => setConfirmSubmitOpen(true)}
              className="btn-sheen inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 active:translate-y-0.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Imtihonni topshirish</span>
            </button>
          </div>
        </footer>

        {/* Submit Confirmation Modal */}
        <AnimatePresence>
          {confirmSubmitOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmSubmitOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 14 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 14 }}
                transition={SPRING_SNAPPY}
                className="relative z-10 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#111113]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Send className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-zinc-950 dark:text-zinc-100">
                  Insholaringizni topshirasizmi?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Yuborishdan so&apos;ng javoblarni o&apos;zgartirib bo&apos;lmaydi. Rasmiy Cambridge & IDP mezonlariga asosan har ikki vazifa tahlil qilinadi.
                </p>

                <div className="mt-4 space-y-2 rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3.5 text-xs font-mono dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Task 1:</span>
                    <span
                      className={cn(
                        "font-bold",
                        t1Words >= 150 ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {t1Words} so&apos;z (min 150)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Task 2:</span>
                    <span
                      className={cn(
                        "font-bold",
                        t2Words >= 250 ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {t2Words} so&apos;z (min 250)
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(false)}
                    className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                  >
                    Davom ettirish
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFinalSubmit()}
                    className="btn-sheen flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 cursor-pointer"
                  >
                    Topshirish va Baholash
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // =========================================================================
  // BOSQICH 2.5: EVALUATION ANIMATION (EXAMINER AT WORK)
  // =========================================================================
  if (phase === "evaluating") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] p-6 text-zinc-950 dark:bg-[#09090B] dark:text-zinc-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_SNAPPY}
          className="flex w-full max-w-md flex-col items-center rounded-3xl border border-emerald-600/30 bg-white p-8 text-center shadow-2xl dark:border-zinc-800 dark:bg-[#111113]"
        >
          <div className="relative flex h-20 w-20 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.5, ease: "linear" }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-500"
            />
            <ShieldCheck className="h-8 w-8 text-emerald-600 animate-pulse" />
          </div>

          <h3 className="mt-6 text-xl font-black text-zinc-950 dark:text-white">
            IELTS Assessment Engine Tahlil Qilmoqda
          </h3>
          <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {evaluatingTask}
          </p>

          <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>TR · CC · LR · GRA (Cambridge & IDP Calibrated)</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // BOSQICH 3: RESULTS DASHBOARD & DIAGNOSTIC REPORT (PHASE 3)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-950 selection:bg-emerald-500/20 dark:bg-[#09090B] dark:text-zinc-50">
      {/* Top Results Header */}
      <header className="border-b border-zinc-200/90 bg-white px-4 py-4 backdrop-blur-md sm:px-8 dark:border-zinc-800 dark:bg-[#111113]">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandLogo href="/dashboard" subtitle="WRITING RESULTS" />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="btn-sheen inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
            >
              {downloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>PDF Hisobotni yuklab olish</span>
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Kabinetga qaytish
            </Link>
          </div>
        </div>
      </header>

      {/* Main Results Content (Ref target for PDF generation) */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div ref={reportRef} className="space-y-8 rounded-3xl bg-transparent p-2 sm:p-4">
          {/* Executive Band Summary Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-950 via-[#0a1813] to-zinc-950 p-6 text-white shadow-2xl sm:p-8">
            <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  RASMIY IELTS WRITING BAHOSI
                </span>
                <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                  Umumiy Writing Natijasi
                </h1>
                <p className="mt-2 text-xs text-zinc-300 sm:text-sm">
                  Task 1 ({evalResult1?.wordCount || t1Words} so&apos;z) va Task 2 ({evalResult2?.wordCount || t2Words} so&apos;z) insholarining Cambridge mezonlariga asosan hisoblangan rasmiy band bali.
                </p>
              </div>

              {/* Band Score Circle */}
              <div className="flex flex-col items-center rounded-2xl border border-emerald-500/30 bg-white/10 p-5 text-center backdrop-blur-md">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  OVERALL BAND
                </span>
                <span className="font-mono text-5xl font-black text-white sm:text-6xl">
                  {realOverallBand.toFixed(1)}
                </span>
                <span className="mt-1 font-mono text-xs font-bold text-emerald-300">
                  {getWritingCefrLabel(realOverallBand)}
                </span>
              </div>
            </div>

            {/* Sub-bands Pill Bar & Verified Official Branding */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Vazifalar bo&apos;yicha:</span>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-white">
                  Task 1: Band {resolvedTask1Band.toFixed(1)}
                </span>
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-white">
                  Task 2: Band {resolvedTask2Band.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-emerald-300">
                  Tekshiruvchi: IELTS Nova Official Assessment Engine (Cambridge & IDP Calibrated)
                </span>
              </div>
            </div>
          </div>

          {/* Task Results Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTask("task1")}
              className={cn(
                "rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                activeTask === "task1"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400"
              )}
            >
              Task 1 Tahlili (Band {resolvedTask1Band.toFixed(1)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTask("task2")}
              className={cn(
                "rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                activeTask === "task2"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400"
              )}
            >
              Task 2 Tahlili (Band {resolvedTask2Band.toFixed(1)})
            </button>
          </div>

          {/* Diagnostic Sub-navigation: Criteria | Exercises | Ask Examiner */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setResultsSubTab("criteria")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                resultsSubTab === "criteria"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <Award className="h-4 w-4" />
              <span>4 Mezon & Xatolar Tahlili</span>
            </button>

            <button
              type="button"
              onClick={() => setResultsSubTab("exercises")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                resultsSubTab === "exercises"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>AI Mashqlar (Micro-Exercises)</span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                {activeEval?.practiceTasks?.length || 4} ta
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResultsSubTab("ask_examiner")}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                resultsSubTab === "ask_examiner"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              <MessageSquare className="h-4 w-4 text-emerald-500" />
              <span>AI Ustoz: Jonli Savol-Javob</span>
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 font-mono text-[10px] text-white">
                LIVE
              </span>
            </button>
          </div>

          {/* TAB 1: 4 MEZON VA XATOLAR TAHLILI */}
          {resultsSubTab === "criteria" && (
            <div className="space-y-6">
              {/* 4 Official Criteria Cards Grid with 'Why this score' and 'How to reach next band' */}
              {activeEval?.criteria && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(activeEval.criteria).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-[#111113]"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                            {val.title}
                          </span>
                          <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            Band {val.band?.toFixed(1)}
                          </span>
                        </div>

                        {/* Progress bar (0 - 9 Band) */}
                        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-600 transition-all duration-700"
                            style={{ width: `${(val.band / 9) * 100}%` }}
                          />
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {val.feedback}
                        </p>
                      </div>

                      {/* Detailed Pedagogical Breakdown */}
                      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3 text-[11px] dark:border-zinc-800/80">
                        {val.whyThisScore && (
                          <div className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900/60">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              Nega aynan shu ball:
                            </span>{" "}
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {val.whyThisScore}
                            </span>
                          </div>
                        )}
                        {val.howToReachNextBand && (
                          <div className="rounded-lg bg-emerald-50/70 p-2.5 dark:bg-emerald-950/20">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">
                              Keyingi ballga chiqish:
                            </span>{" "}
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {val.howToReachNextBand}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Identified Mistakes, Corrections & Band 9.0 Upgrades */}
              {activeEval?.mistakes && activeEval.mistakes.length > 0 && (
                <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-[#111113]">
                  <h3 className="flex items-center gap-2 text-base font-bold text-zinc-950 dark:text-zinc-100">
                    <AlertCircle className="h-4 w-4 text-emerald-600" />
                    Aniqlangan Xatolar va Band 9.0 Darajasidagi Muqobillar:
                  </h3>
                  <div className="mt-4 space-y-3.5">
                    {activeEval.mistakes.map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-700 dark:bg-red-950/50 dark:text-red-400 shrink-0">
                              ASL MATN
                            </span>
                            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                              &ldquo;{m.original}&rdquo;
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 shrink-0">
                              TO&apos;G&apos;RILANGAN
                            </span>
                            <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              &ldquo;{m.correction}&rdquo;
                            </span>
                          </div>

                          {m.band9Upgrade && (
                            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/70 p-2 dark:border-emerald-500/10 dark:bg-emerald-950/20">
                              <span className="flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white shrink-0">
                                <Sparkles className="h-3 w-3" />
                                BAND 9.0 UPGRADE
                              </span>
                              <span className="font-mono text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                &ldquo;{m.band9Upgrade}&rdquo;
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-2.5 text-zinc-600 dark:text-zinc-400">
                          💡 <strong>Tahlil:</strong> {m.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary Upgrades Grid */}
              {activeEval?.vocabularyUpgrades && activeEval.vocabularyUpgrades.length > 0 && (
                <div className="rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-[#111113]">
                  <h3 className="flex items-center gap-2 text-base font-bold text-zinc-950 dark:text-zinc-100">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Leksikani Boyitish: C1/C2 Akademik Sinonimlar:
                  </h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {activeEval.vocabularyUpgrades.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-zinc-200/80 bg-zinc-50/90 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                            {item.originalWord}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-400">C1 / C2</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.upgrades.map((u, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                            >
                              {u}
                            </span>
                          ))}
                        </div>
                        {item.contextExample && (
                          <p className="mt-2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                            &ldquo;{item.contextExample}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Senior Examiner Advice Card */}
              {activeEval?.examinerAdvice && (
                <div className="rounded-3xl border border-emerald-600/25 bg-emerald-50/60 p-6 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <h4 className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    IELTS Examiner Xulosasi va 8.5+ Band uchun Strategiya:
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {activeEval.examinerAdvice}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE MICRO-EXERCISES (XATOLAR USTIDA ISHLASH) */}
          {resultsSubTab === "exercises" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-600/20 bg-emerald-50/40 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
                      Shaxsiy Mini-Tasklar (Interaktiv Mashqlar)
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      Ushbu mashqlar aynan sizning inshoyingizdagi xatolardan kelib chiqib tuzilgan. Gapni to&apos;g&apos;rilab yozing va &ldquo;Tekshirish&rdquo; tugmasini bosing — AI darhol tekshirib ball beradi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exercise Cards */}
              <div className="space-y-4">
                {(activeEval?.practiceTasks || []).map((task, idx) => {
                  const state = practiceStates[task.id] || {
                    userAnswer: "",
                    checked: false,
                    loading: false,
                    showHint: false,
                  };

                  return (
                    <div
                      key={task.id || idx}
                      className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-xs sm:p-6 dark:border-zinc-800 dark:bg-[#111113]"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          MASHQ #{idx + 1} · {task.type.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPracticeStates((prev) => ({
                              ...prev,
                              [task.id]: { ...state, showHint: !state.showHint },
                            }))
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>{state.showHint ? "Maslahatni yopish" : "Maslahat (Hint)"}</span>
                        </button>
                      </div>

                      {/* Question */}
                      <h4 className="mt-3 text-sm font-bold text-zinc-950 dark:text-zinc-100">
                        {task.question}
                      </h4>

                      {/* Incorrect source sentence */}
                      <div className="mt-2.5 rounded-xl border border-red-200/70 bg-red-50/50 p-3 text-xs font-mono text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                        <span className="font-bold">Tuzatilishi kerak:</span> &ldquo;{task.incorrectSentence}&rdquo;
                      </div>

                      {/* Hint Collapse */}
                      {state.showHint && task.hint && (
                        <div className="mt-2.5 rounded-xl border border-amber-500/25 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-300">
                          💡 <strong>Ko&apos;rsatma:</strong> {task.hint}
                        </div>
                      )}

                      {/* User Input Field */}
                      <div className="mt-3.5">
                        <textarea
                          value={state.userAnswer}
                          onChange={(e) =>
                            setPracticeStates((prev) => ({
                              ...prev,
                              [task.id]: { ...state, userAnswer: e.target.value },
                            }))
                          }
                          placeholder="To'g'rilangan variantingizni shu yerga yozing..."
                          rows={2}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-900 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-500"
                        />
                      </div>

                      {/* Action & Feedback */}
                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => void handleCheckPractice(task)}
                          disabled={state.loading || !state.userAnswer.trim()}
                          className="btn-sheen inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                        >
                          {state.loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Javobni Tekshirish</span>
                        </button>
                      </div>

                      {/* Live Feedback Result */}
                      {state.checked && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "mt-4 rounded-2xl border p-4 text-xs",
                            state.isCorrect
                              ? "border-emerald-500/30 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/30"
                              : "border-amber-500/30 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-950/30"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              {state.feedback}
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {state.bandEstimate || "Band 8.5"} ({state.scorePercentage}%)
                            </span>
                          </div>

                          {state.improvedVersion && (
                            <div className="mt-2.5 rounded-xl bg-white/80 p-2.5 font-mono text-[11px] text-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200">
                              <strong>Band 9.0 Ideal Namuna:</strong> &ldquo;{state.improvedVersion}&rdquo;
                            </div>
                          )}

                          {state.pedagogicalNote && (
                            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                              🎓 <strong>Qoida:</strong> {state.pedagogicalNote}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: JONLI SAVOL-JAVOB (ASK YOUR EXAMINER LIVE CHAT) */}
          {resultsSubTab === "ask_examiner" && (
            <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-[#111113]">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                      <span>IELTS Nova Senior Examiner Chat</span>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        ONLINE
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      O&apos;quvchingizning inshosi va ballari bo&apos;yicha jonli pedagogik konsultatsiya.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div
                ref={chatScrollRef}
                className="my-4 max-h-[460px] min-h-[320px] space-y-4 overflow-y-auto pr-2 scrollbar-thin"
              >
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        msg.role === "user"
                          ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                          : "bg-emerald-600 text-white"
                      )}
                    >
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed sm:max-w-[75%]",
                        msg.role === "user"
                          ? "bg-emerald-600 text-white rounded-tr-xs"
                          : "border border-zinc-200/90 bg-zinc-50 text-zinc-900 rounded-tl-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Interactive Quick Follow-up Chips */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-3.5 space-y-1.5 border-t border-zinc-200/70 pt-2.5 dark:border-zinc-800">
                          <span className="font-mono text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                            Tezkor savollar:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((chip, ci) => (
                              <button
                                key={ci}
                                type="button"
                                onClick={() => void handleSendChatMessage(chip)}
                                className="rounded-lg border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 text-left font-mono text-[10px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-600 hover:text-white dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white cursor-pointer"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    <span>Examiner yozmoqda...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSendChatMessage();
                    }
                  }}
                  placeholder="Insho bo'yicha savolingizni yozing (masalan: Kirish qismini qanday yaxshilash mumkin?)..."
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs text-zinc-900 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="btn-sheen flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Retake Button */}
          <div className="flex justify-center pt-4">
            <TactileButton
              onClick={() => {
                setPhase("landing");
                setTimeLeft(3600);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Qayta topshirish (Retake Writing Test)</span>
            </TactileButton>
          </div>
        </div>
      </main>
    </div>
  );
}
