"use client";

import { jsPDF } from "jspdf";
import {
  compareSubmissionsForRank,
  computeEffectiveWritingBand,
  computeOverallBandSummary,
  formatTashkentDateTime,
} from "./exam-grading";
import type { ExamSubmissionRecord, SectionGradeReport } from "./exam-types";

function sanitizePdfText(text: string): string {
  return (text || "")
    .replace(/[\u2018\u2019\u02BB\u02BC`]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00B7/g, "|")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatWritingCell(sub: ExamSubmissionRecord): string {
  const eff = computeEffectiveWritingBand(sub);
  if (eff === null) return "Pending";
  const t1 =
    typeof sub.writingTask1Band === "number" && Number.isFinite(sub.writingTask1Band)
      ? sub.writingTask1Band
      : null;
  const t2 =
    typeof sub.writingTask2Band === "number" && Number.isFinite(sub.writingTask2Band)
      ? sub.writingTask2Band
      : null;
  if (t1 !== null && t2 !== null) {
    return `${eff.toFixed(1)} (T1 ${t1.toFixed(1)} / T2 ${t2.toFixed(1)})`;
  }
  if (t1 !== null) {
    return `${eff.toFixed(1)} (T1 ${t1.toFixed(1)})`;
  }
  return `${eff.toFixed(1)} (T1 ${eff.toFixed(1)})`;
}

export interface GroupPdfOptions {
  centreName?: string;
  sessionTitle?: string;
  sessionDateTimeLabel?: string;
}

/**
 * Generates and downloads an editorial multi-student ranked PDF table
 * matching the official learning-centre Mock Test Results report format.
 */
export function downloadGroupResultsPdfReport(
  submissions: ExamSubmissionRecord[],
  options: GroupPdfOptions = {}
): void {
  if (!submissions.length) return;

  const ranked = [...submissions].sort(compareSubmissionsForRank);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const centreName = sanitizePdfText(
    options.centreName?.trim() || "IELTS Nova Learning Centre"
  );
  const sessionDateLabel = sanitizePdfText(
    options.sessionDateTimeLabel?.trim() ||
      formatTashkentDateTime(ranked[0].sessionStartedAt || ranked[0].submittedAt).label
  );
  const sessionTitle = sanitizePdfText(
    options.sessionTitle?.trim() || ranked[0].mockTitle || "Official CDI Mock Exam"
  );

  // Aggregate summary KPIs
  const totalStudents = ranked.length;
  const summaries = ranked.map((s) => computeOverallBandSummary(s));
  const full4SkillCount = summaries.filter((s) => s.isFull4Skill).length;
  const writingGradedCount = summaries.filter((s) => s.writingBand !== null).length;
  const secondMetricCount = full4SkillCount > 0 ? full4SkillCount : writingGradedCount;
  const secondMetricLabel =
    full4SkillCount > 0 ? "FULL 4-SKILL RESULTS" : "WRITING GRADED";

  const avgRaw =
    summaries.reduce((acc, s) => acc + s.overall, 0) / Math.max(1, totalStudents);
  const topBand = Math.max(...summaries.map((s) => s.overall));

  // Page 1 Header: Editorial Serif Title
  doc.setTextColor(28, 25, 23);
  doc.setFont("times", "bold");
  doc.setFontSize(21);
  doc.text(`Mock Test Results - ${centreName}`, 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(120, 113, 108);
  doc.text(`${sessionTitle}   |   ${sessionDateLabel}`, 105, 26.5, {
    align: "center",
  });

  // 4-Column Warm Cream KPI Strip
  const kpiX = 14;
  const kpiY = 31;
  const kpiW = 182;
  const kpiH = 21;
  doc.setFillColor(246, 244, 239);
  doc.setDrawColor(231, 226, 216);
  doc.setLineWidth(0.3);
  doc.roundedRect(kpiX, kpiY, kpiW, kpiH, 1.5, 1.5, "FD");

  const kpis = [
    { value: String(totalStudents), label: "STUDENTS" },
    { value: String(secondMetricCount), label: secondMetricLabel },
    { value: `~${avgRaw.toFixed(1)}`, label: "CLASS AVERAGE BAND" },
    { value: topBand.toFixed(1), label: "TOP BAND ACHIEVED" },
  ];

  const colWidth = kpiW / 4;
  kpis.forEach((k, idx) => {
    const cx = kpiX + idx * colWidth + colWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16.5);
    doc.setTextColor(154, 75, 44); // warm rust-brown
    doc.text(k.value, cx, kpiY + 10.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(120, 113, 108);
    doc.text(k.label, cx, kpiY + 16.8, { align: "center" });
  });

  // "How to read this" note
  let y = 58.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(68, 64, 60);
  doc.text("How to read this:", 14, y);
  const introOffset = doc.getTextWidth("How to read this: ");

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 96, 92);
  const noteFirstLine =
    "Listening and Reading are raw scores out of 40, converted to bands with the standard Academic conversion scale.";
  const noteRest =
    "Writing combines Task 1 and Task 2 using official weighting (Task 2 counts double when both tasks are present). Overall Band is the rounded average of all recorded skills. Because raw-score conversion is an approximation, treat every band as a close estimate (+/-0.5), not an official score.";

  doc.text(noteFirstLine, 14 + introOffset, y);
  y += 4;
  const wrappedRest = doc.splitTextToSize(noteRest, 182);
  doc.text(wrappedRest, 14, y);
  y += wrappedRest.length * 3.8 + 5;

  // Section Heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(154, 75, 44);
  const sectionBanner = `FULL RESULTS - RANKED BY OVERALL BAND (${sessionDateLabel.toUpperCase()})`;
  doc.text(sectionBanner.slice(0, 95), 14, y);
  y += 3.5;

  // Table Geometry (total width = 182mm, x = 14..196)
  const cols = {
    rank: { x: 14, w: 10 },
    student: { x: 24, w: 50 },
    listening: { x: 74, w: 24 },
    reading: { x: 98, w: 24 },
    speaking: { x: 122, w: 20 },
    writing: { x: 142, w: 34 },
    overall: { x: 176, w: 20 },
  };
  const headerH = 7.4;
  const rowH = 7.2;
  const pageBottomY = 276;

  const drawTableHeader = (topY: number) => {
    doc.setFillColor(20, 20, 22);
    doc.rect(14, topY, 182, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);
    const textY = topY + 5;
    doc.text("#", cols.rank.x + 2.5, textY);
    doc.text("STUDENT", cols.student.x + 2, textY);
    doc.text("LISTENING", cols.listening.x + 2, textY);
    doc.text("READING", cols.reading.x + 2, textY);
    doc.text("SPEAKING", cols.speaking.x + 2, textY);
    doc.text("WRITING", cols.writing.x + 2, textY);
    doc.text("OVERALL", cols.overall.x + cols.overall.w / 2, textY, {
      align: "center",
    });
  };

  drawTableHeader(y);
  let tableStartY = y;
  y += headerH;

  ranked.forEach((sub, idx) => {
    if (y + rowH > pageBottomY) {
      // Close outer border on current page
      doc.setDrawColor(218, 214, 206);
      doc.setLineWidth(0.25);
      doc.rect(14, tableStartY, 182, y - tableStartY, "S");

      doc.addPage();
      y = 18;
      tableStartY = y;
      drawTableHeader(y);
      y += headerH;
    }

    const summary = summaries[idx];
    if (idx % 2 === 1) {
      doc.setFillColor(248, 247, 244);
      doc.rect(14, y, 182, rowH, "F");
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(14, y, 182, rowH, "F");
    }

    // Subtle row divider
    doc.setDrawColor(232, 229, 222);
    doc.setLineWidth(0.2);
    doc.line(14, y + rowH, 196, y + rowH);

    const textY = y + 4.9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(39, 39, 42);

    doc.text(String(idx + 1), cols.rank.x + 2.5, textY);

    const cleanName = sanitizePdfText(sub.fullName);
    const displayName =
      cleanName.length > 29 ? `${cleanName.slice(0, 28)}.` : cleanName;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(24, 24, 27);
    doc.text(displayName, cols.student.x + 2, textY);

    doc.setTextColor(52, 52, 58);
    doc.text(
      `${sub.listening.band.toFixed(1)} (L${sub.listening.rawScore})`,
      cols.listening.x + 2,
      textY
    );
    doc.text(
      `${sub.reading.band.toFixed(1)} (R${sub.reading.rawScore})`,
      cols.reading.x + 2,
      textY
    );
    doc.text(
      summary.speakingBand !== null ? summary.speakingBand.toFixed(1) : "-",
      cols.speaking.x + 2,
      textY
    );
    doc.setFontSize(7.8);
    doc.text(formatWritingCell(sub), cols.writing.x + 2, textY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);
    doc.setTextColor(17, 17, 19);
    doc.text(
      summary.overall.toFixed(1),
      cols.overall.x + cols.overall.w / 2,
      textY,
      { align: "center" }
    );

    y += rowH;
  });

  // Outer border for final table chunk
  doc.setDrawColor(218, 214, 206);
  doc.setLineWidth(0.25);
  doc.rect(14, tableStartY, 182, y - tableStartY, "S");

  // Page Footers across all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(214, 211, 203);
    doc.setLineWidth(0.25);
    doc.line(14, 281, 196, 281);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(120, 113, 108);
    doc.text(`${centreName}  |  IELTS mock exam  |  ${sessionDateLabel}`, 14, 286);
    doc.text(
      totalPages > 1 ? `Page ${p} of ${totalPages}` : `Page ${p}`,
      196,
      286,
      { align: "right" }
    );
  }

  const safeSlug = sanitizePdfText(sessionDateLabel)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  doc.save(`Mock_Test_Results_${safeSlug || "All"}.pdf`);
}

function drawSectionAnswerSheet(
  doc: jsPDF,
  title: string,
  section: SectionGradeReport
) {
  doc.addPage();
  let y = 16;

  doc.setFillColor(17, 17, 19);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(sanitizePdfText(title), 14, 15);
  doc.setFontSize(10);
  doc.text(
    `Band ${section.band.toFixed(1)}  |  ${section.rawScore}/${section.total}`,
    196,
    15,
    { align: "right" }
  );

  y = 32;
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Error Analytics by Part & Question Type", 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const partLine = section.byPart
    .map((p) => `${p.label}: ${p.correct}/${p.total} (${p.accuracy}%)`)
    .join("   |   ");
  doc.text(sanitizePdfText(partLine), 14, y);
  y += 5;

  const typeLines = section.byType
    .map((t) => `${t.label}: ${t.wrong} wrong (${t.correct}/${t.total})`)
    .join("  |  ");
  const wrappedTypes = doc.splitTextToSize(sanitizePdfText(typeLines), 182);
  doc.text(wrappedTypes, 14, y);
  y += wrappedTypes.length * 4.2 + 5;

  // Two-column 1-40 Answer Sheet (1-20 left, 21-40 right)
  const renderColHeader = (x: number, topY: number) => {
    doc.setFillColor(24, 24, 27);
    doc.rect(x, topY, 88, 6.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("#", x + 2, topY + 4.5);
    doc.text("Student", x + 11, topY + 4.5);
    doc.text("Official Key", x + 46, topY + 4.5);
    doc.text("Res", x + 79, topY + 4.5);
  };

  renderColHeader(14, y);
  renderColHeader(108, y);
  y += 6.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (let i = 0; i < 20; i++) {
    const left = section.details[i];
    const right = section.details[i + 20];
    const rowY = y + i * 7.2;

    if (i % 2 === 1) {
      doc.setFillColor(244, 244, 245);
      doc.rect(14, rowY, 88, 7.2, "F");
      doc.rect(108, rowY, 88, 7.2, "F");
    }

    const drawRow = (item: typeof left, x: number) => {
      if (!item) return;
      doc.setTextColor(24, 24, 27);
      doc.text(String(item.number), x + 2, rowY + 4.8);
      doc.text(
        sanitizePdfText(item.studentAnswer || "-").slice(0, 17),
        x + 11,
        rowY + 4.8
      );
      doc.text(
        sanitizePdfText(item.correctAnswer).slice(0, 17),
        x + 46,
        rowY + 4.8
      );
      if (item.isCorrect) {
        doc.setTextColor(22, 101, 52);
        doc.setFont("helvetica", "bold");
        doc.text("OK", x + 79, rowY + 4.8);
      } else {
        doc.setTextColor(185, 28, 28);
        doc.setFont("helvetica", "bold");
        doc.text("X", x + 80.5, rowY + 4.8);
      }
      doc.setFont("helvetica", "normal");
    };

    drawRow(left, 14);
    drawRow(right, 108);
  }
}

export function downloadSubmissionPdfReport(sub: ExamSubmissionRecord): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dt = formatTashkentDateTime(sub.submittedAt);
  const summary = computeOverallBandSummary(sub);

  // Page 1: Official Summary + Writing Task 1 Essay
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("IELTS NOVA - OFFICIAL CDI MOCK REPORT", 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(180, 180, 188);
  doc.text(sanitizePdfText(sub.mockTitle), 14, 24);
  doc.text(`Date: ${sanitizePdfText(dt.label)}`, 196, 24, { align: "right" });

  // Candidate Metadata
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Candidate: ${sanitizePdfText(sub.fullName)}`, 14, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Overall Band: ${summary.overall.toFixed(1)}   |   Submission ID: ${sub.id}   |   Tab-Switch Alerts: ${sub.tabSwitchCount} time(s)`,
    14,
    51
  );

  // 4-Skill Score Cards Row
  const cards = [
    {
      label: "LISTENING",
      value: `Band ${sub.listening.band.toFixed(1)}`,
      sub: `${sub.listening.rawScore} / ${sub.listening.total} correct`,
    },
    {
      label: "READING",
      value: `Band ${sub.reading.band.toFixed(1)}`,
      sub: `${sub.reading.rawScore} / ${sub.reading.total} correct`,
    },
    {
      label: "SPEAKING",
      value:
        summary.speakingBand !== null
          ? `Band ${summary.speakingBand.toFixed(1)}`
          : "Pending",
      sub: "Teacher score",
    },
    {
      label: "WRITING",
      value:
        summary.writingBand !== null
          ? `Band ${summary.writingBand.toFixed(1)}`
          : "Pending",
      sub: `${sub.writingTask1WordCount} words`,
    },
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * 46.5;
    doc.setFillColor(244, 244, 245);
    doc.setDrawColor(212, 212, 216);
    doc.roundedRect(x, 58, 43, 24, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    doc.text(c.label, x + 3.5, 64);
    doc.setFontSize(12.5);
    doc.setTextColor(9, 9, 11);
    doc.text(c.value, x + 3.5, 73);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(82, 82, 91);
    doc.text(c.sub, x + 3.5, 79);
  });

  // Writing Task 1 Essay Section
  let y = 94;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text(
    `Writing Task 1 Essay (${sub.writingTask1WordCount} words)`,
    14,
    y
  );
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(39, 39, 42);
  const essayLines = doc.splitTextToSize(
    sanitizePdfText(sub.writingTask1Text || "(No essay written)"),
    182
  );
  for (const line of essayLines) {
    if (y > 268) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 5;
  }

  if (sub.teacherFeedback) {
    y += 6;
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(9, 9, 11);
    doc.text("Teacher Feedback:", 14, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const fbLines = doc.splitTextToSize(sanitizePdfText(sub.teacherFeedback), 182);
    doc.text(fbLines, 14, y);
  }

  // Page 2: Listening 1-40 Answer Sheet + Analytics
  drawSectionAnswerSheet(doc, "LISTENING 1-40 ANSWER SHEET & ANALYSIS", sub.listening);

  // Page 3: Reading 1-40 Answer Sheet + Analytics
  drawSectionAnswerSheet(doc, "READING 1-40 ANSWER SHEET & ANALYSIS", sub.reading);

  const safeName = sub.fullName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 32);
  doc.save(`IELTS_Nova_CDI_${safeName || "Candidate"}.pdf`);
}
