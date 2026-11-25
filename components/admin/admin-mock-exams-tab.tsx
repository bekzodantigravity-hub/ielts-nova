"use client";

import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  ExamRoomStatus,
  ExamStartMode,
  ExamWritingMode,
  LobbyParticipant,
  TeacherAccount,
} from "@/lib/exam-types";

interface AdminMockSummary {
  id: string;
  title: string;
  subtitle: string;
  password: string;
  startMode: ExamStartMode;
  status: ExamRoomStatus;
  startedAt: string | null;
  writingMode: ExamWritingMode;
  readingDurationSeconds: number;
  writingDurationSeconds: number;
  waitingCount: number;
  lobbyParticipants: LobbyParticipant[];
}

interface AdminMockExamsTabProps {
  onToast: (type: "ok" | "err", text: string) => void;
}

export function AdminMockExamsTab({ onToast }: AdminMockExamsTabProps) {
  const [mocks, setMocks] = useState<AdminMockSummary[]>([]);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [selectedMockId, setSelectedMockId] = useState<string>("mock-1");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable settings for selected mock
  const [passwordDraft, setPasswordDraft] = useState("");
  const [startModeDraft, setStartModeDraft] = useState<ExamStartMode>("proctor");
  const [writingModeDraft, setWritingModeDraft] =
    useState<ExamWritingMode>("task1_only");

  // Create New Mock Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPassword, setNewPassword] = useState("bugunseningkuning");
  const [newStartMode, setNewStartMode] = useState<ExamStartMode>("proctor");
  const [newWritingMode, setNewWritingMode] =
    useState<ExamWritingMode>("task1_only");
  const [newTask2Prompt, setNewTask2Prompt] = useState("");

  // Add Teacher form
  const [teacherName, setTeacherName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");

  const loadExams = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/exams", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        ok?: boolean;
        mocks?: AdminMockSummary[];
        teachers?: TeacherAccount[];
      };
      if (data.ok && Array.isArray(data.mocks)) {
        setMocks(data.mocks);
        if (Array.isArray(data.teachers)) setTeachers(data.teachers);
      }
    } catch {
      // keep existing state
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExams(false);
  }, [loadExams]);

  const activeMock =
    mocks.find((m) => m.id === selectedMockId) || mocks[0] || null;

  useEffect(() => {
    if (!activeMock) return;
    setPasswordDraft(activeMock.password);
    setStartModeDraft(activeMock.startMode);
    setWritingModeDraft(activeMock.writingMode);
  }, [activeMock?.id, activeMock?.password, activeMock?.startMode, activeMock?.writingMode]);

  // Live lobby poller (every 3s) so admin sees students joining the waiting room in real time
  useEffect(() => {
    const id = setInterval(() => {
      void loadExams(true);
    }, 3000);
    return () => clearInterval(id);
  }, [loadExams]);

  const handleSaveSettings = async () => {
    if (!activeMock) return;
    setBusyAction("save");
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeMock.id,
          action: "update_settings",
          password: passwordDraft.trim(),
          startMode: startModeDraft,
          writingMode: writingModeDraft,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Saqlab bo'lmadi.");
      }
      onToast("ok", "Mock sozlamalari saqlandi!");
      await loadExams(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik yuz berdi.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleStartExamForAll = async () => {
    if (!activeMock) return;
    setBusyAction("start_all");
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeMock.id,
          action: "start_all",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Imtihonni boshlab bo'lmadi.");
      }
      onToast(
        "ok",
        "Barcha ulangan kompyuterlarda imtihon sinxron boshlandi!"
      );
      await loadExams(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleResetLobby = async () => {
    if (!activeMock) return;
    setBusyAction("reset_lobby");
    try {
      const res = await fetch("/api/admin/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeMock.id,
          action: "reset_lobby",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Tozalab bo'lmadi.");
      }
      onToast("ok", "Kutish zali qayta ochildi va tozalandi.");
      await loadExams(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setBusyAction("create_mock");
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "mock",
          title: newTitle.trim(),
          password: newPassword.trim() || "bugunseningkuning",
          startMode: newStartMode,
          writingMode: newWritingMode,
          writingTask2Prompt:
            newWritingMode === "task1_and_task2" ? newTask2Prompt : undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        mock?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Yaratishda xatolik.");
      }
      setCreateOpen(false);
      setNewTitle("");
      setNewTask2Prompt("");
      if (data.mock?.id) setSelectedMockId(data.mock.id);
      onToast("ok", "Yangi Mock Exam yaratildi!");
      await loadExams(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherEmail.includes("@")) return;
    setBusyAction("add_teacher");
    try {
      const res = await fetch("/api/admin/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "teacher",
          teacherName: teacherName.trim(),
          teacherEmail: teacherEmail.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Qo'shib bo'lmadi.");
      setTeacherName("");
      setTeacherEmail("");
      onToast("ok", "Yangi o'qituvchi (Teacher/Proktor) qo'shildi.");
      await loadExams(true);
    } catch (err) {
      onToast("err", err instanceof Error ? err.message : "Xatolik.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await fetch("/api/admin/exams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "teacher", id }),
      });
      if (res.ok) {
        onToast("ok", "O'qituvchi o'chirildi.");
        await loadExams(true);
      }
    } catch {}
  };

  const copyExamUrl = () => {
    const url = `${window.location.origin}/exam`;
    void navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading && mocks.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#111113] p-10 text-center text-sm text-zinc-400">
        Mock imtihonlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Yopiq CDI Mock Imtihonlar &amp; Proktor Nazorati
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            30–60 ta kompyuterni bir soniyada sinxron boshlang, imtihon parolini
            va rejimini boshqaring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyExamUrl}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-[#18181b] px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{copiedLink ? "Nusxalandi" : "/exam havolasi"}</span>
          </button>
          <Link
            href="/exam"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-[#18181b] px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>/exam ochish</span>
          </Link>
          <button
            type="button"
            data-testid="create-new-mock-btn"
            onClick={() => setCreateOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Yangi Mock Yaratish</span>
          </button>
        </div>
      </div>

      {/* Mock Selector Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {mocks.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMockId(m.id)}
            className={`cursor-pointer rounded-lg border px-3.5 py-2 text-left text-xs transition ${
              activeMock?.id === m.id
                ? "border-white bg-[#18181b] text-white"
                : "border-zinc-800 bg-[#111113] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            <div className="font-bold">{m.title}</div>
            <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
              {m.startMode === "proctor" ? "PROKTOR" : "INDIVIDUAL"} ·{" "}
              {m.writingMode === "task1_and_task2"
                ? "Writing T1+T2"
                : "Faqat Task 1 (20:00)"}
            </div>
          </button>
        ))}
      </div>

      {activeMock && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Live Proctor Waiting Lobby Control */}
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-[#111113] p-6 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                  LIVE PROCTOR LOBBY
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white">
                  {activeMock.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="proctor-waiting-counter"
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-[#18181b] px-3 py-1.5 font-mono text-xs font-bold text-white"
                >
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{activeMock.waitingCount} ta o&apos;quvchi kutmoqda</span>
                </span>
                <button
                  type="button"
                  onClick={() => void loadExams(true)}
                  aria-label="Yangilash"
                  className="cursor-pointer rounded-md border border-zinc-800 bg-[#18181b] p-2 text-zinc-400 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Room Status + Big Start Exam for All Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-[#18181b] p-4">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  XONA HOLATI
                </p>
                <p
                  data-testid="proctor-room-status"
                  className="mt-1 text-sm font-bold text-white"
                >
                  {activeMock.status === "started"
                    ? "IMTIHON BOSHLANGAN (FAOL)"
                    : "KUTISH ZALI OCHIQ (WAITING)"}
                </p>
                {activeMock.startedAt && (
                  <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
                    Boshlangan vaqt:{" "}
                    {new Date(activeMock.startedAt).toLocaleTimeString("uz-UZ")}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="proctor-start-all-btn"
                  disabled={busyAction === "start_all"}
                  onClick={() => void handleStartExamForAll()}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Barcha uchun imtihonni boshlash (Start Exam for All)</span>
                </button>
                <button
                  type="button"
                  data-testid="proctor-reset-lobby-btn"
                  disabled={busyAction === "reset_lobby"}
                  onClick={() => void handleResetLobby()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Qayta ochish</span>
                </button>
              </div>
            </div>

            {/* Live Waiting Candidates List */}
            <div>
              <p className="mb-2.5 font-mono text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                Kutish zalidagi o&apos;quvchilar ({activeMock.lobbyParticipants.length})
              </p>
              {activeMock.lobbyParticipants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 bg-[#0d0d10] p-6 text-center text-xs text-zinc-500">
                  Hozircha hech kim kutish zaliga kirmagan. O&apos;quvchilar{" "}
                  <span className="font-mono text-zinc-300">/exam</span>{" "}
                  sahifasiga kirib parolni terishi bilan ularning ismi bu yerda
                  jonli ko&apos;rinadi.
                </div>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {activeMock.lobbyParticipants.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-zinc-800 font-mono text-[11px] font-bold text-zinc-300">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">
                          {p.fullName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                        <span>
                          {new Date(p.joinedAt).toLocaleTimeString("uz-UZ")}
                        </span>
                        <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] uppercase text-zinc-200">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Settings (Start Mode, Password, Writing Mode) */}
          <div className="space-y-5 rounded-xl border border-zinc-800 bg-[#111113] p-6 lg:col-span-5">
            <div className="border-b border-zinc-800 pb-3">
              <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                IMTIHON SOZLAMALARI
              </p>
              <h3 className="mt-0.5 text-base font-bold text-white">
                Rejim, Parol va Writing konfiguratsiyasi
              </h3>
            </div>

            {/* Start Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Boshlash rejimi
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="mode-proctor-btn"
                  onClick={() => setStartModeDraft("proctor")}
                  className={`cursor-pointer rounded-lg border p-3 text-left text-xs transition ${
                    startModeDraft === "proctor"
                      ? "border-white bg-[#18181b] text-white"
                      : "border-zinc-800 bg-[#0d0d10] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <p className="font-bold">Proktor (Domla Start)</p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Barcha kutish zalida yig&apos;iladi, domla bitta tugmada
                    boshlaydi.
                  </p>
                </button>
                <button
                  type="button"
                  data-testid="mode-individual-btn"
                  onClick={() => setStartModeDraft("individual")}
                  className={`cursor-pointer rounded-lg border p-3 text-left text-xs transition ${
                    startModeDraft === "individual"
                      ? "border-white bg-[#18181b] text-white"
                      : "border-zinc-800 bg-[#0d0d10] text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <p className="font-bold">Individual (O&apos;quvchi Start)</p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Har bir o&apos;quvchi o&apos;zi &ldquo;Start Exam&rdquo; bosib
                    boshlaydi.
                  </p>
                </button>
              </div>
            </div>

            {/* Exam Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Imtihon paroli (standart: bugunseningkuning)
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  data-testid="admin-mock-password-input"
                  value={passwordDraft}
                  onChange={(e) => setPasswordDraft(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-[#18181b] py-2.5 pr-3 pl-9 font-mono text-sm text-white focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Writing Mode */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300">
                Writing formati (AI baholashsiz — faqat domla tekshiradi)
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWritingModeDraft("task1_only")}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    writingModeDraft === "task1_only"
                      ? "border-white bg-[#18181b] text-white"
                      : "border-zinc-800 bg-[#0d0d10] text-zinc-400"
                  }`}
                >
                  Faqat Task 1 (20:00)
                </button>
                <button
                  type="button"
                  onClick={() => setWritingModeDraft("task1_and_task2")}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    writingModeDraft === "task1_and_task2"
                      ? "border-white bg-[#18181b] text-white"
                      : "border-zinc-800 bg-[#0d0d10] text-zinc-400"
                  }`}
                >
                  Task 1 + Task 2 (60:00)
                </button>
              </div>
            </div>

            <button
              type="button"
              data-testid="save-mock-settings-btn"
              disabled={busyAction === "save"}
              onClick={() => void handleSaveSettings()}
              className="w-full cursor-pointer rounded-lg bg-white py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50"
            >
              {busyAction === "save" ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
            </button>
          </div>
        </div>
      )}

      {/* Teachers / Co-Admins Section */}
      <div className="rounded-xl border border-zinc-800 bg-[#111113] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
              TEACHERS &amp; PROCTORS
            </p>
            <h3 className="mt-0.5 text-base font-bold text-white">
              O&apos;qituvchilar va Nazoratchilar ro&apos;yxati
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-7">
            {teachers.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-[#18181b] px-4 py-2.5 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="font-mono text-[11px] text-zinc-400">{t.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-300">
                    {t.role === "super_admin" ? "SUPER ADMIN" : "TEACHER"}
                  </span>
                  {t.role !== "super_admin" && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteTeacher(t.id)}
                      className="cursor-pointer rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddTeacher}
            className="space-y-2.5 rounded-lg border border-zinc-800 bg-[#0d0d10] p-4 lg:col-span-5"
          >
            <p className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
              <UserPlus className="h-3.5 w-3.5" />
              <span>Yangi o&apos;qituvchi qo&apos;shish</span>
            </p>
            <input
              type="text"
              required
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Ism va familiya"
              className="w-full rounded-md border border-zinc-800 bg-[#18181b] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <input
              type="email"
              required
              value={teacherEmail}
              onChange={(e) => setTeacherEmail(e.target.value)}
              placeholder="Email manzili"
              className="w-full rounded-md border border-zinc-800 bg-[#18181b] px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busyAction === "add_teacher"}
              className="w-full cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
            >
              Qo&apos;shish
            </button>
          </form>
        </div>
      </div>

      {/* Create New Mock Builder Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#111113] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Yangi Mock Imtihon Yaratish
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="cursor-pointer text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateMock} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  Mock nomi
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Masalan: MOCK 2 — Official CDI Exam"
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 text-sm text-white focus:border-zinc-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Imtihon paroli
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 font-mono text-sm text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Boshlash rejimi
                  </label>
                  <select
                    value={newStartMode}
                    onChange={(e) =>
                      setNewStartMode(e.target.value as ExamStartMode)
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 text-sm text-white focus:border-zinc-400 focus:outline-none"
                  >
                    <option value="proctor">Proktor (Domla Start)</option>
                    <option value="individual">Individual (O&apos;quvchi Start)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300">
                  Writing rejimi
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWritingMode("task1_only")}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold ${
                      newWritingMode === "task1_only"
                        ? "border-white bg-[#18181b] text-white"
                        : "border-zinc-800 bg-[#09090b] text-zinc-400"
                    }`}
                  >
                    Faqat Task 1 (20:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWritingMode("task1_and_task2")}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold ${
                      newWritingMode === "task1_and_task2"
                        ? "border-white bg-[#18181b] text-white"
                        : "border-zinc-800 bg-[#09090b] text-zinc-400"
                    }`}
                  >
                    Task 1 + Task 2 (60:00)
                  </button>
                </div>
              </div>

              {newWritingMode === "task1_and_task2" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300">
                    Writing Task 2 savoli (ixtiyoriy)
                  </label>
                  <textarea
                    rows={3}
                    value={newTask2Prompt}
                    onChange={(e) => setNewTask2Prompt(e.target.value)}
                    placeholder="Bo'sh qoldirilsa standart Task 2 savoli qo'yiladi..."
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-[#18181b] px-3 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={busyAction === "create_mock"}
                  className="cursor-pointer rounded-lg bg-white px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-zinc-200"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
