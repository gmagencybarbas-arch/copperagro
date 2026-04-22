"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { BigNumber, Card, Title } from "@/design-system";
import {
  alignPriceSeriesPair,
  buildGranularComparisonPriceSeries,
  buildMonthlyQuantity,
  buildMonthlyYoYPairedForFilter,
  buildPairedWeekSlotVolume,
  buildPeriodPriceSeriesByGranularity,
  buildWeekSlotYoYPairedVolume,
  buildWeekSlotYearlyPriceSeries,
  buildWeekSlotYearlyQuantityBars,
  getComparisonSeries,
} from "@/modules/dashboard/chart-helpers";
import { MarketInsightsSection } from "@/modules/dashboard/market-insights-section";
import { MonthlyBarChart } from "@/modules/dashboard/monthly-bar-chart";
import { PriceLineChart } from "@/modules/dashboard/price-line-chart";
import { SalesFilterBar } from "@/modules/dashboard/sales-filter-bar";
import { formatBRL, formatBRLFine } from "@/lib/format";
import {
  trailingWeeklyAvgBags,
  type TrendComparison,
} from "@/store/sales-metrics";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import type { Sale } from "@/types/sale";
import {
  useSalesMetrics,
  useSalesStore,
  useStockSnapshot,
  useTrendComparison,
} from "@/store/sales-store";
import {
  ArrowRight,
  Clock3,
  DollarSign,
  Info,
  Layers,
  Package,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Balão com `position: fixed` para nunca ser cortado por `overflow` dos cards. */
function MetricHint({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const place = useCallback(() => {
    const root = rootRef.current;
    const bubble = bubbleRef.current;
    if (!root || !bubble) return;
    const icon = root.querySelector("svg");
    if (!icon) return;
    const r = icon.getBoundingClientRect();
    const pad = 12;
    const bw = bubble.offsetWidth || 224;
    const bh = bubble.offsetHeight || 72;
    let left = r.left + r.width / 2 - bw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - bw - pad));
    let top = r.top - bh - 8;
    if (top < pad) {
      top = r.bottom + 8;
    }
    if (top + bh > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - bh - pad);
    }
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  return (
    <span
      ref={rootRef}
      className="relative inline-flex shrink-0 align-middle"
      onMouseEnter={() => {
        setOpen(true);
        requestAnimationFrame(() => requestAnimationFrame(place));
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <Info
        className={`h-3.5 w-3.5 cursor-help transition-colors duration-200 ${open ? "text-[#15803d]" : "text-gray-400"}`}
        strokeWidth={2}
        aria-hidden
      />
      <div
        ref={bubbleRef}
        role="tooltip"
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          zIndex: 9999,
          pointerEvents: "none",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
        }}
        className="w-56 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left text-[11px] leading-snug text-gray-600 shadow-xl ring-1 ring-black/5 transition-opacity duration-150"
      >
        {children}
      </div>
    </span>
  );
}

function TrendDual({
  trend,
  kind,
}: {
  trend: TrendComparison;
  kind: "revenue" | "bags" | "avg";
}) {
  let prevPct: number | null = null;
  let prevUp: boolean | null = null;
  let yoyPct: number | null = null;
  let yoyUp: boolean | null = null;

  if (kind === "revenue") {
    prevPct = trend.revenueDeltaPct;
    prevUp = trend.revenueUp;
    yoyPct = trend.revenueYoyPct;
    yoyUp = trend.revenueYoyUp;
  } else if (kind === "bags") {
    prevPct = trend.bagsDeltaPct;
    prevUp = trend.bagsUp;
    yoyPct = trend.bagsYoyPct;
    yoyUp = trend.bagsYoyUp;
  } else {
    prevPct = trend.avgPriceDeltaPct;
    prevUp = trend.avgPriceUp;
    yoyPct = trend.avgYoyPct;
    yoyUp = trend.avgYoyUp;
  }

  const Row = ({
    pct,
    up,
    label,
  }: {
    pct: number | null;
    up: boolean | null;
    label: string;
  }) => {
    if (pct === null || up === null) {
      return <p className="text-[11px] text-gray-400">{label}: sem base</p>;
    }
    const positive = up;
    const color = positive ? "text-[#15803d]" : "text-[#dc2626]";
    return (
      <p
        className={`flex items-center gap-1 text-[11px] font-semibold tabular-nums ${color}`}
      >
        <span>{positive ? "↑" : "↓"}</span>
        <span>{Math.abs(pct).toFixed(1)}%</span>
        <span className="font-normal text-gray-500">{label}</span>
      </p>
    );
  };

  return (
    <div className="mt-4 space-y-1.5 border-t border-gray-100/80 pt-3">
      <Row pct={prevPct} up={prevUp} label="vs período anterior" />
      <Row pct={yoyPct} up={yoyUp} label="vs mesmo período ano passado" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 duration-300">
      <div className="space-y-3">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200/90" />
        <div className="h-4 w-80 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="h-40 animate-pulse rounded-[22px] bg-gray-200/70" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-[22px] bg-gray-200/80"
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardView() {
  const allSales = useSalesStore((s) => s.sales);
  const filter = useSalesStore((s) => s.filter);
  const isComparing = useSalesStore((s) => s.isComparing);
  const comparisonMode = useSalesStore((s) => s.comparisonMode);
  const comparisonCustomStart = useSalesStore((s) => s.comparisonCustomStart);
  const comparisonCustomEnd = useSalesStore((s) => s.comparisonCustomEnd);
  const metrics = useSalesMetrics();
  const trend = useTrendComparison();
  const stock = useStockSnapshot();
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const sectors = useSectorStore((s) => s.sectors);
  const unit = useMemo(() => {
    const sector = sectors.find((s) => s.id === selectedSectorId);
    return sector?.unit ?? "unidade";
  }, [sectors, selectedSectorId]);
  const sales = useMemo(() => {
    if (!selectedSectorId) return allSales;
    return allSales.filter((s) => s.sectorId === selectedSectorId);
  }, [allSales, selectedSectorId]);
  const salesPath = selectedSectorId ? `/setor/${selectedSectorId}` : "/vendas";

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowContent(true), 420);
    return () => window.clearTimeout(t);
  }, []);

  const weekMode = filter.dimension === "week";
  const refDate = useMemo(() => new Date(), []);
  const priceGranularity = filter.priceChartGranularity ?? "day";

  const priceCurrentRaw = useMemo(() => {
    if (weekMode) {
      return buildWeekSlotYearlyPriceSeries(
        sales,
        filter.monthRef,
        filter.weekOfMonth,
      );
    }
    return buildPeriodPriceSeriesByGranularity(
      sales,
      filter,
      refDate,
      priceGranularity,
    );
  }, [sales, filter, weekMode, refDate, priceGranularity]);

  const priceCompareRaw = useMemo(() => {
    if (weekMode) {
      return getComparisonSeries(
        sales,
        filter,
        refDate,
        comparisonMode,
        priceCurrentRaw,
        comparisonMode === "custom_interval"
          ? {
              start: comparisonCustomStart,
              end: comparisonCustomEnd,
            }
          : null,
      );
    }
    if (priceGranularity === "day") {
      return getComparisonSeries(
        sales,
        filter,
        refDate,
        comparisonMode,
        priceCurrentRaw,
        comparisonMode === "custom_interval"
          ? {
              start: comparisonCustomStart,
              end: comparisonCustomEnd,
            }
          : null,
      );
    }
    return buildGranularComparisonPriceSeries(
      sales,
      filter,
      refDate,
      comparisonMode,
      priceGranularity,
      comparisonMode === "custom_interval"
        ? {
            start: comparisonCustomStart,
            end: comparisonCustomEnd,
          }
        : null,
    );
  }, [
    sales,
    filter,
    refDate,
    comparisonMode,
    priceCurrentRaw,
    comparisonCustomStart,
    comparisonCustomEnd,
    weekMode,
    priceGranularity,
  ]);

  const { current: priceCurrent, compare: priceCompare } = useMemo(
    () => alignPriceSeriesPair(priceCurrentRaw, priceCompareRaw),
    [priceCurrentRaw, priceCompareRaw],
  );

  const singleBars = useMemo(() => {
    if (weekMode) {
      return buildWeekSlotYearlyQuantityBars(
        sales,
        filter.monthRef,
        filter.weekOfMonth,
      );
    }
    return buildMonthlyQuantity(sales, filter);
  }, [sales, filter, weekMode]);

  const pairedBars = useMemo(() => {
    if (weekMode) {
      if (comparisonMode === "same_period_last_year") {
        return buildWeekSlotYoYPairedVolume(
          sales,
          filter.monthRef,
          filter.weekOfMonth,
        );
      }
      return buildPairedWeekSlotVolume(
        sales,
        filter.monthRef,
        filter.weekOfMonth,
      );
    }
    return buildMonthlyYoYPairedForFilter(sales, filter);
  }, [sales, filter, weekMode, comparisonMode]);

  const weeklyAvg = useMemo(() => trailingWeeklyAvgBags(sales), [sales]);
  const weeksLeftAtPace =
    weeklyAvg > 0 ? stock.remaining / weeklyAvg : null;
  const projectionEnd =
    weeksLeftAtPace !== null && Number.isFinite(weeksLeftAtPace)
      ? Math.ceil(weeksLeftAtPace)
      : null;

  const recentSales = useMemo(() => {
    return [...sales]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 8);
  }, [sales]);

  if (!showContent) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-dash-enter mx-auto max-w-6xl space-y-14 pb-16">
      <header className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Painel de decisão
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
            Visão enxuta do que importa: receita, preço, volume e estoque.
          </p>
        </div>
        <SalesFilterBar />
      </header>

      <section className="grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative z-0 min-w-0 overflow-visible rounded-[22px] border border-gray-100/90 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.14)] transition-all duration-300 hover:z-[40] hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <Title className="text-gray-600">
              Faturamento
              <MetricHint>
                Soma do valor total (R$) das vendas no período filtrado.
              </MetricHint>
            </Title>
            <DollarSign
              className="h-5 w-5 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-[#15803d]"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-4 text-gray-900">
            <AnimatedNumber
              value={metrics.totalRevenue}
              format={(n) => formatBRL(Math.round(n))}
            />
          </BigNumber>
          <TrendDual trend={trend} kind="revenue" />
        </Card>

        <Card className="group relative z-0 min-w-0 overflow-visible rounded-[22px] border border-gray-100/90 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.14)] transition-all duration-300 hover:z-[40] hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <Title className="text-gray-600">
              Preço médio
              <MetricHint>
                Média ponderada: faturamento ÷ unidades no período.
              </MetricHint>
            </Title>
            <TrendingUp
              className="h-5 w-5 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-[#15803d]"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-4 text-gray-900">
            <AnimatedNumber
              value={metrics.averagePrice}
              decimals={2}
              format={(n) => formatBRLFine(n)}
            />
          </BigNumber>
          <TrendDual trend={trend} kind="avg" />
        </Card>

        <Card className="group relative z-0 min-w-0 overflow-visible rounded-[22px] border border-gray-100/90 bg-white shadow-[0_12px_40px_-18px_rgba(15,23,42,0.14)] transition-all duration-300 hover:z-[40] hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <Title className="text-gray-600">
              Unidades vendidas
              <MetricHint>
                Quantidade total no período filtrado.
              </MetricHint>
            </Title>
            <Package
              className="h-5 w-5 shrink-0 text-gray-400 transition-colors duration-200 group-hover:text-[#15803d]"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-4 text-gray-900">
            <AnimatedNumber
              value={metrics.totalBagsSold}
              format={(n) =>
                new Intl.NumberFormat("pt-BR").format(Math.round(n))
              }
            />
          </BigNumber>
          <TrendDual trend={trend} kind="bags" />
        </Card>

        <Card className="group relative z-0 min-w-0 overflow-visible rounded-[22px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/40 shadow-[0_12px_40px_-18px_rgba(21,128,61,0.12)] transition-all duration-300 hover:z-[40] hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-3">
            <Title className="text-gray-600">
              Estoque restante
              <MetricHint>
                Capacidade contratada menos unidades já faturadas.
              </MetricHint>
            </Title>
            <Layers
              className="h-5 w-5 shrink-0 text-emerald-600/70 transition-transform duration-200 group-hover:scale-110"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-4 text-emerald-950">
            <AnimatedNumber
              value={stock.remaining}
              format={(n) =>
                new Intl.NumberFormat("pt-BR").format(Math.round(n))
              }
            />
          </BigNumber>
          <p className="mt-3 text-[11px] text-gray-600">
            Total {new Intl.NumberFormat("pt-BR").format(stock.total)} ·
            vendido{" "}
            <span className="tabular-nums font-medium">{stock.sold}</span>
          </p>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-[22px] border border-slate-800/90 bg-slate-950 p-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]">
            <PriceLineChart
              current={priceCurrent}
              compareSeries={priceCompare}
              comparisonEnabled={isComparing}
              yearlyAggregate={weekMode}
              chartGranularity={
                weekMode ? undefined : filter.priceChartGranularity
              }
            />
          </Card>
          <Card className="overflow-hidden rounded-[22px] border border-slate-800/90 bg-slate-950 p-0 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]">
            {isComparing ? (
              <MonthlyBarChart
                pairedData={pairedBars}
                comparisonEnabled={isComparing}
                unitLabel={pluralizeUnit(unit, 2)}
                chartTitle={
                  weekMode ? "Volume por ano (comparativo)" : "Volume mensal"
                }
                chartSubtitle={
                  weekMode
                    ? comparisonMode === "same_period_last_year"
                      ? `${pluralizeUnit(unit, 2)} no slot vs mesmo slot no ano anterior`
                      : `${pluralizeUnit(unit, 2)} no slot vs slot do mês anterior`
                    : "Mês atual vs mesmo mês no ano anterior"
                }
              />
            ) : (
              <MonthlyBarChart
                singleData={singleBars}
                unitLabel={pluralizeUnit(unit, 2)}
                chartTitle={weekMode ? "Volume por ano (slot)" : "Volume mensal"}
                chartSubtitle={
                  weekMode
                    ? `${pluralizeUnit(unit, 2)} no recorte semanal, por ano`
                    : `${pluralizeUnit(unit, 2)} vendidas por mês no período`
                }
              />
            )}
          </Card>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 text-gray-400" strokeWidth={1.75} />
              <div>
                <Title className="text-gray-600">
                  Média semanal de vendas
                </Title>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
                  <AnimatedNumber
                    value={weeklyAvg}
                    decimals={1}
                    format={(n) =>
                      `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${pluralizeUnit(unit, n)}`
                    }
                  />
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                  Últimos 28 dias até a última venda; média = unidades totais ÷
                  semanas ISO no período (costuma ser 4 ou 5).
                </p>
              </div>
            </div>
          </Card>
          <Card className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <Timer className="mt-0.5 h-5 w-5 text-gray-400" strokeWidth={1.75} />
              <div>
                <Title className="text-gray-600">
                  Projeção de término (estoque)
                </Title>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
                  {projectionEnd !== null ? (
                    <>
                      <AnimatedNumber value={projectionEnd} />{" "}
                      <span className="text-xl font-medium text-gray-500">
                        semanas
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Estoque restante ÷ ritmo semanal atual (estimativa).
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Últimas vendas
          </h2>
          <Link
            href={salesPath}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#15803d] transition-colors hover:text-emerald-800"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Card className="overflow-hidden rounded-[22px] border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3 text-right">
                    {pluralizeUnit(unit, 2)}
                  </th>
                  <th className="px-4 py-3 text-right">Preço / {unit}</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 transition-colors hover:bg-emerald-50/50"
                  >
                    <td className="px-4 py-2.5 tabular-nums text-gray-700">
                      <Link
                        href={`${salesPath}?sale=${encodeURIComponent(s.id)}`}
                        className="font-medium text-[#15803d] hover:underline"
                      >
                        {new Intl.DateTimeFormat("pt-BR").format(
                          new Date(s.date),
                        )}
                      </Link>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-gray-800">
                      <Link
                        href={`${salesPath}?sale=${encodeURIComponent(s.id)}`}
                        className="hover:text-emerald-800"
                      >
                        {s.buyer}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-800">
                      {s.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-700">
                      {formatBRLFine(s.unitPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900">
                      {formatBRL(Math.round(s.totalPrice))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <MarketInsightsSection sales={sales} />
    </div>
  );
}
