"use client";

import { Highlighter, MessageSquarePlus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReadingParagraph } from "@/lib/exam-types";
import type { ExamTheme } from "./question-highlight-area";

export interface PassageHighlight {
  id: string;
  passage: number;
  paragraphIndex: number;
  start: number;
  end: number;
  text: string;
  note?: string;
}

interface ReadingHighlightPaneProps {
  theme: ExamTheme;
  passageNumber: number;
  title: string;
  subtitle?: string;
  paragraphs: ReadingParagraph[];
  highlights: PassageHighlight[];
  onChangeHighlights: (next: PassageHighlight[]) => void;
}

interface SelectionMenuState {
  x: number;
  y: number;
  paragraphIndex: number;
  start: number;
  end: number;
  text: string;
}

function getParagraphOffset(
  container: HTMLElement,
  targetNode: Node,
  targetOffset: number
): number {
  const range = document.createRange();
  range.selectNodeContents(container);
  range.setEnd(targetNode, targetOffset);
  return range.toString().length;
}

export function ReadingHighlightPane({
  theme,
  passageNumber,
  title,
  subtitle,
  paragraphs,
  highlights,
  onChangeHighlights,
}: ReadingHighlightPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<SelectionMenuState | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const isDark = theme === "dark";
  const highlightBg = isDark ? "#f97316" : "#fbbf24";
  const highlightFg = isDark ? "#ffffff" : "#111827";

  const passageHighlights = highlights.filter(
    (h) => h.passage === passageNumber
  );

  useEffect(() => {
    setMenu(null);
    setActiveNoteId(null);
  }, [passageNumber]);

  const captureSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setMenu(null);
      return;
    }

    const text = sel.toString();
    if (!text || !text.trim()) {
      setMenu(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const startEl =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement;
    const endEl =
      range.endContainer.nodeType === Node.ELEMENT_NODE
        ? (range.endContainer as HTMLElement)
        : range.endContainer.parentElement;

    const startPara = startEl?.closest("[data-para-index]") as HTMLElement | null;
    const endPara = endEl?.closest("[data-para-index]") as HTMLElement | null;

    if (!startPara || !endPara || startPara !== endPara) {
      setMenu(null);
      return;
    }

    const paragraphIndex = Number(startPara.dataset.paraIndex);
    if (Number.isNaN(paragraphIndex)) {
      setMenu(null);
      return;
    }

    const start = getParagraphOffset(
      startPara,
      range.startContainer,
      range.startOffset
    );
    const end = getParagraphOffset(
      startPara,
      range.endContainer,
      range.endOffset
    );
    if (end <= start) {
      setMenu(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setMenu({
      x: Math.max(
        16,
        Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 90)
      ),
      y: Math.max(16, rect.top - 48),
      paragraphIndex,
      start,
      end,
      text: text.trim(),
    });
  }, []);

  const addHighlight = (withNote: boolean) => {
    if (!menu) return;
    const id = `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const filtered = highlights.filter(
      (h) =>
        !(
          h.passage === passageNumber &&
          h.paragraphIndex === menu.paragraphIndex &&
          h.start < menu.end &&
          h.end > menu.start
        )
    );
    const created: PassageHighlight = {
      id,
      passage: passageNumber,
      paragraphIndex: menu.paragraphIndex,
      start: menu.start,
      end: menu.end,
      text: menu.text,
      note: withNote ? "" : undefined,
    };
    onChangeHighlights([...filtered, created]);
    window.getSelection()?.removeAllRanges();
    setMenu(null);
    if (withNote) {
      setActiveNoteId(id);
      setNoteDraft("");
    }
  };

  const removeHighlight = (id: string) => {
    onChangeHighlights(highlights.filter((h) => h.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const saveNote = () => {
    if (!activeNoteId) return;
    onChangeHighlights(
      highlights.map((h) =>
        h.id === activeNoteId ? { ...h, note: noteDraft.trim() } : h
      )
    );
    setActiveNoteId(null);
  };

  const renderParagraphText = (text: string, pIndex: number) => {
    const pHighlights = passageHighlights
      .filter((h) => h.paragraphIndex === pIndex)
      .sort((a, b) => a.start - b.start);

    if (pHighlights.length === 0) return text;

    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    for (const h of pHighlights) {
      const s = Math.max(cursor, Math.min(h.start, text.length));
      const e = Math.max(s, Math.min(h.end, text.length));
      if (s > cursor) {
        nodes.push(text.slice(cursor, s));
      }
      if (e > s) {
        nodes.push(
          <mark
            key={h.id}
            data-testid={`reading-highlight-${h.id}`}
            onClick={(ev) => {
              ev.stopPropagation();
              setActiveNoteId(h.id);
              setNoteDraft(h.note || "");
            }}
            style={{ backgroundColor: highlightBg, color: highlightFg }}
            className="cursor-pointer rounded-xs px-0.5 py-0 font-medium"
            title={
              h.note ? `Eslatma: ${h.note}` : "Eslatma qo'shish yoki o'chirish"
            }
          >
            {text.slice(s, e)}
            {h.note ? (
              <span className="ml-0.5 inline-block rounded-xs bg-zinc-900 px-1 text-[10px] font-bold text-amber-200 align-super">
                N
              </span>
            ) : null}
          </mark>
        );
      }
      cursor = e;
    }

    if (cursor < text.length) {
      nodes.push(text.slice(cursor));
    }

    return nodes;
  };

  const activeHighlight = activeNoteId
    ? passageHighlights.find((h) => h.id === activeNoteId) || null
    : null;

  return (
    <div
      ref={containerRef}
      onMouseUp={captureSelection}
      onContextMenu={(e) => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim()) {
          e.preventDefault();
          captureSelection();
        }
      }}
      className={`relative h-full overflow-y-auto px-7 py-6 select-text ${
        isDark ? "bg-[#0b192f] text-[#e2e8f0]" : "bg-white text-[#111827]"
      }`}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2
              className={`text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#111827]"
              }`}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className={`mt-2 text-center text-sm italic ${
                  isDark ? "text-[#94a3b8]" : "text-[#4b5563]"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {passageHighlights.length > 0 && (
            <button
              type="button"
              onClick={() =>
                onChangeHighlights(
                  highlights.filter((h) => h.passage !== passageNumber)
                )
              }
              className={`inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-medium ${
                isDark
                  ? "border-[#284773] bg-[#0e203b] text-[#cbd5e1] hover:border-[#4b72aa]"
                  : "border-[#d1d5db] bg-[#f9fafb] text-[#374151] hover:bg-[#f3f4f6]"
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span>Tozalash ({passageHighlights.length})</span>
            </button>
          )}
        </div>

        <div
          className={`mt-5 space-y-4 text-[15.5px] leading-[1.72] ${
            isDark ? "text-[#e2e8f0]" : "text-[#1f2937]"
          }`}
        >
          {paragraphs.map((para, idx) => (
            <div key={idx} className="flex items-start gap-3">
              {para.label && (
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border font-mono text-xs font-bold select-none ${
                    isDark
                      ? "border-[#3a5c8d] bg-[#102340] text-white"
                      : "border-[#9ca3af] bg-[#f3f4f6] text-[#111827]"
                  }`}
                >
                  {para.label}
                </span>
              )}
              <p data-para-index={idx} className="flex-1">
                {renderParagraphText(para.text, idx)}
              </p>
            </div>
          ))}
        </div>

        {/* Saved Notes Panel */}
        {passageHighlights.some((h) => h.note) && (
          <div
            className={`mt-8 rounded-lg border p-4 ${
              isDark
                ? "border-[#1f3a63] bg-[#0e203b]"
                : "border-[#e5e7eb] bg-[#f9fafb]"
            }`}
          >
            <p
              className={`font-mono text-[11px] font-semibold tracking-wider uppercase ${
                isDark ? "text-[#94a3b8]" : "text-[#6b7280]"
              }`}
            >
              Eslatmalar (Notes)
            </p>
            <div className="mt-2.5 space-y-2">
              {passageHighlights
                .filter((h) => h.note)
                .map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-xs ${
                      isDark
                        ? "border-[#284773] bg-[#091529] text-[#e2e8f0]"
                        : "border-[#e5e7eb] bg-white text-[#111827]"
                    }`}
                  >
                    <div>
                      <p className="italic opacity-70">
                        &ldquo;{h.text.slice(0, 80)}
                        {h.text.length > 80 ? "..." : ""}&rdquo;
                      </p>
                      <p className="mt-1 font-medium">{h.note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHighlight(h.id)}
                      className="cursor-pointer opacity-60 hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Highlight / Note Selection Toolbar */}
      {menu && (
        <div
          data-testid="reading-highlight-toolbar"
          style={{ left: menu.x, top: menu.y }}
          onMouseDown={(e) => e.preventDefault()}
          className={`fixed z-50 flex items-center gap-1 rounded-lg border p-1 shadow-2xl ${
            isDark
              ? "border-[#2c4a75] bg-[#0e203b] text-white"
              : "border-[#d1d5db] bg-white text-[#111827]"
          }`}
        >
          <button
            type="button"
            data-testid="highlight-yellow-btn"
            onClick={() => addHighlight(false)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              isDark ? "hover:bg-[#1a335a]" : "hover:bg-[#f3f4f6]"
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-xs border border-black/20"
              style={{ backgroundColor: highlightBg }}
            />
            <Highlighter className="h-3.5 w-3.5" />
            <span>Highlight</span>
          </button>
          <div
            className={`h-4 w-px ${isDark ? "bg-[#2c4a75]" : "bg-[#e5e7eb]"}`}
          />
          <button
            type="button"
            data-testid="highlight-note-btn"
            onClick={() => addHighlight(true)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              isDark ? "hover:bg-[#1a335a]" : "hover:bg-[#f3f4f6]"
            }`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>Note</span>
          </button>
        </div>
      )}

      {/* Note Editor Modal */}
      {activeHighlight && (
        <div
          onClick={() => setActiveNoteId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-xl border p-5 shadow-2xl ${
              isDark
                ? "border-[#2c4a75] bg-[#0e203b] text-white"
                : "border-[#d1d5db] bg-white text-[#111827]"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">Highlight &amp; Eslatma (Note)</h4>
              <button
                type="button"
                onClick={() => setActiveNoteId(null)}
                className="cursor-pointer opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p
              className={`mt-2 rounded-md border px-3 py-2 text-xs italic ${
                isDark
                  ? "border-[#1f3a63] bg-[#091529] text-[#cbd5e1]"
                  : "border-[#e5e7eb] bg-[#f9fafb] text-[#4b5563]"
              }`}
            >
              &ldquo;{activeHighlight.text.slice(0, 140)}&rdquo;
            </p>
            <textarea
              rows={3}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Eslatma yozing..."
              className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                isDark
                  ? "border-[#2c4a75] bg-[#060f1e] text-white placeholder:text-[#64748b] focus:border-[#60a5fa]"
                  : "border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb]"
              }`}
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => removeHighlight(activeHighlight.id)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  isDark
                    ? "border-[#2c4a75] text-[#cbd5e1] hover:bg-[#1a335a]"
                    : "border-[#d1d5db] text-[#374151] hover:bg-[#f3f4f6]"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>O&apos;chirish</span>
              </button>
              <button
                type="button"
                onClick={saveNote}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold ${
                  isDark
                    ? "bg-white text-[#091529] hover:bg-slate-200"
                    : "bg-[#111827] text-white hover:bg-[#1f2937]"
                }`}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
