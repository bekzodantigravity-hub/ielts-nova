import { NextResponse } from "next/server";
import { listAllUsers } from "@/lib/users-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = listAllUsers();
  const safeAccounts = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    targetBand: u.targetBand,
    goal: u.goal,
    lastActive: u.updatedAt,
  }));

  return NextResponse.json({ accounts: safeAccounts });
}
