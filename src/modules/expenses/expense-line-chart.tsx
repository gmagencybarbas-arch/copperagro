"use client";

import { Card } from "@/design-system";
import { filterExpenses, lastNDaysWindow, seriesByDay, type DayPoint } from "@/lib/expense-analytics";
import { formatBRLFine } from "@/lib/format";
import type { Expense } from "@/types/expense";
import { useMemo, useState } from "react";

const PRESETS = [
  { id: 7, label: "7d" as const },
  { id: 30, label: "30d" as const },
  { id: 90, label: "90d" as const },
] as const;

type PresetN = 7 | 30 | 90;

type Props = {
  expenses: Expense[];
  /** Filtro de setor a aplicar (igual à página) */
  sectorId: "all" | "global" | string;
};

function maxForSeries(points: DayPoint[]): number {
  return Math.max(1, ...points.map((p) => p.total));
}

export function ExpenseLineChart({ expenses, sectorId }: Props) {
  const [n, setN] = useState<PresetN>(30);

  const { points, from, to, total, maxH } = useMemo(() => {
    const w = lastNDaysWindow(n);
    const sub = filterExpenses(expenses, { sectorId, from: w.from, to: w.to });
    const ser = seriesByDay(sub, w.from, w.to);
    const t = sub.reduce((a, e) => a + e.amount, 0);
    return {
      points: ser,
      from: w.from,
      to: w.to,
      total: t,
      maxH: maxForSeries(ser),
    };
  }, [expenses, sectorId, n]);

  const w = 640;
  const h = 200;
  const pad = 12;
  const bottom = 36;
  const innerH = h - bottom - pad;
  const pathD = useMemo(() => {
    const nPts = points.length;
    if (nPts < 1) return "";
    if (nPts === 1) {
      const x = w / 2;
      const y = pad + innerH - (points[0]!.total / maxH) * innerH;
      return `M${x},${y} L${x + 0.1},${y}`;
    }
    return points
      .map((p, i) => {
        const x = pad + (i / (nPts - 1)) * (w - 2 * pad);
        const y = pad + innerH - (p.total / maxH) * innerH;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }, [innerH, maxH, pad, points, w]);

  return (
    <Card className="border border-gray-100/90 p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Despesas no tempo</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {from} a {to} · soma: {formatBRLFine(total)}
          </p>
        </div>
        <div className="inline-flex gap-1 rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/50">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setN(p.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-app ${
                n === p.id
                  ? "bg-white text-rose-800 shadow-sm dark:bg-slate-700 dark:text-rose-200"
                  : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-gray-500">Sem movimentos no intervalo.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg
            className="min-w-[320px] w-full"
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label="Gráfico de despesas diárias"
          >
            <title>Despesas por dia</title>
            <defs>
              <linearGradient id="expline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(244 63 94 / 0.5)" />
                <stop offset="100%" stopColor="rgb(244 63 94 / 0.05)" />
              </linearGradient>
            </defs>
            {pathD && (
              <>
                <path
                  d={`${pathD} L${w - pad},${h - bottom} L${pad},${h - bottom} Z`}
                  fill="url(#expline)"
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="rgb(190 18 60)"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
            <g transform={`translate(0, ${h - bottom + 4})`}>
              {points.map((p, i) => {
                if (points.length > 20 && i % 3 !== 0) return null;
                const x = pad + (i / Math.max(1, points.length - 1)) * (w - 2 * pad);
                const label = p.day.slice(5);
                return (
                  <text
                    key={p.day + i}
                    x={x}
                    y={0}
                    className="fill-gray-500 text-[9px] dark:fill-slate-400"
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </Card>
  );
}
