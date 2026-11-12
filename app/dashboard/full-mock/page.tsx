"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import FullMockLoading from "./loading";
import {
  SPRING_SNAPPY,
  SPRING_TACTILE,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion";
import { Badge, Card, PageHeader } from "@/components/ui";
import { DICT } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import { FULL_MOCK_TEST } from "@/lib/tests-registry";

export default function FullMockPage() {
  return (
    <Suspense fallback={<FullMockLoading />}>
      <motion.div
        initial={{ opacity: 0, filter: "blur(5px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      >
        <FullMockContent />
      </motion.div>
    </Suspense>
  );
}

function FullMockContent() {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang];

  // Find any previous attempts for full-mock-1
  const fullMockAttempts = state.attempts.filter((a) => a.testId === "full-mock-1");
  const latestAttempt = fullMockAttempts[0] || null;

  return (
    <StaggerContainer className="space-y-7">
      <PageHeader
        eyebrow="RASMIY COMPUTER-DELIVERED IELTS"
        title="IELTS To'liq Full Mock (80 Savol)"
        subtitle="Listening (40 savol) va Academic Reading (40 savol) birgalikda — rasmiy Cambridge CDI tizimi asosidagi to'liq 100 daqiqalik simulyator."
      />

      {/* Main Full Mock Hero Banner */}
      <StaggerItem>
        <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-950 via-[#0c1813] to-zinc-950 p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  TO&apos;LIQ RASMIY FORMAT
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  80 Savol · 100 Daqiqa · 2 Modul
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                Cambridge CDI Full Mock — Week 03 Edition
              </h2>

              <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
                Haqiqiy imtihon kabi: avval 4 qismdan iborat Listening (40 savol), so&apos;ng 60 daqiqalik 3 ta akademik matndan iborat Reading (40 savol). Imtihon yakunida umumiy va alohida Band ballar hisoblanadi.
              </p>

              {/* 4 Feature Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  <Headphones className="h-3.5 w-3.5 text-emerald-400" />
                  40 ta Listening savoli
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                  40 ta Reading savoli
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Real imtihon taymeri
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  <Award className="h-3.5 w-3.5 text-emerald-400" />
                  Rasmiy 9.0 Band shkalasi
                </span>
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex shrink-0 flex-col gap-3">
              <Link
                href="/test/full-mock-1"
                prefetch={true}
                className="btn-sheen relative z-20 cursor-pointer inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-600/35 transition-colors hover:bg-emerald-500"
              >
                <Sparkles className="pointer-events-none h-5 w-5" />
                <span className="pointer-events-none">Full Mockni Boshlash ✦</span>
                <ArrowRight className="pointer-events-none h-5 w-5" />
              </Link>

              {latestAttempt && (
                <Link
                  href="/dashboard/results"
                  prefetch={true}
                  className="relative z-20 cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-white"
                >
                  <CheckCircle2 className="pointer-events-none h-3.5 w-3.5 text-emerald-400" />
                  <span className="pointer-events-none">Avvalgi natija: Band {latestAttempt.band.toFixed(1)}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
        </div>
      </StaggerItem>

      {/* Structure Overview: 2 Panels (Listening + Reading) */}
      <StaggerItem className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Module 1: Listening */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <Headphones className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  1-Modul: Listening
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  4 ta qism · 40 ta savol · Real audio
                </p>
              </div>
            </div>
            <Badge tone="emerald" mono>
              Part 1–4
            </Badge>
          </div>

          <div className="mt-5 space-y-2.5">
            {[
              {
                part: "Part 1 (Q1–10)",
                title: "Accommodation & Parking Enquiry",
                type: "Note Completion & Form Filling",
              },
              {
                part: "Part 2 (Q11–20)",
                title: "Community Facilities & Map",
                type: "Multiple Choice & Map Labelling",
              },
              {
                part: "Part 3 (Q21–30)",
                title: "Academic Project & Seminar",
                type: "Matching & Multiple Choice",
              },
              {
                part: "Part 4 (Q31–40)",
                title: "Industrial Materials & Technology",
                type: "One Word Only Lecture Notes",
              },
            ].map((p) => (
              <div
                key={p.part}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {p.part}: {p.title}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {p.type}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  10 savol
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Module 2: Reading */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-50 text-emerald-700 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  2-Modul: Academic Reading
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  3 ta matn · 40 ta savol · 60 daqiqa
                </p>
              </div>
            </div>
            <Badge tone="dark" mono>
              Passage 1–3
            </Badge>
          </div>

          <div className="mt-5 space-y-2.5">
            {[
              {
                part: "Passage 1 (Q1–13)",
                title: "An early cultural tourist",
                type: "True/False/Not Given & Notes Completion",
                count: 13,
              },
              {
                part: "Passage 2 (Q14–26)",
                title: "The clustering of IT companies",
                type: "Information Matching & Summary",
                count: 13,
              },
              {
                part: "Passage 3 (Q27–40)",
                title: "What is social history?",
                type: "Matching Features, Yes/No & Multiple Choice",
                count: 14,
              },
            ].map((p) => (
              <div
                key={p.part}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    {p.part}: {p.title}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {p.type}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  {p.count} savol
                </span>
              </div>
            ))}
          </div>
        </Card>
      </StaggerItem>

      {/* Real CDI Exam Tips & Guidelines */}
      <StaggerItem>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              CDI Imtihon Standart Qoidalari va Tavsiyalar
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                1. Qat&apos;iy vaqt nazorati
              </div>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Listening audio tezligida davom etadi. Reading qismida aniq 60 daqiqalik teskari hisoblagich ishlaydi.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                2. Matn ajratgich (Highlight)
              </div>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Reading matnlarida kerakli jumlalarni sichqoncha bilan belgilab, &quot;Highlight&quot; yoki &quot;Note&quot; orqali eslatma qo&apos;yishingiz mumkin.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                3. Xatolar chuqur tahlili
              </div>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Imtihon topshirilgach, har bir savol bo&apos;yicha nima uchun xato qilganingiz va matndagi isboti batafsil ko&apos;rsatiladi.
              </p>
            </div>
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
