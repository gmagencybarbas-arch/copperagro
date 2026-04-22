"use client";

import type {
  MonthBar,
  PairedVolumeBar,
} from "@/modules/dashboard/chart-helpers";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  chartTitle?: string;
  chartSubtitle?: string;
  comparisonEnabled?: boolean;
  unitLabel?: string;
} & (
  | { pairedData?: undefined; singleData: MonthBar[] }
  | { pairedData: PairedVolumeBar[]; singleData?: undefined }
);

function ChartLegend({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-6 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
        Vol.
      </span>
      <span className="inline-flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-slate-500" />
        Ref.
      </span>
    </div>
  );
}

/** Barras simples ou agrupadas (atual vs comparação), altura animada. */
export function MonthlyBarChart(props: Props) {
  const {
    chartTitle = "Volume mensal",
    chartSubtitle = "Unidades vendidas por mês",
    comparisonEnabled = false,
    unitLabel = "unidades",
  } = props;

  const pairedData = "pairedData" in props ? props.pairedData : undefined;
  const singleData = "singleData" in props ? props.singleData : undefined;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isPaired = Boolean(pairedData && pairedData.length > 0);

  if (!isPaired && (!singleData || singleData.length === 0)) {
    return (
      <div className="flex min-h-[13rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-600/60 bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-10 text-center ring-1 ring-white/5 transition-all duration-200">
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 text-emerald-500/80 shadow-inner">
          <BarChart3 className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-300">
            Sem volume no período
          </p>
          <p className="mt-1 max-w-xs font-mono text-[11px] leading-relaxed text-slate-500">
            Quando houver vendas neste intervalo, o volume aparece aqui.
          </p>
        </div>
      </div>
    );
  }

  if (
    isPaired &&
    comparisonEnabled &&
    pairedData!.every(
      (r) => r.currentQty === 0 && r.comparisonQty === 0,
    )
  ) {
    return (
      <div className="flex min-h-[13rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/35 bg-amber-950/35 px-6 py-10 text-center ring-1 ring-amber-900/30">
        <p className="font-mono text-sm font-semibold uppercase tracking-wide text-amber-200/95">
          Sem dados para comparação
        </p>
        <p className="max-w-sm font-mono text-[11px] leading-relaxed text-amber-100/70">
          Não há volume registrado no período de comparação para este recorte.
        </p>
      </div>
    );
  }

  const maxQ = isPaired
    ? Math.max(
        ...pairedData!.flatMap((r) => [r.currentQty, r.comparisonQty]),
        1,
      )
    : Math.max(...singleData!.map((d) => d.quantity), 1);

  return (
    <div className="rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5 transition-all duration-300 hover:ring-emerald-500/15">
      <ChartLegend show={comparisonEnabled && isPaired} />
      <div className="mb-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400/90">
          {chartTitle}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{chartSubtitle}</p>
      </div>

      <div className="relative rounded-lg bg-slate-950/90 px-2 py-3 ring-1 ring-white/[0.06]">
        {/* Grade horizontal tipo tape */}
        <div
          className="pointer-events-none absolute inset-x-2 top-3 bottom-14 opacity-[0.45]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent calc(25% - 1px), rgba(51,65,85,0.65) calc(25% - 1px), rgba(51,65,85,0.65) 25%)",
          }}
          aria-hidden
        />
        <div className="relative flex gap-2 sm:gap-3">
          {isPaired
            ? pairedData!.map((row, idx) => {
                const pctCur = (row.currentQty / maxQ) * 100;
                const pctCmp = (row.comparisonQty / maxQ) * 100;
                const hCur = mounted ? Math.max(pctCur, 6) : 0;
                const hCmp = mounted ? Math.max(pctCmp, 6) : 0;
                return (
                  <div
                    key={row.key}
                    className="group/col flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex h-44 w-full items-end justify-center gap-1 px-0.5">
                      <div
                        className="max-w-[26px] flex-1 rounded-t-md bg-gradient-to-t from-emerald-900 via-emerald-600 to-emerald-400 shadow-[0_0_18px_-4px_rgba(52,211,153,0.55)] ring-1 ring-emerald-400/25 transition-all duration-500 ease-out group-hover/col:brightness-110"
                        style={{
                          height: `${hCur}%`,
                          transitionDelay: mounted ? `${idx * 35}ms` : "0ms",
                        }}
                        title={`Atual: ${row.currentQty}`}
                      />
                      <div
                        className="max-w-[26px] flex-1 rounded-t-md bg-gradient-to-t from-slate-700 to-slate-500 ring-1 ring-white/10 transition-all duration-500 ease-out group-hover/col:shadow-[0_0_14px_rgba(148,163,184,0.35)]"
                        style={{
                          height: `${hCmp}%`,
                          transitionDelay: mounted ? `${idx * 35 + 18}ms` : "0ms",
                        }}
                        title={`Comparação: ${row.comparisonQty}`}
                      />
                    </div>
                    <span className="max-w-[5rem] truncate text-center font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-200 group-hover/col:text-slate-300">
                      {row.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-slate-600">
                      <span className="text-emerald-400/90">{row.currentQty}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-slate-400">{row.comparisonQty}</span>
                    </span>
                  </div>
                );
              })
            : singleData!.map((m, idx) => {
                const pct = (m.quantity / maxQ) * 100;
                const h = mounted ? Math.max(pct, 10) : 0;
                return (
                  <div
                    key={m.key}
                    className="group/col flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex h-44 w-full items-end justify-center">
                      <div
                        className="w-full max-w-[52px] rounded-t-lg bg-gradient-to-t from-emerald-900 via-emerald-600 to-emerald-400 shadow-[0_0_22px_-6px_rgba(52,211,153,0.55)] ring-1 ring-emerald-400/30 transition-all duration-500 ease-out group-hover/col:brightness-110"
                        style={{
                          height: `${h}%`,
                          transitionDelay: mounted ? `${idx * 40}ms` : "0ms",
                        }}
                        title={`${m.quantity} ${unitLabel}`}
                      />
                    </div>
                    <span className="max-w-[4.5rem] truncate text-center font-mono text-[9px] font-semibold uppercase tracking-wide text-slate-500 transition-colors duration-200 group-hover/col:text-slate-300">
                      {m.label}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-emerald-400/90">
                      {m.quantity}
                    </span>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
