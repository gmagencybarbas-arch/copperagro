"use client";

import { SparklinePath } from "./sparkline-path";
import { AN } from "./analytics-tokens";
import { AlertTriangle, Clock3 } from "lucide-react";

type Props = {
  title?: string;
  mode: "global" | "sector";
  /** Stock / inventário: valor ou unidade */
  stockLabel: string;
  stockValue: string;
  /** Semanas restantes (número) para cálculo de urgência e texto */
  weeksRemaining: number | null;
  /** séries simples de tendência (ex.: faturamento semanal) */
  trendPoints: number[];
  runwayLabel?: string;
  runwayValue?: string | null;
};

/**
 * Urgência 0 = muitas semanas, 1 = quase a esgotar
 */
function urgencyFromWeeks(weeks: number | null): number {
  if (weeks == null || !Number.isFinite(weeks) || weeks < 0) return 0.2;
  return 1 - Math.min(1, weeks / 20);
}

function barClass(u: number): string {
  if (u < 0.4) return "from-[#1f7a63] to-[#2e7d5b]";
  if (u < 0.72) return "from-amber-500 to-amber-400";
  return "from-rose-600 to-rose-500";
}

function paceSentence(weeks: number | null, daysApprox: number | null) {
  if (weeks == null || !Number.isFinite(weeks)) {
    return "Ritmo sem referência ainda — registe saídas para ver cobertura.";
  }
  const w = weeks;
  if (w > 0 && w < 0.3) {
    return `Neste ritmo, o tempo está quase a esgotar (menos de 2 dias). Reponha ou ajuste vendas.`;
  }
  const d = daysApprox != null ? Math.round(daysApprox) : Math.round(w * 7);
  if (w < 3) {
    return `Neste ritmo, tem cerca de ${w.toFixed(1)} semanas (≈${d} dias) de cobertura. Antecipe a reposição.`;
  }
  if (w < 6) {
    return `Neste ritmo, tem aproximadamente ${w.toFixed(1)} semanas (≈${d} dias) — acompanhe a folga.`;
  }
  return `Neste ritmo, tem aproximadamente ${w.toFixed(1)} semanas (≈${d} dias) de folga.`;
}

export function ProjectionCard({
  title = "Projeção",
  mode,
  stockLabel,
  stockValue,
  weeksRemaining,
  trendPoints,
  runwayLabel = "Fatur. projectado (stock)",
  runwayValue,
}: Props) {
  const u = urgencyFromWeeks(weeksRemaining);
  const w = weeksRemaining;
  const daysApprox = w != null && Number.isFinite(w) ? w * 7 : null;
  const urgent = w != null && w < 4;

  return (
    <div
      className={`flex h-full min-h-[300px] flex-col rounded-2xl border p-6 shadow-sm transition-shadow ${
        urgent
          ? "border-amber-200/90 bg-gradient-to-b from-amber-50/40 to-white ring-1 ring-amber-500/10"
          : "border-[#e6eae8] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-[#5c6b66]">
            {mode === "global" ? "Cobertura do inventário (R$ / semana)" : "Cobertura de stock a este ritmo"}
          </p>
        </div>
        {urgent && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2 py-1 text-[10px] font-bold text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5" />
            Atenção
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c6b66]">
          {stockLabel}
        </p>
        <p className="mt-1.5 break-words text-3xl font-bold tabular-nums text-[#0d5c4a] dark:text-emerald-200">
          {stockValue}
        </p>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-slate-800">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#1f7a63]" />
        {paceSentence(w, daysApprox)}
      </p>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-[10px] font-medium text-[#5c6b66]">
          <span>Quanto falta o tempo a esgotar (a este ritmo)</span>
          <span className="tabular-nums text-slate-700">
            {w != null && Number.isFinite(w) ? `${(u * 100).toFixed(0)}%` : "—"}
          </span>
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barClass(u)} transition-[width] duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(4, u * 100))}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-[#5c6b66]">Verde: folga | Amarelo: apertar o calendário | Vermelho: actuar já</p>
      </div>

      {runwayValue != null && (
        <p className="mt-4 text-sm">
          <span className="text-[#5c6b66]">{runwayLabel}:</span>{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {runwayValue}
          </span>
        </p>
      )}

      <div className="mt-auto border-t border-[#e6eae8]/80 pt-4">
        <p className="text-[10px] font-bold uppercase text-[#5c6b66]">Ritmo recente (R$ / sem. implícito)</p>
        <div className="mt-2 flex items-end justify-between">
          <SparklinePath values={trendPoints} color={AN.green} width={200} height={40} />
        </div>
      </div>
    </div>
  );
}
