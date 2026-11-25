import { type NextRequest, NextResponse } from "next/server";
import {
  getMockExamById,
  joinExamLobby,
  toPublicMockPayload,
} from "@/lib/exam-db";
import { MOCK_1_ID } from "@/lib/exam-mock1";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      mockId?: string;
      fullName?: string;
      password?: string;
      participantId?: string;
    };

    const mockId = (body.mockId || MOCK_1_ID).trim();
    const fullName = (body.fullName || "").trim();
    const password = (body.password || "").trim().toLowerCase();

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: "Iltimos, ism va familiyangizni to'liq kiriting." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Iltimos, imtihon parolini kiriting." },
        { status: 400 }
      );
    }

    const mock = await getMockExamById(mockId);
    if (!mock) {
      return NextResponse.json(
        { error: "Tanlangan imtihon topilmadi." },
        { status: 404 }
      );
    }

    const expectedPassword = (mock.password || "").trim().toLowerCase();
    if (password !== expectedPassword) {
      return NextResponse.json(
        { error: "Imtihon paroli noto'g'ri!" },
        { status: 401 }
      );
    }

    const participant = await joinExamLobby({
      mockId: mock.id,
      fullName,
      participantId: body.participantId,
    });

    return NextResponse.json({
      ok: true,
      participant,
      exam: toPublicMockPayload(mock),
    });
  } catch {
    return NextResponse.json(
      { error: "Imtihon zaliga kirishda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
