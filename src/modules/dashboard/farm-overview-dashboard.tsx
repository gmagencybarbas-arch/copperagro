"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { SectorGlyph } from "@/components/sector/sector-icon";
import { TableScroll } from "@/components/table-scroll";
import {
  DeltaBadge,
  FramePanel,
  RiskBadge,
} from "@/components/ui/frame-panel";
import { CardHelpLabel } from "@/components/ui/card-help";
import { formatBRL, formatBRLFine } from "@/lib/format";
import { SECTOR_CHART_HEX } from "@/lib/sector-palette";
import { useExpenseStore } from "@/store/expense-store";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import {
  computeStockSnapshot,
  useSalesStore,
  useStockSnapshot,
} from "@/store/sales-store";
import { type Sale } from "@/types/sale";
import type { Sector, SectorColorToken } from "@/types/sector";
import { ArrowUpRight, ChevronRight } from "lucide-react";

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inDateRange(iso: string, from: string, to: string) {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

type RevenuePoint = { key: string; label: string; total: number };
type SectorAgg = {
  id: string;
  name: string;
  icon: string;
  colorToken: SectorColorToken;
  revenue: number;
  quantity: number;
  avgPrice: number;
  expenses: number;
  profit: number;
  share: number;
  risk: "healthy" | "watch" | "risk";
};

function monthKeyLabel(isoDate: string): { key: string; label: string } {
  const d = new Date(`${isoDate}T12:00:00`);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(d);
  return { key, label };
}

function buildRevenueSeries(sales: Sale[]): RevenuePoint[] {
  const map = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const s of sales) {
    const { key, label } = monthKeyLabel(s.date);
    map.set(key, (map.get(key) ?? 0) + s.totalPrice);
    labels.set(key, label);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ key, total, label: labels.get(key) ?? key }));
}

function riskFromMargin(revenue: number, expenses: number): SectorAgg["risk"] {
  if (revenue <= 0 && expenses > 0) return "risk";
  if (revenue <= 0) return "watch";
  const ratio = expenses / revenue;
  if (ratio > 0.7) return "risk";
  if (ratio > 0.4) return "watch";
  return "healthy";
}

function buildSectorAgg(
  sales: Sale[],
  sectors: Sector[],
  expensesBySector: Map<string, number>,
): SectorAgg[] {
  const totalRev = sales.reduce((a, s) => a + s.totalPrice, 0);
  return sectors.map((sector) => {
    const list = sales.filter((s) => s.sectorId === sector.id);
    const revenue = list.reduce((acc, s) => acc + s.totalPrice, 0);
    const quantity = list.reduce((acc, s) => acc + s.quantity, 0);
    const avgPrice = quantity > 0 ? revenue / quantity : 0;
    const expenses = expensesBySector.get(sector.id) ?? 0;
    const profit = revenue - expenses;
    const share = totalRev > 0 ? (revenue / totalRev) * 100 : 0;
    return {
      id: sector.id,
      name: sector.name,
      icon: sector.icon,
      colorToken: sector.color,
      revenue,
      quantity,
      avgPrice,
      expenses,
      profit,
      share,
      risk: riskFromMargin(revenue, expenses),
    };
  });
}

function AreaChart({ series }: { series: RevenuePoint[] }) {
  const w = 720;
  const h = 220;
  const p = { t: 16, r: 16, b: 34, l: 8 };
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const maxY = Math.max(1, ...series.map((s) => s.total));
  const [hovered, setHovered] = useState<number | null>(null);
  const gradId = useId().replace(/:/g, "");
  const fillGradId = `${gradId}-fill`;
  const lineGradId = `${gradId}-line`;

  const pts = series.map((s, i) => {
    const x =
      p.l + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const y = p.t + innerH - (s.total / maxY) * innerH;
    return { ...s, x, y };
  });
  const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const bottomY = p.t + innerH;
  const areaD =
    pts.length > 0
      ? `M ${pts[0]!.x} ${bottomY} ${pts.map((pt) => `L ${pt.x} ${pt.y}`).join(" ")} L ${pts[pts.length - 1]!.x} ${bottomY} Z`
      : "";

  if (series.length === 0) {
    return (
      <p className="px-5 py-14 text-center text-sm text-gray-500 dark:text-slate-500">
        Sem dados suficientes para exibir evolução.
      </p>
    );
  }

  return (
    <div className="relative px-3 pb-2 pt-1 sm:px-5">
      {hovered != null && pts[hovered] && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="font-medium text-gray-500 dark:text-slate-400">
            {pts[hovered].label}
          </span>
          <span className="ml-2 font-semibold tabular-nums text-gray-900 dark:text-slate-50">
            {formatBRL(Math.round(pts[hovered].total))}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a34a" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${fillGradId})`} />
        <path
          d={d}
          fill="none"
          stroke={`url(#${lineGradId})`}
          strokeWidth={2.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((pt, i) => (
          <g key={pt.key}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hovered === i ? 5.5 : 3.5}
              fill={hovered === i ? "#ecfdf5" : "#86efac"}
              stroke="#166534"
              strokeWidth={hovered === i ? 2 : 1.5}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(i)}
            />
            {(i === 0 || i === pts.length - 1 || i % Math.ceil(pts.length / 6) === 0) && (
              <text
                x={pt.x}
                y={h - 10}
                textAnchor="middle"
                className="fill-gray-400 text-[10px] dark:fill-slate-500"
              >
                {pt.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function SectorDonut({
  rows,
  total,
}: {
  rows: SectorAgg[];
  total: number;
}) {
  const size = 180;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const withRev = rows.filter((s) => s.revenue > 0);
  let offset = 0;

  return (
    <div className="relative mx-auto flex h-[180px] w-[180px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-100 dark:text-slate-800"
        />
        {withRev.length === 0 ? null : (
          withRev.map((s) => {
            const frac = total > 0 ? s.revenue / total : 0;
            const len = Math.max(frac * c, 2);
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.id}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={SECTOR_CHART_HEX[s.colorToken]}
                strokeWidth={stroke}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
          Receita
        </p>
        <p className="mt-0.5 max-w-[7.5rem] text-sm font-bold leading-tight tabular-nums text-gray-900 dark:text-slate-50">
          {formatBRL(Math.round(total))}
        </p>
      </div>
    </div>
  );
}

export function FarmOverviewDashboard() {
  const setSelectedSector = useSectorStore((s) => s.setSelectedSector);
  const sectors = useSectorStore((s) => s.sectors);
  const sales = useSalesStore((s) => s.sales);
  const stockMovements = useSalesStore((s) => s.stockMovements);
  const stockTotalSacas = useSalesStore((s) => s.stockTotalSacas);
  const stock = useStockSnapshot();
  const expenses = useExpenseStore((s) => s.expenses);
  const [chartMode, setChartMode] = useState<"global" | "split">("global");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const periodActive = Boolean(dateFrom || dateTo);

  const filteredSales = useMemo(
    () => sales.filter((s) => inDateRange(s.date, dateFrom, dateTo)),
    [sales, dateFrom, dateTo],
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => inDateRange(e.date, dateFrom, dateTo)),
    [expenses, dateFrom, dateTo],
  );

  useEffect(() => {
    setSelectedSector(null);
  }, [setSelectedSector]);

  const expensesBySector = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of filteredExpenses) {
      if (!e.sectorId) continue;
      map.set(e.sectorId, (map.get(e.sectorId) ?? 0) + e.amount);
    }
    return map;
  }, [filteredExpenses]);

  const sectorAgg = useMemo(
    () => buildSectorAgg(filteredSales, sectors, expensesBySector),
    [filteredSales, sectors, expensesBySector],
  );

  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.totalPrice, 0),
    [filteredSales],
  );
  const totalUnits = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.quantity, 0),
    [filteredSales],
  );
  const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((acc, e) => acc + e.amount, 0),
    [filteredExpenses],
  );
  const netProfit = totalRevenue - totalExpenses;
  const isDanger = totalExpenses > totalRevenue * 0.7 && totalRevenue > 0;

  const revenueBySector = useMemo(
    () => [...sectorAgg].sort((a, b) => b.revenue - a.revenue),
    [sectorAgg],
  );

  const globalSeries = useMemo(
    () => buildRevenueSeries(filteredSales),
    [filteredSales],
  );
  const revenueGrowthPercent = useMemo(() => {
    if (globalSeries.length < 2) return null;
    const last = globalSeries[globalSeries.length - 1]!.total;
    const prev = globalSeries[globalSeries.length - 2]!.total;
    if (prev <= 0) return null;
    return ((last - prev) / prev) * 100;
  }, [globalSeries]);

  const periodBest = useMemo(() => {
    const monthStart = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const list = periodActive
      ? filteredSales
      : filteredSales.filter((s) => s.date >= monthStart);
    const agg = buildSectorAgg(list, sectors, expensesBySector).sort(
      (a, b) => b.revenue - a.revenue,
    );
    return agg[0] ?? null;
  }, [filteredSales, sectors, expensesBySector, periodActive]);

  const projected4wRevenue = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 27);
    start.setHours(0, 0, 0, 0);
    const from = isoDate(start);
    return sales
      .filter((s) => s.date >= from)
      .reduce((acc, s) => acc + s.totalPrice, 0);
  }, [sales]);

  const activeSectors = revenueBySector.filter((s) => s.revenue > 0).length;

  const stockBySector = useMemo(() => {
    return sectors.map((sector) => {
      const snap = computeStockSnapshot(
        stockTotalSacas,
        stockMovements,
        sector.id,
      );
      return {
        id: sector.id,
        name: sector.name,
        icon: sector.icon,
        colorToken: sector.color,
        unit: sector.unit,
        remaining: snap.remaining,
        total: snap.total,
        sold: snap.sold,
      };
    });
  }, [sectors, stockMovements, stockTotalSacas]);

  const stockBySectorId = useMemo(
    () => new Map(stockBySector.map((s) => [s.id, s])),
    [stockBySector],
  );

  const maxSectorStock = Math.max(1, ...stockBySector.map((s) => s.remaining));
  const fmtInt = (n: number) =>
    new Intl.NumberFormat("pt-BR").format(Math.round(n));

  return (
    <div className="animate-dash-enter mx-auto max-w-7xl space-y-5 pb-16">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
            CoopFinance <span className="text-gray-300 dark:text-slate-600">/</span> Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-50 sm:text-3xl">
            Farm Overview
          </h1>
          <p className="max-w-xl text-sm text-gray-600 dark:text-slate-400">
            Visão consolidada da operação — receita, custos, mix e estoque por setor.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              {sectors.length} setores
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
              Estoque {new Intl.NumberFormat("pt-BR").format(stock.remaining)}
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                De
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Até
              </span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                setDateFrom(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
                setDateTo(isoDate(d));
              }}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              Este mês
            </button>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const start = new Date(d);
                start.setDate(d.getDate() - 29);
                setDateFrom(isoDate(start));
                setDateTo(isoDate(d));
              }}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              30 dias
            </button>
            {periodActive && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300"
              >
                Tudo
              </button>
            )}
          </div>
        </div>
      </header>

      {isDanger && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          Despesas acima de 70% da receita — revise custos ou ritmo de venda.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Painel principal — KPI strip + área */}
        <FramePanel
          className="lg:col-span-2"
          flush
          title="Operação consolidada"
          description="KPIs + evolução mensal de faturamento"
          actions={
            <div className="flex gap-1.5">
              <button
                type="button"
                className="frame-chip"
                data-active={chartMode === "global"}
                onClick={() => setChartMode("global")}
              >
                Consolidado
              </button>
              <button
                type="button"
                className="frame-chip"
                data-active={chartMode === "split"}
                onClick={() => setChartMode("split")}
              >
                Por setor
              </button>
            </div>
          }
        >
          <div className="frame-kpi-strip">
            <div className="frame-kpi-cell">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <CardHelpLabel help="Soma do valor total (R$) de todas as vendas no período. O % compara com o mês anterior.">
                  Faturamento
                </CardHelpLabel>
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-slate-50 sm:text-2xl">
                <AnimatedNumber
                  value={totalRevenue}
                  format={(n) => formatBRL(Math.round(n))}
                />
              </p>
              <div className="mt-2">
                <DeltaBadge value={revenueGrowthPercent} />
                <span className="ml-1.5 text-[10px] text-gray-400">vs mês ant.</span>
              </div>
            </div>
            <div className="frame-kpi-cell">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <CardHelpLabel help="Quantidade total vendida (todas as unidades dos setores) no período consolidado.">
                  Unidades
                </CardHelpLabel>
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-slate-50 sm:text-2xl">
                <AnimatedNumber
                  value={totalUnits}
                  format={(n) =>
                    new Intl.NumberFormat("pt-BR").format(Math.round(n))
                  }
                />
              </p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
                Volume consolidado
              </p>
            </div>
            <div className="frame-kpi-cell">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <CardHelpLabel help="Média ponderada: faturamento ÷ unidades vendidas no período.">
                  Preço médio
                </CardHelpLabel>
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-slate-50 sm:text-2xl">
                <AnimatedNumber
                  value={averagePrice}
                  decimals={2}
                  format={(n) => formatBRLFine(n)}
                />
              </p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
                Ponderado
              </p>
            </div>
            <div className="frame-kpi-cell">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <CardHelpLabel help="Faturamento menos despesas no período. Positivo = lucro; negativo = prejuízo.">
                  Lucro líquido
                </CardHelpLabel>
              </p>
              <p
                className={`mt-1.5 text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${
                  netProfit >= 0
                    ? "text-emerald-800 dark:text-emerald-300"
                    : "text-rose-800 dark:text-rose-300"
                }`}
              >
                <AnimatedNumber
                  value={netProfit}
                  format={(n) => formatBRL(Math.round(n))}
                />
              </p>
              <p className="mt-2 text-[11px] text-gray-400 dark:text-slate-500">
                Despesas {formatBRL(Math.round(totalExpenses))}
              </p>
            </div>
          </div>

          {chartMode === "global" ? (
            <AreaChart series={globalSeries} />
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {sectors.length === 0 ? (
                <p className="col-span-full py-10 text-center text-sm text-gray-500">
                  Sem setores no banco ainda.
                </p>
              ) : (
                sectors.map((sector) => (
                  <div
                    key={sector.id}
                    className="overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800"
                  >
                    <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-slate-800 dark:text-slate-200">
                      {sector.name}
                    </p>
                    <AreaChart
                      series={buildRevenueSeries(
                        filteredSales.filter((s) => s.sectorId === sector.id),
                      )}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </FramePanel>

        {/* Mix por setor */}
        <FramePanel
          title="Mix por setor"
          description="Participação na receita"
          help="Quanto cada setor representa no faturamento total do período."
          actions={
            <DeltaBadge
              value={
                revenueBySector[0] && totalRevenue > 0
                  ? revenueBySector[0].share
                  : null
              }
              suffix="% top"
            />
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <CardHelpLabel help="Quantos setores tiveram pelo menos uma venda no período, face ao total cadastrado.">
                  Setores com venda
                </CardHelpLabel>
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-slate-50">
                {activeSectors}
                <span className="ml-1 text-base font-medium text-gray-400">
                  / {sectors.length}
                </span>
              </p>
            </div>

            <SectorDonut rows={revenueBySector} total={totalRevenue} />

            <ul className="space-y-2">
              {revenueBySector.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: SECTOR_CHART_HEX[s.colorToken] }}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium text-gray-800 dark:text-slate-200">
                    {s.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-gray-500 dark:text-slate-400">
                    {s.share.toFixed(0)}%
                  </span>
                </li>
              ))}
              {revenueBySector.length === 0 && (
                <li className="text-sm text-gray-500">Sem vendas registadas.</li>
              )}
            </ul>

            <p className="text-[11px] leading-relaxed text-gray-400 dark:text-slate-500">
              Mix reflecte a receita real carregada do Supabase por setor.
            </p>
          </div>
        </FramePanel>
      </div>

      {/* Breakdown tabela */}
      <FramePanel
        flush
        title="Desempenho por setor"
        description="Receita, volume, margem e sinal de risco"
        actions={
          <Link
            href="/analises"
            className="frame-chip inline-flex items-center gap-1"
          >
            Análises
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <TableScroll hint={false}>
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:border-slate-800 dark:text-slate-500">
                <th className="px-5 py-3">Setor</th>
                <th className="px-4 py-3 text-right">Unidades</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Receita</th>
                <th className="px-4 py-3 text-right">Share</th>
                <th className="px-4 py-3 text-right">Preço méd.</th>
                <th className="px-4 py-3 text-right">Lucro</th>
                <th className="px-5 py-3">Risco</th>
              </tr>
            </thead>
            <tbody>
              {revenueBySector.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-500 dark:text-slate-400"
                  >
                    Sem setores ou vendas no banco ainda.
                  </td>
                </tr>
              ) : (
                revenueBySector.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/70 dark:border-slate-800/80 dark:hover:bg-slate-900/60"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800">
                          <SectorGlyph
                            icon={s.icon}
                            sectorId={s.id}
                            className="h-4 w-4"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900 dark:text-slate-50">
                            {s.name}
                          </p>
                          <p className="truncate text-[11px] text-gray-400 dark:text-slate-500">
                            {s.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-800 dark:text-slate-200">
                      {new Intl.NumberFormat("pt-BR").format(s.quantity)}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-800 dark:text-slate-200">
                      {fmtInt(stockBySectorId.get(s.id)?.remaining ?? 0)}
                      <span className="ml-1 text-[11px] font-normal text-gray-400">
                        {pluralizeUnit(
                          stockBySectorId.get(s.id)?.unit ?? "un",
                          stockBySectorId.get(s.id)?.remaining ?? 0,
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-gray-900 dark:text-slate-50">
                      {formatBRL(Math.round(s.revenue))}
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(3, s.share)}%`,
                            background: SECTOR_CHART_HEX[s.colorToken],
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600 dark:text-slate-300">
                      {s.share.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700 dark:text-slate-300">
                      {s.avgPrice > 0 ? formatBRLFine(s.avgPrice) : "—"}
                    </td>
                    <td
                      className={`px-4 py-3.5 text-right font-semibold tabular-nums ${
                        s.profit >= 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {formatBRL(Math.round(s.profit))}
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={s.risk} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScroll>
      </FramePanel>

      {/* Insights compactos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <FramePanel
          title={periodActive ? "Melhor setor no período" : "Melhor setor no mês"}
          help={
            periodActive
              ? "Setor com maior faturamento no intervalo filtrado."
              : "Setor com maior faturamento no histórico carregado (usa o filtro se estiver ativo)."
          }
        >
          <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
            {periodBest?.name ?? "Sem dados"}
          </p>
          {periodBest && (
            <p className="mt-1 text-sm tabular-nums text-gray-500 dark:text-slate-400">
              {formatBRL(Math.round(periodBest.revenue))}
            </p>
          )}
        </FramePanel>
        <FramePanel
          title="Projeção 4 semanas"
          help="Estimativa de faturamento nas próximas 4 semanas com base no ritmo dos últimos 28 dias."
        >
          <p className="inline-flex items-center gap-1.5 text-lg font-semibold tabular-nums text-gray-900 dark:text-slate-50">
            {formatBRL(Math.round(projected4wRevenue))}
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
            Ritmo dos últimos 28 dias
          </p>
        </FramePanel>
        <FramePanel
          title="Estoque restante"
          help="Geral = soma do que ainda pode vender. Em baixo, o saldo de cada setor (entradas − saídas daquele setor)."
          actions={
            <Link
              href="/estoque"
              className="frame-chip inline-flex items-center gap-1"
            >
              Estoque
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-slate-50">
            {fmtInt(stock.remaining)}
            <span className="ml-1.5 text-xs font-medium text-gray-400">
              geral
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
            Total {fmtInt(stock.total)} · vendido {fmtInt(stock.sold)}
          </p>
          <ul className="mt-3 space-y-2">
            {stockBySector.length === 0 ? (
              <li className="text-xs text-gray-500">Sem setores ainda.</li>
            ) : (
              stockBySector.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/setor/${s.id}`}
                    className="group block rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: SECTOR_CHART_HEX[s.colorToken] }}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium text-gray-700 group-hover:text-gray-900 dark:text-slate-300">
                        {s.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-800 dark:text-slate-100">
                        {fmtInt(s.remaining)}{" "}
                        <span className="text-gray-400">
                          {pluralizeUnit(s.unit, s.remaining)}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500/80"
                        style={{
                          width: `${Math.max(4, (s.remaining / maxSectorStock) * 100)}%`,
                        }}
                      />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </FramePanel>
      </div>
    </div>
  );
}
