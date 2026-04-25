"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { Card } from "@/design-system";
import {
  byCategory,
  bySectorBars,
  filterExpenses,
  lastNDaysWindow,
  projectNext30FromLast30,
  totalAmount,
  totalUnitsSold,
  trendCompareLast30d,
} from "@/lib/expense-analytics";
import { NON_SECTOR_PIE_COLOR } from "@/lib/sector-palette";
import { formatBRLFine } from "@/lib/format";
import { useExpenseStore } from "@/store/expense-store";
import { useSalesStore } from "@/store/sales-store";
import { useDrawerStore } from "@/store/drawer-store";
import { useSectorStore } from "@/store/sector-store";
import { EXPENSE_CATEGORY_LABEL, type Expense } from "@/types/expense";
import type { Sector, SectorColorToken } from "@/types/sector";
import { BarChart3, ChevronDown, LayoutDashboard } from "lucide-react";
import { useMemo, useState } from "react";
import { ExpenseByCategoryChart } from "./expense-by-category-chart";
import { ExpenseBySectorChart } from "./expense-by-sector-chart";
import { ExpenseLineChart } from "./expense-line-chart";

function sectorNameFromId(sectors: Sector[], id?: string): string {
  if (!id) return "Fazenda (global)";
  return sectors.find((s) => s.id === id)?.name ?? "Setor";
}

function sectorColorFromId(sectors: Sector[], id?: string): SectorColorToken {
  if (!id) return NON_SECTOR_PIE_COLOR;
  return sectors.find((s) => s.id === id)?.color ?? "green";
}

export function ExpensesView() {
  const expenses = useExpenseStore((s) => s.expenses);
  const filters = useExpenseStore((s) => s.filters);
  const setFilters = useExpenseStore((s) => s.setFilters);
  const clearFilters = useExpenseStore((s) => s.clearFilters);
  const openExpenseDrawer = useDrawerStore((s) => s.openExpenseDrawer);
  const sectors = useSectorStore((s) => s.sectors);
  const sales = useSalesStore((s) => s.sales);

  const sn = (id?: string) => sectorNameFromId(sectors, id);

  const rows = useMemo((): Expense[] => {
    let list: Expense[] = [...expenses];
    if (filters.sectorId !== "all") {
      list = list.filter((e) => (e.sectorId ?? "global") === filters.sectorId);
    }
    if (filters.dateFrom) list = list.filter((e) => e.date >= filters.dateFrom);
    if (filters.dateTo) list = list.filter((e) => e.date <= filters.dateTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filters.dateFrom, filters.dateTo, filters.sectorId]);

  const totalExpenses = useMemo(() => totalAmount(rows), [rows]);
  const avgExpense = useMemo(
    () => (rows.length ? totalExpenses / rows.length : 0),
    [rows.length, totalExpenses],
  );

  const sectorBars = useMemo(
    () =>
      bySectorBars(
        rows,
        (id) => sectorNameFromId(sectors, id),
        (id) => sectorColorFromId(sectors, id),
      ),
    [rows, sectors],
  );

  const categoryRows = useMemo(() => byCategory(rows), [rows]);

  const trend = useMemo(
    () => trendCompareLast30d(expenses, filters.sectorId),
    [expenses, filters.sectorId],
  );

  const last30 = useMemo(() => {
    const w = lastNDaysWindow(30);
    return totalAmount(
      filterExpenses(expenses, {
        sectorId: filters.sectorId,
        from: w.from,
        to: w.to,
      }),
    );
  }, [expenses, filters.sectorId]);

  const nextMonthEst = useMemo(
    () => projectNext30FromLast30(last30),
    [last30],
  );

  const topCategory = categoryRows[0];
  const topSector = sectorBars[0];

  const isProductSector =
    filters.sectorId !== "all" && filters.sectorId !== "global";

  const [showDados, setShowDados] = useState(true);

  const costPerUnit = useMemo(() => {
    if (!isProductSector) return null;
    const ex = totalAmount(rows);
    const units = totalUnitsSold(
      sales,
      filters.sectorId as string,
      filters.dateFrom || undefined,
      filters.dateTo || undefined,
    );
    if (units <= 0) return null;
    return ex / units;
  }, [
    isProductSector,
    rows,
    sales,
    filters.sectorId,
    filters.dateFrom,
    filters.dateTo,
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">Despesas</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Painel de custos, distribuição e tendência — com o detalhe por lançamento em baixo.
        </p>
      </header>

      <Card className="border border-gray-100/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Setor
            </label>
            <select
              value={filters.sectorId}
              onChange={(e) => setFilters({ sectorId: e.target.value as "all" | string })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
            >
              <option value="all">Todos</option>
              <option value="global">Fazenda (global)</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">De</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Até</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
            />
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Limpar
          </button>
        </div>
      </Card>

      <section className="space-y-3" aria-label="Painel e gráficos">
        <button
          type="button"
          onClick={() => setShowDados((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm md:hidden dark:border-slate-600 dark:bg-slate-800/80"
          aria-expanded={showDados}
          aria-controls="despesas-dados-content"
        >
          <LayoutDashboard className="h-4 w-4 text-rose-600" strokeWidth={2} />
          Dados
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showDados ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <h2 className="hidden text-sm font-semibold uppercase tracking-wide text-gray-500 md:block dark:text-slate-500">
          Dados
        </h2>

        <div
          id="despesas-dados-content"
          className={`${showDados ? "block" : "hidden"} space-y-4 md:block`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border border-rose-100/90 bg-gradient-to-br from-rose-50/90 to-white p-5 shadow-sm dark:border-rose-900/40 dark:from-rose-950/30 dark:to-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/80 dark:text-rose-200/80">Total de despesas</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-rose-900 dark:text-rose-100">
                <AnimatedNumber value={totalExpenses} format={(n) => formatBRLFine(Math.round(n * 100) / 100)} />
              </p>
            </Card>
            <Card className="border border-gray-100/90 p-5 shadow-sm dark:border-slate-600/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Média por lançamento</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-slate-100">
                <AnimatedNumber value={avgExpense} format={(n) => formatBRLFine(Math.round(n * 100) / 100)} />
              </p>
            </Card>
            <Card className="border border-gray-100/90 p-5 shadow-sm sm:col-span-2 lg:col-span-1 dark:border-slate-600/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Lançamentos</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900 dark:text-slate-100">{rows.length}</p>
            </Card>
          </div>

          {isProductSector && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border border-indigo-100/90 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-slate-900/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800/90 dark:text-indigo-200/90">Custo por unidade (vendida)</p>
                <p className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-300/70">Despesas do filtro ÷ unidades vendidas (mesmas datas, setor {sn(filters.sectorId)}).</p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-indigo-950 dark:text-indigo-100">
                  {costPerUnit == null
                    ? "— (sem vendas no período)"
                    : formatBRLFine(Math.round(costPerUnit * 100) / 100)}
                </p>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-slate-900/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80 dark:text-emerald-200/80">Estimativa próximo mês</p>
              <p className="mt-1 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">Base: ritmo homogéneo dos últimos 30 dias (filtro de setor aplicado).</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
                {formatBRLFine(Math.round(nextMonthEst * 100) / 100)}
              </p>
            </Card>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="border border-gray-200/90 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Insight</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {topCategory
                    ? `Maior categoria: ${topCategory.label}`
                    : "Sem categorias no período"}
                </p>
              </Card>
              <Card className="border border-gray-200/90 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Tendência (30d vs 30d anterior)</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {trend.previous <= 0 && trend.current <= 0
                    ? "Sem base para comparar"
                    : `Gastos ${trend.up ? "a subir" : "a descer"} ${
                        Number.isFinite(trend.pct) ? `${trend.pct >= 0 ? "+" : ""}${trend.pct.toFixed(1)}%` : ""
                      }`}
                </p>
              </Card>
              {filters.sectorId === "all" && topSector && (
                <Card className="border border-gray-200/90 p-4 shadow-sm sm:col-span-2 dark:border-slate-600 dark:bg-slate-800/40">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Setor com mais custo (no filtro da tabela)</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {topSector.label} — {formatBRLFine(topSector.total)}
                  </p>
                </Card>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExpenseBySectorChart data={sectorBars} emptyMessage="Sem despesas no filtro actual." />
            <ExpenseByCategoryChart data={categoryRows} emptyMessage="Sem despesas no filtro actual." />
          </div>

          <div className="space-y-2" aria-label="Evolução no tempo">
            <div className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-rose-600" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Tendência (evolução no tempo)</h3>
            </div>
            <ExpenseLineChart
              expenses={expenses}
              sectorId={filters.sectorId === "all" ? "all" : filters.sectorId}
            />
          </div>

          {expenses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/80 py-10 text-center text-gray-500 dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400">
              Ainda sem despesas registadas.
              <div>
                <button
                  type="button"
                  onClick={openExpenseDrawer}
                  className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-rose-800"
                >
                  Lançar primeira despesa
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3" aria-label="Histórico de lançamentos" id="historico-despesas">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Histórico de lançamentos</h2>
        <Card className="overflow-hidden border border-gray-100/90 shadow-sm dark:border-slate-600/60">
        <p className="border-b border-gray-100/90 bg-gray-50/80 px-4 py-2 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Tabela
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-slate-400">
                    Sem despesas no filtro actual.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50/90 transition-colors hover:bg-gray-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-slate-200">
                      {EXPENSE_CATEGORY_LABEL[r.category ?? "outros"]}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-slate-200">{r.description}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{sn(r.sectorId)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-800 dark:text-rose-200/90">
                      -{formatBRLFine(r.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      </section>
    </div>
  );
}
