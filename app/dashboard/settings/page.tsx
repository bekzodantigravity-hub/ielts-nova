"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Globe,
  LogOut,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SPRING_SNAPPY, StaggerContainer, StaggerItem } from "@/components/motion";
import { Badge, btnOutline, Card, PageHeader } from "@/components/ui";
import { DICT, translateGoal } from "@/lib/i18n";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const BAND_CHOICES = [5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
const GOAL_CHOICES = [20, 40, 80];

export default function SettingsPage() {
  const state = useAppState();
  const t = DICT[state.lang].settings;
  const authT = DICT[state.lang].auth;

  // Local form state for candidate profile
  const [name, setName] = useState(
    state.profile.name && state.profile.name !== "Candidate"
      ? state.profile.name
      : state.authUser?.name || ""
  );
  const [phone, setPhone] = useState(
    state.profile.phone || state.authUser?.phone || ""
  );
  const [birthYear, setBirthYear] = useState<number>(
    state.profile.birthYear ?? state.authUser?.birthYear ?? 2002
  );
  const [goal, setGoal] = useState(
    state.profile.goal || state.authUser?.goal || ""
  );
  const [targetBand, setTargetBand] = useState<number>(
    state.profile.targetBand ?? state.authUser?.targetBand ?? 7.5
  );
  const [examDate, setExamDate] = useState<string>(state.profile.examDate ?? "");
  const [dailyGoal, setDailyGoal] = useState<number>(state.profile.dailyGoal ?? 40);
  const [formHydratedKey, setFormHydratedKey] = useState<string>("");

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync form fields cleanly once real user session/profile hydrates
  useEffect(() => {
    const resolvedEmail = state.authUser?.email || "";
    const resolvedName =
      state.profile.name && state.profile.name !== "Candidate"
        ? state.profile.name
        : state.authUser?.name || "";
    const key = `${resolvedEmail}|${resolvedName}`;
    if (resolvedEmail && key !== formHydratedKey) {
      setName(resolvedName);
      setPhone(state.profile.phone || state.authUser?.phone || "");
      setBirthYear(state.profile.birthYear ?? state.authUser?.birthYear ?? 2002);
      setGoal(state.profile.goal || state.authUser?.goal || "");
      setTargetBand(state.profile.targetBand ?? state.authUser?.targetBand ?? 7.5);
      setExamDate(state.profile.examDate ?? "");
      setDailyGoal(state.profile.dailyGoal ?? 40);
      setFormHydratedKey(key);
    }
  }, [state.authUser, state.profile, formHydratedKey]);

  const currentYear = new Date().getFullYear();
  const calculatedAge = Math.max(12, currentYear - birthYear);

  const savedName = (
    state.profile.name && state.profile.name !== "Candidate"
      ? state.profile.name
      : state.authUser?.name || ""
  ).trim();
  const savedPhone = (state.profile.phone || state.authUser?.phone || "").trim();
  const savedBirthYear = state.profile.birthYear ?? state.authUser?.birthYear ?? 2002;
  const savedGoal = (state.profile.goal || state.authUser?.goal || "").trim();

  const isDirty =
    Boolean(formHydratedKey) &&
    (name.trim() !== savedName ||
      phone.trim() !== savedPhone ||
      birthYear !== savedBirthYear ||
      targetBand !== (state.profile.targetBand ?? state.authUser?.targetBand ?? 7.5) ||
      dailyGoal !== (state.profile.dailyGoal ?? 40) ||
      (examDate || "") !== (state.profile.examDate || "") ||
      goal.trim() !== savedGoal);

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaveStatus("error");
      setStatusMessage(authT.nameRequiredError || "Ism va familiyangizni kiriting");
      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phone.trim(),
          birthYear,
          age: calculatedAge,
          goal: goal.trim() || undefined,
          targetBand,
          examDate: examDate || null,
          dailyGoal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Profilni saqlashda xatolik yuz berdi");
      }

      // Update both client profile and auth user immediately
      actions.setProfile({
        name: trimmedName,
        phone: phone.trim(),
        birthYear,
        age: calculatedAge,
        goal: goal.trim(),
        targetBand,
        examDate: examDate || null,
        dailyGoal,
      });

      if (data.user) {
        actions.setAuthUser(data.user);
      }

      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3500);
    } catch (err) {
      setSaveStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    actions.clearAuthUser();
    window.location.href = "/";
  };

  return (
    <StaggerContainer className="space-y-6">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <div className="flex items-center gap-2.5">
            {saveStatus === "saved" ? (
              <Badge tone="emerald" mono>
                <Check className="h-3 w-3" />
                {t.saveSuccessToast}
              </Badge>
            ) : isDirty ? (
              <Badge tone="sky" mono>
                <AlertCircle className="h-3 w-3" />
                {t.unsavedChanges}
              </Badge>
            ) : null}

            <button
              type="button"
              data-testid="header-save-profile-btn"
              disabled={isSaving}
              onClick={() => void handleSaveProfile()}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer",
                isDirty
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  : "bg-emerald-600/90 text-white hover:bg-emerald-600 dark:bg-emerald-600/80"
              )}
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t.savingBtn}</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>{t.saveChangesBtn}</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {/* Verified Google Account Card */}
      {state.authUser && (
        <StaggerItem>
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {state.authUser.picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.authUser.picture}
                    alt={state.authUser.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-xl border border-emerald-500/40 object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 font-mono text-base font-bold text-white shadow-sm shadow-emerald-600/25">
                    {state.authUser.name[0]?.toUpperCase() ?? "G"}
                  </span>
                )}
                <div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t.accountSection}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-base font-bold text-zinc-950 dark:text-zinc-50">
                    <span>{state.authUser.name}</span>
                    <Badge tone="emerald" mono>
                      Paket: {(state.authUser.plan || state.profile.plan || "free").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {state.authUser.email}
                    {(state.authUser.phone || state.profile.phone) &&
                      ` · ${state.authUser.phone || state.profile.phone}`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className={btnOutline}
              >
                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{t.signOutBtn}</span>
              </button>
            </div>
          </Card>
        </StaggerItem>
      )}

      {/* Candidate Profile Card */}
      <StaggerItem>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t.profileSection}
              </h2>
            </div>
            {isDirty && (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
                <AlertCircle className="h-3 w-3" />
                {t.unsavedChanges}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Candidate Name Input */}
            <div className="sm:col-span-2">
              <label
                htmlFor="candidateName"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {t.nameLabel} <span className="text-emerald-600">*</span>
              </label>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                <input
                  id="candidateName"
                  data-testid="settings-candidate-name"
                  type="text"
                  maxLength={60}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jasur Karimov"
                  className="w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-950 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  data-testid="inline-save-profile-btn"
                  disabled={isSaving}
                  onClick={() => void handleSaveProfile()}
                  className="btn-sheen inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition-colors cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  {isSaving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t.savingBtn}</span>
                    </>
                  ) : saveStatus === "saved" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>{t.saveSuccessToast}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{t.saveChangesBtn}</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {t.nameHint}
              </p>
            </div>

            {/* Candidate Phone Number */}
            <div className="sm:col-span-2">
              <label
                htmlFor="candidatePhone"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Telefon raqam
              </label>
              <input
                id="candidatePhone"
                data-testid="settings-candidate-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="mt-1.5 w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm font-semibold text-zinc-950 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Candidate Birth Year & Calculated Age */}
            <div>
              <label
                htmlFor="candidateBirthYear"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {authT.birthYearLabel}
              </label>
              <div className="mt-1.5 flex items-center gap-2.5">
                <input
                  id="candidateBirthYear"
                  type="number"
                  min={1970}
                  max={new Date().getFullYear() - 10}
                  value={birthYear}
                  onChange={(e) => setBirthYear(Number(e.target.value))}
                  className="w-32 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-zinc-950 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {calculatedAge} {authT.yearsOld}
                </span>
              </div>
            </div>

            {/* Candidate Main Goal */}
            <div>
              <label
                htmlFor="candidateGoal"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {authT.goalLabel}
              </label>
              <input
                id="candidateGoal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Chet elda ta'lim (Bakalavr / Magistratura)"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-950 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* IELTS Target Band Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t.targetLabel}
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {BAND_CHOICES.map((b) => {
                  const active = targetBand === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setTargetBand(b)}
                      className={cn(
                        "relative rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
                        active
                          ? "text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-band-pill"
                          transition={SPRING_SNAPPY}
                          className="absolute inset-0 rounded-lg bg-emerald-600 shadow-xs shadow-emerald-600/30"
                        />
                      )}
                      <span className="relative z-10">{b.toFixed(1)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Planned Exam Date */}
            <div>
              <label
                htmlFor="examDateField"
                className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                {t.examDateLabel}
              </label>
              <input
                id="examDateField"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 font-mono text-xs text-zinc-900 outline-none transition-all focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Daily Questions Goal */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t.dailyGoalLabel}
              </label>
              <div className="mt-2 flex gap-2">
                {GOAL_CHOICES.map((g) => {
                  const active = dailyGoal === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setDailyGoal(g)}
                      className={cn(
                        "relative rounded-lg px-3.5 py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
                        active
                          ? "text-white"
                          : "border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="settings-goal-pill"
                          transition={SPRING_SNAPPY}
                          className="absolute inset-0 rounded-lg bg-emerald-600 shadow-2xs shadow-emerald-600/25"
                        />
                      )}
                      <span className="relative z-10">{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Explicit Save Action Banner & Button */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-600/20 bg-emerald-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div>
              <div className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
                {isDirty ? t.unsavedChanges : t.allSaved}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {statusMessage
                  ? statusMessage
                  : isDirty
                    ? "Kiritilgan barcha o'zgarishlar platforma va server bazasida saqlanadi."
                    : "Profil ma'lumotlari hozirgi sessiyada to'liq yangilangan."}
              </p>
            </div>

            <button
              type="button"
              data-testid="main-save-profile-btn"
              disabled={isSaving}
              onClick={() => void handleSaveProfile()}
              className={cn(
                "btn-sheen inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-colors cursor-pointer",
                isDirty
                  ? "bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  : "bg-emerald-600/80 hover:bg-emerald-600 dark:bg-emerald-600/80"
              )}
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t.savingBtn}</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>{t.saveSuccessToast}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{t.saveChangesBtn}</span>
                </>
              )}
            </button>
          </div>
        </Card>
      </StaggerItem>

      {/* Appearance & 3-Language Switcher */}
      <StaggerItem>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2.5 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80">
            <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              {t.appearanceSection}
            </h2>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t.themeLabel}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => actions.setTheme("light")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer",
                    state.theme === "light"
                      ? "border-emerald-600 bg-emerald-500/8 dark:bg-emerald-500/12"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900">
                      <Sun className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                      {t.light}
                    </span>
                  </span>
                  {state.theme === "light" && (
                    <Check className="h-4 w-4 text-emerald-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => actions.setTheme("dark")}
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 text-left transition-all cursor-pointer",
                    state.theme === "dark"
                      ? "border-emerald-500 bg-emerald-500/12"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-emerald-400">
                      <Moon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                      {t.dark}
                    </span>
                  </span>
                  {state.theme === "dark" && (
                    <Check className="h-4 w-4 text-emerald-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {t.langLabel || "Tizim tili"}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/15">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-mono text-xs font-bold text-white shadow-xs">
                    UZ
                  </span>
                  <div>
                    <div className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      O&apos;zbek tili (Lotin yozuvi)
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Rasmiy Cambridge CDI standartiga to&apos;liq moslashtirilgan interfeys
                    </div>
                  </div>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </Card>
      </StaggerItem>

      {/* Danger / Reset Local Data */}
      <StaggerItem>
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
            {t.dangerSection}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {t.dangerDesc}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className={btnOutline}
              >
                <RotateCcw className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>{t.resetBtn}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    actions.reset();
                    setConfirmingReset(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer"
                >
                  <span>{t.confirmReset}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className={btnOutline}
                >
                  <span>{t.cancel}</span>
                </button>
              </>
            )}
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}
