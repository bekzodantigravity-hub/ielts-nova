import { NextResponse } from "next/server";
import { listMockExams } from "@/lib/exam-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mocks = await listMockExams();
    const summary = mocks.map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle,
      startMode: m.startMode,
      status: m.status,
      startedAt: m.startedAt,
      writingMode: m.writingMode,
      readingDurationSeconds: m.readingDurationSeconds,
      writingDurationSeconds: m.writingDurationSeconds,
    }));
    return NextResponse.json({ ok: true, mocks: summary });
  } catch {
    return NextResponse.json(
      { error: "Imtihonlar ro'yxatini yuklab bo'lmadi." },
      { status: 500 }
    );
  }
}
