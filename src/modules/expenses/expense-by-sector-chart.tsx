"use client";

import { Card } from "@/design-system";
import type { SectorBarRow } from "@/lib/expense-analytics";
import { formatBRLFine } from "@/lib/format";

const BAR_MAX_H = 160;

type Props = {
  data: SectorBarRow[];
  emptyMessage?: string;
};

export function ExpenseBySectorChart({ data, emptyMessage }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <Card className="border border-gray-100/90 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Por setor</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Totais no período filtrado (ordem decrescente)</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {emptyMessage ?? "Sem dados de setor no filtro."}
        </p>
      ) : (
        <ul className="flex min-h-[200px] items-end justify-start gap-3 overflow-x-auto pb-1">
          {data.map((row) => {
            const h = (row.total / max) * BAR_MAX_H;
            return (
              <li key={row.sectorId} className="flex w-20 shrink-0 flex-col items-center gap-2">
                <span className="text-[10px] font-medium tabular-nums text-rose-800 dark:text-rose-200/90">
                  {formatBRLFine(row.total)}
                </span>
                <div
                  className="w-full min-w-10 rounded-t-lg bg-gradient-to-t from-rose-200 to-rose-500 dark:from-rose-900/60 dark:to-rose-600/90"
                  style={{ height: Math.max(8, h) }}
                />
                <span className="w-full text-center text-[10px] font-medium leading-tight text-gray-600 line-clamp-2 dark:text-slate-300">
                  {row.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
