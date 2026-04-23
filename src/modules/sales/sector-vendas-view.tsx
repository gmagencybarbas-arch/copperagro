"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { BigNumber, Card, Title } from "@/design-system";
import {
  buildMonthlyQuantity,
  buildPeriodPriceSeriesByGranularity,
  buildWeekSlotYearlyPriceSeries,
  buildWeekSlotYearlyQuantityBars,
} from "@/modules/dashboard/chart-helpers";
import { MonthlyBarChart } from "@/modules/dashboard/monthly-bar-chart";
import { PriceLineChart } from "@/modules/dashboard/price-line-chart";
import { SalesFilterBar } from "@/modules/dashboard/sales-filter-bar";
import { SectorTabs } from "@/components/sector/sector-tabs";
import { SalesTable } from "@/modules/sales/sales-table";
import { formatBRL, formatBRLFine } from "@/lib/format";
import { useExpenseStore } from "@/store/expense-store";
import { trailingWeeklyAvgBags } from "@/store/sales-metrics";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import {
  useSalesMetrics,
  useSalesStore,
  useStockSnapshot,
} from "@/store/sales-store";
import {
  BarChart3,
  ChevronDown,
  DollarSign,
  Layers,
  LayoutDashboard,
  Package,
  Timer,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Painel do setor: KPIs e gráficos (período = filtro global) + histórico completo (tabela reutilizada).
 */
export function SectorVendasView() {
  const allSales = useSalesStore((s) => s.sales);
  const filter = useSalesStore((s) => s.filter);
  const metrics = useSalesMetrics();
  const stock = useStockSnapshot();
  const sectors = useSectorStore((s) => s.sectors);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const [showDados, setShowDados] = useState(true);
  const [showCharts, setShowCharts] = useState(true);
  const expenses = useExpenseStore((s) => s.expenses);
  const refDate = useMemo(() => new Date(), []);
  const weekMode = filter.dimension === "week";
  const priceGranularity = filter.priceChartGranularity ?? "day";

  const selectedSector = useMemo(
    () => sectors.find((s) => s.id === selectedSectorId) ?? null,
    [sectors, selectedSectorId],
  );
  const unit = selectedSector?.unit ?? "unidade";
  const sales = useMemo(() => {
    if (!selectedSectorId) return allSales;
    return allSales.filter((s) => s.sectorId === selectedSectorId);
  }, [allSales, selectedSectorId]);

  const priceCurrent = useMemo(() => {
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

  const weeklyAvg = useMemo(() => trailingWeeklyAvgBags(sales), [sales]);
  const projectionEnd =
    weeklyAvg > 0 ? Math.ceil(stock.remaining / weeklyAvg) : null;
  const sectorExpenses = useMemo(() => {
    if (!selectedSectorId) return 0;
    return expenses
      .filter((e) => !e.sectorId || e.sectorId === selectedSectorId)
      .reduce((a, e) => a + e.amount, 0);
  }, [expenses, selectedSectorId]);
  const sectorProfit = metrics.totalRevenue - sectorExpenses;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">
          {selectedSector?.name ?? "Todos os setores"}
        </h1>
        <div className="pt-1">
          <SectorTabs />
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          Desempenho comercial, tendência de preço e volume no período selecionado
          — com histórico detalhado e ações no mesmo sítio.
        </p>
        <SalesFilterBar />
      </header>

      <section className="space-y-4" aria-label="Indicadores">
        <button
          type="button"
          onClick={() => setShowDados((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm md:hidden"
          aria-expanded={showDados}
          aria-controls="dados-setor-content"
        >
          <LayoutDashboard className="h-4 w-4 text-[#16a34a]" strokeWidth={2} />
          Dados
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showDados ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>

        <div
          id="dados-setor-content"
          className={`${showDados ? "grid" : "hidden"} grid-cols-2 gap-6 md:grid`}
        >
          <Card className="col-span-2 rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm dark:border-slate-800 lg:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <Title className="text-gray-600">Faturamento total</Title>
            <DollarSign
              className="h-5 w-5 shrink-0 text-gray-400"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-3 break-words leading-tight text-gray-900 dark:text-slate-50">
            <AnimatedNumber
              value={metrics.totalRevenue}
              format={(n) => formatBRL(Math.round(n))}
            />
          </BigNumber>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
            Soma (R$) no período filtrado
          </p>
        </Card>

          <Card className="col-span-2 rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm dark:border-slate-800 lg:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <Title className="text-gray-600">Unidades ({pluralizeUnit(unit, 2)})</Title>
            <Package
              className="h-5 w-5 shrink-0 text-gray-400"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-3 break-words leading-tight text-gray-900 dark:text-slate-50">
            <AnimatedNumber
              value={metrics.totalBagsSold}
              format={(n) =>
                new Intl.NumberFormat("pt-BR").format(Math.round(n))
              }
            />
          </BigNumber>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
            Quantidade total no período
          </p>
        </Card>

          <Card className="col-span-1 rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm dark:border-slate-800 lg:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <Title className="text-gray-600">Preço médio</Title>
            <TrendingUp
              className="h-5 w-5 shrink-0 text-gray-400"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-3 break-words leading-tight text-gray-900 dark:text-slate-50">
            <AnimatedNumber
              value={metrics.averagePrice}
              decimals={2}
              format={(n) => formatBRLFine(n)}
            />
          </BigNumber>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
            Média ponderada (R$/{unit})
          </p>
        </Card>

          <Card className="col-span-1 rounded-[22px] border border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/40 p-6 shadow-sm lg:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <Title className="text-gray-600">Estoque restante</Title>
            <Layers
              className="h-5 w-5 shrink-0 text-emerald-600/70"
              strokeWidth={1.75}
            />
          </div>
          <BigNumber className="mt-3 break-words leading-tight text-emerald-950 dark:text-emerald-200">
            <AnimatedNumber
              value={stock.remaining}
              format={(n) =>
                new Intl.NumberFormat("pt-BR").format(Math.round(n))
              }
            />
          </BigNumber>
          <p className="mt-1 text-xs text-gray-600 dark:text-slate-500">
            Total {new Intl.NumberFormat("pt-BR").format(stock.total)} · vendido{" "}
            <span className="tabular-nums font-medium">
              {stock.sold} {pluralizeUnit(unit, stock.sold)}
            </span>
          </p>
        </Card>

          <Card className="col-span-2 rounded-[22px] border border-gray-100/90 bg-white p-6 shadow-sm dark:border-slate-800 md:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <Title className="text-gray-600">
              Projeção de término do estoque
            </Title>
            <Timer className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
          </div>
          <BigNumber className="mt-3 break-words leading-tight text-gray-900 dark:text-slate-50">
            {projectionEnd !== null ? (
              <>
                <AnimatedNumber value={projectionEnd} />
                <span className="ml-2 text-xl font-medium text-gray-500 dark:text-slate-400">
                  semanas
                </span>
              </>
            ) : (
              "—"
            )}
          </BigNumber>
          <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-sm font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
            Ritmo médio usado:{" "}
            <span className="tabular-nums text-[#15803d] dark:text-emerald-400">
              {weeklyAvg > 0
                ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(weeklyAvg)} ${pluralizeUnit(unit, weeklyAvg)} / semana`
                : "— (sem vendas no recorte para ritmo)"}
            </span>
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">
            Estoque restante ÷ ritmo médio semanal de vendas (últimos 28 dias até a última venda, em semanas ISO).
          </p>
        </Card>

          <Card className="col-span-2 overflow-hidden rounded-[22px] border border-gray-200/90 bg-gradient-to-br from-white via-slate-50/50 to-white p-0 shadow-md ring-1 ring-gray-100/80 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 dark:ring-slate-800 md:col-span-2">
            <div className="grid divide-y divide-gray-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700/90 dark:text-rose-300/90">
                  Despesas do setor
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-rose-800 dark:text-rose-200/95">
                  <AnimatedNumber value={sectorExpenses} format={(n) => formatBRL(Math.round(n))} />
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                  Custos atribuídos ao setor no período (e despesas globais repartidas).
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50/90 to-white p-6 dark:from-emerald-950/40 dark:to-slate-900/60">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                  Lucro do setor
                </p>
                <p
                  className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${
                    sectorProfit >= 0
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-rose-800 dark:text-rose-200/90"
                  }`}
                >
                  {formatBRL(Math.round(sectorProfit))}
                </p>
                <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
                  Faturamento <span className="font-semibold text-gray-800 dark:text-slate-200">{formatBRL(Math.round(metrics.totalRevenue))}</span>
                  {" "}
                  − despesas
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-2" aria-label="Gráficos">
        <button
          type="button"
          onClick={() => setShowCharts((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm md:hidden"
          aria-expanded={showCharts}
          aria-controls="charts-setor-content"
        >
          <BarChart3 className="h-4 w-4 text-[#16a34a]" strokeWidth={2} />
          Tendência e volume
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showCharts ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <h2 className="hidden text-sm font-semibold uppercase tracking-wide text-gray-500 md:block dark:text-slate-500">
          Tendência e volume
        </h2>
        <div
          id="charts-setor-content"
          className={`${showCharts ? "grid" : "hidden"} gap-6 md:grid lg:grid-cols-2`}
        >
          <Card className="overflow-hidden rounded-[22px] border border-slate-800/90 bg-slate-950 p-0 shadow-md ring-1 ring-white/[0.06]">
            <PriceLineChart
              current={priceCurrent}
              compareSeries={[]}
              comparisonEnabled={false}
              yearlyAggregate={weekMode}
              chartGranularity={
                weekMode ? undefined : filter.priceChartGranularity
              }
            />
          </Card>
          <Card className="overflow-hidden rounded-[22px] border border-slate-800/90 bg-slate-950 p-0 shadow-md ring-1 ring-white/[0.06]">
            <MonthlyBarChart
              singleData={singleBars}
              unitLabel={pluralizeUnit(unit, 2)}
              chartTitle={weekMode ? "Volume por ano" : "Volume por mês"}
              chartSubtitle={
                weekMode
                  ? `${pluralizeUnit(unit, 2)} no recorte da semana, por ano`
                  : `${pluralizeUnit(unit, 2)} vendidas por mês no período`
              }
            />
          </Card>
        </div>
      </section>

      <section className="space-y-4" id="historico-vendas">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
          Histórico de vendas
        </h2>
        <SalesTable embed />
      </section>
    </div>
  );
}
