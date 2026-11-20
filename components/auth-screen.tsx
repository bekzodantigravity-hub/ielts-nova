"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { actions, type ClientAuthUser } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AuthScreenProps {
  mode: "login" | "register";
}

const TARGET_BANDS = [6.5, 7.0, 7.5, 8.0, 8.5];

export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetBand, setTargetBand] = useState(7.5);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Iltimos, to'liq elektron pochtangizni kiriting.");
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        setErrorMsg("Iltimos, ism va familiyangizni kiriting.");
        return;
      }
      if (phone.replace(/\D/g, "").length < 9) {
        setErrorMsg("Iltimos, to'g'ri telefon raqamingizni kiriting.");
        return;
      }
      if (trimmedPass.length < 6) {
        setErrorMsg("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
        return;
      }
    } else if (!trimmedPass) {
      setErrorMsg("Iltimos, parolingizni kiriting.");
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: isRegister ? "register" : "login",
          email: trimmedEmail,
          password: trimmedPass,
          name: isRegister ? fullName.trim() : undefined,
          phone: isRegister ? phone.trim() : undefined,
          targetBand: isRegister ? targetBand : undefined,
        }),
      });
      clearTimeout(timeoutId);

      const data = (await res.json()) as {
        ok?: boolean;
        user?: ClientAuthUser;
        isAdmin?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok || !data.user) {
        throw new Error(data.error || "Tizimga kirishda xatolik yuz berdi.");
      }

      actions.setAuthUser(data.user);
      router.push(data.isAdmin ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      setLoading(false);
      setErrorMsg(
        err instanceof DOMException && err.name === "AbortError"
          ? "Server javobi kechikdi. Iltimos, qayta urinib ko'ring."
          : err instanceof Error
            ? err.message
            : "Tizimga kirishda xatolik yuz berdi."
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#070D12] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
      <div className="pointer-events-none fixed -top-40 left-1/2 h-96 w-[640px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            prefetch={true}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Bosh sahifaga</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            CDI Portal
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl">
          <div className="bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent px-6 pt-8 pb-5 text-center sm:px-8">
            <div className="mx-auto inline-flex flex-col items-center">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-[#020503] p-1 shadow-[0_0_50px_rgba(16,185,129,0.28)]">
                <Image
                  src="/logo.png"
                  alt="IELTS Nova"
                  width={320}
                  height={180}
                  priority
                  className="h-auto w-56 sm:w-64 object-contain rounded-xl"
                />
              </div>
              <p className="mt-3 text-[11px] font-bold tracking-[0.28em] text-emerald-400 uppercase">
                LEARN • PRACTICE • SUCCEED
              </p>
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight text-white">
              {isRegister
                ? "Yangi nomzod hisobini yaratish"
                : "Nomzod kabinetiga kirish"}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              {isRegister
                ? "IELTS Nova rasmiy CDI sinovlari va natijalar tahliliga ulaning."
                : "Natijalar, kunlik streak va Full Mock testlaringizni davom ettiring."}
            </p>
          </div>

          <div className="px-6 pb-7 sm:px-8">
            {/* Mode Tabs */}
            <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1">
              <Link
                href="/login"
                prefetch={true}
                className={cn(
                  "rounded-lg py-2 text-center text-xs font-semibold transition-colors",
                  !isRegister
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Kirish
              </Link>
              <Link
                href="/register"
                prefetch={true}
                className={cn(
                  "rounded-lg py-2 text-center text-xs font-semibold transition-colors",
                  isRegister
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Ism va familiya <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <User className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-400/70" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Masalan, Sardor Alimov"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Telefon raqam <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Phone className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-400/70" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pr-4 pl-10 font-mono text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Elektron pochta <span className="text-emerald-400">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-400/70" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namuna@gmail.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pr-4 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300">
                  Parol <span className="text-emerald-400">*</span>
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-emerald-400/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={isRegister ? 6 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pr-10 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Parolni ko'rsatish"
                    className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300">
                    Maqsadli Band balli
                  </label>
                  <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                    {TARGET_BANDS.map((band) => (
                      <button
                        key={band}
                        type="button"
                        onClick={() => setTargetBand(band)}
                        className={cn(
                          "rounded-lg border py-1.5 font-mono text-xs font-bold transition-colors cursor-pointer",
                          targetBand === band
                            ? "border-emerald-500 bg-emerald-600/20 text-emerald-300"
                            : "border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        {band.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500 disabled:opacity-60 cursor-pointer"
              >
                <span>
                  {loading
                    ? "Tekshirilmoqda..."
                    : isRegister
                      ? "Hisob yaratish va kirish"
                      : "Kabinetga kirish"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
