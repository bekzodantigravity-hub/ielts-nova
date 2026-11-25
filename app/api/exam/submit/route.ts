import { type NextRequest, NextResponse } from "next/server";
import {
  getMockExamById,
  saveExamSubmission,
  touchLobbyParticipant,
} from "@/lib/exam-db";
import { countWords, gradeExamSection } from "@/lib/exam-grading";
import { MOCK_1_ID } from "@/lib/exam-mock1";
import type { ExamSubmissionRecord } from "@/lib/exam-types";

export const dynamic = "force-dynamic";

async function sendTelegramNotification(record: ExamSubmissionRecord): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  const submittedTime = new Date(record.submittedAt).toLocaleString("uz-UZ", {
    timeZone: "Asia/Tashkent",
  });

  const text = [
    `📋 <b>IELTS Nova — CDI Mock Natija</b>`,
    `<b>Imtihon:</b> ${record.mockTitle}`,
    `<b>O'quvchi:</b> ${record.fullName}`,
    `<b>Sana:</b> ${submittedTime}`,
    ``,
    `🎧 <b>Listening:</b> Band ${record.listening.band.toFixed(1)} (${record.listening.rawScore}/${record.listening.total})`,
    `📖 <b>Reading:</b> Band ${record.reading.band.toFixed(1)} (${record.reading.rawScore}/${record.reading.total})`,
    `✍️ <b>Writing Task 1:</b> ${record.writingTask1WordCount} so'z (Domla tekshiruvida)`,
    `⚠️ <b>Tab-Cheat:</b> ${record.tabSwitchCount} marta`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // Never fail exam submission if Telegram is unreachable
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mockId?: string;
      participantId?: string;
      fullName?: string;
      listeningAnswers?: Record<string, string>;
      readingAnswers?: Record<string, string>;
      writingTask1Text?: string;
      writingTask2Text?: string;
      tabSwitchCount?: number;
    };

    const mockId = (body.mockId || MOCK_1_ID).trim();
    const fullName = (body.fullName || "").trim();
    const participantId =
      (body.participantId || "").trim() || `cand_${Date.now().toString(36)}`;

    if (!fullName) {
      return NextResponse.json(
        { error: "O'quvchi ism-familiyasi ko'rsatilmagan." },
        { status: 400 }
      );
    }

    const mock = await getMockExamById(mockId);
    if (!mock) {
      return NextResponse.json(
        { error: "Imtihon topilmadi." },
        { status: 404 }
      );
    }

    const listeningAnswers = body.listeningAnswers || {};
    const readingAnswers = body.readingAnswers || {};
    const writingTask1Text = (body.writingTask1Text || "").trim();
    const writingTask2Text = (body.writingTask2Text || "").trim();
    const tabSwitchCount = Math.max(0, Math.floor(Number(body.tabSwitchCount) || 0));

    const listening = gradeExamSection(
      "listening",
      mock.listeningKey,
      listeningAnswers
    );
    const reading = gradeExamSection("reading", mock.readingKey, readingAnswers);

    const record: ExamSubmissionRecord = {
      id: `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
      mockId: mock.id,
      mockTitle: mock.title,
      participantId,
      fullName,
      submittedAt: new Date().toISOString(),
      tabSwitchCount,
      listening,
      reading,
      writingTask1Text,
      writingTask1WordCount: countWords(writingTask1Text),
      writingTask2Text: writingTask2Text || undefined,
      writingTask2WordCount: writingTask2Text
        ? countWords(writingTask2Text)
        : undefined,
      writingBand: null,
      teacherFeedback: "",
      gradedBy: null,
      gradedAt: null,
    };

    await saveExamSubmission(record);
    await touchLobbyParticipant(participantId, "submitted");

    // Fire Telegram alert silently if configured
    await sendTelegramNotification(record);

    return NextResponse.json({
      ok: true,
      submissionId: record.id,
      submittedAt: record.submittedAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Imtihon natijasini saqlashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
