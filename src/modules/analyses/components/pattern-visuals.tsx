"use client";

import { SparklinePath } from "./sparkline-path";
import { AN } from "./analytics-tokens";
import { formatBRLFine } from "@/lib/format";
import { CalendarRange, LineChart, Calendar } from "lucide-react";

type Props = {
  bestMonthName: string | null;
  bestMonthPrice: number | null;
  bestWeek: number | null;
  bestWeekPrice: number | null;
  profitSpark: number[];
  hasMomentum: boolean;
};

/**
 * Padrões históricos com pequena visualização (não só texto)
 */
export function PatternVisuals({
  bestMonthName,
  bestMonthPrice,
  bestWeek,
  bestWeekPrice,
  profitSpark,
  hasMomentum,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-[#e6eae8] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#5c6b66]">
          <CalendarRange className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase">Melhor mês (preço)</span>
        </div>
        {bestMonthName && bestMonthPrice != null ? (
          <>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-slate-100">
              {bestMonthName}
            </p>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full w-full rounded-full bg-gradient-to-r from-[#1f7a63] to-[#2e7d5b]"
                style={{ width: "100%" }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: AN.profit }}>
              {formatBRLFine(bestMonthPrice)} méd.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-[#5c6b66]">Dados insuficientes</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#e6eae8] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#5c6b66]">
          <Calendar className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase">Semanas do mês</span>
        </div>
        <div className="mt-3 flex h-12 items-end justify-between gap-1">
          {[1, 2, 3, 4].map((w) => {
            const h = bestWeek === w ? 100 : 35 + w * 12;
            return (
              <div
                key={w}
                className="flex-1 rounded-t-sm bg-slate-200/90 transition-all dark:bg-slate-700/80"
                style={{
                  height: `${h}%`,
                  background:
                    bestWeek === w
                      ? `linear-gradient(180deg, ${AN.green}, #2e7d5b)`
                      : undefined,
                }}
                title={`Semana ${w}`}
              />
            );
          })}
        </div>
        {bestWeek != null && bestWeekPrice != null && (
          <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
            Destaque: sem. <strong>{bestWeek}</strong> — {formatBRLFine(bestWeekPrice)}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-[#e6eae8] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#5c6b66]">
          <LineChart className="h-4 w-4" />
          <span className="text-[11px] font-bold uppercase">Tend. lucro (semanal)</span>
        </div>
        <div className="mt-2">
          <SparklinePath
            values={profitSpark.length > 1 ? profitSpark : [0, 0]}
            color={AN.profit}
            width={160}
            height={40}
          />
        </div>
        <p className="mt-1 text-xs text-[#5c6b66]">
          {hasMomentum ? "Há sinal de comparação com janela anterior" : "Série de lucro semanal (referência visual)"}
        </p>
      </div>
    </div>
  );
}
