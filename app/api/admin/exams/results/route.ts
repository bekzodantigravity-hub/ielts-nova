import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth-token";
import {
  deleteExamSubmission,
  getExamStorageMode,
  listExamSubmissions,
  syncExamSubmissions,
  updateSubmissionWritingGrade,
} from "@/lib/exam-db";
import type { ExamSubmissionRecord } from "@/lib/exam-types";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
}

function parseOptionalBand(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(9, num));
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const mockId = searchParams.get("mockId")?.trim() || undefined;
    const submissions = await listExamSubmissions(mockId);
    return NextResponse.json({
      ok: true,
      submissions,
      storageMode: getExamStorageMode(),
    });
  } catch {
    return NextResponse.json(
      { error: "Natijalarni yuklashda xatolik." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action?: "sync";
      submissions?: ExamSubmissionRecord[];
    };
    if (body.action === "sync" && Array.isArray(body.submissions)) {
      const merged = await syncExamSubmissions(body.submissions);
      return NextResponse.json({
        ok: true,
        submissions: merged,
        storageMode: getExamStorageMode(),
      });
    }
    return NextResponse.json(
      { error: "Noto'g'ri so'rov turi." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Natijalarni sinxronlashda xatolik." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      id?: string;
      writingBand?: number | null;
      writingTask1Band?: number | null;
      writingTask2Band?: number | null;
      speakingBand?: number | null;
      teacherFeedback?: string;
      fallbackRecord?: ExamSubmissionRecord;
    };

    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Natija ID ko'rsatilmagan." },
        { status: 400 }
      );
    }

    const updated = await updateSubmissionWritingGrade({
      id,
      writingBand: parseOptionalBand(body.writingBand),
      writingTask1Band: parseOptionalBand(body.writingTask1Band),
      writingTask2Band: parseOptionalBand(body.writingTask2Band),
      speakingBand: parseOptionalBand(body.speakingBand),
      teacherFeedback:
        body.teacherFeedback !== undefined
          ? body.teacherFeedback.trim()
          : undefined,
      gradedBy: admin.email,
      fallbackRecord: body.fallbackRecord,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Natija topilmadi." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, submission: updated });
  } catch {
    return NextResponse.json(
      { error: "Bahoni saqlashda xatolik." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { id?: string };
    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "O'chiriladigan natija ID kerak." },
        { status: 400 }
      );
    }
    await deleteExamSubmission(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Natijani o'chirishda xatolik." },
      { status: 500 }
    );
  }
}
