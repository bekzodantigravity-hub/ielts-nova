import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth-token";
import {
  addTeacherAccount,
  clearLobbyForMock,
  createNewMockExam,
  deleteMockExam,
  getMockExamById,
  listLobbyParticipants,
  listMockExams,
  listTeachers,
  removeTeacherAccount,
  saveMockExam,
} from "@/lib/exam-db";
import type { ExamStartMode, ExamWritingMode } from "@/lib/exam-types";

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
    const [mocks, teachers] = await Promise.all([
      listMockExams(),
      listTeachers(),
    ]);

    const mocksWithLobby = await Promise.all(
      mocks.map(async (m) => {
        const lobby = await listLobbyParticipants(m.id);
        return {
          id: m.id,
          title: m.title,
          subtitle: m.subtitle,
          password: m.password,
          startMode: m.startMode,
          status: m.status,
          startedAt: m.startedAt,
          writingMode: m.writingMode,
          readingDurationSeconds: m.readingDurationSeconds,
          writingDurationSeconds: m.writingDurationSeconds,
          writingTask1: m.writingTask1,
          writingTask2: m.writingTask2 || null,
          waitingCount: lobby.filter((p) => p.status !== "submitted").length,
          lobbyParticipants: lobby,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      mocks: mocksWithLobby,
      teachers,
    });
  } catch {
    return NextResponse.json(
      { error: "Mock imtihonlarni yuklashda xatolik." },
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
      entity?: "mock" | "teacher";
      title?: string;
      subtitle?: string;
      password?: string;
      startMode?: ExamStartMode;
      writingMode?: ExamWritingMode;
      writingDurationSeconds?: number;
      writingTask2Prompt?: string;
      teacherName?: string;
      teacherEmail?: string;
    };

    if (body.entity === "teacher") {
      const name = (body.teacherName || "").trim();
      const email = (body.teacherEmail || "").trim().toLowerCase();
      if (!name || !email.includes("@")) {
        return NextResponse.json(
          { error: "O'qituvchi ismi va to'g'ri emailini kiriting." },
          { status: 400 }
        );
      }
      const teacher = await addTeacherAccount({ name, email });
      return NextResponse.json({ ok: true, teacher });
    }

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json(
        { error: "Mock nomini kiriting." },
        { status: 400 }
      );
    }

    const created = await createNewMockExam({
      title,
      subtitle: body.subtitle,
      password: body.password,
      startMode: body.startMode,
      writingMode: body.writingMode,
      writingDurationSeconds: body.writingDurationSeconds,
      writingTask2Prompt: body.writingTask2Prompt,
    });

    return NextResponse.json({ ok: true, mock: created });
  } catch {
    return NextResponse.json(
      { error: "Yangi Mock yaratishda xatolik yuz berdi." },
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
      action?: "start_all" | "reset_lobby" | "update_settings";
      title?: string;
      password?: string;
      startMode?: ExamStartMode;
      writingMode?: ExamWritingMode;
    };

    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Mock ID kerak." }, { status: 400 });
    }

    const mock = await getMockExamById(id);
    if (!mock) {
      return NextResponse.json({ error: "Mock topilmadi." }, { status: 404 });
    }

    if (body.action === "start_all") {
      const nowIso = new Date().toISOString();
      const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const updated = await saveMockExam({
        ...mock,
        status: "started",
        startedAt: nowIso,
        currentSessionId: sessionId,
      });
      return NextResponse.json({ ok: true, mock: updated });
    }

    if (body.action === "reset_lobby") {
      await clearLobbyForMock(mock.id);
      const updated = await saveMockExam({
        ...mock,
        status: "waiting",
        startedAt: null,
        currentSessionId: null,
      });
      return NextResponse.json({ ok: true, mock: updated });
    }

    const nextWritingMode: ExamWritingMode =
      body.writingMode === "task1_and_task2" || body.writingMode === "task1_only"
        ? body.writingMode
        : mock.writingMode;

    const updated = await saveMockExam({
      ...mock,
      title: body.title?.trim() || mock.title,
      password:
        body.password !== undefined && body.password.trim().length >= 3
          ? body.password.trim().toLowerCase()
          : mock.password,
      startMode:
        body.startMode === "proctor" || body.startMode === "individual"
          ? body.startMode
          : mock.startMode,
      writingMode: nextWritingMode,
      writingDurationSeconds:
        nextWritingMode === "task1_and_task2" ? 60 * 60 : 20 * 60,
    });

    return NextResponse.json({ ok: true, mock: updated });
  } catch {
    return NextResponse.json(
      { error: "Mock sozlamalarini yangilab bo'lmadi." },
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
    const body = (await req.json()) as {
      entity?: "mock" | "teacher";
      id?: string;
    };
    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "ID ko'rsatilmagan." }, { status: 400 });
    }

    if (body.entity === "teacher") {
      const removed = await removeTeacherAccount(id);
      if (!removed) {
        return NextResponse.json(
          { error: "Asosiy Super Adminni o'chirib bo'lmaydi." },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    const deleted = await deleteMockExam(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Asosiy MOCK 1 ni o'chirib bo'lmaydi." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "O'chirishda xatolik." },
      { status: 500 }
    );
  }
}
