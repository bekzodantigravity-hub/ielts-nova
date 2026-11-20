"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getLocalAdminUsers,
  saveAdminSession,
  upsertLocalAdminUser,
} from "@/lib/admin-local-store";
import {
  ADMIN_SESSION_COOKIE_NAME,
  isAdminEmail,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signAdminToken,
  signSessionToken,
  verifyAdminCredentials,
} from "@/lib/auth-token";
import { DICT } from "@/lib/i18n";
import { actions, type ClientAuthUser, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
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
  initialTab?: "register" | "login";
}

type AuthTab = "register" | "login";

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
  initialTab = "register",
}: AuthModalProps) {
  const state = useAppState();
  const lang = state.lang;
  const t = DICT[lang].auth;

  const [tab, setTab] = useState<AuthTab>(initialTab);
  // Register wizard step: 0 = Email+Password, 1 = Name+Phone, 2 = Birth/Age, 3 = Goal, 4 = Target Band
  const [regStep, setRegStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Credentials
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding Profile Fields (including Phone!)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [birthDay, setBirthDay] = useState<number>(15);
  const [birthMonth, setBirthMonth] = useState<number>(5);
  const [birthYear, setBirthYear] = useState<number>(2004);
  const [goalId, setGoalId] = useState<
    "study_abroad" | "work_migration" | "local_uni" | "career_growth"
  >("study_abroad");
  const [targetBand, setTargetBand] = useState<number>(7.5);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateEmailHint, setDuplicateEmailHint] = useState(false);
  const [portalUser, setPortalUser] = useState<ClientAuthUser | null>(null);

  const currentYear = new Date().getFullYear();
  const calculatedAge = Math.max(12, currentYear - birthYear);

  const goalOptions = [
    { id: "study_abroad" as const, icon: GraduationCap, label: t.goalStudyAbroad },
    { id: "work_migration" as const, icon: Briefcase, label: t.goalWorkMigration },
    { id: "local_uni" as const, icon: Landmark, label: t.goalLocalUni },
    { id: "career_growth" as const, icon: TrendingUp, label: t.goalCareerGrowth },
  ];

  const selectedGoalLabel =
    goalOptions.find((g) => g.id === goalId)?.label ?? t.goalStudyAbroad;

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setRegStep(0);
      setErrorMsg(null);
      setDuplicateEmailHint(false);
      setLoading(false);
      if (initialEmail) setEmail(initialEmail);
      setPassword("");
    }
  }, [open, initialTab, initialEmail]);

  const finishAuthRedirect = (
    user: ClientAuthUser,
    isAdmin?: boolean,
    rawPassword?: string
  ) => {
    upsertLocalAdminUser({
      id: user.sub,
      email: user.email,
      password: rawPassword || "",
      phone: user.phone || phone.trim(),
      name: user.name,
      plan: user.plan || (isAdmin ? "elite" : "free"),
      role: isAdmin ? "admin" : user.role || "user",
      birthYear: user.birthYear ?? birthYear,
      age: user.age ?? calculatedAge,
      goal: user.goal ?? selectedGoalLabel,
      targetBand: user.targetBand ?? targetBand,
    });
    actions.setAuthUser(user);
    actions.setProfile({
      name: user.name,
      phone: user.phone,
      plan: user.plan || "free",
      targetBand: user.targetBand ?? targetBand,
      birthYear: user.birthYear ?? birthYear,
      age: user.age ?? calculatedAge,
      goal: user.goal ?? selectedGoalLabel,
    });

    setLoading(false);
    setPortalUser(user);

    const dest =
      nextPath && nextPath.startsWith("/")
        ? nextPath
        : isAdmin
          ? "/admin"
          : "/dashboard";
    setTimeout(() => {
      window.location.assign(dest);
    }, 380);
  };

  // LOGIN SUBMIT
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateEmailHint(false);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Iltimos, to'liq elektron pochta manzilini kiriting.");
      return;
    }
    if (!trimmedPass) {
      setErrorMsg("Iltimos, parolingizni kiriting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "login",
          email: trimmedEmail,
          password: trimmedPass,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        user?: ClientAuthUser;
        isAdmin?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok || !data.user) {
        throw new Error(data?.error || "Kirishda xatolik yuz berdi.");
      }

      if (data.isAdmin) {
        saveAdminSession(trimmedEmail, trimmedPass);
      }
      finishAuthRedirect(data.user, data.isAdmin, trimmedPass);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("fetch")) {
        // Fallback when webview blocks fetch
        if (await verifyAdminCredentials(trimmedEmail, trimmedPass)) {
          const { token, user } = await signSessionToken({
            sub: "usr_admin",
            email: trimmedEmail,
            name: "Bekzod (Admin)",
            plan: "elite",
            role: "admin",
            targetBand: 8.5,
          });
          const adminToken = await signAdminToken(trimmedEmail);
          document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=${SESSION_TTL_SECONDS}; SameSite=Lax`;
          document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=${adminToken}; path=/; max-age=${SESSION_TTL_SECONDS}; SameSite=Lax`;
          saveAdminSession(trimmedEmail, trimmedPass);
          finishAuthRedirect(user, true, trimmedPass);
          return;
        }
        const localMatch = getLocalAdminUsers().find(
          (u) =>
            u.email.toLowerCase() === trimmedEmail &&
            u.password === trimmedPass
        );
        if (localMatch) {
          const { token, user } = await signSessionToken({
            sub: localMatch.id,
            email: localMatch.email,
            name: localMatch.name,
            phone: localMatch.phone,
            plan: localMatch.plan,
            role: localMatch.role,
            targetBand: localMatch.targetBand,
          });
          document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=${SESSION_TTL_SECONDS}; SameSite=Lax`;
          finishAuthRedirect(user, localMatch.role === "admin", trimmedPass);
          return;
        }
        setLoading(false);
        setErrorMsg("Email yoki parol noto'g'ri.");
        return;
      }
      setLoading(false);
      setErrorMsg(
        err instanceof Error ? err.message : "Tizimga kirib bo'lmadi."
      );
    }
  };

  // REGISTER STEP 0 -> Check email availability & password length
  const handleRegisterStep0 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setDuplicateEmailHint(false);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Iltimos, to'liq elektron pochta manzilini kiriting.");
      return;
    }
    if (trimmedPass.length < 6) {
      setErrorMsg("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        exists?: boolean;
        error?: string;
      };
      if (data.exists) {
        setLoading(false);
        setDuplicateEmailHint(true);
        setErrorMsg(
          "Bu email bilan hisob allaqachon mavjud. 'Kirish' bo'limidan parolingiz bilan kiring."
        );
        return;
      }
    } catch {
      // Allow continuing; final /api/auth/google also strictly enforces uniqueness
    } finally {
      setLoading(false);
    }

    setRegStep(1);
  };

  // REGISTER STEP 1 -> Validate Full Name + Phone Number
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName.trim()) {
      setErrorMsg("Iltimos, ism va familiyangizni kiriting.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErrorMsg(
        "Iltimos, to'g'ri telefon raqamingizni kiriting (masalan: +998 90 123 45 67)."
      );
      return;
    }
    setRegStep(2);
  };

  // FINAL REGISTER SUBMIT
  const handleCompleteRegistration = async () => {
    setErrorMsg(null);
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || trimmedPass.length < 6) {
      setErrorMsg("Barcha majburiy maydonlarni to'ldiring.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "register",
          email: trimmedEmail,
          password: trimmedPass,
          name: trimmedName,
          phone: trimmedPhone,
          birthYear,
          age: calculatedAge,
          goal: selectedGoalLabel,
          targetBand,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        user?: ClientAuthUser;
        isAdmin?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok || !data.user) {
        throw new Error(data?.error || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }

      finishAuthRedirect(data.user, data.isAdmin, trimmedPass);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("fetch")) {
        if (await isAdminEmail(trimmedEmail)) {
          setLoading(false);
          setErrorMsg(
            "Bu email admin hisobiga biriktirilgan. 'Kirish' bo'limidan parolingiz bilan kiring."
          );
          return;
        }
        const { token, user } = await signSessionToken({
          sub: `usr_${Math.random().toString(36).slice(2, 10)}`,
          email: trimmedEmail,
          name: trimmedName,
          phone: trimmedPhone,
          plan: "free",
          role: "user",
          birthYear,
          age: calculatedAge,
          goal: selectedGoalLabel,
          targetBand,
          picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=059669`,
        });
        document.cookie = `${SESSION_COOKIE_NAME}=${token}; path=/; max-age=${SESSION_TTL_SECONDS}; SameSite=Lax`;
        finishAuthRedirect(user, false, trimmedPass);
        return;
      }
      setLoading(false);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Ro'yxatdan o'tishda xatolik yuz berdi."
      );
    }
  };

  const registerHeadings = [
    "Yangi hisob yaratish",
    "Ism-familiya va telefon raqam",
    "Tug'ilgan sana va yosh",
    "Asosiy maqsadingiz",
    "Maqsadli Band ball",
  ];

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
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md dark:bg-black/75"
            />

            {/* Modal Dialog */}
            <motion.div
              role="dialog"
              aria-modal="true"
              data-testid="auth-modal"
              layout
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRING_SNAPPY}
              className="relative z-10 max-h-[92vh] w-full max-w-[470px] overflow-y-auto rounded-3xl border border-emerald-600/20 bg-white shadow-2xl shadow-emerald-950/15 dark:border-zinc-800 dark:bg-[#111113] dark:shadow-black/60"
            >
              {/* Top Emerald Accent Line */}
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />

              <div className="relative bg-gradient-to-b from-emerald-500/8 via-transparent to-transparent p-6 sm:p-7">
                {/* Brand Banner on Initial Screen */}
                {(tab === "login" || regStep === 0) && (
                  <div className="mb-4 flex flex-col items-center pt-1 text-center">
                    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#020503] p-1 shadow-[0_0_32px_rgba(16,185,129,0.2)]">
                      <Image
                        src="/logo.png"
                        alt="IELTS Nova"
                        width={220}
                        height={124}
                        priority
                        className="h-auto w-44 sm:w-48 rounded-xl object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {tab === "register" && regStep > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setRegStep((prev) => (prev - 1) as 0 | 1 | 2 | 3 | 4);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-600/20 bg-emerald-50/70 text-emerald-700 transition-colors hover:bg-emerald-100/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {tab === "register"
                            ? `RO'YXATDAN O'TISH (${regStep + 1}/5)`
                            : "SHAXSIY KABINETGA KIRISH"}
                        </span>
                      </div>
                      <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {tab === "login"
                          ? "Hisobingizga kiring"
                          : registerHeadings[regStep]}
                      </h2>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Yopish"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Auth Mode Switcher Tabs (Register | Login) */}
                {regStep === 0 && (
                  <div className="mt-4 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/90">
                    <button
                      type="button"
                      data-testid="auth-tab-register"
                      onClick={() => {
                        setTab("register");
                        setErrorMsg(null);
                        setDuplicateEmailHint(false);
                      }}
                      className={cn(
                        "rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer",
                        tab === "register"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                      )}
                    >
                      Ro&apos;yxatdan o&apos;tish
                    </button>
                    <button
                      type="button"
                      data-testid="auth-tab-login"
                      onClick={() => {
                        setTab("login");
                        setErrorMsg(null);
                        setDuplicateEmailHint(false);
                      }}
                      className={cn(
                        "rounded-lg py-2 text-xs font-bold transition-colors cursor-pointer",
                        tab === "login"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                      )}
                    >
                      Kirish
                    </button>
                  </div>
                )}

                {/* Redirected Notice */}
                {requiredReason && regStep === 0 && (
                  <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-200">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Shaxsiy kabinet va testlarga kirish uchun o&apos;zingizning hisobingiz bilan kiring yoki yangi hisob oching.
                    </span>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {/* =========================================================
                      TAB: LOGIN (Email + Password)
                      ========================================================= */}
                  {tab === "login" && (
                    <motion.form
                      key="tab-login"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      onSubmit={handleLoginSubmit}
                      className="mt-4 space-y-3.5"
                    >
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Elektron pochta <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Mail className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/75 dark:text-zinc-400" />
                          <input
                            type="email"
                            data-testid="auth-login-email"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="sizning@gmail.com"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-10 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Parol <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Lock className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/75 dark:text-zinc-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            data-testid="auth-login-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Parolingizni kiriting"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-10 pl-10 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label="Parolni ko'rsatish"
                            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        data-testid="auth-login-submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>
                          {loading ? "Tekshirilmoqda..." : "Kabinetga kirish"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* =========================================================
                      TAB: REGISTER STEP 0 (Email + Password)
                      ========================================================= */}
                  {tab === "register" && regStep === 0 && (
                    <motion.form
                      key="reg-step-0"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.18 }}
                      onSubmit={handleRegisterStep0}
                      className="mt-4 space-y-3.5"
                    >
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Shaxsiy hisobingizni oching — natijalaringiz va mock testlaringiz faqat sizga biriktiriladi.
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Elektron pochta <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Mail className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/75 dark:text-zinc-400" />
                          <input
                            type="email"
                            data-testid="auth-reg-email"
                            required
                            autoFocus
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setDuplicateEmailHint(false);
                              if (errorMsg) setErrorMsg(null);
                            }}
                            placeholder="namuna@gmail.com"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-10 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Parol o&apos;ylab toping <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Lock className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/75 dark:text-zinc-400" />
                          <input
                            type={showPassword ? "text" : "password"}
                            data-testid="auth-reg-password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              if (errorMsg) setErrorMsg(null);
                            }}
                            placeholder="Kamida 6 ta belgi"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-10 pl-10 text-sm font-medium text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label="Parolni ko'rsatish"
                            className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        data-testid="auth-reg-step0-next"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>
                          {loading
                            ? "Tekshirilmoqda..."
                            : "Keyingisi: Ism va telefon raqam"}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* =========================================================
                      TAB: REGISTER STEP 1 (Ism Familiya + Telefon Raqam)
                      ========================================================= */}
                  {tab === "register" && regStep === 1 && (
                    <motion.form
                      key="reg-step-1"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleRegisterStep1}
                      className="mt-4 space-y-4"
                    >
                      <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        IELTS sertifikatlaringiz va shaxsiy profil bog&apos;lanishi uchun ism-familiyangiz hamda telefon raqamingizni kiriting:
                      </p>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Ism va familiyangiz <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <User className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/80 dark:text-zinc-400" />
                          <input
                            type="text"
                            data-testid="auth-reg-name"
                            required
                            autoFocus
                            value={fullName}
                            onChange={(e) => {
                              setFullName(e.target.value);
                              if (errorMsg) setErrorMsg(null);
                            }}
                            placeholder="Masalan: Sardor Alimov"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-10 text-sm font-bold text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Telefon raqamingiz <span className="text-emerald-600">*</span>
                        </label>
                        <div className="relative mt-1.5">
                          <Phone className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-600/80 dark:text-zinc-400" />
                          <input
                            type="tel"
                            data-testid="auth-reg-phone"
                            required
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (errorMsg) setErrorMsg(null);
                            }}
                            placeholder="+998 90 123 45 67"
                            className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-10 font-mono text-sm font-semibold text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        data-testid="auth-reg-step1-next"
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>Keyingisi: Tug&apos;ilgan sana va yosh</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* =========================================================
                      TAB: REGISTER STEP 2 (Birth Date & Age)
                      ========================================================= */}
                  {tab === "register" && regStep === 2 && (
                    <motion.div
                      key="reg-step-2"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 space-y-4"
                    >
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Tug&apos;ilgan kuningiz, oyingiz va yilingizni belgilang:
                      </p>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Kun
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

                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Oy
                          </label>
                          <select
                            value={birthMonth}
                            onChange={(e) => setBirthMonth(Number(e.target.value))}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            {MONTHS_LIST.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.uz}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                            Yil
                          </label>
                          <select
                            value={birthYear}
                            onChange={(e) => setBirthYear(Number(e.target.value))}
                            className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2.5 text-xs font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                          >
                            {Array.from({ length: 45 }, (_, i) => currentYear - 10 - i).map(
                              (y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl border border-emerald-600/30 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                        <div>
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Hisoblangan yoshingiz
                          </div>
                          <div className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                            Imtihon tavsiyalari yosh guruhingizga moslanadi
                          </div>
                        </div>
                        <span className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 font-mono text-sm font-black text-white shadow-xs">
                          {calculatedAge} {t.yearsOld}
                        </span>
                      </div>

                      <motion.button
                        type="button"
                        data-testid="auth-reg-step2-next"
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        onClick={() => setRegStep(3)}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>Keyingisi: Asosiy maqsad</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* =========================================================
                      TAB: REGISTER STEP 3 (Primary Goal)
                      ========================================================= */}
                  {tab === "register" && regStep === 3 && (
                    <motion.div
                      key="reg-step-3"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 space-y-3"
                    >
                      <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                        IELTS topshirishdan asosiy maqsadingizni tanlang:
                      </p>

                      <div className="space-y-2">
                        {goalOptions.map((opt) => {
                          const active = goalId === opt.id;
                          const GoalIcon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
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
                                    ? "border-emerald-600 bg-emerald-600 text-white"
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
                            </button>
                          );
                        })}
                      </div>

                      <motion.button
                        type="button"
                        data-testid="auth-reg-step3-next"
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        onClick={() => setRegStep(4)}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
                      >
                        <span>Keyingisi: Maqsadli Band ball</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>
                    </motion.div>
                  )}

                  {/* =========================================================
                      TAB: REGISTER STEP 4 (Target Band & Complete)
                      ========================================================= */}
                  {tab === "register" && regStep === 4 && (
                    <motion.div
                      key="reg-step-4"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 space-y-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => {
                          const active = targetBand === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setTargetBand(b)}
                              className={cn(
                                "rounded-xl border px-3.5 py-2 font-mono text-xs font-bold transition-all cursor-pointer",
                                active
                                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                              )}
                            >
                              Band {b.toFixed(1)}
                            </button>
                          );
                        })}
                      </div>

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

                      {/* Summary Pill */}
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {fullName}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{phone}</span>
                        <span>·</span>
                        <span>{calculatedAge} {t.yearsOld}</span>
                      </div>

                      <motion.button
                        type="button"
                        data-testid="complete-onboarding-btn"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        transition={SPRING_TACTILE}
                        onClick={() => void handleCompleteRegistration()}
                        className="btn-sheen mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-60 dark:hover:bg-emerald-500 cursor-pointer"
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

                {/* Error Banner */}
                {errorMsg && (
                  <div
                    data-testid="auth-error-banner"
                    className="mt-4 flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                    {duplicateEmailHint && (
                      <button
                        type="button"
                        onClick={() => {
                          setTab("login");
                          setRegStep(0);
                          setErrorMsg(null);
                          setDuplicateEmailHint(false);
                        }}
                        className="self-start rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-700 cursor-pointer"
                      >
                        Kirish bo&apos;limiga o&apos;tish →
                      </button>
                    )}
                  </div>
                )}

                {/* Security Footer */}
                <div className="mt-5 border-t border-zinc-200/80 pt-3.5 text-center font-mono text-[10.5px] text-zinc-400 dark:border-zinc-800/80 dark:text-zinc-500">
                  Har bir nomzod uchun shaxsiy himoyalangan IELTS Nova hisobi
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
