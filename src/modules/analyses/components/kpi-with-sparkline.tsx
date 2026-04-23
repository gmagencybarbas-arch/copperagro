"use client";

import { formatBRL } from "@/lib/format";
import { SparklinePath } from "./sparkline-path";
import { AN } from "./analytics-tokens";
import { TrendingDown, TrendingUp } from "lucide-react";

type Variant = "revenue" | "expense" | "profit";

const variantStyles: Record<
  Variant,
  { line: string; label: string; card: string }
> = {
  revenue: { line: AN.green, label: "Faturamento", card: "border-[#e6eae8] bg-white" },
  expense: { line: AN.red, label: "Despesas", card: "border-[#e6eae8] bg-white" },
  profit: {
    line: AN.profit,
    label: "Resultado",
    card: "border-[#1f7a63]/20 bg-gradient-to-br from-white to-[#1f7a63]/[0.04] ring-1 ring-[#1f7a63]/10",
  },
};

type Props = {
  variant: Variant;
  value: number;
  changePct: number;
  sparkline: number[];
  sublabel?: string;
};

function fmtDelta(p: number): string {
  if (!Number.isFinite(p) || p === 0) return "0%";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1)}%`;
}

export function KPIWithSparkline({
  variant,
  value,
  changePct,
  sparkline,
  sublabel = "vs sem. anterior",
}: Props) {
  const vs = variantStyles[variant];
  const positive = changePct >= 0;
  const forExpense = variant === "expense";
  const isGood = forExpense ? !positive : positive;

  return (
    <div
      className={`group relative flex min-h-[132px] flex-col justify-between rounded-2xl border p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] transition-all duration-200 ease-app hover:shadow-md hover:shadow-slate-900/[0.06] ${vs.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b66]">
          {vs.label}
        </p>
        <div
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
            isGood
              ? "bg-emerald-50 text-[#1f7a63] dark:bg-emerald-950/50 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200"
          }`}
        >
          {isGood ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {fmtDelta(changePct)}
        </div>
      </div>
      <p
        className={`mt-1 text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl ${
          variant === "profit" ? "text-[#0d5c4a] dark:text-emerald-200" : "text-slate-900 dark:text-slate-50"
        }`}
      >
        {formatBRL(Math.round(value))}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-[10px] text-[#5c6b66] dark:text-slate-500">{sublabel}</p>
        <div className="shrink-0 opacity-80 transition-opacity group-hover:opacity-100">
          <SparklinePath values={sparkline} color={vs.line} width={100} height={32} />
        </div>
      </div>
    </div>
  );
}
