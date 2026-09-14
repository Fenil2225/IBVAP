"use client";

import { useState } from "react";

export default function CircularChart({
  data = [],
  title = "Distribution Graph",
  size = 200,
  strokeWidth = 24,
  centerLabel = "Total",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const validData = Array.isArray(data) ? data.filter((d) => (d.value || 0) > 0) : [];
  const totalValue = validData.reduce((acc, curr) => acc + (curr.value || 0), 0) || 1;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const slices = validData.map((item, index) => {
    const percent = item.value / totalValue;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
      index,
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-950/40 dark:bg-slate-950/50 border border-slate-800/80 transition-all duration-300">
      {title && (
        <div className="w-full text-left mb-2 text-xs font-bold uppercase tracking-wider text-teal-400">
          {title}
        </div>
      )}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-800/60 dark:text-slate-900/90"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <circle
                key={slice.label || slice.index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color || "#2dd4bf"}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="transition-all duration-300 cursor-pointer opacity-90 hover:opacity-100"
                style={{
                  filter: isHovered ? `drop-shadow(0 0 6px ${slice.color})` : "none",
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {activeSlice ? (
            <>
              <span className="text-lg font-black text-white dark:text-white" style={{ color: activeSlice.color }}>
                {activeSlice.percent}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[80px]">
                {activeSlice.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-base font-extrabold text-white dark:text-white">
                100%
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {centerLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-full">
        {slices.map((slice) => {
          const isHovered = hoveredIndex === slice.index;
          return (
            <button
              key={slice.label}
              type="button"
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                isHovered
                  ? "bg-slate-800 text-white shadow-sm ring-1 ring-teal-400/40"
                  : "bg-slate-900/60 text-slate-300 hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: slice.color || "#2dd4bf" }}
              />
              <span className="capitalize">{slice.label}:</span>
              <span className="font-mono text-teal-300">{slice.percent}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
