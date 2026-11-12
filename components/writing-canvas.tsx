"use client";

import {
  Eraser,
  Highlighter,
  Pencil,
  RotateCcw,
  Table as TableIcon,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { cn } from "@/lib/utils";
import { WRITING_TESTS, type WritingTableRow } from "@/lib/writing-tests";

interface WritingCanvasProps {
  imageUrl: string;
  fallbackImageUrl?: string;
  imageAlt?: string;
  lightboxTitle?: string;
  tableTitle?: string;
  columns?: string[];
  rows?: WritingTableRow[];
  className?: string;
}

type ToolMode = "pen" | "highlighter" | "eraser";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  mode: ToolMode;
}

const COLORS = [
  { id: "emerald", value: "#059669", label: "Yashil" },
  { id: "red", value: "#dc2626", label: "Qizil" },
  { id: "blue", value: "#2563eb", label: "Ko'k" },
  { id: "amber", value: "#d97706", label: "Sariq" },
  { id: "purple", value: "#9333ea", label: "Binafsha" },
];

const STROKE_WIDTHS = [
  { id: "thin", value: 2, label: "2px" },
  { id: "medium", value: 4, label: "4px" },
  { id: "thick", value: 8, label: "8px" },
];

// Official Data for UK City Tourism-related jobs (1989 - 2009)
export const TASK1_HD_DATA = [
  {
    year: "1989",
    restaurants: 1100,
    hotels: 1050,
    leisure: 900,
    travel: 800,
    total: 3850,
  },
  {
    year: "1994",
    restaurants: 1300,
    hotels: 1400, // Peak for hotels
    leisure: 700,
    travel: 1040,
    total: 4440,
  },
  {
    year: "1999",
    restaurants: 1400,
    hotels: 1220,
    leisure: 1050, // Peak for leisure
    travel: 900,
    total: 4570,
  },
  {
    year: "2004",
    restaurants: 1600, // All-time highest peak
    hotels: 1080,
    leisure: 900,
    travel: 700,
    total: 4280,
  },
  {
    year: "2009",
    restaurants: 1300,
    hotels: 1050,
    leisure: 700,
    travel: 400, // Lowest nadir
    total: 3450,
  },
];

export function WritingCanvas({
  imageUrl,
  fallbackImageUrl = WRITING_TESTS[0].task1.fallbackImageUrl,
  imageAlt = WRITING_TESTS[0].task1.imageAlt,
  lightboxTitle = WRITING_TESTS[0].task1.lightboxTitle,
  tableTitle = WRITING_TESTS[0].task1.tableTitle,
  columns = WRITING_TESTS[0].task1.columns,
  rows = WRITING_TESTS[0].task1.rows,
  className,
}: WritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<ToolMode>("pen");
  const [selectedColor, setSelectedColor] = useState<string>("#059669"); // Default emerald annotation
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStroke = useRef<Point[]>([]);

  // Lightbox zoom modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showDataTable, setShowDataTable] = useState(true);

  useEffect(() => {
    setStrokes([]);
  }, [imageUrl]);

  // Redraw all strokes onto canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.mode === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.width * 2.5;
        ctx.stroke();
      } else if (stroke.mode === "highlighter") {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * 3.5;
        ctx.stroke();
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [strokes]);

  // Adjust canvas resolution to match underlying image
  const syncCanvasDimensions = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        redrawCanvas();
      }
    }
  }, [redrawCanvas]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    if (img.complete) {
      syncCanvasDimensions();
    } else {
      img.onload = () => syncCanvasDimensions();
    }

    window.addEventListener("resize", syncCanvasDimensions);
    return () => window.removeEventListener("resize", syncCanvasDimensions);
  }, [syncCanvasDimensions]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCoordinates = (
    e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>
  ) => {
    const pt = getCoordinates(e);
    if (!pt) return;
    setIsDrawing(true);
    currentStroke.current = [pt];
  };

  const draw = (
    e: ReactMouseEvent<HTMLCanvasElement> | ReactTouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    currentStroke.current.push(pt);

    // Live preview on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pts = currentStroke.current;
    if (pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = strokeWidth * 2.5;
      ctx.stroke();
    } else if (activeTool === "highlighter") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth * 3.5;
      ctx.stroke();
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.current.length > 0) {
      setStrokes((prev) => [
        ...prev,
        {
          points: currentStroke.current,
          color: selectedColor,
          width: strokeWidth,
          mode: activeTool,
        },
      ]);
    }
    currentStroke.current = [];
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Precision Annotation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-100/90 p-1.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
        {/* Tool Selector */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTool("pen")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
              activeTool === "pen"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Qalam</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("highlighter")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
              activeTool === "highlighter"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ajratgich</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("eraser")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer",
              activeTool === "eraser"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            <Eraser className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">O&apos;chirgich</span>
          </button>
        </div>

        {/* Color Palette */}
        {activeTool !== "eraser" && (
          <div className="flex items-center gap-1 border-x border-zinc-200 px-2 dark:border-zinc-800">
            {COLORS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedColor(col.value)}
                title={col.label}
                aria-label={col.label}
                className={cn(
                  "h-4.5 w-4.5 rounded-full transition-transform cursor-pointer",
                  selectedColor === col.value && "scale-125 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900"
                )}
                style={{ backgroundColor: col.value }}
              />
            ))}
          </div>
        )}

        {/* Stroke Width Selector */}
        <div className="hidden items-center gap-1 sm:flex">
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setStrokeWidth(w.value)}
              className={cn(
                "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors cursor-pointer",
                strokeWidth === w.value
                  ? "bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Actions: Undo, Clear & HD Zoom Modal */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            title="Qaytarish (Undo)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokes.length === 0}
            title="Tozalash (Clear all)"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="h-4 w-[1px] bg-zinc-300 dark:bg-zinc-700 mx-0.5" />
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            title="HD Kattalashtirib ko'rish (Zoom In / Lightbox)"
            className="flex items-center gap-1 rounded-lg bg-emerald-600/15 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600/25 dark:bg-emerald-500/20 dark:text-emerald-300 cursor-pointer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kattalashtirish</span>
          </button>
        </div>
      </div>

      {/* Visual Canvas Drawing Container with Enhanced Contrast Filter */}
      <div
        ref={containerRef}
        className="group relative mx-auto w-full overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* Underlying official task image with high-definition contrast filter */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt={imageAlt}
          className="block h-auto w-full select-none object-contain pointer-events-none contrast-105 brightness-100 filter [image-rendering:crisp-edges]"
          draggable={false}
          onError={(e) => {
            const target = e.currentTarget;
            if (fallbackImageUrl && !target.src.includes(fallbackImageUrl)) {
              target.src = fallbackImageUrl;
            }
          }}
        />

        {/* Canvas overlay for interactive sketch and notes */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
        />

        {/* Hover Zoom quick button in bottom-right corner */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-bold text-zinc-800 shadow-sm backdrop-blur-xs transition-transform hover:scale-105 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 cursor-pointer"
        >
          <ZoomIn className="h-3.5 w-3.5 text-emerald-600" />
          <span>HD Ko&apos;rish</span>
        </button>
      </div>

      {/* Interactive HD Data Table Toggle & Content */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-[#111113]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TableIcon className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {tableTitle}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDataTable(!showDataTable)}
            className="font-mono text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400 cursor-pointer"
          >
            {showDataTable ? "Yopish ▲" : "Ko'rsatish ▼"}
          </button>
        </div>

        {showDataTable && (
          <div className="mt-3 overflow-x-auto scrollbar-thin">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  {columns.map((col, idx) => (
                    <th
                      key={col}
                      className={cn(
                        "py-1.5 font-bold",
                        idx === 0
                          ? "pr-2"
                          : "px-2 text-zinc-800 dark:text-zinc-200"
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {rows.map((row) => (
                  <tr key={row.keyLabel} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="py-1.5 pr-2 font-black text-emerald-600 dark:text-emerald-400">
                      {row.keyLabel}
                    </td>
                    {row.cells.map((cell, idx) => (
                      <td
                        key={`${row.keyLabel}-${idx}`}
                        className="py-1.5 px-2 text-zinc-700 dark:text-zinc-300"
                      >
                        <span
                          className={cn(
                            cell.highlight === "emerald" &&
                              "font-black text-emerald-600 dark:text-emerald-400",
                            cell.highlight === "red" &&
                              "font-black text-red-500 dark:text-red-400"
                          )}
                        >
                          {cell.text}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal for HD Graph inspection */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsLightboxOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          <div className="relative z-10 flex max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-700 bg-white shadow-2xl dark:bg-[#111113]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  HD DIAGRAMMA
                </span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {lightboxTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Image container */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={imageAlt}
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-lg contrast-110 brightness-100 filter [image-rendering:crisp-edges]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (fallbackImageUrl && !target.src.includes(fallbackImageUrl)) {
                    target.src = fallbackImageUrl;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
