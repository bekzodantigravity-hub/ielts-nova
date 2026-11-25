import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth-token";
import { getMockExamById, listLobbyParticipants } from "@/lib/exam-db";
import { MOCK_1_ID } from "@/lib/exam-mock1";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const mockId = (searchParams.get("mockId") || MOCK_1_ID).trim();
    const [mock, participants] = await Promise.all([
      getMockExamById(mockId),
      listLobbyParticipants(mockId),
    ]);

    return NextResponse.json({
      ok: true,
      mockId,
      status: mock?.status || "waiting",
      startMode: mock?.startMode || "proctor",
      startedAt: mock?.startedAt || null,
      waitingCount: participants.filter((p) => p.status !== "submitted").length,
      participants,
    });
  } catch {
    return NextResponse.json(
      { error: "Kutish zalini yuklashda xatolik." },
      { status: 500 }
    );
  }
}
