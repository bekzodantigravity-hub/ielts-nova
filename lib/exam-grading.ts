import type {
  AnalyticsBucket,
  ExamAnswerItem,
  ExamSubmissionRecord,
  GradedQuestionDetail,
  SectionGradeReport,
} from "./exam-types";

export function calculateListeningBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 32) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 26) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 18) return 5.5;
  if (correct >= 16) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 11) return 4.0;
  if (correct >= 8) return 3.5;
  if (correct >= 6) return 3.0;
  if (correct >= 4) return 2.5;
  if (correct >= 2) return 2.0;
  if (correct >= 1) return 1.0;
  return 0.0;
}

export function calculateReadingAcademicBand(correct: number): number {
  if (correct >= 39) return 9.0;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8.0;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7.0;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6.0;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5.0;
  if (correct >= 13) return 4.5;
  if (correct >= 10) return 4.0;
  if (correct >= 8) return 3.5;
  if (correct >= 6) return 3.0;
  if (correct >= 4) return 2.5;
  if (correct >= 2) return 2.0;
  if (correct >= 1) return 1.0;
  return 0.0;
}

function normalizeAnswer(val: string | undefined | null): string {
  return (val ?? "")
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?'"`]+$/g, "")
    .replace(/\s+/g, " ");
}

export function countWords(text: string): number {
  const clean = text.trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

export function gradeExamSection(
  section: "listening" | "reading",
  key: ExamAnswerItem[],
  answers: Record<string, string>
): SectionGradeReport {
  const details: GradedQuestionDetail[] = [];

  // Track already-credited pair answers per pairGroupId so duplicate letters like ["A", "A"] only score once
  const pairUsed = new Map<string, Set<string>>();

  for (const item of key) {
    const rawStudent = (answers[String(item.number)] ?? "").trim();
    const normStudent = normalizeAnswer(rawStudent);
    let isCorrect = false;

    if (item.pairGroupId && item.pairAnswers && item.pairAnswers.length > 0) {
      const allowed = new Set(item.pairAnswers.map((a) => normalizeAnswer(a)));
      if (!pairUsed.has(item.pairGroupId)) {
        pairUsed.set(item.pairGroupId, new Set());
      }
      const usedSet = pairUsed.get(item.pairGroupId)!;
      if (normStudent && allowed.has(normStudent) && !usedSet.has(normStudent)) {
        isCorrect = true;
        usedSet.add(normStudent);
      }
    } else {
      const acceptedSet = new Set(item.accepted.map((a) => normalizeAnswer(a)));
      isCorrect = Boolean(normStudent && acceptedSet.has(normStudent));
    }

    details.push({
      number: item.number,
      part: item.part,
      partLabel: item.partLabel,
      questionType: item.questionType,
      studentAnswer: rawStudent,
      correctAnswer: item.displayAnswer,
      isCorrect,
    });
  }

  const rawScore = details.filter((d) => d.isCorrect).length;
  const band =
    section === "listening"
      ? calculateListeningBand(rawScore)
      : calculateReadingAcademicBand(rawScore);

  const partMap = new Map<string, { total: number; correct: number }>();
  const typeMap = new Map<string, { total: number; correct: number }>();

  for (const d of details) {
    const p = partMap.get(d.partLabel) || { total: 0, correct: 0 };
    p.total += 1;
    if (d.isCorrect) p.correct += 1;
    partMap.set(d.partLabel, p);

    const t = typeMap.get(d.questionType) || { total: 0, correct: 0 };
    t.total += 1;
    if (d.isCorrect) t.correct += 1;
    typeMap.set(d.questionType, t);
  }

  const toBuckets = (
    map: Map<string, { total: number; correct: number }>
  ): AnalyticsBucket[] =>
    Array.from(map.entries()).map(([label, v]) => ({
      label,
      total: v.total,
      correct: v.correct,
      wrong: v.total - v.correct,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

  return {
    rawScore,
    total: details.length,
    band,
    details,
    byPart: toBuckets(partMap),
    byType: toBuckets(typeMap).sort((a, b) => b.wrong - a.wrong),
  };
}

export function roundIeltsBand(val: number): number {
  if (!Number.isFinite(val)) return 0;
  const clamped = Math.max(0, Math.min(9, val));
  return Math.floor(clamped * 2 + 0.5) / 2;
}

export function computeEffectiveWritingBand(
  sub: Pick<
    ExamSubmissionRecord,
    "writingBand" | "writingTask1Band" | "writingTask2Band"
  >
): number | null {
  const t1 =
    typeof sub.writingTask1Band === "number" && Number.isFinite(sub.writingTask1Band)
      ? sub.writingTask1Band
      : null;
  const t2 =
    typeof sub.writingTask2Band === "number" && Number.isFinite(sub.writingTask2Band)
      ? sub.writingTask2Band
      : null;
  if (t1 !== null && t2 !== null) {
    return roundIeltsBand((t1 + 2 * t2) / 3);
  }
  if (typeof sub.writingBand === "number" && Number.isFinite(sub.writingBand)) {
    return roundIeltsBand(sub.writingBand);
  }
  if (t1 !== null) return roundIeltsBand(t1);
  if (t2 !== null) return roundIeltsBand(t2);
  return null;
}

export function computeOverallBandSummary(sub: ExamSubmissionRecord): {
  overall: number;
  skillCount: number;
  isFull4Skill: boolean;
  writingBand: number | null;
  speakingBand: number | null;
} {
  const writingBand = computeEffectiveWritingBand(sub);
  const speakingBand =
    typeof sub.speakingBand === "number" && Number.isFinite(sub.speakingBand)
      ? roundIeltsBand(sub.speakingBand)
      : null;

  const scores: number[] = [sub.listening.band, sub.reading.band];
  if (writingBand !== null) scores.push(writingBand);
  if (speakingBand !== null) scores.push(speakingBand);

  const avg = scores.reduce((acc, v) => acc + v, 0) / scores.length;
  return {
    overall: roundIeltsBand(avg),
    skillCount: scores.length,
    isFull4Skill: scores.length === 4,
    writingBand,
    speakingBand,
  };
}

export function compareSubmissionsForRank(
  a: ExamSubmissionRecord,
  b: ExamSubmissionRecord
): number {
  const sa = computeOverallBandSummary(a);
  const sb = computeOverallBandSummary(b);
  if (sb.overall !== sa.overall) return sb.overall - sa.overall;
  const rawA = a.listening.rawScore + a.reading.rawScore;
  const rawB = b.listening.rawScore + b.reading.rawScore;
  if (rawB !== rawA) return rawB - rawA;
  const lrA = a.listening.band + a.reading.band;
  const lrB = b.listening.band + b.reading.band;
  if (lrB !== lrA) return lrB - lrA;
  const spA = sa.speakingBand ?? -1;
  const spB = sb.speakingBand ?? -1;
  if (spB !== spA) return spB - spA;
  const wrA = sa.writingBand ?? -1;
  const wrB = sb.writingBand ?? -1;
  if (wrB !== wrA) return wrB - wrA;
  return a.fullName.localeCompare(b.fullName);
}

export function formatTashkentDateTime(iso: string): {
  date: string;
  time: string;
  label: string;
  dayKey: string;
  hourKey: string;
} {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return {
      date: "—",
      time: "—",
      label: "Sana noma'lum",
      dayKey: "unknown",
      hourKey: "unknown",
    };
  }
  // Tashkent is UTC+5 year-round (no DST)
  const tzMs = d.getTime() + 5 * 60 * 60 * 1000;
  const td = new Date(tzMs);
  const yyyy = td.getUTCFullYear();
  const mm = String(td.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(td.getUTCDate()).padStart(2, "0");
  const hh = String(td.getUTCHours()).padStart(2, "0");
  const min = String(td.getUTCMinutes()).padStart(2, "0");
  return {
    date: `${dd}.${mm}.${yyyy}`,
    time: `${hh}:${min}`,
    label: `${dd}.${mm}.${yyyy} · ${hh}:${min}`,
    dayKey: `${yyyy}-${mm}-${dd}`,
    hourKey: `${yyyy}-${mm}-${dd}_${hh}`,
  };
}

export function getSubmissionSessionInfo(sub: ExamSubmissionRecord): {
  sessionKey: string;
  sessionLabel: string;
  dateLabel: string;
  timeLabel: string;
  sortTs: number;
  mockTitle: string;
} {
  const refIso = sub.sessionStartedAt || sub.submittedAt;
  const dt = formatTashkentDateTime(refIso);
  const sortTs = Number.isFinite(new Date(refIso).getTime())
    ? new Date(refIso).getTime()
    : 0;

  if (sub.sessionId && sub.sessionId.trim()) {
    return {
      sessionKey: sub.sessionId.trim(),
      sessionLabel: sub.sessionLabel?.trim() || dt.label,
      dateLabel: dt.date,
      timeLabel: dt.time,
      sortTs,
      mockTitle: sub.mockTitle,
    };
  }

  return {
    sessionKey: `${sub.mockId}__${dt.hourKey}`,
    sessionLabel: `${dt.date} · ${dt.time.slice(0, 2)}:00`,
    dateLabel: dt.date,
    timeLabel: `${dt.time.slice(0, 2)}:00`,
    sortTs,
    mockTitle: sub.mockTitle,
  };
}
