"use client";

import { Maximize2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { WritingTask1Config } from "@/lib/exam-types";

interface Task1ChartProps {
  config: WritingTask1Config;
  compact?: boolean;
}

function ChartSvg({
  config,
  large = false,
}: {
  config: WritingTask1Config;
  large?: boolean;
}) {
  const width = 820;
  const height = 430;
  const padLeft = 86;
  const padRight = 195;
  const padTop = 58;
  const padBottom = 56;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const yTicks: number[] = [];
  for (let v = 0; v <= config.yMax; v += config.yStep) {
    yTicks.push(v);
  }

  const groupCount = config.data.length;
  const groupW = plotW / groupCount;
  const seriesCount = config.series.length;
  const barAreaW = groupW * 0.72;
  const barW = barAreaW / seriesCount;

  const yPos = (val: number) =>
    padTop + plotH - (Math.max(0, Math.min(val, config.yMax)) / config.yMax) * plotH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={config.chartTitle}
      className={large ? "h-auto w-full max-w-5xl select-none" : "h-auto w-full select-none"}
    >
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" rx="8" />

      {/* Title */}
      <text
        x={width / 2}
        y="30"
        textAnchor="middle"
        fill="#1e293b"
        fontSize="19"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      >
        {config.chartTitle}
      </text>

      {/* Horizontal grid lines + Y-axis labels */}
      {yTicks.map((tick) => {
        const y = yPos(tick);
        return (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={y}
              x2={padLeft + plotW}
              y2={y}
              stroke={tick === 0 ? "#94a3b8" : "#e2e8f0"}
              strokeWidth={tick === 0 ? "1.5" : "1"}
            />
            <text
              x={padLeft - 12}
              y={y + 4}
              textAnchor="end"
              fill="#334155"
              fontSize="13"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
            >
              {tick.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}

      {/* Y-axis spine */}
      <line
        x1={padLeft}
        y1={padTop}
        x2={padLeft}
        y2={padTop + plotH}
        stroke="#94a3b8"
        strokeWidth="1.5"
      />

      {/* Grouped Bars */}
      {config.data.map((datum, gIdx) => {
        const groupStart = padLeft + gIdx * groupW + (groupW - barAreaW) / 2;
        return (
          <g key={datum.season}>
            {config.series.map((s, sIdx) => {
              const val = datum.values[s.key] ?? 0;
              const topY = yPos(val);
              const barH = Math.max(0, padTop + plotH - topY);
              const x = groupStart + sIdx * barW;
              return (
                <rect
                  key={s.key}
                  x={x + 1}
                  y={topY}
                  width={Math.max(4, barW - 2)}
                  height={barH}
                  fill={s.color}
                  rx="1"
                >
                  <title>{`${datum.season} — ${s.label}: $${val.toLocaleString("en-US")}`}</title>
                </rect>
              );
            })}
            <text
              x={padLeft + gIdx * groupW + groupW / 2}
              y={padTop + plotH + 26}
              textAnchor="middle"
              fill="#1e293b"
              fontSize="14"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
            >
              {datum.season}
            </text>
          </g>
        );
      })}

      {/* Legend on Right */}
      <g transform={`translate(${padLeft + plotW + 22}, ${padTop + 72})`}>
        {config.series.map((s, idx) => (
          <g key={s.key} transform={`translate(0, ${idx * 30})`}>
            <rect x="0" y="-11" width="13" height="13" fill={s.color} rx="2" />
            <text
              x="21"
              y="0"
              fill="#1e293b"
              fontSize="13.5"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
            >
              {s.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

export function Task1Chart({ config, compact = false }: Task1ChartProps) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <>
      <div
        data-testid="task1-chart-card"
        onClick={() => setZoomed(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setZoomed(true);
        }}
        className={`group relative cursor-zoom-in overflow-hidden rounded-lg border border-zinc-700 bg-white shadow-sm transition hover:border-zinc-400 ${
          compact ? "p-2" : "p-3"
        }`}
      >
        <ChartSvg config={config} />
        <div className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-zinc-900/85 px-2.5 py-1 text-[11px] font-medium text-zinc-100 opacity-85 transition group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Kattalashtirish</span>
        </div>
      </div>

      {zoomed && (
        <div
          data-testid="task1-chart-lightbox"
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl rounded-xl border border-zinc-700 bg-white p-4 shadow-2xl"
          >
            <button
              type="button"
              data-testid="task1-chart-lightbox-close"
              onClick={() => setZoomed(false)}
              aria-label="Yopish"
              className="absolute top-3 right-3 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-zinc-900 text-white hover:bg-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
            <ChartSvg config={config} large />
          </div>
        </div>
      )}
    </>
  );
}
