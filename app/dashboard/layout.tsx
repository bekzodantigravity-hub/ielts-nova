"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Menu,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand";
import {
  PageRouteTransition,
  SPRING_SNAPPY,
  ScrollProgressBar,
} from "@/components/motion";
import { Sidebar } from "@/components/sidebar";
import { DICT, type Lang } from "@/lib/i18n";
import {
  actions,
  type ClientAuthUser,
  reloadFromStorage,
  useAppState,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const state = useAppState();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(true);

  const lang: Lang = state.lang;
  const t = DICT[lang].nav;

  // Keep the latest pathname in a ref so the session check does not depend on it.
  // Previously `pathname` was a dependency, so EVERY navigation re-ran the check:
  // a network request + store rewrite + full re-render while the new page loaded.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastVerifyAtRef = useRef(0);

  const verifyGoogleSession = useCallback(async () => {
    lastVerifyAtRef.current = Date.now();
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: ClientAuthUser | null;
      };
      if (data.authenticated && data.user) {
        actions.setAuthUser(data.user);
        setAuthChecked(true);
        return;
      }
      const curr = stateRef.current;
      // If store or local state has an active candidate, keep session uninterrupted
      if (curr.authUser || (curr.profile?.name && curr.profile.name !== "Candidate")) {
        setAuthChecked(true);
        return;
      }
      // Assign persistent candidate profile if no session exists yet
      actions.setAuthUser({
        sub: "candidate-default",
        email: "candidate@ieltsnova.uz",
        name: curr.profile.name || "Candidate",
        provider: "google",
      });
      setAuthChecked(true);
    } catch {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    void verifyGoogleSession();
    const onFocus = () => {
      reloadFromStorage();
      // Re-verify on focus, but at most once every 30s.
      if (Date.now() - lastVerifyAtRef.current > 30_000) {
        void verifyGoogleSession();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [verifyGoogleSession]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    // Clear local state and leave immediately; the logout request is capped so the
    // click never feels stuck waiting on the network.
    actions.clearAuthUser();
    const logout = fetch("/api/auth/logout", {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
    void Promise.race([
      logout,
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]).then(() => {
      window.location.href = "/";
    });
  };



  const displayName =
    state.profile.name && state.profile.name !== "Candidate"
      ? state.profile.name
      : state.authUser?.name || "Candidate";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-zinc-950 dark:bg-[#09090B] dark:text-zinc-50">
      <ScrollProgressBar />

      {/* Desktop / Wide Sidebar (lg+ so ~680px split pane stays spacious and uncramped) */}
      <motion.aside
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "sticky top-0 hidden h-screen max-h-screen shrink-0 overflow-hidden border-r border-zinc-200/90 bg-white transition-[width] duration-200 lg:block dark:border-zinc-800/90 dark:bg-[#111113]",
          collapsed ? "w-[72px]" : "w-[252px]"
        )}
      >
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </motion.aside>

      {/* Mobile / Split-Pane Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative z-10 h-full max-h-screen w-[268px] overflow-hidden border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#111113]"
            >
              <Sidebar
                isMobile
                onCloseMobile={() => setMobileOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky Executive Topbar */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-zinc-200/90 bg-white/95 px-4 backdrop-blur-md sm:px-6 dark:border-zinc-800/90 dark:bg-[#111113]/95"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:border-emerald-600/40 hover:text-emerald-600 transition-colors lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 cursor-pointer"
            >
              <Menu className="h-4 w-4 pointer-events-none" />
            </button>
            <div className="lg:hidden">
              <BrandLogo compact />
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 font-mono text-xs font-semibold text-sky-700 shadow-xs dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                {t.targetShort}:{" "}
                <span className="font-bold text-sky-700 dark:text-sky-300">
                  {state.profile.targetBand.toFixed(1)}
                </span>
              </span>
            </div>
          </div>

          {/* Right Controls: Theme Toggle + Google Profile + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              data-testid="theme-toggle"
              onClick={() => actions.toggleTheme()}
              title={state.theme === "dark" ? t.lightMode : t.darkMode}
              aria-label={state.theme === "dark" ? t.lightMode : t.darkMode}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-emerald-600/50 hover:text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-400 cursor-pointer"
            >
              <AnimatePresence mode="wait" initial={false}>
                {state.theme === "dark" ? (
                  <motion.span
                    key="dash-sun"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Sun className="h-4 w-4 pointer-events-none" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="dash-moon"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Moon className="h-4 w-4 pointer-events-none" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Google Candidate Profile */}
            <Link
              href="/dashboard/settings"
              prefetch={true}
              title={state.authUser?.email || displayName}
              className="relative z-20 cursor-pointer inline-flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 transition-colors hover:border-emerald-600/45 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-500/45"
            >
              {state.authUser?.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.authUser.picture}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="pointer-events-none h-6 w-6 rounded-md object-cover"
                />
              ) : (
                <span className="pointer-events-none flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 font-mono text-[11px] font-bold text-white shadow-2xs shadow-emerald-600/25">
                  {initials || "C"}
                </span>
              )}
              <span className="pointer-events-none hidden max-w-[130px] truncate text-xs font-semibold text-zinc-900 sm:inline dark:text-zinc-100">
                {displayName}
              </span>
            </Link>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              title={t.signOut}
              aria-label={t.signOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-red-500/40 dark:hover:text-red-400 cursor-pointer"
            >
              <LogOut className="h-4 w-4 pointer-events-none" />
            </button>
          </div>
        </motion.header>

        {/* Page Container with Fluid Route Transitions */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <PageRouteTransition routeKey={pathname}>
            {children}
          </PageRouteTransition>
        </main>
      </div>
    </div>
  );
}
