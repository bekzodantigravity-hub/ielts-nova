import { type NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE_NAME,
  isAdminEmail,
  verifyAdminToken,
} from "@/lib/auth-token";
import {
  adminUpdateUser,
  deleteUserByEmail,
  findUserByEmail,
  listAllUsers,
  normalizePlan,
  upsertUser,
  type UserPlan,
} from "@/lib/users-db";

export const dynamic = "force-dynamic";

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const admin = await verifyAdminToken(token);
  if (!admin) {
    return null;
  }
  return admin;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: "Ruxsat yo'q. Admin sifatida kiring." },
      { status: 401 }
    );
  }

  const users = listAllUsers().map((u) => ({
    id: u.id,
    email: u.email,
    password: u.password || "",
    phone: u.phone || "",
    name: u.name,
    plan: normalizePlan(u.plan),
    role: u.role === "admin" ? "admin" : "user",
    birthYear: u.birthYear ?? null,
    age: u.age ?? null,
    goal: u.goal || "",
    targetBand: u.targetBand ?? 7.5,
    dailyGoal: u.dailyGoal ?? 40,
    examDate: u.examDate ?? null,
    picture: u.picture || "",
    attemptsCount: Array.isArray(u.attempts) ? u.attempts.length : 0,
    inProgressCount: u.inProgress ? Object.keys(u.inProgress).length : 0,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return NextResponse.json({ ok: true, users });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      phone?: string;
      name?: string;
      plan?: UserPlan;
      targetBand?: number;
      goal?: string;
    };

    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();
    const phone = (body.phone ?? "").trim();
    const name = (body.name ?? "").trim();
    const plan = normalizePlan(body.plan);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "To'g'ri email manzilini kiriting." },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: "Foydalanuvchi ism-familiyasini kiriting." },
        { status: 400 }
      );
    }
    if (password.length < 4) {
      return NextResponse.json(
        { error: "Parol kamida 4 ta belgidan iborat bo'lsin." },
        { status: 400 }
      );
    }
    if (findUserByEmail(email)) {
      return NextResponse.json(
        { error: "Bu email bilan foydalanuvchi allaqachon mavjud." },
        { status: 409 }
      );
    }

    const created = upsertUser({
      email,
      password,
      phone,
      name,
      plan,
      role: (await isAdminEmail(email)) ? "admin" : "user",
      targetBand:
        typeof body.targetBand === "number" && !Number.isNaN(body.targetBand)
          ? body.targetBand
          : 7.5,
      goal: body.goal?.trim() || undefined,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669`,
    });

    return NextResponse.json({ ok: true, user: created });
  } catch {
    return NextResponse.json(
      { error: "Yangi foydalanuvchi yaratishda xatolik." },
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
      originalEmail?: string;
      email?: string;
      password?: string;
      phone?: string;
      name?: string;
      plan?: UserPlan;
      targetBand?: number;
      goal?: string;
    };

    const originalEmail = (body.originalEmail ?? body.email ?? "").trim();
    if (!originalEmail) {
      return NextResponse.json(
        { error: "Tahrirlanayotgan foydalanuvchi emaili ko'rsatilmagan." },
        { status: 400 }
      );
    }

    const result = adminUpdateUser(originalEmail, {
      email: body.email,
      password: body.password,
      phone: body.phone,
      name: body.name,
      plan: body.plan ? normalizePlan(body.plan) : undefined,
      targetBand: body.targetBand,
      goal: body.goal,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: result.user });
  } catch {
    return NextResponse.json(
      { error: "Foydalanuvchini yangilashda xatolik yuz berdi." },
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
    const body = (await req.json()) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "O'chiriladigan email ko'rsatilmagan." },
        { status: 400 }
      );
    }
    if (await isAdminEmail(email)) {
      return NextResponse.json(
        { error: "Asosiy admin hisobini o'chirib bo'lmaydi." },
        { status: 400 }
      );
    }

    const deleted = deleteUserByEmail(email);
    if (!deleted) {
      return NextResponse.json(
        { error: "Foydalanuvchi topilmadi." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Foydalanuvchini o'chirishda xatolik." },
      { status: 500 }
    );
  }
}
