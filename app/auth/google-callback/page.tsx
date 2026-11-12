"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PortalTransitionOverlay } from "@/components/motion";
import { btnPrimary, Card } from "@/components/ui";
import { DICT } from "@/lib/i18n";
import { actions, type ClientAuthUser, useAppState } from "@/lib/store";

export default function GoogleOAuthCallbackPage() {
  const router = useRouter();
  const state = useAppState();
  const t = DICT[state.lang].auth;

  const [error, setError] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<ClientAuthUser | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const returnedState = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      setError(`Google OAuth error: ${oauthError}`);
      return;
    }

    if (!accessToken) {
      setError("No OAuth token received from Google.");
      return;
    }

    try {
      const expectedState = window.sessionStorage.getItem(
        "ielts_nova_oauth_state"
      );
      if (expectedState && returnedState && expectedState !== returnedState) {
        setError("OAuth state mismatch. Please retry signing in.");
        return;
      }
    } catch {
      /* ignore */
    }

    let cancelled = false;
    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (!ok || !d.ok || !d.user) {
          throw new Error(d.error || "Google token verification failed.");
        }
        actions.setAuthUser(d.user);
        setVerifiedUser(d.user);

        let dest = "/dashboard";
        try {
          const savedNext = window.sessionStorage.getItem(
            "ielts_nova_oauth_next"
          );
          if (savedNext && savedNext.startsWith("/")) dest = savedNext;
        } catch {
          /* ignore */
        }

        setTimeout(() => {
          router.replace(dest);
        }, 850);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Authentication failed."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (verifiedUser) {
    return (
      <PortalTransitionOverlay
        open
        userName={verifiedUser.name}
        userEmail={verifiedUser.email}
        userPicture={verifiedUser.picture}
        verifiedLabel={t.portalVerified}
        launchingLabel={t.portalLaunching}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-6 dark:bg-[#09090B]">
      <Card className="w-full max-w-md p-6 text-center">
        {error ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {error}
            </p>
            <Link href="/?auth=required" className={btnPrimary}>
              <span>{t.title}</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {t.verifyingGoogle}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
