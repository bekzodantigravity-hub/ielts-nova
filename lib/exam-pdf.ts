"use client";

import { jsPDF } from "jspdf";
import type { ExamSubmissionRecord, SectionGradeReport } from "./exam-types";

function sanitizePdfText(text: string): string {
  return (text || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E\n]/g, " ");
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
  const dateStr = new Date(sub.submittedAt).toLocaleString("en-GB");

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
  doc.text(`Date: ${sanitizePdfText(dateStr)}`, 196, 24, { align: "right" });

  // Candidate Metadata
  doc.setTextColor(24, 24, 27);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Candidate: ${sanitizePdfText(sub.fullName)}`, 14, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(
    `Submission ID: ${sub.id}   |   Tab-Switch Alerts: ${sub.tabSwitchCount} time(s)`,
    14,
    51
  );

  // Score Cards Row
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
      label: "WRITING TASK 1",
      value:
        sub.writingBand !== null ? `Band ${sub.writingBand.toFixed(1)}` : "Pending",
      sub: `${sub.writingTask1WordCount} words`,
    },
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * 62;
    doc.setFillColor(244, 244, 245);
    doc.setDrawColor(212, 212, 216);
    doc.roundedRect(x, 58, 58, 24, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(113, 113, 122);
    doc.text(c.label, x + 4, 64);
    doc.setFontSize(14);
    doc.setTextColor(9, 9, 11);
    doc.text(c.value, x + 4, 73);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91);
    doc.text(c.sub, x + 4, 79);
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
