"use client";

import { SECTOR_CHART_HEX, SECTOR_COLOR_TOKENS } from "@/lib/sector-palette";
import type { SectorColorToken } from "@/types/sector";
import { useMemo } from "react";

export type PieSlice = {
  label: string;
  value: number;
  /** Sempre token — mesma cor em todos os gráficos para o mesmo setor */
  colorToken: SectorColorToken;
};

type Props = {
  title: string;
  slices: PieSlice[];
  size?: number;
};

function polar(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function hexForSlice(s: PieSlice, index: number): string {
  return SECTOR_CHART_HEX[s.colorToken] ?? SECTOR_CHART_HEX[SECTOR_COLOR_TOKENS[index % SECTOR_COLOR_TOKENS.length]!]!;
}

export function PieDistributionChart({ title, slices, size = 200 }: Props) {
  const { withPct } = useMemo(() => {
    const t = slices.reduce((a, s) => a + s.value, 0) || 1;
    let start = -Math.PI / 2;
    const out: { path: string; slice: PieSlice; pct: number; hex: string }[] = [];
    slices.forEach((s, i) => {
      const angle = (s.value / t) * 2 * Math.PI;
      const end = start + angle;
      const hex = hexForSlice(s, i);
      out.push({
        path: polar(100, 100, 90, start, end),
        slice: s,
        pct: (s.value / t) * 100,
        hex,
      });
      start = end;
    });
    return { withPct: out };
  }, [slices]);

  if (slices.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#e6eae8] bg-white p-6 text-sm text-[#5c6b66]">
        Sem dados para o gráfico.
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-[#e6eae8] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-0.5 text-xs text-[#5c6b66]">Partilha no período analisado</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
        <svg
          viewBox="0 0 200 200"
          className="max-w-[200px] shrink-0"
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {withPct.map((p) => (
            <path
              key={p.slice.label + p.pct}
              d={p.path}
              fill={p.hex}
              stroke="white"
              strokeWidth="1.5"
              className="transition-opacity hover:opacity-90"
            />
          ))}
        </svg>
        <ul className="w-full min-w-0 space-y-2.5 text-sm sm:max-w-[220px]">
          {withPct.map((p) => (
            <li key={p.slice.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: p.hex }}
                />
                <span className="truncate text-slate-800 dark:text-slate-200">
                  {p.slice.label}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-xs font-semibold text-slate-600">
                {p.pct.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { PieDistributionChart as PieChart };
