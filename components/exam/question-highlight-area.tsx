"use client";

import { Highlighter, Trash2 } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";

export type ExamTheme = "light" | "dark";

interface QuestionHighlightAreaProps {
  theme: ExamTheme;
  children: ReactNode;
  className?: string;
}

interface FloatingPos {
  x: number;
  y: number;
  range: Range;
}

export function QuestionHighlightArea({
  theme,
  children,
  className = "",
}: QuestionHighlightAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState<FloatingPos | null>(null);

  const checkSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setFloating(null);
      return;
    }
    const text = sel.toString();
    if (!text || !text.trim()) {
      setFloating(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const root = rootRef.current;
    if (!root || !root.contains(range.commonAncestorContainer)) {
      setFloating(null);
      return;
    }
    // Don't pop toolbar when selecting text inside an input/textarea
    const ancestorEl =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;
    if (ancestorEl?.closest("input, textarea, select")) {
      setFloating(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setFloating(null);
      return;
    }
    setFloating({
      x: Math.max(12, Math.min(window.innerWidth - 150, rect.left + rect.width / 2 - 60)),
      y: Math.max(12, rect.top - 44),
      range: range.cloneRange(),
    });
  }, []);

  const applyHighlight = () => {
    if (!floating) return;
    const range = floating.range;
    try {
      const mark = document.createElement("mark");
      mark.setAttribute("data-cdi-qhl", "1");
      mark.style.backgroundColor = theme === "dark" ? "#f97316" : "#fbbf24";
      mark.style.color = theme === "dark" ? "#ffffff" : "#111827";
      mark.style.borderRadius = "2px";
      mark.style.padding = "0 2px";
      mark.style.cursor = "pointer";
      mark.title = "Highlightni o'chirish uchun bosing";
      mark.onclick = (ev) => {
        ev.stopPropagation();
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      };
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    } catch {
      // Ignore partial cross-element range edge cases
    }
    window.getSelection()?.removeAllRanges();
    setFloating(null);
  };

  const clearAllInArea = () => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll("mark[data-cdi-qhl='1']").forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
    setFloating(null);
  };

  return (
    <div
      ref={rootRef}
      onMouseUp={checkSelection}
      onContextMenu={(e) => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim()) {
          e.preventDefault();
          checkSelection();
        }
      }}
      className={`select-text ${className}`}
    >
      {children}

      {floating && (
        <div
          data-testid="question-highlight-toolbar"
          style={{ left: floating.x, top: floating.y }}
          onMouseDown={(e) => e.preventDefault()}
          className={`fixed z-50 flex items-center gap-1 rounded-lg border p-1 shadow-xl ${
            theme === "dark"
              ? "border-[#2c4a75] bg-[#0e203b] text-white"
              : "border-zinc-300 bg-white text-zinc-900"
          }`}
        >
          <button
            type="button"
            data-testid="question-highlight-btn"
            onClick={applyHighlight}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
              theme === "dark" ? "hover:bg-[#1a335a]" : "hover:bg-zinc-100"
            }`}
          >
            <span
              className="inline-block h-3 w-3 rounded-xs border border-black/20"
              style={{
                backgroundColor: theme === "dark" ? "#f97316" : "#fbbf24",
              }}
            />
            <Highlighter className="h-3.5 w-3.5" />
            <span>Highlight</span>
          </button>
          <button
            type="button"
            onClick={clearAllInArea}
            title="Barcha belgilarni tozalash"
            className={`cursor-pointer rounded-md p-1.5 ${
              theme === "dark"
                ? "text-slate-400 hover:bg-[#1a335a] hover:text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
