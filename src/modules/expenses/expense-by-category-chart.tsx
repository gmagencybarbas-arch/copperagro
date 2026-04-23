"use client";

import { Card } from "@/design-system";
import type { CategoryRow } from "@/lib/expense-analytics";
import { formatBRLFine } from "@/lib/format";

const COLORS = [
  "from-amber-200 to-amber-600",
  "from-rose-200 to-rose-500",
  "from-violet-200 to-violet-500",
  "from-emerald-200 to-emerald-600",
  "from-slate-200 to-slate-500",
];

type Props = {
  data: CategoryRow[];
  emptyMessage?: string;
};

export function ExpenseByCategoryChart({ data, emptyMessage }: Props) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <Card className="border border-gray-100/90 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Por categoria</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Percentual e valor no período</p>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          {emptyMessage ?? "Sem despesas classificadas no filtro."}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((row, i) => (
            <li key={row.category}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-800 dark:text-slate-200">{row.label}</span>
                <span className="tabular-nums text-gray-600 dark:text-slate-300">
                  {row.pct.toFixed(1)}% · {formatBRLFine(row.total)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${COLORS[i % COLORS.length]}`}
                  style={{ width: `${(row.total / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
