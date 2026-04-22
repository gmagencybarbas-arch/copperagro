"use client";

import type { PricePoint } from "@/modules/dashboard/chart-helpers";
import { smoothLinePath } from "@/modules/dashboard/chart-path";
import { formatBRL } from "@/lib/format";
import type { PriceChartGranularity } from "@/types/sale";
import { useCallback, useId, useMemo, useState } from "react";

export type PriceLineAxisMode = "year" | PriceChartGranularity;

type Props = {
  current: PricePoint[];
  compareSeries?: PricePoint[];
  comparisonEnabled?: boolean;
  yearlyAggregate?: boolean;
  /** Quando não é modo “ano”, controla legenda/eixo do gráfico de período */
  chartGranularity?: PriceChartGranularity;
};

function ChartLegend({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-6 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        Atual
      </span>
      <span className="inline-flex items-center gap-2 text-slate-500">
        <span className="h-2 w-2 shrink-0 rounded-sm bg-slate-500" />
        Ref.
      </span>
    </div>
  );
}

function mapToCanvas(
  data: PricePoint[],
  w: number,
  h: number,
  padX: number,
  padY: number,
  yMin: number,
  yMax: number,
): { x: number; y: number; raw: PricePoint }[] {
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const n = data.length;
  return data.map((d, i) => {
    const x = padX + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yn =
      yMax === yMin ? 0.5 : (d.unitPrice - yMin) / (yMax - yMin);
    const y = padY + innerH - yn * innerH;
    return { x, y, raw: d };
  });
}

/** Gráfico de linha: série diária ou agregada anual; comparação alinhada por índice. */
export function PriceLineChart({
  current,
  compareSeries = [],
  comparisonEnabled = false,
  yearlyAggregate = false,
  chartGranularity = "day",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fillId = `priceFill-${uid}`;
  const glowId = `lineGlow-${uid}`;

  const axisMode: PriceLineAxisMode = yearlyAggregate
    ? "year"
    : chartGranularity ?? "day";

  const [tipIndex, setTipIndex] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(
    null,
  );

  const hasCompareData = compareSeries.length > 0;
  const showTwoLines =
    comparisonEnabled && hasCompareData && current.length > 0;
  const alignedCompare =
    showTwoLines && compareSeries.length === current.length;
  const comparisonIncomplete =
    comparisonEnabled && !hasCompareData && current.length > 0;

  const allPrices = useMemo(() => {
    const list = [...current.map((d) => d.unitPrice)];
    if (showTwoLines) {
      list.push(...compareSeries.map((d) => d.unitPrice));
    }
    return list;
  }, [current, compareSeries, showTwoLines]);

  const chart = useMemo(() => {
    if (
      current.length === 0 &&
      (!comparisonEnabled || compareSeries.length === 0)
    ) {
      return null;
    }

    const seriesForScale =
      showTwoLines || current.length > 0 ? current : compareSeries;
    if (seriesForScale.length === 0 && compareSeries.length === 0) {
      return null;
    }

    const pricesRaw =
      allPrices.length > 0
        ? allPrices
        : [...compareSeries.map((d) => d.unitPrice)];
    const prices = pricesRaw.length > 0 ? pricesRaw : [0];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = max === min ? 40 : (max - min) * 0.08;
    const yMin = min - pad;
    const yMax = max + pad;

    const w = 560;
    const h = 220;
    const padX = 14;
    const padY = 18;

    const curPts =
      current.length > 0
        ? mapToCanvas(current, w, h, padX, padY, yMin, yMax)
        : [];
    const cmpPts =
      showTwoLines && compareSeries.length > 0
        ? mapToCanvas(compareSeries, w, h, padX, padY, yMin, yMax)
        : [];

    const pathCurrent =
      curPts.length > 0
        ? smoothLinePath(curPts.map((p) => ({ x: p.x, y: p.y })))
        : "";
    const pathCompare =
      cmpPts.length > 0
        ? smoothLinePath(cmpPts.map((p) => ({ x: p.x, y: p.y })))
        : "";

    const areaD =
      curPts.length > 0 && pathCurrent
        ? `${pathCurrent} L ${curPts[curPts.length - 1]?.x ?? 0} ${h - padY} L ${curPts[0]?.x ?? 0} ${h - padY} Z`
        : "";

    const innerW = w - padX * 2;
    const innerH = h - padY * 2;

    return {
      w,
      h,
      padY,
      innerW,
      innerH,
      yMin,
      yMax,
      min,
      max,
      curPts,
      cmpPts,
      pathCurrent,
      pathCompare,
      areaD,
      padX,
    };
  }, [current, compareSeries, comparisonEnabled, showTwoLines, allPrices]);

  const hideTip = useCallback(() => {
    setTipIndex(null);
    setPointer(null);
  }, []);

  const onSvgMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chart || chart.curPts.length === 0) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * chart.w;
      const br = svg.getBoundingClientRect();

      if (showTwoLines && alignedCompare && chart.cmpPts.length > 0) {
        let bestI = 0;
        let bestD = Infinity;
        for (let i = 0; i < chart.curPts.length; i++) {
          const dx = Math.abs(vx - chart.curPts[i]!.x);
          if (dx < bestD) {
            bestD = dx;
            bestI = i;
          }
        }
        if (bestD < 56) {
          setTipIndex(bestI);
          setPointer({
            x: e.clientX - br.left,
            y: e.clientY - br.top,
          });
        } else {
          hideTip();
        }
        return;
      }

      let nearest = chart.curPts[0]!;
      let bestD = Math.abs(vx - nearest.x);
      for (let i = 1; i < chart.curPts.length; i++) {
        const p = chart.curPts[i]!;
        const dx = Math.abs(vx - p.x);
        if (dx < bestD) {
          bestD = dx;
          nearest = p;
        }
      }
      if (bestD < 52) {
        const idx = chart.curPts.indexOf(nearest);
        setTipIndex(idx >= 0 ? idx : 0);
        setPointer({
          x: e.clientX - br.left,
          y: e.clientY - br.top,
        });
      } else {
        hideTip();
      }
    },
    [chart, showTwoLines, alignedCompare, hideTip],
  );

  if (!comparisonEnabled && current.length === 0) {
    return (
      <ChartEmpty
        title="Sem dados para o período"
        hint="Ajuste o filtro ou registre novas vendas."
      />
    );
  }

  if (
    comparisonEnabled &&
    current.length === 0 &&
    compareSeries.length === 0
  ) {
    return (
      <ChartEmpty
        title="Sem dados suficientes para comparação"
        hint="Não há vendas no período atual nem no de comparação para este filtro."
      />
    );
  }

  if (comparisonEnabled && current.length === 0 && !hasCompareData) {
    return (
      <ChartEmpty
        title="Sem dados suficientes para comparação"
        hint="Período de comparação sem vendas registradas."
      />
    );
  }

  if (!chart) {
    return (
      <ChartEmpty
        title="Sem dados para o período"
        hint="Ajuste o filtro ou registre novas vendas."
      />
    );
  }

  const subtitleLine =
    axisMode === "year"
      ? showTwoLines
        ? "Preço médio por ano — séries comparáveis"
        : "Preço médio por ano no slot filtrado"
      : axisMode === "week"
        ? showTwoLines
          ? "Preço médio por semana — períodos alinhados"
          : "Preço médio por semana (semana ISO, carry-forward)"
        : axisMode === "month"
          ? showTwoLines
            ? "Preço médio por mês — períodos alinhados"
            : "Preço médio por mês civil (carry-forward)"
          : showTwoLines
            ? "Preço médio diário — períodos alinhados por dia"
            : "Preço médio diário (carry-forward sem buracos)";

  const tipDateIso =
    tipIndex !== null && current[tipIndex]
      ? current[tipIndex]!.date
      : null;

  const crossX =
    tipIndex !== null && chart.curPts[tipIndex]
      ? chart.curPts[tipIndex]!.x
      : null;

  return (
    <div className="group/chart rounded-xl border border-slate-700/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5 transition-all duration-300 hover:ring-emerald-500/15">
      <ChartLegend show={comparisonEnabled && hasCompareData && showTwoLines} />

      {comparisonIncomplete && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 font-mono text-[12px] text-amber-100/95">
          <span className="font-semibold text-amber-200">AVISO</span>
          <span className="text-amber-100/80">
            {" "}
            — sem vendas no período de comparação para este recorte.
          </span>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            Preço / saca
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{subtitleLine}</p>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-wide text-slate-500 sm:inline">
          <span className="text-slate-600">Lo</span>{" "}
          <span className="tabular-nums text-emerald-400/90">
            {formatBRL(Math.round(chart.min))}
          </span>
          <span className="mx-2 text-slate-700">·</span>
          <span className="text-slate-600">Hi</span>{" "}
          <span className="tabular-nums text-emerald-400/90">
            {formatBRL(Math.round(chart.max))}
          </span>
        </span>
      </div>

      <div className="relative rounded-lg bg-slate-950/90 p-1 ring-1 ring-white/[0.06] transition-[filter] duration-300 group-hover/chart:shadow-[0_0_40px_-8px_rgba(16,185,129,0.25)]">
        <svg
          viewBox={`0 0 ${chart.w} ${chart.h}`}
          className="h-auto w-full cursor-crosshair overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label="Gráfico de preço"
          onMouseMove={onSvgMove}
          onMouseLeave={hideTip}
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#059669" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </linearGradient>
            <filter
              id={glowId}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grade estilo terminal */}
          <g opacity={0.55} pointerEvents="none">
            {[0, 1, 2, 3, 4].map((i) => {
              const y =
                chart.padY + (i / 4) * chart.innerH;
              return (
                <line
                  key={`h-${i}`}
                  x1={chart.padX}
                  x2={chart.w - chart.padX}
                  y1={y}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity={0.65}
                  strokeWidth={i === 0 || i === 4 ? 0.65 : 0.45}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {[0, 1, 2, 3, 4, 5, 6].map((j) => {
              const x =
                chart.padX + (j / 6) * chart.innerW;
              return (
                <line
                  key={`v-${j}`}
                  x1={x}
                  x2={x}
                  y1={chart.padY}
                  y2={chart.h - chart.padY}
                  stroke="#1e293b"
                  strokeOpacity={0.9}
                  strokeWidth={0.35}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          {crossX !== null && (
            <line
              x1={crossX}
              x2={crossX}
              y1={chart.padY}
              y2={chart.h - chart.padY}
              stroke="#64748b"
              strokeDasharray="5 6"
              strokeOpacity={0.85}
              strokeWidth={0.85}
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}

          {chart.areaD ? (
            <path d={chart.areaD} fill={`url(#${fillId})`} />
          ) : null}

          {showTwoLines && chart.pathCompare ? (
            <path
              d={chart.pathCompare}
              fill="none"
              stroke="#64748b"
              strokeWidth={1.85}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.95}
              vectorEffect="non-scaling-stroke"
              className="transition-opacity duration-300"
            />
          ) : null}

          {chart.pathCurrent ? (
            <path
              d={chart.pathCurrent}
              fill="none"
              stroke="#34d399"
              strokeWidth={2.35}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={tipIndex !== null ? `url(#${glowId})` : undefined}
              className="transition-all duration-200"
            />
          ) : null}

          {chart.curPts.map((p, i) => (
            <circle
              key={`c-${p.raw.date}-${i}`}
              cx={p.x}
              cy={p.y}
              r={tipIndex === i ? 5 : 3.25}
              fill="#0f172a"
              stroke="#34d399"
              strokeWidth={tipIndex === i ? 2.25 : 1.6}
              className="transition-all duration-150"
            />
          ))}
          {showTwoLines &&
            chart.cmpPts.map((p, i) => (
              <circle
                key={`y-${p.raw.date}-${i}`}
                cx={p.x}
                cy={p.y}
                r={tipIndex === i ? 4.25 : 2.75}
                fill="#0f172a"
                stroke="#94a3b8"
                strokeWidth={tipIndex === i ? 2 : 1.35}
                className="transition-all duration-150"
              />
            ))}
        </svg>

        {tipIndex !== null && pointer && current[tipIndex] && (
          <div
            className="pointer-events-none absolute z-10 min-w-[11rem] rounded-lg border border-slate-600/90 bg-slate-950/98 px-3 py-2.5 font-mono text-[11px] shadow-[0_12px_40px_-8px_rgba(0,0,0,0.75)] ring-1 ring-emerald-500/20 backdrop-blur-sm transition-opacity duration-150"
            style={{
              left: Math.min(chart.w - 176, Math.max(8, pointer.x + 12)),
              top: Math.max(8, pointer.y - 76),
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {formatChartDate(tipDateIso, axisMode)}
            </p>
            <p className="mt-1.5 tabular-nums text-emerald-400">
              <span className="text-slate-500">Atual </span>
              <span className="font-semibold text-emerald-300">
                {formatBRL(Math.round(current[tipIndex]!.unitPrice))}
              </span>
            </p>
            {showTwoLines && compareSeries[tipIndex] !== undefined && (
              <p className="mt-1 tabular-nums text-slate-400">
                <span className="text-slate-600">Ref. </span>
                <span className="font-semibold text-slate-300">
                  {formatBRL(Math.round(compareSeries[tipIndex]!.unitPrice))}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {current.length > 0 && (
        <div className="mt-2 flex justify-between gap-2 font-mono text-[10px] uppercase tracking-wide text-slate-600">
          <span>{formatChartDate(current[0]?.date, axisMode)}</span>
          <span>
            {formatChartDate(
              current[current.length - 1]?.date,
              axisMode,
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function ChartEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex min-h-[13rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-600/60 bg-gradient-to-b from-slate-950 to-slate-900 px-6 py-10 text-center ring-1 ring-white/5">
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 p-3 shadow-inner">
        <span className="text-2xl opacity-90" aria-hidden>
          ☕
        </span>
      </div>
      <div>
        <p className="font-mono text-sm font-semibold uppercase tracking-wide text-slate-300">
          {title}
        </p>
        <p className="mt-1 max-w-xs font-mono text-[11px] leading-relaxed text-slate-500">
          {hint}
        </p>
      </div>
    </div>
  );
}

function formatChartDate(
  iso?: string | null,
  axisMode: PriceLineAxisMode = "day",
): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  if (axisMode === "year") {
    return String(y);
  }
  if (axisMode === "month") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
    }).format(new Date(y, m - 1, 1));
  }
  if (axisMode === "week") {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }).format(new Date(y, m - 1, d));
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m - 1, d));
}
