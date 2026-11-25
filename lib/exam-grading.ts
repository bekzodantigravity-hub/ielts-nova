import type {
  AnalyticsBucket,
  ExamAnswerItem,
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
