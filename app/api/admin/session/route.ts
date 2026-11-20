import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminToken,
} from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return NextResponse.json({ authenticated: false, admin: null });
  }
  return NextResponse.json({
    authenticated: true,
    admin: { email: admin.email, role: admin.role },
  });
}
