"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  actions,
  type ClientAuthUser,
  reloadFromStorage,
  useAppState,
} from "@/lib/store";
import { TEST_BY_ID, type TestId } from "@/lib/tests-registry";

export default function FullscreenTestRunnerPage() {
  const params = useParams<{ testId: string }>();
  const router = useRouter();
  const state = useAppState();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [authorized, setAuthorized] = useState(false);

  const testId = params.testId as TestId;
  const test = TEST_BY_ID[testId];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; user?: ClientAuthUser | null }) => {
        if (!active) return;
        if (data.authenticated && data.user) {
          actions.setAuthUser(data.user);
          setAuthorized(true);
          return;
        }
        if (state.authUser) {
          setAuthorized(true);
          return;
        }
        router.replace(`/?auth=required&next=/test/${testId}`);
      })
      .catch(() => {
        if (active) {
          if (state.authUser) {
            setAuthorized(true);
          } else {
            router.replace(`/?auth=required&next=/test/${testId}`);
          }
        }
      });

    return () => {
      active = false;
    };
  }, [router, testId, state.authUser]);

  useEffect(() => {
    function handleMessage(ev: MessageEvent) {
      const data = ev.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "IELTS_NOVA_PROGRESS" && data.testId === testId) {
        actions.recordProgress(
          testId,
          Number(data.answered) || 0,
          Number(data.total) || 40
        );
      } else if (data.type === "IELTS_NOVA_FULL_MOCK_SUBMIT" && data.payload) {
        const p = data.payload;
        const questionsList: any[] = [];
        const rawAnswers = p.answers || {};

        // Build 80 question items
        for (let i = 1; i <= 80; i++) {
          const isReading = i > 40;
          const prefix = isReading ? "R" : "L";
          const qNum = isReading ? i - 40 : i;
          const uAns = String(rawAnswers[prefix + qNum] || "").trim();
          questionsList.push({
            q: i,
            part: isReading ? (qNum <= 13 ? 5 : qNum <= 26 ? 6 : 7) : (qNum <= 10 ? 1 : qNum <= 20 ? 2 : qNum <= 30 ? 3 : 4),
            userAnswer: uAns,
            correctAnswer: "",
            isCorrect: false, // Updated by gradeSection in html
          });
        }

        actions.recordAttempt({
          testId: "full-mock-1",
          skill: "full",
          rawScore: (Number(p.listeningScore) || 0) + (Number(p.readingScore) || 0),
          total: 80,
          band: Number(p.overallBand) || 7.0,
          timeSpentSec: Number(p.timeSpentSec) || 3600,
          submittedAt: Date.now(),
          partScores: [Number(p.listeningScore) || 0, Number(p.readingScore) || 0],
          partTotals: [40, 40],
          questions: questionsList,
        });
      } else if (data.type === "IELTS_NOVA_ATTEMPT" && data.attempt) {
        actions.recordAttempt(data.attempt);
      } else if (
        data.type === "IELTS_NOVA_THEME" &&
        (data.theme === "dark" || data.theme === "light")
      ) {
        actions.setTheme(data.theme);
      } else if (data.type === "IELTS_NOVA_EXIT") {
        reloadFromStorage();
        router.push("/dashboard");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, testId]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage({ type: "IELTS_NOVA_SET_THEME", theme: state.theme }, "*");
    win.postMessage({ type: "IELTS_NOVA_SET_LANG", lang: state.lang }, "*");
  }, [state.theme, state.lang]);

  if (!test) {
    notFound();
  }

  if (!authorized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
        <span className="h-3 w-3 animate-ping rounded-full bg-emerald-500" />
      </div>
    );
  }

  const microTopics = test.sections
    .map((s) => `${s.labelEn}: ${s.title}`)
    .join(" | ");
  const skillLabel =
    test.skill === "listening"
      ? "Listening"
      : test.skill === "reading"
        ? "Reading"
        : "Full Mock";

  return (
    <div className="fixed inset-0 flex h-dvh w-screen flex-col overflow-hidden bg-[#FAFAFA] dark:bg-[#09090B]">
      {/* Compact Top Corner Micro-Topics Strip (only visible after Start) */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-600/20 bg-emerald-950/95 px-3 py-1 text-[10px] font-mono text-emerald-100/90">
        <span className="shrink-0 font-bold text-emerald-400">
          {test.testNumber} · {skillLabel}
        </span>
        <span
          title={microTopics}
          className="truncate text-right text-[10px] text-zinc-300"
        >
          {microTopics}
        </span>
      </div>
      <iframe
        key={test.id}
        ref={iframeRef}
        src={test.htmlPath}
        title={`${test.testNumber} · ${skillLabel}`}
        allow="fullscreen; autoplay"
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}
