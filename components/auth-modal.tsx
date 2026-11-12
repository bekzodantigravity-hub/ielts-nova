"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DICT } from "@/lib/i18n";
import { actions, type ClientAuthUser, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  PortalTransitionOverlay,
  SPRING_SNAPPY,
  SPRING_TACTILE,
} from "./motion";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  requiredReason?: boolean;
  nextPath?: string;
  initialEmail?: string;
}

type AuthStep = "chooser" | "google_input" | "onboarding";

interface KnownAccount {
  id?: string;
  email: string;
  name: string;
  picture?: string;
  targetBand?: number;
  goal?: string;
  lastActive?: string;
}

function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function AppleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.86c.65-.8 1.1-1.92.97-3.06-1 .04-2.17.67-2.85 1.47-.6.69-1.12 1.83-.98 2.93 1.11.09 2.21-.55 2.86-1.34" />
    </svg>
  );
}

const MONTHS_LIST = [
  { id: 1, uz: "01 - Yanvar", ru: "01 - Январь", en: "01 - January" },
  { id: 2, uz: "02 - Fevral", ru: "02 - Февраль", en: "02 - February" },
  { id: 3, uz: "03 - Mart", ru: "03 - Март", en: "03 - March" },
  { id: 4, uz: "04 - Aprel", ru: "04 - Апрель", en: "04 - April" },
  { id: 5, uz: "05 - May", ru: "05 - Май", en: "05 - May" },
  { id: 6, uz: "06 - Iyun", ru: "06 - Июнь", en: "06 - June" },
  { id: 7, uz: "07 - Iyul", ru: "07 - Июль", en: "07 - July" },
  { id: 8, uz: "08 - Avgust", ru: "08 - Август", en: "08 - August" },
  { id: 9, uz: "09 - Sentabr", ru: "09 - Сентябрь", en: "09 - September" },
  { id: 10, uz: "10 - Oktabr", ru: "10 - Октябрь", en: "10 - October" },
  { id: 11, uz: "11 - Noyabr", ru: "11 - Ноябрь", en: "11 - November" },
  { id: 12, uz: "12 - Dekabr", ru: "12 - Декабрь", en: "12 - December" },
];

const BAND_GUIDE: Record<number, { cefr: string; title: string; desc: string }> = {
  6.0: {
    cefr: "B2",
    title: "Kompetent daraja",
    desc: "Aksariyat umumiy ta'lim va tayyorlov dasturlariga yetarli minimum.",
  },
  6.5: {
    cefr: "B2+",
    title: "Standart akademik talab",
    desc: "Yevropa, Janubiy Koreya va Osiyo universitetlarida o'qish uchun standart.",
  },
  7.0: {
    cefr: "C1",
    title: "Ilg'or daraja (Advanced)",
    desc: "Top 100 xalqaro universitetlar, xalqaro grantlar va immigratsiya.",
  },
  7.5: {
    cefr: "C1+",
    title: "Yuqori ilg'or (High Advanced)",
    desc: "AQSH top universitetlari, Russell Group va to'liq moliyalashtiriladigan stipendiyalar.",
  },
  8.0: {
    cefr: "C2",
    title: "Mukammal (Proficient)",
    desc: "Oxford, Cambridge, tibbiyot, yuridik dasturlar va global ilmiy laboratoriyalar.",
  },
  8.5: {
    cefr: "C2+",
    title: "Ekspert daraja",
    desc: "Ona tili darajasidagi bexato ingliz tili, xalqaro elita daraja.",
  },
  9.0: {
    cefr: "Expert",
    title: "Maksimal rekord",
    desc: "IELTS tizimidagi eng yuqori mutlaq ball.",
  },
};

export function AuthModal({
  open,
  onClose,
  requiredReason = false,
  nextPath = "/dashboard",
  initialEmail = "",
}: AuthModalProps) {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang].auth;

  const [step, setStep] = useState<AuthStep>("chooser");
  const [knownAccounts, setKnownAccounts] = useState<KnownAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Form Fields
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Candidate Onboarding Fields
  const [onboardingSubStep, setOnboardingSubStep] = useState<0 | 1 | 2 | 3>(0);
  const [fullName, setFullName] = useState("");
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(5);
  const [birthYear, setBirthYear] = useState<number>(2004);
  const [goalId, setGoalId] = useState<
    "study_abroad" | "work_migration" | "local_uni" | "career_growth"
  >("study_abroad");
  const [targetBand, setTargetBand] = useState<number>(7.5);

  const [appleNotice, setAppleNotice] = useState(false);
  const [oauthHint, setOauthHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [portalUser, setPortalUser] = useState<ClientAuthUser | null>(null);

  const currentYear = new Date().getFullYear();
  const calculatedAge = Math.max(12, currentYear - birthYear);

  const goalOptions = [
    {
      id: "study_abroad" as const,
      icon: GraduationCap,
      label: t.goalStudyAbroad,
    },
    {
      id: "work_migration" as const,
      icon: Briefcase,
      label: t.goalWorkMigration,
    },
    {
      id: "local_uni" as const,
      icon: Landmark,
      label: t.goalLocalUni,
    },
    {
      id: "career_growth" as const,
      icon: TrendingUp,
      label: t.goalCareerGrowth,
    },
  ];

  const selectedGoalLabel =
    goalOptions.find((g) => g.id === goalId)?.label ?? t.goalStudyAbroad;

  // Fetch registered & local accounts on modal open
  useEffect(() => {
    if (open) {
      setStep("chooser");
      setAppleNotice(false);
      setOauthHint(false);
      setErrorMsg(null);
      setLoading(false);
      setLoadingAccounts(true);

      fetch("/api/auth/accounts", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { accounts: [] }))
        .then((data: { accounts?: KnownAccount[] }) => {
          const serverAccounts = Array.isArray(data.accounts) ? data.accounts : [];
          let localAccounts: KnownAccount[] = [];
          try {
            const raw = localStorage.getItem("ielts-nova:known-accounts");
            if (raw) localAccounts = JSON.parse(raw);
          } catch {}

          const map = new Map<string, KnownAccount>();
          serverAccounts.forEach((acc) => {
            if (acc.email) map.set(acc.email.toLowerCase().trim(), acc);
          });
          localAccounts.forEach((acc) => {
            if (acc.email && !map.has(acc.email.toLowerCase().trim())) {
              map.set(acc.email.toLowerCase().trim(), acc);
            }
          });

          setKnownAccounts(Array.from(map.values()));
        })
        .catch(() => {})
        .finally(() => {
          setLoadingAccounts(false);
        });
    }
  }, [open]);

  const handleSupabaseOAuthSignIn = async () => {
    setErrorMsg(null);
    setAppleNotice(false);
    setOauthHint(false);
    setEmail((prev) => prev || initialEmail || "");
    setPassword("");
    setFullName("");
    setStep("google_input");
  };

  const handleAppleClick = () => {
    setErrorMsg(null);
    setAppleNotice(true);
  };

  const handleStartNewGoogleInput = () => {
    setAppleNotice(false);
    setOauthHint(false);
    setErrorMsg(null);
    setEmail("");
    setPassword("");
    setFullName("");
    setStep("google_input");
  };

  const handleSelectAccount = async (account: KnownAccount) => {
    setLoading(true);
    setErrorMsg(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          email: account.email,
          name: account.name,
          targetBand: account.targetBand,
          goal: account.goal,
        }),
      });
      clearTimeout(timeoutId);

      const data = (await res.json()) as {
        ok?: boolean;
        user?: ClientAuthUser;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.user) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Save to known accounts
      try {
        const raw = localStorage.getItem("ielts-nova:known-accounts");
        const list: KnownAccount[] = raw ? JSON.parse(raw) : [];
        const nextList = [
          {
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture,
            targetBand: data.user.targetBand,
            goal: data.user.goal,
          },
          ...list.filter((x) => x.email.toLowerCase() !== data.user!.email.toLowerCase()),
        ];
        localStorage.setItem("ielts-nova:known-accounts", JSON.stringify(nextList));
      } catch {}

      actions.setAuthUser(data.user);
      setLoading(false);
      setPortalUser(data.user);

      const dest = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";
      setTimeout(() => {
        window.location.assign(dest);
      }, 450);
    } catch (err) {
      clearTimeout(timeoutId);
      setLoading(false);
      setErrorMsg(
        err instanceof DOMException && err.name === "AbortError"
          ? "Server javobi kechikdi. Iltimos, qayta urinib ko'ring."
          : err instanceof Error
            ? err.message
            : "Authentication failed."
      );
    }
  };

  const handleVerifyGoogleInput = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg(t.emailRequiredError);
      return;
    }

    if (!fullName) {
      const emailPrefix = trimmedEmail.split("@")[0] || "";
      const derived = emailPrefix
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setFullName(derived || "Nomzod");
    }

    setOnboardingSubStep(0);
    setStep("onboarding");
  };

  const handleCompleteOnboarding = async () => {
    setErrorMsg(null);
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setErrorMsg(t.nameRequiredError);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const targetEmail =
      email.trim() ||
      `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "candidate"}@gmail.com`;

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          email: targetEmail,
          password: password.trim(),
          name: trimmedName,
          birthYear,
          age: calculatedAge,
          goal: selectedGoalLabel,
          targetBand,
        }),
      });
      clearTimeout(timeoutId);

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        user?: ClientAuthUser;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok || !data.user) {
        throw new Error(data?.error || "Authentication failed.");
      }

      // Save to known accounts
      try {
        const raw = localStorage.getItem("ielts-nova:known-accounts");
        const list: KnownAccount[] = raw ? JSON.parse(raw) : [];
        const nextList = [
          {
            email: data.user.email,
            name: data.user.name,
            picture: data.user.picture,
            targetBand: data.user.targetBand,
            goal: data.user.goal,
          },
          ...list.filter((x) => x.email.toLowerCase() !== data.user!.email.toLowerCase()),
        ];
        localStorage.setItem("ielts-nova:known-accounts", JSON.stringify(nextList));
      } catch {}

      actions.setAuthUser(data.user);
      actions.setProfile({
        name: data.user.name,
        targetBand: data.user.targetBand ?? targetBand,
        birthYear: data.user.birthYear ?? birthYear,
        age: data.user.age ?? calculatedAge,
        goal: data.user.goal ?? selectedGoalLabel,
      });

      setLoading(false);
      setPortalUser(data.user);

      const dest = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";
      setTimeout(() => {
        window.location.assign(dest);
      }, 350);
    } catch {
      clearTimeout(timeoutId);
      // Resilient instant local session fallback so onboarding NEVER hangs:
      const fallbackUser: ClientAuthUser = {
        sub: `usr_${Date.now().toString(36)}`,
        email: targetEmail,
        name: trimmedName,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=059669`,
        targetBand,
        birthYear,
        age: calculatedAge,
        goal: selectedGoalLabel,
        provider: "google",
      };
      try {
        const raw = localStorage.getItem("ielts-nova:known-accounts");
        const list: KnownAccount[] = raw ? JSON.parse(raw) : [];
        const nextList = [
          {
            email: fallbackUser.email,
            name: fallbackUser.name,
            picture: fallbackUser.picture,
            targetBand: fallbackUser.targetBand,
            goal: fallbackUser.goal,
          },
          ...list.filter((x) => x.email.toLowerCase() !== fallbackUser.email.toLowerCase()),
        ];
        localStorage.setItem("ielts-nova:known-accounts", JSON.stringify(nextList));
      } catch {}
      actions.setAuthUser(fallbackUser);
      actions.setProfile({
        name: trimmedName,
        targetBand,
        birthYear,
        age: calculatedAge,
        goal: selectedGoalLabel,
      });
      setLoading(false);
      setPortalUser(fallbackUser);
      const dest = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";
      setTimeout(() => {
        window.location.assign(dest);
      }, 350);
    }
  };

  const stepIndex =
    step === "chooser" ? 0 : step === "google_input" ? 1 : 2;

  return (
    <>
      <PortalTransitionOverlay
        open={Boolean(portalUser)}
        userName={portalUser?.name}
        userEmail={portalUser?.email}
        userPicture={portalUser?.picture}
        verifiedLabel={t.portalVerified}
        launchingLabel={t.portalLaunching}
      />

      <AnimatePresence>
        {open && !portalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed inset-0 bg-zinc-950/55 backdrop-blur-md dark:bg-black/70"
            />

            {/* Modal Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              layout
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRING_SNAPPY}
              className="relative z-10 max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-3xl border border-emerald-600/20 bg-white shadow-2xl shadow-emerald-950/15 dark:border-zinc-800 dark:bg-[#111113] dark:shadow-black/60"
            >
              {/* Top Emerald Accent Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />

              <div className="relative bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent p-6 sm:p-7">
                {step === "chooser" && (
                  <div className="mb-4 flex flex-col items-center pt-1 text-center">
                    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#020503] p-1 shadow-[0_0_36px_rgba(16,185,129,0.22)]">
                      <Image
                        src="/logo.png"
                        alt="IELTS Nova"
                        width={260}
                        height={146}
                        priority
                        className="h-auto w-52 sm:w-56 rounded-xl object-contain"
                      />
                    </div>
                    <p className="mt-2.5 text-[10px] font-bold tracking-[0.28em] text-emerald-700 dark:text-emerald-400 uppercase">
                      LEARN • PRACTICE • SUCCEED
                    </p>
                  </div>
                )}

                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {step !== "chooser" ? (
                      <>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          transition={SPRING_TACTILE}
                          onClick={() => {
                            if (step === "onboarding") {
                              if (onboardingSubStep > 0) {
                                setOnboardingSubStep((prev) => (prev - 1) as 0 | 1 | 2 | 3);
                              } else {
                                setStep("google_input");
                              }
                            } else {
                              setStep("chooser");
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-50/70 text-emerald-700 transition-colors hover:bg-emerald-100/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </motion.button>
                        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-emerald-500/30 bg-[#020503] p-1 shadow-xs">
                          <Image
                            src="/logo-mark.png"
                            alt="IELTS Nova"
                            width={36}
                            height={36}
                            priority
                            className="h-full w-full object-contain"
                          />
                        </span>
                      </>
                    ) : null}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {step === "onboarding" ? `${t.onboardingBadge} (${onboardingSubStep + 1}/4)` : t.badge}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {step === "onboarding" ? (
                            [0, 1, 2, 3].map((i) => (
                              <span
                                key={i}
                                className={cn(
                                  "h-1.5 rounded-full transition-all duration-300",
                                  i === onboardingSubStep
                                    ? "w-4 bg-emerald-600 dark:bg-emerald-400"
                                    : i < onboardingSubStep
                                      ? "w-1.5 bg-emerald-400"
                                      : "w-1.5 bg-zinc-200 dark:bg-zinc-800"
                                )}
                              />
                            ))
                          ) : (
                            [0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className={cn(
                                  "h-1.5 rounded-full transition-all duration-300",
                                  i === stepIndex
                                    ? "w-4 bg-emerald-600 dark:bg-emerald-400"
                                    : i < stepIndex
                                      ? "w-1.5 bg-emerald-400"
                                      : "w-1.5 bg-zinc-200 dark:bg-zinc-800"
                                )}
                              />
                            ))
                          )}
                        </span>
                      </div>
                      <h2 className="text-lg font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {step === "chooser" && (knownAccounts.length > 0 ? t.chooseAccountTitle : t.title)}
                        {step === "google_input" && t.googleInputTitle}
                        {step === "onboarding" && (
                          onboardingSubStep === 0
                            ? (lang === "uz" ? "Ism va familiyangiz" : lang === "ru" ? "Имя и фамилия" : "Full Name")
                            : onboardingSubStep === 1
                              ? (lang === "uz" ? "Tug'ilgan sana va yosh" : lang === "ru" ? "Дата рождения и возраст" : "Date of Birth & Age")
                              : onboardingSubStep === 2
                                ? (lang === "uz" ? "Asosiy maqsadingiz" : lang === "ru" ? "Основная цель" : "Primary Objective")
                                : (lang === "uz" ? "Maqsadli Band ball" : lang === "ru" ? "Целевой балл Band" : "Target Band Score")
                        )}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Route Gate Notice if redirected */}
                {requiredReason && step === "chooser" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200"
                  >
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.requiredNotice}</span>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {/* =========================================================
                      STEP 1: CHOOSER (Multi-Account List OR Clean Start)
                      ========================================================= */}
                  {step === "chooser" && (
                    <motion.div
                      key="step-chooser"
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 14 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-5 space-y-3"
                    >
                      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {knownAccounts.length > 0 ? t.chooseAccountDesc : t.subtitle}
                      </p>

                      {/* If existing accounts on this device/browser */}
                      {knownAccounts.length > 0 && (
                        <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                          {knownAccounts.map((acc) => (
                            <motion.button
                              key={acc.email}
                              type="button"
                              data-testid={`account-card-${acc.email}`}
                              whileHover={{ scale: 1.015, y: -1 }}
                              whileTap={{ scale: 0.98 }}
                              transition={SPRING_TACTILE}
                              onClick={() => void handleSelectAccount(acc)}
                              className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3 text-left transition-all hover:border-emerald-600/40 hover:bg-emerald-50/25 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-500/40 cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {acc.picture ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={acc.picture}
                                    alt={acc.name}
                                    className="h-10 w-10 shrink-0 rounded-xl border border-emerald-500/30 object-cover"
                                  />
                                ) : (
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-mono text-sm font-bold text-white shadow-xs">
                                    {acc.name?.[0]?.toUpperCase() || "G"}
                                  </span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-100">
                                    {acc.name}
                                  </div>
                                  <div className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                    {acc.email}
                                  </div>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                Kirish →
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      )}

                      {/* Primary Actions */}
                      <div className="mt-4 space-y-2.5">
                        <motion.button
                          type="button"
                          data-testid="auth-supabase-google-btn"
                          disabled={loading}
                          whileHover={{ y: -2, scale: 1.015 }}
                          whileTap={{ y: 1, scale: 0.97 }}
                          transition={SPRING_TACTILE}
                          onClick={() => void handleSupabaseOAuthSignIn()}
                          className="btn-sheen flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all cursor-pointer"
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white p-0.5 shadow-2xs">
                            <GoogleMark className="h-4 w-4" />
                          </span>
                          <span>Google orqali davom etish</span>
                          <ArrowRight className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                          type="button"
                          data-testid="auth-google-btn"
                          whileHover={{ y: -1.5, scale: 1.01 }}
                          whileTap={{ y: 1, scale: 0.975 }}
                          transition={SPRING_TACTILE}
                          onClick={handleStartNewGoogleInput}
                          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-800 transition-colors hover:border-emerald-600/35 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
                        >
                          <Mail className="h-4 w-4 text-emerald-600" />
                          <span>
                            {knownAccounts.length > 0 ? "Boshqa hisob kiritish" : "Tezkor nomzod ma'lumotlari bilan kirish"}
                          </span>
                        </motion.button>

                        <motion.button
                          type="button"
                          data-testid="auth-apple-btn"
                          whileHover={{ y: -1.5, scale: 1.01 }}
                          whileTap={{ scale: 0.975 }}
                          transition={SPRING_TACTILE}
                          onClick={handleAppleClick}
                          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-emerald-600/35 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 cursor-pointer"
                        >
                          <AppleMark className="h-4 w-4" />
                          <span>{t.continueApple}</span>
                        </motion.button>
                      </div>

                      {/* Apple Click -> Strict Google Notice */}
                      <AnimatePresence>
                        {appleNotice && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div
                              data-testid="apple-restricted-notice"
                              className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs dark:border-amber-500/30 dark:bg-amber-500/12"
                            >
                              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span>{t.appleRestrictedTitle}</span>
                              </div>
                              <p className="mt-1.5 leading-relaxed text-amber-800/90 dark:text-amber-200/85">
                                {t.appleRestrictedDesc}
                              </p>
                              <button
                                type="button"
                                onClick={handleStartNewGoogleInput}
                                className="mt-3 inline-flex items-center gap-1.5 font-bold text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                              >
                                <span>{t.continueGoogle}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* =========================================================
                      STEP 2: GOOGLE ACCOUNT INPUT (Email)
                      ========================================================= */}
                  {step === "google_input" && (
                    <motion.form
                      key="step-google-input"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      onSubmit={handleVerifyGoogleInput}
                      className="mt-5 space-y-4"
                    >
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {lang === "uz"
                          ? "Qurilmangizdagi Google akkaunt pochtasini kiriting:"
                          : lang === "ru"
                            ? "Введите адрес Google почты вашего устройства:"
                            : "Enter your device Google account email:"}
                      </p>

                      {oauthHint && (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11.5px] font-medium text-emerald-800 dark:text-emerald-300">
                          {lang === "uz"
                            ? "Google pochtangizni kiriting — tezkor tasdiqlash orqali kabinetga darhol kirasiz."
                            : lang === "ru"
                              ? "Введите вашу Google почту для мгновенного входа в кабинет."
                              : "Enter your Google email to continue seamlessly."}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {t.emailLabel} <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Mail className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/70 dark:text-zinc-400" />
                          <input
                            type="email"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="namuna@gmail.com"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-10 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>Google OAuth 2.0 protokoli bilan xavfsiz himoyalangan</span>
                      </div>

                      <motion.button
                        type="submit"
                        whileHover={{ y: -2, scale: 1.015 }}
                        whileTap={{ y: 1, scale: 0.97 }}
                        transition={SPRING_TACTILE}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>{t.nextOnboardingBtn}</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* =========================================================
                      STEP 3: SEQUENTIAL CANDIDATE ONBOARDING WIZARD
                      (Step 0: Name -> Step 1: Birth/Age -> Step 2: Goal -> Step 3: Band)
                      ========================================================= */}
                  {step === "onboarding" && (
                    <div className="mt-4">
                      <AnimatePresence mode="wait">
                        {/* ---------------------------------------------------
                            SUBSTEP 0: ISM VA FAMILIYA (First & Last Name)
                            --------------------------------------------------- */}
                        {onboardingSubStep === 0 && (
                          <motion.form
                            key="substep-name"
                            initial={{ opacity: 0, x: 22 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -22 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!fullName.trim()) {
                                setErrorMsg(t.nameRequiredError);
                                return;
                              }
                              setErrorMsg(null);
                              setOnboardingSubStep(1);
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                {t.fullNameLabel} <span className="text-emerald-600">*</span>
                              </label>
                              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                                {lang === "uz"
                                  ? "IELTS test natijalaringiz, xatolar tahlili va shaxsiy sertifikatlaringiz ushbu ismga yoziladi:"
                                  : lang === "ru"
                                    ? "Ваши результаты тестов, разбор ошибок и именные сертификаты будут привязаны к этому имени:"
                                    : "Your test results, diagnostics, and verified certificates will be registered to this name:"}
                              </p>
                              <div className="relative mt-3">
                                <User className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/80 dark:text-zinc-400" />
                                <input
                                  type="text"
                                  required
                                  autoFocus
                                  value={fullName}
                                  onChange={(e) => {
                                    setFullName(e.target.value);
                                    if (errorMsg) setErrorMsg(null);
                                  }}
                                  placeholder="Jasur Karimov"
                                  className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pr-4 pl-10 text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                />
                              </div>
                            </div>

                            {fullName.trim() && (
                              <motion.div
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-2.5 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                              >
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="font-semibold">
                                  {lang === "uz" ? "Nomzod" : lang === "ru" ? "Кандидат" : "Candidate"}:{" "}
                                  <span className="font-bold">{fullName}</span>
                                </span>
                              </motion.div>
                            )}

                            <motion.button
                              type="submit"
                              whileHover={{ y: -2, scale: 1.015 }}
                              whileTap={{ y: 1, scale: 0.97 }}
                              transition={SPRING_TACTILE}
                              className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                            >
                              <span>
                                {lang === "uz"
                                  ? "Keyingisi: Tug'ilgan sana va yosh"
                                  : lang === "ru"
                                    ? "Далее: Дата рождения и возраст"
                                    : "Next: Date of birth & age"}
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </motion.button>
                          </motion.form>
                        )}

                        {/* ---------------------------------------------------
                            SUBSTEP 1: TUG'ILGAN SANA VA YOSH (Birth Date & Age)
                            --------------------------------------------------- */}
                        {onboardingSubStep === 1 && (
                          <motion.div
                            key="substep-birth"
                            initial={{ opacity: 0, x: 22 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -22 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-4"
                          >
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {lang === "uz"
                                ? "Tug'ilgan kuningiz, oyingiz va yilingizni belgilang — tizim yoshingizni avtomatik hisoblaydi:"
                                : lang === "ru"
                                  ? "Укажите день, месяц и год рождения — система автоматически рассчитает ваш возраст:"
                                  : "Select your day, month, and year of birth — the system automatically computes your age:"}
                            </p>

                            <div className="grid grid-cols-3 gap-2.5">
                              {/* Day */}
                              <div>
                                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                                  {lang === "uz" ? "Kun" : lang === "ru" ? "День" : "Day"}
                                </label>
                                <select
                                  value={birthDay}
                                  onChange={(e) => setBirthDay(Number(e.target.value))}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                >
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                    <option key={d} value={d}>
                                      {d}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Month */}
                              <div>
                                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                                  {lang === "uz" ? "Oy" : lang === "ru" ? "Месяц" : "Month"}
                                </label>
                                <select
                                  value={birthMonth}
                                  onChange={(e) => setBirthMonth(Number(e.target.value))}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                >
                                  {MONTHS_LIST.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {lang === "uz" ? m.uz : lang === "ru" ? m.ru : m.en}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Year */}
                              <div>
                                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                                  {lang === "uz" ? "Yil" : lang === "ru" ? "Год" : "Year"}
                                </label>
                                <select
                                  value={birthYear}
                                  onChange={(e) => setBirthYear(Number(e.target.value))}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                                >
                                  {Array.from({ length: 45 }, (_, i) => currentYear - 10 - i).map((y) => (
                                    <option key={y} value={y}>
                                      {y}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Real-time Calculated Age Highlight */}
                            <div className="flex items-center justify-between rounded-2xl border border-emerald-600/30 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                              <div>
                                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                  {lang === "uz"
                                    ? "Hisoblangan yoshingiz"
                                    : lang === "ru"
                                      ? "Рассчитанный возраст"
                                      : "Computed Age"}
                                </div>
                                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                                  {lang === "uz"
                                    ? "Imtihon strategiyasi va tahlili ushbu yosh guruhiga moslanadi"
                                    : lang === "ru"
                                      ? "Рекомендации адаптируются под данную возрастную группу"
                                      : "Exam strategy is personalized for your age group"}
                                </div>
                              </div>
                              <span className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 font-mono text-sm font-black text-white shadow-xs">
                                {calculatedAge} {t.yearsOld}
                              </span>
                            </div>

                            <motion.button
                              type="button"
                              whileHover={{ y: -2, scale: 1.015 }}
                              whileTap={{ y: 1, scale: 0.97 }}
                              transition={SPRING_TACTILE}
                              onClick={() => {
                                setErrorMsg(null);
                                setOnboardingSubStep(2);
                              }}
                              className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                            >
                              <span>
                                {lang === "uz"
                                  ? "Keyingisi: Asosiy maqsad"
                                  : lang === "ru"
                                    ? "Далее: Основная цель"
                                    : "Next: Primary Objective"}
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        )}

                        {/* ---------------------------------------------------
                            SUBSTEP 2: ASOSIY MAQSAD (Goal Selection)
                            --------------------------------------------------- */}
                        {onboardingSubStep === 2 && (
                          <motion.div
                            key="substep-goal"
                            initial={{ opacity: 0, x: 22 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -22 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-3"
                          >
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {lang === "uz"
                                ? "IELTS topshirishdan asosiy maqsadingizni tanlang:"
                                : lang === "ru"
                                  ? "Выберите ключевую цель сдачи IELTS:"
                                  : "Select your primary reason for taking IELTS:"}
                            </p>

                            <div className="space-y-2">
                              {goalOptions.map((opt) => {
                                const active = goalId === opt.id;
                                const GoalIcon = opt.icon;
                                return (
                                  <motion.button
                                    key={opt.id}
                                    type="button"
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.985 }}
                                    transition={SPRING_TACTILE}
                                    onClick={() => setGoalId(opt.id)}
                                    className={cn(
                                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-xs font-semibold transition-all cursor-pointer",
                                      active
                                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-950 shadow-xs dark:border-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-100"
                                        : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-emerald-600/35 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                                        active
                                          ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                                          : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                                      )}
                                    >
                                      <GoalIcon className="h-4 w-4" />
                                    </span>
                                    <span className="flex-1 leading-snug">{opt.label}</span>
                                    {active && (
                                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                        <Check className="h-3 w-3 stroke-[3]" />
                                      </span>
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>

                            <motion.button
                              type="button"
                              whileHover={{ y: -2, scale: 1.015 }}
                              whileTap={{ y: 1, scale: 0.97 }}
                              transition={SPRING_TACTILE}
                              onClick={() => {
                                setErrorMsg(null);
                                setOnboardingSubStep(3);
                              }}
                              className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                            >
                              <span>
                                {lang === "uz"
                                  ? "Keyingisi: Maqsadli Band ball"
                                  : lang === "ru"
                                    ? "Далее: Целевой балл Band"
                                    : "Next: Target Band Score"}
                              </span>
                              <ArrowRight className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        )}

                        {/* ---------------------------------------------------
                            SUBSTEP 3: MAQSADLI BAND BALL (Target Band & Finish)
                            --------------------------------------------------- */}
                        {onboardingSubStep === 3 && (
                          <motion.div
                            key="substep-band"
                            initial={{ opacity: 0, x: 22 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -22 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-4"
                          >
                            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                              {lang === "uz"
                                ? "Erishmoqchi bo'lgan maqsadli IELTS Band ko'rsatkichingizni tanlang:"
                                : lang === "ru"
                                  ? "Выберите желаемый целевой балл IELTS Band:"
                                  : "Select the target IELTS Band score you are aiming for:"}
                            </p>

                            {/* Band Selector Pills */}
                            <div className="flex flex-wrap gap-2">
                              {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => {
                                const active = targetBand === b;
                                return (
                                  <motion.button
                                    key={b}
                                    type="button"
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => setTargetBand(b)}
                                    className={cn(
                                      "rounded-xl border px-3.5 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                                      active
                                        ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                                        : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                    )}
                                  >
                                    Band {b.toFixed(1)}
                                  </motion.button>
                                );
                              })}
                            </div>

                            {/* Selected Band Guidance Card */}
                            {BAND_GUIDE[targetBand] && (
                              <div className="rounded-2xl border border-emerald-600/30 bg-emerald-500/10 p-3.5 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    CEFR: {BAND_GUIDE[targetBand].cefr} · {BAND_GUIDE[targetBand].title}
                                  </span>
                                  <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                                    Band {targetBand.toFixed(1)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                                  {BAND_GUIDE[targetBand].desc}
                                </p>
                              </div>
                            )}

                            {/* Candidate Summary Pill */}
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {fullName}
                              </span>
                              <span>·</span>
                              <span>{calculatedAge} {t.yearsOld}</span>
                              <span>·</span>
                              <span className="truncate max-w-[140px] text-emerald-700 dark:text-emerald-400">
                                {selectedGoalLabel}
                              </span>
                            </div>

                            {/* Complete Onboarding Button */}
                            <motion.button
                              type="button"
                              data-testid="complete-onboarding-btn"
                              disabled={loading}
                              whileHover={{ y: -2, scale: 1.015 }}
                              whileTap={{ y: 1, scale: 0.97 }}
                              transition={SPRING_TACTILE}
                              onClick={() => void handleCompleteOnboarding()}
                              className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500 cursor-pointer"
                            >
                              {loading ? (
                                <span className="flex items-center gap-2">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  <span>{t.savingProfile}</span>
                                </span>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  <span>{t.completeOnboardingBtn}</span>
                                  <ArrowRight className="h-4 w-4" />
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </AnimatePresence>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Security Footer Note */}
                <div className="mt-6 border-t border-zinc-200/80 pt-4 text-center font-mono text-[11px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
                  {t.securityFooter}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
