"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  Headphones,
  Moon,
  Play,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { DICT } from "@/lib/i18n";
import { actions, type ClientAuthUser, useAppState } from "@/lib/store";
import { OFFICIAL_TESTS } from "@/lib/tests-registry";
import { cn, roundBand } from "@/lib/utils";
import { AuthModal } from "./auth-modal";
import { BrandLogo } from "./brand";
import {
  AnimatedNumber,
  AnimatedWords,
  ParallaxShowcase,
  PortalTransitionOverlay,
  SPRING_SNAPPY,
  SPRING_TACTILE,
  ScrollProgressBar,
  ScrollReveal,
  SpotlightSurface,
  TactileButton,
} from "./motion";
import { Badge, ProgressBar } from "./ui";

function listeningRawToBand(raw: number): number {
  if (raw >= 39) return 9.0;
  if (raw >= 37) return 8.5;
  if (raw >= 35) return 8.0;
  if (raw >= 32) return 7.5;
  if (raw >= 30) return 7.0;
  if (raw >= 26) return 6.5;
  if (raw >= 23) return 6.0;
  if (raw >= 18) return 5.5;
  if (raw >= 16) return 5.0;
  if (raw >= 13) return 4.5;
  if (raw >= 10) return 4.0;
  if (raw >= 6) return 3.5;
  if (raw >= 4) return 3.0;
  return 2.5;
}

function readingRawToBand(raw: number): number {
  if (raw >= 39) return 9.0;
  if (raw >= 37) return 8.5;
  if (raw >= 35) return 8.0;
  if (raw >= 33) return 7.5;
  if (raw >= 30) return 7.0;
  if (raw >= 27) return 6.5;
  if (raw >= 23) return 6.0;
  if (raw >= 19) return 5.5;
  if (raw >= 15) return 5.0;
  if (raw >= 13) return 4.5;
  if (raw >= 10) return 4.0;
  if (raw >= 8) return 3.5;
  if (raw >= 6) return 3.0;
  return 2.5;
}

function bandToCefr(band: number): string {
  if (band >= 8.5) return "C2 Proficient";
  if (band >= 7.0) return "C1 Advanced";
  if (band >= 5.5) return "B2 Upper-Intermediate";
  if (band >= 4.0) return "B1 Intermediate";
  return "A2 Elementary";
}

export function LandingPage() {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang].landing;
  const authT = DICT[lang].auth;
  const tc = DICT[lang].testCard;

  // Navbar floating scroll state
  const [scrolled, setScrolled] = useState(false);

  // Auth modal & verified session state
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"register" | "login">("register");
  const [authRequired, setAuthRequired] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [sessionUser, setSessionUser] = useState<ClientAuthUser | null>(null);
  const [launchingPortal, setLaunchingPortal] = useState(false);

  // Band Calculator state
  const [listeningRaw, setListeningRaw] = useState(34);
  const [readingRaw, setReadingRaw] = useState(35);
  const [writingBand, setWritingBand] = useState(7.0);
  const [speakingBand, setSpeakingBand] = useState(7.5);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const req = params.get("auth");
    const nxt = params.get("next");
    if (nxt && nxt.startsWith("/")) {
      setNextPath(nxt);
    }
    if (req === "required") {
      setAuthRequired(true);
      setAuthOpen(true);
    }

    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { authenticated?: boolean; user?: ClientAuthUser | null }) => {
        if (d.authenticated && d.user && d.user.provider === "google") {
          setSessionUser(d.user);
          actions.setAuthUser(d.user);
        } else {
          setSessionUser(null);
          actions.clearAuthUser();
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const triggerStartAction = (target = "/dashboard") => {
    if (sessionUser && sessionUser.provider === "google") {
      setLaunchingPortal(true);
      setTimeout(() => {
        window.location.href = target;
      }, 680);
      return;
    }
    setNextPath(target);
    setAuthRequired(false);
    setAuthTab("register");
    setAuthOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthOpen(false);
    if (authRequired && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.pathname + url.search);
      setAuthRequired(false);
    }
  };

  const lBand = listeningRawToBand(listeningRaw);
  const rBand = readingRawToBand(readingRaw);
  const overallBand = roundBand(
    (lBand + rBand + writingBand + speakingBand) / 4
  );

  const navLinks = [
    { href: "#top", label: t.navHome },
    { href: "/writing", label: "CDI Writing ✦" },
    { href: "#features", label: t.navFeatures },
    { href: "#calculator", label: t.navCalculator },
    { href: "#pricing", label: t.navPricing },
  ];

  const heroModuleCards = [
    {
      id: "writing-card",
      badge: "YANGI · GEMINI AI",
      icon: Sparkles,
      title:
        lang === "uz"
          ? "CD-IELTS Writing Moduli"
          : lang === "ru"
            ? "CD-IELTS Writing Модуль"
            : "CD-IELTS Writing Suite",
      meta:
        lang === "uz"
          ? "Task 1 (Canvas) + Task 2 · 60 daqiqa · AI Tahlil"
          : lang === "ru"
            ? "Task 1 (Canvas) + Task 2 · 60 мин · AI Разбор"
            : "Task 1 (Canvas) + Task 2 · 60 min · AI Evaluation",
      target: "/writing",
    },
    {
      id: "listening-card",
      badge: "VOL 5 · TEST 09",
      icon: Headphones,
      title:
        lang === "uz"
          ? "Full Listening Mock"
          : lang === "ru"
            ? "Full Listening Экзамен"
            : "Full Listening Paper",
      meta: `4 ${tc.parts} · 40 ${tc.questions} · 30+2 ${tc.minutes}`,
      target: "/test/listening-v5-t09",
    },
    {
      id: "reading-card",
      badge: "VOL 5 · TEST 10",
      icon: BookOpen,
      title:
        lang === "uz"
          ? "Academic Reading Mock"
          : lang === "ru"
            ? "Academic Reading Экзамен"
            : "Academic Reading Paper",
      meta: `3 ${tc.passages} · 40 ${tc.questions} · 60 ${tc.minutes}`,
      target: "/test/reading-v5-t10",
    },
    {
      id: "analytics-card",
      badge: "BAND 9.0 ENGINE",
      icon: FileCheck2,
      title:
        lang === "uz"
          ? "Tahlil va PDF Sertifikat"
          : lang === "ru"
            ? "Разбор и PDF Отчёт"
            : "Diagnostics & PDF Report",
      meta:
        lang === "uz"
          ? "Avtomatik Band hisoblash · 40 savol kaliti"
          : lang === "ru"
            ? "Мгновенный расчёт Band · Ключи к 40 вопросам"
            : "Instant Band conversion · 40-question review",
      target: "/dashboard/results",
    },
  ];

  const userInitials = sessionUser?.name
    ? sessionUser.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "G";

  return (
    <div
      id="top"
      className="min-h-screen bg-[#FAFAFA] text-zinc-950 selection:bg-emerald-500/20 dark:bg-[#09090B] dark:text-zinc-50"
    >
      {/* Top Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Portal Transition Overlay when entering Dashboard */}
      <PortalTransitionOverlay
        open={launchingPortal}
        userName={sessionUser?.name}
        userEmail={sessionUser?.email}
        userPicture={sessionUser?.picture}
        verifiedLabel={authT.portalVerified}
        launchingLabel={authT.portalLaunching}
      />

      {/* Candidate Registration & Login Modal */}
      <AuthModal
        open={authOpen}
        onClose={handleCloseAuth}
        requiredReason={authRequired}
        nextPath={nextPath}
        initialTab={authTab}
      />

      {/* ===================================================================
          MORPHING TOP -> FLOATING PILL NAVBAR
          =================================================================== */}
      <div className="sticky top-0 z-40 px-3 sm:px-6">
        <motion.header
          layout
          transition={SPRING_SNAPPY}
          className={cn(
            "mx-auto flex items-center justify-between gap-2.5 transition-[padding,margin,background-color,border-color,box-shadow] duration-300",
            scrolled
              ? "mt-3 max-w-5xl rounded-2xl border border-emerald-600/20 bg-white/92 px-3.5 py-2.5 shadow-xl shadow-emerald-950/6 backdrop-blur-md sm:px-5 dark:border-zinc-800/90 dark:bg-[#111113]/92 dark:shadow-black/45"
              : "max-w-7xl border-b border-transparent py-4 sm:py-5"
          )}
        >
          <BrandLogo href="/" />

          {/* Center Navigation Links */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_TACTILE}
                className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-500/8 hover:text-emerald-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-emerald-400"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          {/* Right Controls: Dark/Light + Emerald CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9, rotate: 16 }}
              transition={SPRING_TACTILE}
              onClick={() => actions.toggleTheme()}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-emerald-600/50 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                {state.theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Sun className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 60, opacity: 0, scale: 0.7 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -60, opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Moon className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {sessionUser ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  title={`${sessionUser.name} (${sessionUser.email})`}
                  className="flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50/80 px-2.5 py-1 transition-all hover:bg-emerald-100/70 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:border-emerald-500/40"
                >
                  {sessionUser.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sessionUser.picture}
                      alt={sessionUser.name}
                      referrerPolicy="no-referrer"
                      className="h-6 w-6 rounded-full border border-emerald-500/50 object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 font-mono text-[11px] font-bold text-white shadow-2xs">
                      {userInitials}
                    </span>
                  )}
                  <span className="hidden max-w-[110px] truncate text-xs font-bold text-zinc-900 sm:inline dark:text-zinc-100">
                    {sessionUser.name}
                  </span>
                  <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-white">
                    {(sessionUser.plan || "free").toUpperCase()}
                  </span>
                </Link>

                <Link
                  href="/dashboard"
                  prefetch={true}
                  data-testid="hero-nav-cta"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <span>{t.openDashboard}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="hero-nav-login"
                  onClick={() => {
                    setNextPath("/dashboard");
                    setAuthTab("login");
                    setAuthOpen(true);
                  }}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 transition-colors hover:border-emerald-600/40 hover:text-emerald-700 sm:px-4 sm:py-2.5 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
                >
                  Kirish
                </button>
                <button
                  type="button"
                  data-testid="hero-nav-cta"
                  onClick={() => {
                    setNextPath("/dashboard");
                    setAuthTab("register");
                    setAuthOpen(true);
                  }}
                  className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700 sm:px-5 sm:py-2.5 sm:text-sm dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <span>{t.startFree}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </div>
        </motion.header>
      </div>

      {/* ===================================================================
          EXECUTIVE HERO SECTION + COMPACT 3-CARD CDI ARCHITECTURE STRIP
          =================================================================== */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-24">
        {/* Architectural Grid + Subtle Emerald Radial Aura */}
        <div className="bg-hero-grid pointer-events-none absolute inset-0" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/14"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          {/* Centered Hero Copy */}
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-600/25 bg-emerald-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t.heroEyebrow}
            </motion.div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-[62px] lg:leading-[1.08] dark:text-zinc-50">
              <AnimatedWords text={t.heroTitle1} delay={0.08} />
              <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
                <AnimatedWords text={t.heroTitleAccent} delay={0.22} />
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.3 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400"
            >
              {t.heroSubtitle}
            </motion.p>

            {/* Primary & Secondary Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.38 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
            >
              <Link
                href="/dashboard"
                prefetch={true}
                data-testid="hero-main-cta"
                className="group inline-flex items-center gap-2.5 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/25 transition-colors hover:bg-emerald-700 sm:text-base dark:bg-emerald-600 dark:shadow-emerald-950/35 dark:hover:bg-emerald-500 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>{sessionUser ? t.openDashboard : t.startFree}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>

              <motion.a
                href="#calculator"
                whileHover={{ y: -2, scale: 1.015 }}
                whileTap={{ y: 1, scale: 0.97 }}
                transition={SPRING_TACTILE}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-2xs transition-colors hover:border-emerald-600/45 hover:bg-emerald-50/40 sm:text-base dark:border-zinc-800 dark:bg-[#111113] dark:text-zinc-100 dark:hover:border-emerald-500/50"
              >
                <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t.secondaryCta}</span>
              </motion.a>
            </motion.div>

            {/* Compact Metric Strip */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_SNAPPY, delay: 0.44 }}
              className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-emerald-600/15 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xs dark:border-zinc-800/80 dark:bg-[#111113]/85"
            >
              <div>
                <div className="font-mono text-xl font-extrabold text-zinc-950 sm:text-2xl dark:text-zinc-50">
                  <AnimatedNumber value={OFFICIAL_TESTS.length} />
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
                  {t.statTestsLabel}
                </div>
              </div>
              <div className="border-x border-zinc-200/80 dark:border-zinc-800/80">
                <div className="font-mono text-xl font-extrabold text-emerald-600 sm:text-2xl dark:text-emerald-400">
                  <AnimatedNumber value={OFFICIAL_TESTS.length * 40} />
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
                  {t.statQuestionsLabel}
                </div>
              </div>
              <div>
                <div className="font-mono text-xl font-extrabold text-zinc-950 sm:text-2xl dark:text-zinc-50">
                  9.0
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-zinc-500 sm:text-xs dark:text-zinc-400">
                  {t.statScoringLabel}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Executive 3-Card Interactive CDI Architecture Strip (Clean, Zero Passage Clutter) */}
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {heroModuleCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <ScrollReveal
                  key={card.id}
                  delay={0.08 + idx * 0.07}
                  direction="up"
                >
                  <SpotlightSurface
                    hoverLift
                    className="group h-full rounded-2xl p-5"
                  >
                    <Link
                      href={card.target}
                      prefetch={true}
                      className="flex h-full w-full flex-col justify-between text-left cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                            <Icon className="h-5 w-5" />
                          </span>
                          <Badge tone="emerald" mono>
                            {card.badge}
                          </Badge>
                        </div>

                        <h3 className="mt-4 text-base font-extrabold tracking-tight text-zinc-950 transition-colors group-hover:text-emerald-700 dark:text-zinc-50 dark:group-hover:text-emerald-400">
                          {card.title}
                        </h3>
                        <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {card.meta}
                        </p>
                      </div>

                      <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span>{sessionUser ? t.openDashboard : t.startFree}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </Link>
                  </SpotlightSurface>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================
          NUMBERED FEATURE SHOWCASES (01 & 02) WITH PARALLAX SCROLL
          =================================================================== */}
      <section
        id="features"
        className="space-y-24 border-t border-zinc-200/80 py-20 sm:space-y-32 sm:py-28 dark:border-zinc-800/80"
      >
        {/* FEATURE 01: Full-Length CDI Mock Tests */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <ScrollReveal direction="left" className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {t.f1Tag}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              {t.f1Title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              {t.f1Desc}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              {[t.f1Bullet1, t.f1Bullet2, t.f1Bullet3].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="right" className="lg:col-span-7">
            <ParallaxShowcase offset={18}>
              <div className="rounded-2xl border border-emerald-600/20 bg-white p-5 shadow-xl shadow-emerald-950/6 sm:p-6 dark:border-zinc-800/90 dark:bg-[#111113] dark:shadow-black/40">
                <div className="mb-4 flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
                  <div>
                    <div className="text-sm font-extrabold text-zinc-950 dark:text-zinc-100">
                      {DICT[lang].practice.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      IELTS Nova Official CDI Suite
                    </div>
                  </div>
                  <Badge tone="emerald" mono>
                    {OFFICIAL_TESTS.length} PAPERS READY
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {OFFICIAL_TESTS.filter((x) => x.skill !== "full")
                    .slice(0, 4)
                    .map((test) => {
                      const Icon =
                        test.skill === "listening" ? Headphones : BookOpen;
                      const skillLabel =
                        test.skill === "listening" ? "Listening" : "Reading";
                      return (
                        <SpotlightSurface
                          key={test.id}
                          hoverLift
                          className="group flex flex-col justify-between p-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge tone="dark" mono>
                                {test.testNumber}
                              </Badge>
                              <Badge tone="emerald" mono>
                                {skillLabel}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center gap-2.5">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-600/20 bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <Icon className="h-4 w-4" />
                              </span>
                              <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                                {test.testNumber} · {skillLabel}
                              </div>
                            </div>
                          <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              {test.durationMinutes} {tc.minutes}
                            </span>
                            <span>·</span>
                            <span>
                              {test.questionsCount} {tc.questions}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={test.routePath}
                          prefetch={true}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{tc.startTest}</span>
                        </Link>
                      </SpotlightSurface>
                    );
                  })}
                </div>
              </div>
            </ParallaxShowcase>
          </ScrollReveal>
        </div>

        {/* FEATURE 02: 40-Question Mistake Analytics & PDF Reports */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <ScrollReveal direction="left" className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-600/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
              02
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              {t.f3Title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              {t.f3Desc}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
              {[t.f3Bullet1, t.f3Bullet2, t.f3Bullet3].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </ScrollReveal>

          <ScrollReveal direction="right" className="space-y-4 lg:col-span-7">
            <ParallaxShowcase offset={18}>
              <div className="rounded-2xl border border-emerald-600/20 bg-white p-5 shadow-xl shadow-emerald-950/6 sm:p-6 dark:border-zinc-800/90 dark:bg-[#111113] dark:shadow-black/40">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Badge tone="dark" mono>
                      RAW 36 / 40
                    </Badge>
                    <Badge tone="emerald" mono>
                      BAND 8.0
                    </Badge>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <FileCheck2 className="h-4 w-4" />
                    PDF SCORE REPORT
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {[
                    {
                      q: "Q17",
                      yours: "deadly disease",
                      key: "deadly disease",
                      ok: true,
                    },
                    {
                      q: "Q33",
                      yours: "position",
                      key: "weight and position",
                      ok: false,
                    },
                    {
                      q: "Q35",
                      yours: "three axes",
                      key: "three axes",
                      ok: true,
                    },
                  ].map((r) => (
                    <motion.div
                      key={r.q}
                      whileHover={{ x: 3 }}
                      transition={SPRING_TACTILE}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-3.5 py-2.5 text-xs transition-colors hover:border-emerald-600/30 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 font-mono font-bold",
                            r.ok
                              ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                          )}
                        >
                          {r.q}
                        </span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {r.yours}
                        </span>
                      </div>
                      {!r.ok ? (
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          &rarr; {r.key}
                        </span>
                      ) : (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Section Breakdown Bars */}
                <div className="mt-4 grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Passage 1", val: 12, max: 13 },
                    { label: "Passage 2", val: 12, max: 13 },
                    { label: "Passage 3", val: 12, max: 14 },
                  ].map((sec) => (
                    <div
                      key={sec.label}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {sec.label}
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {sec.val}/{sec.max}
                        </span>
                      </div>
                      <ProgressBar
                        value={sec.val}
                        max={sec.max}
                        className="mt-2 h-1.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </ParallaxShowcase>
          </ScrollReveal>
        </div>
      </section>

      {/* ===================================================================
          INTERACTIVE OFFICIAL IELTS BAND SCORE CALCULATOR (#calculator)
          =================================================================== */}
      <section
        id="calculator"
        className="border-t border-zinc-200/80 bg-white/70 py-20 sm:py-28 dark:border-zinc-800/80 dark:bg-[#0D0D10]"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t.calcEyebrow}
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              {t.calcTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              {t.calcSubtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.08} className="mt-12">
            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-emerald-600/20 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8 lg:grid-cols-12 dark:border-zinc-800 dark:bg-[#111113]">
              {/* Sliders Column */}
              <div className="space-y-6 lg:col-span-7">
                {/* Listening Raw */}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.calcListeningRaw}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {listeningRaw} / 40 &rarr; Band {lBand.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={listeningRaw}
                    onChange={(e) => setListeningRaw(Number(e.target.value))}
                    className="nova-slider mt-3 w-full cursor-pointer"
                  />
                </div>

                {/* Reading Raw */}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.calcReadingRaw}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {readingRaw} / 40 &rarr; Band {rBand.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={readingRaw}
                    onChange={(e) => setReadingRaw(Number(e.target.value))}
                    className="nova-slider mt-3 w-full cursor-pointer"
                  />
                </div>

                {/* Writing Band */}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.calcWritingBand}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Band {writingBand.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={9}
                    step={0.5}
                    value={writingBand}
                    onChange={(e) => setWritingBand(Number(e.target.value))}
                    className="nova-slider mt-3 w-full cursor-pointer"
                  />
                </div>

                {/* Speaking Band */}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.calcSpeakingBand}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Band {speakingBand.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={9}
                    step={0.5}
                    value={speakingBand}
                    onChange={(e) => setSpeakingBand(Number(e.target.value))}
                    className="nova-slider mt-3 w-full cursor-pointer"
                  />
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.calcRuleNote}
                </p>
              </div>

              {/* Overall Band Result Display (Emerald Executive Card in Light Mode, Deep Emerald-Obsidian in Dark Mode) */}
              <div className="flex flex-col items-center justify-between rounded-2xl border border-emerald-600/30 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 p-7 text-center text-white shadow-xl shadow-emerald-600/20 lg:col-span-5 dark:border-emerald-500/25 dark:from-[#121B17] dark:via-[#0F1614] dark:to-[#0B100E] dark:shadow-black/40">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-100 dark:text-emerald-400">
                  {t.calcOverallLabel}
                </div>

                <div className="my-6 flex flex-col items-center">
                  <motion.div
                    key={overallBand}
                    initial={{ scale: 0.92, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRING_TACTILE}
                    className="font-mono text-7xl font-extrabold tracking-tight text-white"
                  >
                    <AnimatedNumber value={overallBand} decimals={1} />
                  </motion.div>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 font-mono text-xs font-bold text-white dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Award className="h-3.5 w-3.5" />
                    <span>
                      {t.calcCefrLabel}: {bandToCefr(overallBand)}
                    </span>
                  </div>
                </div>

                <div className="grid w-full grid-cols-4 gap-2 rounded-xl border border-white/20 bg-white/12 p-3 font-mono text-xs backdrop-blur-xs dark:border-white/10 dark:bg-white/5">
                  <div>
                    <div className="text-[10px] text-emerald-100/80 dark:text-zinc-400">
                      L
                    </div>
                    <div className="font-bold text-white dark:text-emerald-400">
                      {lBand.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-100/80 dark:text-zinc-400">
                      R
                    </div>
                    <div className="font-bold text-white dark:text-emerald-400">
                      {rBand.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-100/80 dark:text-zinc-400">
                      W
                    </div>
                    <div className="font-bold text-white">
                      {writingBand.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-100/80 dark:text-zinc-400">
                      S
                    </div>
                    <div className="font-bold text-white">
                      {speakingBand.toFixed(1)}
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  prefetch={true}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <span>{sessionUser ? t.openDashboard : t.startFree}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===================================================================
          3-COLUMN PRICING SECTION (#pricing)
          =================================================================== */}
      <section
        id="pricing"
        className="border-t border-zinc-200/80 py-20 sm:py-28 dark:border-zinc-800/80"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t.pricingEyebrow}
            </div>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
              {t.pricingTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              {t.pricingSubtitle}
            </p>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* FREE PLAN */}
            <ScrollReveal delay={0.04}>
              <SpotlightSurface
                hoverLift
                className="flex h-full flex-col justify-between rounded-2xl p-7"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                    {t.planFreeName}
                  </h3>
                  <p className="mt-2 min-h-[40px] text-sm text-zinc-600 dark:text-zinc-400">
                    {t.planFreeDesc}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">
                      $0
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t.perMonth}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    prefetch={true}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-emerald-600/25 bg-emerald-50/70 py-3 text-sm font-bold text-emerald-800 transition-colors hover:border-emerald-600/50 hover:bg-emerald-100/70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <span>{t.planFreeCta}</span>
                  </Link>

                  <div className="mt-7 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
                    <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      {t.navFeatures}
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {[t.planFreeF1, t.planFreeF2, t.planFreeF3].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SpotlightSurface>
            </ScrollReveal>

            {/* PRO PLAN (Highlighted Center Card in Emerald Green) */}
            <ScrollReveal delay={0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={SPRING_SNAPPY}
                className="nova-spotlight relative flex h-full flex-col justify-between rounded-2xl border-2 border-emerald-600 bg-white p-7 shadow-xl shadow-emerald-600/12 dark:border-emerald-500 dark:bg-[#111113] dark:shadow-emerald-950/25"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                      {t.planProName}
                    </h3>
                    <Badge tone="emerald" mono>
                      {t.popularBadge}
                    </Badge>
                  </div>
                  <p className="mt-2 min-h-[40px] text-sm text-zinc-600 dark:text-zinc-400">
                    {t.planProDesc}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      $13.99
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t.perMonth}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    prefetch={true}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition-colors hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 cursor-pointer"
                  >
                    <span>{t.planProCta}</span>
                  </Link>

                  <div className="mt-7 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
                    <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      {t.navFeatures}
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                      {[
                        t.planProF1,
                        t.planProF2,
                        t.planProF3,
                        t.planProF4,
                        t.planProF5,
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {/* ELITE PLAN */}
            <ScrollReveal delay={0.16}>
              <SpotlightSurface
                hoverLift
                className="flex h-full flex-col justify-between rounded-2xl p-7"
              >
                <div>
                  <h3 className="text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
                    {t.planEliteName}
                  </h3>
                  <p className="mt-2 min-h-[40px] text-sm text-zinc-600 dark:text-zinc-400">
                    {t.planEliteDesc}
                  </p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-extrabold text-zinc-950 dark:text-zinc-50">
                      $24.99
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t.perMonth}
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    prefetch={true}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-emerald-600/25 bg-emerald-50/70 py-3 text-sm font-bold text-emerald-800 transition-colors hover:border-emerald-600/50 hover:bg-emerald-100/70 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <span>{t.planEliteCta}</span>
                  </Link>

                  <div className="mt-7 border-t border-zinc-200/80 pt-6 dark:border-zinc-800/80">
                    <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                      {t.navFeatures}
                    </div>
                    <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {[
                        t.planEliteF1,
                        t.planEliteF2,
                        t.planEliteF3,
                        t.planEliteF4,
                        t.planEliteF5,
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SpotlightSurface>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===================================================================
          EXECUTIVE EMERALD BOTTOM CTA + FOOTER
          =================================================================== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal direction="scale">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 px-6 py-12 text-center text-white shadow-2xl shadow-emerald-600/20 sm:px-12 sm:py-16 dark:border-emerald-500/25 dark:from-[#121B17] dark:via-[#0E1412] dark:to-[#0A0E0C] dark:shadow-black/50">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-white/20 blur-3xl dark:bg-emerald-500/20"
              />
              <div className="relative z-10 mx-auto max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  GOOGLE VERIFIED ACCESS
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
                  {t.ctaBannerTitle}
                </h2>
                <p className="mt-3 text-sm text-emerald-50/90 sm:text-base dark:text-zinc-400">
                  {t.ctaBannerDesc}
                </p>
                <Link
                  href="/dashboard"
                  prefetch={true}
                  className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition-colors hover:bg-emerald-50 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500 cursor-pointer"
                >
                  <span>{sessionUser ? t.openDashboard : t.startFree}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="border-t border-zinc-200/80 py-10 dark:border-zinc-800/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-zinc-500 sm:flex-row sm:px-6 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" />
            <span className="hidden sm:inline">· {t.footerTagline}</span>
          </div>
          <div className="font-mono text-[11px]">
            &copy; {new Date().getFullYear()} IELTS Nova. {t.footerRights}
          </div>
        </div>
      </footer>
    </div>
  );
}
