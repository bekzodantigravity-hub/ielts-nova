import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth-token";
import {
  deleteExamSubmission,
  listExamSubmissions,
  updateSubmissionWritingGrade,
} from "@/lib/exam-db";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return verifyAdminToken(token);
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
    return NextResponse.json({ ok: true, submissions });
  } catch {
    return NextResponse.json(
      { error: "Natijalarni yuklashda xatolik." },
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
      teacherFeedback?: string;
    };

    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Natija ID ko'rsatilmagan." },
        { status: 400 }
      );
    }

    const writingBand =
      body.writingBand === null || body.writingBand === undefined
        ? null
        : Math.max(0, Math.min(9, Number(body.writingBand)));

    const updated = await updateSubmissionWritingGrade({
      id,
      writingBand:
        writingBand !== null && !Number.isNaN(writingBand) ? writingBand : null,
      teacherFeedback: (body.teacherFeedback || "").trim(),
      gradedBy: admin.email,
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
      { error: "Writing bahosini saqlashda xatolik." },
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
