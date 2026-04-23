"use client";

import { useMemo } from "react";
import { AN } from "./analytics-tokens";

type Props = {
  values: number[];
  className?: string;
  color?: string;
  width?: number;
  height?: number;
};

/**
 * Gera trilha SVG mínima para sparkline (0–1 normalizado)
 */
export function SparklinePath({
  values,
  className = "",
  color = AN.green,
  height = 36,
  width = 120,
}: Props) {
  const d = useMemo(() => {
    if (values.length < 1) return "";
    const v = values.map((n) => (Number.isFinite(n) ? n : 0));
    const min = Math.min(0, ...v);
    const max = Math.max(1, ...v);
    const r = max - min || 1;
    const padX = 2;
    const padY = 2;
    const w = width - 2 * padX;
    const h = height - 2 * padY;
    return v
      .map((n, i) => {
        const x = padX + (i / Math.max(1, v.length - 1)) * w;
        const y = padY + h - ((n - min) / r) * h;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [height, values, width]);

  if (values.length < 2) {
    return (
      <div
        className={`flex items-end justify-start gap-0.5 ${className}`}
        style={{ height }}
      >
        {values[0] != null && (
          <div
            className="h-1 w-full rounded-full opacity-30"
            style={{ background: color }}
          />
        )}
      </div>
    );
  }

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
