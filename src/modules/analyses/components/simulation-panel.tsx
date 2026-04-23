"use client";

import { formatBRL } from "@/lib/format";
import { CleanInput, PrimaryButton } from "@/design-system";
import { AN } from "./analytics-tokens";
import { Calculator, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useId, useMemo } from "react";
import type { ReactNode } from "react";

type Props = {
  mode: "global" | "sector";
  unit: string;
  sacasWeek: number;
  setSacasWeek: (n: number) => void;
  priceExpect: number;
  setPriceExpect: (n: number) => void;
  onReset: () => void;
  simRevenue: number | null;
  simWeeks: number | null;
  globalWeekly: number;
  setGlobalWeekly: (n: number) => void;
  globalRunway: number | null;
  simCurve: number[];
  /** Cenário de referência (sem simulação) */
  baselineGlobalWeekly: number;
  baselineGlobalRunway: number | null;
  baselineProjectedRevenue: number | null;
  baselineWeeksSector: number | null;
};

function SimCurve({
  values,
  width = 400,
  height = 120,
  animKey,
}: {
  values: number[];
  width?: number;
  height?: number;
  animKey: string;
}) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) {
    return (
      <div
        className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-[#e6eae8] text-xs text-[#5c6b66]"
        style={{ minHeight: height }}
      >
        Ajuste os valores para ver a projeção
      </div>
    );
  }
  const w = width;
  const h = height;
  const pad = 8;
  const max = Math.max(1, ...values);
  const min = 0;
  const path = values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - 2 * pad);
      const y = pad + (h - 2 * pad) - ((v - min) / (max - min)) * (h - 2 * pad);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const area = `${path} L${w - pad},${h - pad} L${pad},${h - pad} Z`;

  return (
    <div key={animKey} className="origin-bottom transition-transform duration-300 ease-out will-change-transform">
      <svg
        className="w-full max-w-full transition-opacity duration-300"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AN.green} stopOpacity="0.2" />
            <stop offset="100%" stopColor={AN.green} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} className="transition-all duration-300" />
        <path
          d={path}
          fill="none"
          stroke={AN.green}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

function DeltaPill({
  good,
  children,
  icon,
}: {
  good: boolean;
  children: ReactNode;
  icon: "up" | "down";
}) {
  const Icon = icon === "up" ? TrendingUp : TrendingDown;
  return (
    <div
      className={`inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all duration-300 ${
        good
          ? "border-emerald-200 bg-emerald-50/90 text-[#0d4f3c]"
          : "border-rose-200 bg-rose-50/90 text-rose-900"
      } `}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

export function SimulationPanel({
  mode,
  unit,
  sacasWeek,
  setSacasWeek,
  priceExpect,
  setPriceExpect,
  onReset,
  simRevenue,
  simWeeks,
  globalWeekly,
  setGlobalWeekly,
  globalRunway,
  simCurve,
  baselineGlobalWeekly,
  baselineGlobalRunway,
  baselineProjectedRevenue,
  baselineWeeksSector,
}: Props) {
  const animKey = useMemo(
    () => `${mode}-${globalWeekly}-${sacasWeek}-${priceExpect}`,
    [mode, globalWeekly, sacasWeek, priceExpect],
  );

  const dWeekly =
    mode === "global" && baselineGlobalWeekly > 0
      ? globalWeekly - baselineGlobalWeekly
      : 0;
  const dRunway =
    mode === "global" &&
    globalRunway != null &&
    baselineGlobalRunway != null &&
    Number.isFinite(globalRunway) &&
    Number.isFinite(baselineGlobalRunway)
      ? globalRunway - baselineGlobalRunway
      : null;

  const dRev =
    mode === "sector" &&
    simRevenue != null &&
    baselineProjectedRevenue != null &&
    Number.isFinite(simRevenue) &&
    Number.isFinite(baselineProjectedRevenue)
      ? simRevenue - baselineProjectedRevenue
      : null;
  const dWeeksS =
    mode === "sector" && simWeeks != null && baselineWeeksSector != null
      ? simWeeks - baselineWeeksSector
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e6eae8] bg-white shadow-sm">
      <div className="border-b border-[#e6eae8]/80 bg-gradient-to-r from-white to-[#f7f9f8] px-6 py-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-[#1f7a63]" />
          Simulação: impacto imediato
        </h3>
        <p className="text-xs text-[#5c6b66]">Compare o cenário simulado com a referência actual</p>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-5">
          {mode === "global" ? (
            <div>
              <label className="text-[11px] font-bold uppercase text-[#5c6b66]">
                Faturamento (R$ / semana)
              </label>
              <CleanInput
                type="number"
                min={0}
                step={100}
                value={Number.isFinite(globalWeekly) ? globalWeekly : ""}
                onChange={(e) => setGlobalWeekly(Number(e.target.value) || 0)}
                className="mt-1.5 tabular-nums"
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#5c6b66]">
                  {unit} / semana
                </label>
                <CleanInput
                  type="number"
                  min={0}
                  step={0.1}
                  value={Number.isFinite(sacasWeek) ? sacasWeek : ""}
                  onChange={(e) => setSacasWeek(Number(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-[#5c6b66]">Preço (R$)</label>
                <CleanInput
                  type="number"
                  min={0}
                  step={0.5}
                  value={Number.isFinite(priceExpect) ? priceExpect : ""}
                  onChange={(e) => setPriceExpect(Number(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}
          <PrimaryButton
            type="button"
            onClick={onReset}
            className="!bg-[#1f7a63] !shadow-[#1f7a63]/20 hover:!bg-[#2e7d5b]"
          >
            <Calculator className="h-4 w-4" />
            Repor valores de referência
          </PrimaryButton>
          <div className="space-y-2 rounded-xl border border-[#e6eae8] bg-[#f7f9f8] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#5c6b66]">
              vs. cenário de referência
            </p>
            {mode === "global" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {dWeekly !== 0 && (
                  <DeltaPill
                    good={dWeekly >= 0}
                    icon={dWeekly >= 0 ? "up" : "down"}
                  >
                    {dWeekly > 0 ? "+" : "−"}
                    {formatBRL(Math.round(Math.abs(dWeekly)))} /semana
                  </DeltaPill>
                )}
                {dRunway != null && dRunway !== 0 && (
                  <DeltaPill
                    good={dRunway >= 0}
                    icon={dRunway >= 0 ? "up" : "down"}
                  >
                    {dRunway > 0 ? "+" : "−"}
                    {Math.abs(dRunway).toFixed(1)} sem. de cobertura
                  </DeltaPill>
                )}
                {dWeekly === 0 && (dRunway == null || dRunway === 0) && (
                  <p className="text-xs text-[#5c6b66]">Sem diferença face ao ritmo actua</p>
                )}
              </div>
            )}
            {mode === "sector" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {dRev != null && dRev !== 0 && (
                  <DeltaPill
                    good={dRev >= 0}
                    icon={dRev >= 0 ? "up" : "down"}
                  >
                    {dRev > 0 ? "+" : "−"}
                    {formatBRL(Math.round(Math.abs(dRev)))} fatur. projectado
                  </DeltaPill>
                )}
                {dWeeksS != null && dWeeksS !== 0 && (
                  <DeltaPill
                    good={dWeeksS >= 0}
                    icon={dWeeksS >= 0 ? "up" : "down"}
                  >
                    {dWeeksS > 0 ? "+" : "−"}
                    {Math.abs(dWeeksS).toFixed(1)} sem. de estoque
                  </DeltaPill>
                )}
                {(dRev == null && dWeeksS == null) && (
                  <p className="text-xs text-[#5c6b66]">Ajuste unidades ou preço para ver o impacto.</p>
                )}
                {dRev === 0 && dWeeksS === 0 && dRev != null && dWeeksS != null && (
                  <p className="text-xs text-[#5c6b66]">Sem diferença face ao referência</p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#e6eae8] bg-white p-4">
            {mode === "global" ? (
              <div className="col-span-2">
                <p className="text-[10px] font-bold uppercase text-[#5c6b66]">Runway (simulado)</p>
                <p className="mt-1 text-xl font-bold text-[#0d5c4a]">
                  {globalRunway != null && globalRunway > 0
                    ? `${globalRunway.toFixed(1)} sem.`
                    : "—"}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#5c6b66]">Fatur. simulado</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                    {simRevenue != null && simRevenue > 0
                      ? formatBRL(Math.round(simRevenue))
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#5c6b66]">Semanas a este ritmo</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                    {simWeeks != null && simWeeks > 0
                      ? `${simWeeks.toFixed(1)} sem.`
                      : "—"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#5c6b66]">
            {mode === "sector" ? "Valor remanescente" : "Inventário (R$) a esgotar"}
          </p>
          {simCurve.length >= 2 ? (
            <SimCurve
              values={simCurve}
              width={mode === "global" ? 480 : 400}
              height={128}
              animKey={animKey}
            />
          ) : (
            <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-[#e6eae8] text-center text-xs text-[#5c6b66]">
              Ajuste o ritmo semanal e os valores para ver a projeção.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
