"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { BigNumber, Card, Title } from "@/design-system";
import { formatBRL, formatBRLFine } from "@/lib/format";
import { useExpenseStore } from "@/store/expense-store";
import { useSectorStore } from "@/store/sector-store";
import { useSalesStore, useStockSnapshot } from "@/store/sales-store";
import { type Sale } from "@/types/sale";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  DollarSign,
  HandCoins,
  LineChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RevenuePoint = { key: string; label: string; total: number };
type SectorAgg = {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
  avgPrice: number;
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

function trendLabel(series: RevenuePoint[]): "subindo" | "caindo" | "estável" {
  if (series.length < 2) return "estável";
  const last = series[series.length - 1]!.total;
  const prev = series[series.length - 2]!.total;
  if (last > prev) return "subindo";
  if (last < prev) return "caindo";
  return "estável";
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

function buildSectorAgg(
  sales: Sale[],
  sectors: { id: string; name: string }[],
): SectorAgg[] {
  return sectors.map((sector) => {
    const list = sales.filter((s) => s.sectorId === sector.id);
    const revenue = list.reduce((acc, s) => acc + s.totalPrice, 0);
    const quantity = list.reduce((acc, s) => acc + s.quantity, 0);
    const avgPrice = quantity > 0 ? revenue / quantity : 0;
    return { id: sector.id, name: sector.name, revenue, quantity, avgPrice };
  });
}

function RevenueLine({
  title,
  series,
}: {
  title: string;
  series: RevenuePoint[];
}) {
  const w = 720;
  const h = 220;
  const p = { t: 16, r: 16, b: 34, l: 22 };
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const maxY = Math.max(1, ...series.map((s) => s.total));
  const pts = series.map((s, i) => {
    const x = p.l + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
    const y = p.t + innerH - (s.total / maxY) * innerH;
    return { ...s, x, y };
  });
  const d = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");

  return (
    <Card className="overflow-hidden rounded-[22px] border border-slate-800/90 bg-slate-950 p-5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]">
      <div className="mb-3 flex items-center gap-2">
        <LineChart className="h-4 w-4 text-emerald-400" />
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          {title}
        </p>
      </div>
      {series.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sem dados suficientes para exibir evolução.
        </p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full">
          <path d={d} fill="none" stroke="#34d399" strokeWidth={3} />
          {pts.map((pt) => (
            <circle key={pt.key} cx={pt.x} cy={pt.y} r={3.5} fill="#6ee7b7" />
          ))}
        </svg>
      )}
    </Card>
  );
}

export function FarmOverviewDashboard() {
  const setSelectedSector = useSectorStore((s) => s.setSelectedSector);
  const sectors = useSectorStore((s) => s.sectors);
  const sales = useSalesStore((s) => s.sales);
  const stock = useStockSnapshot();
  const expenses = useExpenseStore((s) => s.expenses);
  const [splitBySector, setSplitBySector] = useState(false);

  useEffect(() => {
    // Dashboard principal é sempre visão global.
    setSelectedSector(null);
  }, [setSelectedSector]);

  const sectorAgg = useMemo(() => buildSectorAgg(sales, sectors), [sales, sectors]);
  const totalRevenue = useMemo(
    () => sales.reduce((acc, s) => acc + s.totalPrice, 0),
    [sales],
  );
  const totalUnits = useMemo(
    () => sales.reduce((acc, s) => acc + s.quantity, 0),
    [sales],
  );
  const averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
  const totalExpenses = useMemo(
    () => expenses.reduce((acc, e) => acc + e.amount, 0),
    [expenses],
  );
  const netProfit = totalRevenue - totalExpenses;

  const revenueBySector = useMemo(
    () => [...sectorAgg].sort((a, b) => b.revenue - a.revenue),
    [sectorAgg],
  );
  const maxSectorRevenue = Math.max(1, ...revenueBySector.map((s) => s.revenue));

  const globalSeries = useMemo(() => buildRevenueSeries(sales), [sales]);
  const bestByPrice = useMemo(
    () => [...sectorAgg].sort((a, b) => b.avgPrice - a.avgPrice)[0] ?? null,
    [sectorAgg],
  );
  const worstByPrice = useMemo(
    () => [...sectorAgg].sort((a, b) => a.avgPrice - b.avgPrice)[0] ?? null,
    [sectorAgg],
  );
  const mostSold = useMemo(
    () => [...sectorAgg].sort((a, b) => b.quantity - a.quantity)[0] ?? null,
    [sectorAgg],
  );

  const monthlyBest = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthSales = sales.filter((s) => new Date(`${s.date}T12:00:00`) >= monthStart);
    const agg = buildSectorAgg(monthSales, sectors).sort((a, b) => b.revenue - a.revenue);
    return agg[0] ?? null;
  }, [sales, sectors]);

  const trend = useMemo(() => trendLabel(globalSeries), [globalSeries]);
  const projected4wRevenue = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 27);
    start.setHours(0, 0, 0, 0);
    const last4w = sales
      .filter((s) => new Date(`${s.date}T12:00:00`) >= start)
      .reduce((acc, s) => acc + s.totalPrice, 0);
    return last4w;
  }, [sales]);

  return (
    <div className="animate-dash-enter mx-auto max-w-7xl space-y-8 pb-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">
          Farm Overview
        </h1>
        <p className="max-w-2xl text-sm text-gray-600 dark:text-slate-400">
          Visão macro da operação consolidada em todos os setores.
        </p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Faturamento total</Title>
          <BigNumber className="mt-3 text-gray-900">
            <AnimatedNumber value={totalRevenue} format={(n) => formatBRL(Math.round(n))} />
          </BigNumber>
          <DollarSign className="mt-2 h-4 w-4 text-gray-400" />
        </Card>

        <Card className="rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Unidades vendidas</Title>
          <BigNumber className="mt-3 text-gray-900">
            <AnimatedNumber
              value={totalUnits}
              format={(n) => new Intl.NumberFormat("pt-BR").format(Math.round(n))}
            />
          </BigNumber>
          <Boxes className="mt-2 h-4 w-4 text-gray-400" />
        </Card>

        <Card className="rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Preço médio global</Title>
          <BigNumber className="mt-3 text-gray-900">
            <AnimatedNumber value={averagePrice} decimals={2} format={(n) => formatBRLFine(n)} />
          </BigNumber>
          <Activity className="mt-2 h-4 w-4 text-gray-400" />
        </Card>

        <Card className="rounded-[22px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/40 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Estoque restante total</Title>
          <BigNumber className="mt-3 text-emerald-950">
            <AnimatedNumber
              value={stock.remaining}
              format={(n) => new Intl.NumberFormat("pt-BR").format(Math.round(n))}
            />
          </BigNumber>
          <p className="mt-1 text-xs text-gray-600">Soma consolidada dos setores</p>
        </Card>

        <Card className="rounded-[22px] border border-amber-100/80 bg-gradient-to-br from-white to-amber-50/50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Despesas totais (mock)</Title>
          <BigNumber className="mt-3 text-amber-950">
            <AnimatedNumber value={totalExpenses} format={(n) => formatBRL(Math.round(n))} />
          </BigNumber>
          <HandCoins className="mt-2 h-4 w-4 text-amber-700/80" />
        </Card>

        <Card className="rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Title className="text-gray-600">Lucro líquido</Title>
          <BigNumber className={`mt-3 ${netProfit >= 0 ? "text-emerald-800" : "text-red-700"}`}>
            <AnimatedNumber value={netProfit} format={(n) => formatBRL(Math.round(n))} />
          </BigNumber>
          {netProfit >= 0 ? (
            <TrendingUp className="mt-2 h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="mt-2 h-4 w-4 text-red-600" />
          )}
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Performance por setor</h2>
        <Card className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {revenueBySector.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatBRL(Math.round(s.revenue))}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                    style={{ width: `${Math.max(4, (s.revenue / maxSectorRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Evolução de faturamento</h2>
          <button
            type="button"
            onClick={() => setSplitBySector((v) => !v)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {splitBySector ? "Mostrar consolidado" : "Mostrar por setor"}
          </button>
        </div>
        {!splitBySector ? (
          <RevenueLine title="Faturamento global por mês" series={globalSeries} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {sectors.map((sector) => (
              <RevenueLine
                key={sector.id}
                title={`${sector.name} por mês`}
                series={buildRevenueSeries(sales.filter((s) => s.sectorId === sector.id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Comparação setorial</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <span>Melhor setor (maior preço médio)</span>
              <span className="font-semibold">
                {bestByPrice?.name ?? "—"} {bestByPrice ? `· ${formatBRLFine(bestByPrice.avgPrice)}` : ""}
              </span>
            </p>
            <p className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <span>Pior setor (menor preço médio)</span>
              <span className="font-semibold">
                {worstByPrice?.name ?? "—"} {worstByPrice ? `· ${formatBRLFine(worstByPrice.avgPrice)}` : ""}
              </span>
            </p>
            <p className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
              <span>Setor mais vendido</span>
              <span className="font-semibold">
                {mostSold?.name ?? "—"} {mostSold ? `· ${new Intl.NumberFormat("pt-BR").format(mostSold.quantity)}` : ""}
              </span>
            </p>
          </div>
        </Card>

        <Card className="rounded-[22px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick Insights</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Melhor setor no mês</p>
              <p className="mt-1 font-semibold text-emerald-950">
                {monthlyBest?.name ?? "Sem dados no mês atual"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Tendência de preço</p>
              <p className="mt-1 font-semibold text-gray-900">
                {trend === "subindo" ? "Subindo" : trend === "caindo" ? "Caindo" : "Estável"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Projeção 4 semanas</p>
              <p className="mt-1 inline-flex items-center gap-1 font-semibold text-gray-900">
                {formatBRL(Math.round(projected4wRevenue))}
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

