import { type NextRequest, NextResponse } from "next/server";
import {
  getMockExamById,
  listLobbyParticipants,
  touchLobbyParticipant,
} from "@/lib/exam-db";
import { MOCK_1_ID } from "@/lib/exam-mock1";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mockId = (searchParams.get("mockId") || MOCK_1_ID).trim();
    const participantId = (searchParams.get("participantId") || "").trim();

    if (participantId) {
      await touchLobbyParticipant(participantId);
    }

    const [mock, participants] = await Promise.all([
      getMockExamById(mockId),
      listLobbyParticipants(mockId),
    ]);

    if (!mock) {
      return NextResponse.json({ error: "Mock topilmadi." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      mockId: mock.id,
      startMode: mock.startMode,
      status: mock.status,
      startedAt: mock.startedAt,
      sessionId: mock.currentSessionId || null,
      waitingCount: participants.filter((p) => p.status !== "submitted").length,
    });
  } catch {
    return NextResponse.json(
      { error: "Holatni tekshirib bo'lmadi." },
      { status: 500 }
    );
  }
}
