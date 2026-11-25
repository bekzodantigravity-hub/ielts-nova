"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ClipboardList,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminMockExamsTab } from "@/components/admin/admin-mock-exams-tab";
import { AdminMockResultsTab } from "@/components/admin/admin-mock-results-tab";
import { BrandLogo } from "@/components/brand";
import {
  type AdminUserRow,
  clearAdminSession,
  deleteLocalAdminUser,
  getLocalAdminUsers,
  getSavedAdminSession,
  mergeServerAndLocalUsers,
  type PlanType,
  saveAdminSession,
  upsertLocalAdminUser,
} from "@/lib/admin-local-store";
import {
  ADMIN_SESSION_COOKIE_NAME,
  getAdminDisplayName,
  isAdminEmail,
  SESSION_TTL_SECONDS,
  signAdminToken,
  verifyAdminCredentials,
} from "@/lib/auth-token";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

const PLANS: PlanType[] = ["free", "pro", "elite"];

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 3500
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

export default function AdminPanelPage() {
  const appState = useAppState();
  const [mounted, setMounted] = useState(false);

  // Admin auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeSection, setActiveSection] = useState<
    "mock_exams" | "mock_results" | "users"
  >("mock_exams");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Users management state
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | PlanType>("all");
  const [showAllPasswords, setShowAllPasswords] = useState(true);
  const [visiblePassMap, setVisiblePassMap] = useState<Record<string, boolean>>({});
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Create / Edit User Modal state
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editOriginalEmail, setEditOriginalEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlan, setFormPlan] = useState<PlanType>("free");
  const [formTargetBand, setFormTargetBand] = useState<number>(7.5);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const localInitial = getLocalAdminUsers();
    if (localInitial.length > 0) {
      setUsers(localInitial);
    }
    try {
      const res = await fetchWithTimeout("/api/admin/users");
      if (res.ok) {
        const data = (await res.json()) as {
          ok?: boolean;
          users?: AdminUserRow[];
        };
        if (data.ok && Array.isArray(data.users)) {
          const merged = mergeServerAndLocalUsers(data.users);
          setUsers(merged);
          return;
        }
      }
      setUsers(getLocalAdminUsers());
    } catch {
      setUsers(getLocalAdminUsers());
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Verify admin session on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = getSavedAdminSession();
        if (saved && (await isAdminEmail(saved.email))) {
          if (cancelled) return;
          upsertLocalAdminUser({
            email: saved.email,
            password: saved.password || "",
            name: "Bekzod (Admin)",
            plan: "elite",
            role: "admin",
            targetBand: 8.5,
          });
          setAuthenticated(true);
          setAdminEmail(saved.email);
          setUsers(getLocalAdminUsers());
          setCheckingAuth(false);
          void fetchUsers();
          return;
        }

        const res = await fetchWithTimeout("/api/admin/session", {}, 2500);
        const data = (await res.json()) as {
          authenticated?: boolean;
          admin?: { email: string } | null;
        };
        if (!cancelled && data.authenticated && data.admin) {
          saveAdminSession(data.admin.email);
          upsertLocalAdminUser({
            email: data.admin.email,
            name: "Bekzod (Admin)",
            plan: "elite",
            role: "admin",
            targetBand: 8.5,
          });
          setAuthenticated(true);
          setAdminEmail(data.admin.email);
          void fetchUsers();
        } else if (!cancelled) {
          setAuthenticated(false);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const cleanLogin = loginEmail.trim().toLowerCase();
      const cleanPass = loginPassword.trim();

      if (!cleanLogin || !cleanPass) {
        throw new Error("Login va parolni kiriting.");
      }

      const isLocalValid = await verifyAdminCredentials(cleanLogin, cleanPass);
      let serverAccepted = false;
      let serverEmail = "";
      let serverRejectMsg = "";

      try {
        const res = await fetchWithTimeout(
          "/api/admin/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: cleanLogin,
              password: cleanPass,
            }),
          },
          3000
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          admin?: { email: string; name: string };
          error?: string;
        };
        if (res.ok && data.ok) {
          serverAccepted = true;
          serverEmail = data.admin?.email || cleanLogin;
        } else {
          serverRejectMsg = data.error || "Login yoki parol noto'g'ri!";
        }
      } catch {
        // Network / Webview fetch error — fall back cleanly to cryptographic verification
      }

      if (!serverAccepted && !isLocalValid) {
        throw new Error(serverRejectMsg || "Login yoki parol noto'g'ri!");
      }

      const resolvedEmail =
        serverEmail ||
        (cleanLogin.includes("@") ? cleanLogin : "admin@ieltsnova.uz");

      try {
        const clientAdminToken = await signAdminToken(resolvedEmail);
        document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=${clientAdminToken}; path=/; max-age=${SESSION_TTL_SECONDS}; SameSite=Lax`;
      } catch {}

      saveAdminSession(resolvedEmail, cleanPass);
      const displayAdminName = await getAdminDisplayName(resolvedEmail);
      const seeded = upsertLocalAdminUser({
        email: resolvedEmail,
        password: cleanPass,
        name: displayAdminName,
        plan: "elite",
        role: "admin",
        targetBand: 8.5,
      });

      setUsers(seeded);
      setAuthenticated(true);
      setAdminEmail(resolvedEmail);
      setLoginPassword("");
      await fetchUsers();
    } catch (err) {
      const rawMsg =
        err instanceof Error ? err.message : "Login yoki parol noto'g'ri!";
      setLoginError(
        rawMsg.toLowerCase().includes("fetch")
          ? "Login yoki parol noto'g'ri!"
          : rawMsg
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    clearAdminSession();
    try {
      document.cookie = `${ADMIN_SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    } catch {}
    try {
      await fetchWithTimeout("/api/admin/logout", { method: "POST" }, 2000);
    } catch {}
    setAuthenticated(false);
    setUsers([]);
  };

  // Instant 1-click plan update
  const handleQuickPlanChange = async (userEmail: string, nextPlan: PlanType) => {
    setUpdatingEmail(userEmail);
    try {
      const nextList = upsertLocalAdminUser({
        email: userEmail,
        plan: nextPlan,
      });
      setUsers(nextList);

      try {
        await fetchWithTimeout(
          "/api/admin/users",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originalEmail: userEmail,
              plan: nextPlan,
            }),
          },
          3000
        );
      } catch {}

      showToast(
        "ok",
        `${userEmail} paketi ${nextPlan.toUpperCase()} ga o'zgartirildi!`
      );
    } catch (err) {
      showToast(
        "err",
        err instanceof Error ? err.message : "Paketni yangilashda xatolik."
      );
    } finally {
      setUpdatingEmail(null);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditOriginalEmail("");
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormPhone("+998 ");
    setFormPlan("free");
    setFormTargetBand(7.5);
    setModalError(null);
  };

  const openEditModal = (u: AdminUserRow) => {
    setModalMode("edit");
    setEditOriginalEmail(u.email);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword(u.password || "");
    setFormPhone(u.phone || "");
    setFormPlan(u.plan);
    setFormTargetBand(u.targetBand || 7.5);
    setModalError(null);
  };

  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSaving(true);

    try {
      const cleanName = formName.trim();
      const cleanEmail = formEmail.trim().toLowerCase();
      const cleanPassword = formPassword.trim();
      const cleanPhone = formPhone.trim();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("To'g'ri email manzilini kiriting.");
      }
      if (!cleanName) {
        throw new Error("Foydalanuvchi ism-familiyasini kiriting.");
      }
      if (modalMode === "create" && cleanPassword.length < 4) {
        throw new Error("Parol kamida 4 ta belgidan iborat bo'lsin.");
      }

      const role = (await isAdminEmail(cleanEmail)) ? "admin" : "user";

      if (modalMode === "create") {
        const nextList = upsertLocalAdminUser({
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          phone: cleanPhone,
          plan: formPlan,
          role,
          targetBand: formTargetBand,
        });
        setUsers(nextList);

        try {
          await fetchWithTimeout(
            "/api/admin/users",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: cleanName,
                email: cleanEmail,
                password: cleanPassword,
                phone: cleanPhone,
                plan: formPlan,
                targetBand: formTargetBand,
              }),
            },
            3000
          );
        } catch {}

        showToast("ok", "Yangi foydalanuvchi muvaffaqiyatli qo'shildi!");
      } else if (modalMode === "edit") {
        const nextList = upsertLocalAdminUser(
          {
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            phone: cleanPhone,
            plan: formPlan,
            role,
            targetBand: formTargetBand,
          },
          editOriginalEmail
        );
        setUsers(nextList);

        try {
          await fetchWithTimeout(
            "/api/admin/users",
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                originalEmail: editOriginalEmail,
                name: cleanName,
                email: cleanEmail,
                password: cleanPassword,
                phone: cleanPhone,
                plan: formPlan,
                targetBand: formTargetBand,
              }),
            },
            3000
          );
        } catch {}

        showToast("ok", "Foydalanuvchi ma'lumotlari saqlandi!");
      }

      setModalMode(null);
      void fetchUsers();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Saqlashda xatolik yuz berdi."
      );
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    setUpdatingEmail(email);
    try {
      if (await isAdminEmail(email)) {
        throw new Error("Asosiy admin hisobini o'chirib bo'lmaydi.");
      }
      const nextList = deleteLocalAdminUser(email);
      setUsers(nextList);
      setConfirmDeleteEmail(null);

      try {
        await fetchWithTimeout(
          "/api/admin/users",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
          3000
        );
      } catch {}

      showToast("ok", `${email} o'chirildi.`);
    } catch (err) {
      showToast("err", err instanceof Error ? err.message : "O'chirib bo'lmadi.");
    } finally {
      setUpdatingEmail(null);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, planFilter]);

  const stats = useMemo(() => {
    let free = 0;
    let pro = 0;
    let elite = 0;
    for (const u of users) {
      if (u.plan === "pro") pro += 1;
      else if (u.plan === "elite") elite += 1;
      else free += 1;
    }
    return { total: users.length, free, pro, elite };
  }, [users]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <span>Shaxsiy Adminlar paneli tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ADMIN LOGIN GATE
  // =========================================================================
  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-10 text-zinc-100">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#111113] px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-600 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Bosh sahifaga</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#111113] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Shield className="h-3.5 w-3.5" />
              SHAXSIY ADMINLAR
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#111113] shadow-2xl">
            <div className="p-7">
              <div className="mb-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-[#18181b] text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="mt-4 text-xl font-bold tracking-tight text-white">
                  Shaxsiy Adminlar Paneli
                </h1>
                <p className="mt-1.5 text-xs text-zinc-400">
                  Admin panelga kirish uchun login va parolingizni kiriting.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Login
                  </label>
                  <div className="relative mt-1.5">
                    <User className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      data-testid="admin-login-email"
                      required
                      autoFocus
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Login"
                      className="w-full rounded-lg border border-zinc-800 bg-[#18181b] py-3 pr-4 pl-10 text-sm font-medium text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Parol
                  </label>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-zinc-500" />
                    <input
                      type={showLoginPass ? "text" : "password"}
                      data-testid="admin-login-password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Parol"
                      className="w-full rounded-lg border border-zinc-800 bg-[#18181b] py-3 pr-10 pl-10 text-sm font-medium text-white placeholder:text-zinc-600 focus:border-zinc-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass((v) => !v)}
                      className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      {showLoginPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div
                    data-testid="admin-login-error"
                    className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-xs font-medium text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="admin-login-submit"
                  disabled={loginLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {loginLoading ? "Tekshirilmoqda..." : "Admin panelga kirish"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="dark min-h-screen bg-[#09090b] text-zinc-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={cn(
              "fixed top-20 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur-md",
              toast.type === "ok"
                ? "border-zinc-700 bg-white text-zinc-950"
                : "border-red-800 bg-red-950 text-red-200"
            )}
          >
            {toast.type === "ok" ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Sticky Serious Dark Admin Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#111113]/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo href="/dashboard" subtitle="CDI ADMIN" />
            <span className="hidden items-center gap-1.5 rounded border border-zinc-700 bg-[#18181b] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              PROCTOR &amp; ADMIN
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-zinc-800 bg-[#18181b] px-2.5 py-1.5 font-mono text-[11px] font-medium text-zinc-400 md:inline">
              {adminEmail}
            </span>

            <Link
              href="/exam"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700 bg-[#18181b] px-3 text-xs font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">/exam Zali</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kabinet</span>
            </Link>

            <button
              type="button"
              data-testid="admin-logout-btn"
              onClick={() => void handleAdminLogout()}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#18181b] px-3 text-xs font-semibold text-zinc-300 hover:border-red-800 hover:bg-red-950/40 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>

        {/* Admin Section Tabs */}
        <div className="mx-auto mt-3 flex max-w-7xl flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            data-testid="admin-tab-mock-exams"
            onClick={() => setActiveSection("mock_exams")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition",
              activeSection === "mock_exams"
                ? "bg-white text-zinc-950"
                : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-600 hover:text-white"
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Mock Exams</span>
          </button>

          <button
            type="button"
            data-testid="admin-tab-mock-results"
            onClick={() => setActiveSection("mock_results")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition",
              activeSection === "mock_results"
                ? "bg-white text-zinc-950"
                : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-600 hover:text-white"
            )}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Mock Natijalari</span>
          </button>

          <button
            type="button"
            data-testid="admin-tab-users"
            onClick={() => setActiveSection("users")}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition",
              activeSection === "users"
                ? "bg-white text-zinc-950"
                : "border border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-600 hover:text-white"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Foydalanuvchilar ({stats.total})</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {activeSection === "mock_exams" && (
          <AdminMockExamsTab onToast={showToast} />
        )}

        {activeSection === "mock_results" && (
          <AdminMockResultsTab onToast={showToast} />
        )}

        {activeSection === "users" && (
          <>
            {/* Title Row */}
            <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              Shaxsiy Adminlar — Foydalanuvchilar Boshqaruvi
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Saytga kirgan barcha foydalanuvchilarning ism-familiyasi, emaili, paroli, telefon raqami va paketlarini real vaqtda sozlang.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-bold text-zinc-700 hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loadingUsers && "animate-spin")} />
              <span>Yangilash</span>
            </button>
            <button
              type="button"
              data-testid="admin-add-user-btn"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-700 dark:hover:bg-emerald-500 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Foydalanuvchi qo&apos;shish</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#111113]">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Jami foydalanuvchilar</span>
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div
              data-testid="admin-stat-total"
              className="mt-2 font-mono text-3xl font-black text-zinc-950 dark:text-white"
            >
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#111113]">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Free Paket</span>
              <User className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="mt-2 font-mono text-3xl font-black text-zinc-700 dark:text-zinc-200">
              {stats.free}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-4 shadow-2xs dark:border-emerald-800/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span>Pro Paket</span>
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {stats.pro}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/40 p-4 shadow-2xs dark:border-amber-800/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span>Elite Paket</span>
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 font-mono text-3xl font-black text-amber-700 dark:text-amber-400">
              {stats.elite}
            </div>
          </div>
        </div>

        {/* Search + Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-[#111113]">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-3 left-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              data-testid="admin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism, email yoki telefon raqam bo'yicha qidirish..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-10 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["all", "free", "pro", "elite"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlanFilter(p)}
                className={cn(
                  "rounded-xl px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors cursor-pointer",
                  planFilter === p
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                )}
              >
                {p === "all" ? "Barchasi" : p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowAllPasswords((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
            >
              {showAllPasswords ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              <span>{showAllPasswords ? "Parollarni yashirish" : "Parollarni ko'rish"}</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-[#111113]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/90 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
                  <th className="py-3.5 pr-3 pl-5">Foydalanuvchi</th>
                  <th className="px-4 py-3.5">Email &amp; Parol</th>
                  <th className="px-4 py-3.5">Telefon raqam</th>
                  <th className="px-4 py-3.5">Paket (Sozlash)</th>
                  <th className="px-4 py-3.5">Sana</th>
                  <th className="py-3.5 pr-5 pl-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400"
                    >
                      Hech qanday foydalanuvchi topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const passVisible = showAllPasswords || Boolean(visiblePassMap[u.email]);
                    const isBusy = updatingEmail === u.email;
                    const createdLabel = u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("uz-UZ", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    return (
                      <tr
                        key={u.email}
                        data-testid={`admin-user-row-${u.email}`}
                        className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                      >
                        {/* User Info */}
                        <td className="py-4 pr-3 pl-5 align-top">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 font-mono text-sm font-black text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                              {(u.name?.[0] || "U").toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-bold text-zinc-950 dark:text-zinc-100">
                                <span className="truncate">{u.name}</span>
                                {u.role === "admin" && (
                                  <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[9px] font-black text-white">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="mt-0.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                Band maqsad: {u.targetBand.toFixed(1)} · Testlar: {u.attemptsCount}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email & Password */}
                        <td className="px-4 py-4 align-top">
                          <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {u.email}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                              {u.password
                                ? passVisible
                                  ? u.password
                                  : "••••••••"
                                : "Parolsiz (eski)"}
                            </span>
                            {u.password && !showAllPasswords && (
                              <button
                                type="button"
                                onClick={() =>
                                  setVisiblePassMap((prev) => ({
                                    ...prev,
                                    [u.email]: !prev[u.email],
                                  }))
                                }
                                className="text-zinc-400 hover:text-emerald-600 cursor-pointer"
                              >
                                {passVisible ? (
                                  <EyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-4 align-top">
                          {u.phone ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                              <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-xs italic text-zinc-400">
                              Kiritilmagan
                            </span>
                          )}
                        </td>

                        {/* Instant Package Switcher */}
                        <td className="px-4 py-4 align-top">
                          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
                            {PLANS.map((p) => {
                              const active = u.plan === p;
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  data-testid={`plan-btn-${u.email}-${p}`}
                                  disabled={isBusy}
                                  onClick={() =>
                                    !active && void handleQuickPlanChange(u.email, p)
                                  }
                                  className={cn(
                                    "rounded-lg px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase transition-colors cursor-pointer disabled:opacity-50",
                                    active
                                      ? p === "elite"
                                        ? "bg-amber-500 text-white shadow-xs"
                                        : p === "pro"
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-950"
                                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                  )}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4 align-top font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {createdLabel}
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-5 pl-3 text-right align-top">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              data-testid={`admin-edit-${u.email}`}
                              onClick={() => openEditModal(u)}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-500/50 hover:text-emerald-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Tahrirlash</span>
                            </button>

                            {u.role !== "admin" && (
                              confirmDeleteEmail === u.email ? (
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteUser(u.email)}
                                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 cursor-pointer"
                                  >
                                    Ha
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteEmail(null)}
                                    className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                                  >
                                    Yo&apos;q
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteEmail(u.email)}
                                  title="O'chirish"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:hover:border-red-900 dark:hover:bg-red-950/40 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </main>

      {/* =====================================================================
          CREATE / EDIT USER MODAL
         ===================================================================== */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalMode(null)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-[#111113]"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h2 className="text-base font-extrabold text-zinc-950 dark:text-white">
                  {modalMode === "create"
                    ? "Yangi foydalanuvchi qo'shish"
                    : "Foydalanuvchini tahrirlash"}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleModalSave} className="space-y-4 p-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Ism va familiya *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Sardor Alimov"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Elektron pochta (Email) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Parol {modalMode === "create" ? "*" : "(o'zgartirish uchun yozing)"}
                  </label>
                  <input
                    type="text"
                    required={modalMode === "create"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Parol"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Telefon raqam
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 font-mono text-sm text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Paket (Tarif)
                    </label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as PlanType)}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="elite">ELITE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Maqsadli Band
                    </label>
                    <select
                      value={formTargetBand}
                      onChange={(e) => setFormTargetBand(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-sm font-bold text-zinc-950 focus:border-emerald-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      {[6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map((b) => (
                        <option key={b} value={b}>
                          Band {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {modalError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-700 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    data-testid="admin-modal-save-btn"
                    disabled={modalSaving}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {modalSaving ? "Saqlanmoqda..." : "Saqlash"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
