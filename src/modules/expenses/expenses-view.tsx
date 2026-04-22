"use client";

import { Card } from "@/design-system";
import { useExpenseStore } from "@/store/expense-store";
import { useSectorStore } from "@/store/sector-store";
import { formatBRLFine } from "@/lib/format";
import { useMemo } from "react";

export function ExpensesView() {
  const expenses = useExpenseStore((s) => s.expenses);
  const filters = useExpenseStore((s) => s.filters);
  const setFilters = useExpenseStore((s) => s.setFilters);
  const clearFilters = useExpenseStore((s) => s.clearFilters);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const sectors = useSectorStore((s) => s.sectors);

  const effectiveSectorFilter =
    selectedSectorId && filters.sectorId === "all" ? selectedSectorId : filters.sectorId;

  const rows = useMemo(() => {
    let list = [...expenses];
    if (effectiveSectorFilter !== "all") {
      list = list.filter((e) => (e.sectorId ?? "global") === effectiveSectorFilter);
    }
    if (filters.dateFrom) list = list.filter((e) => e.date >= filters.dateFrom);
    if (filters.dateTo) list = list.filter((e) => e.date <= filters.dateTo);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filters.dateFrom, filters.dateTo, effectiveSectorFilter]);

  const sectorName = (id?: string) => {
    if (!id) return "Global";
    return sectors.find((s) => s.id === id)?.name ?? "Setor";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Despesas</h1>
        <p className="text-sm text-gray-600">Registo e acompanhamento de custos por setor.</p>
      </header>

      <Card className="border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Setor
            </label>
            <select
              value={filters.sectorId}
              onChange={(e) => setFilters({ sectorId: e.target.value as "all" | string })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
            >
              <option value="all">Todos</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              De
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ dateFrom: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Até
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                    Sem despesas no filtro atual.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3 tabular-nums text-gray-700">{r.date}</td>
                    <td className="px-4 py-3 text-gray-800">{r.description}</td>
                    <td className="px-4 py-3 text-gray-600">{sectorName(r.sectorId)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-red-700">
                      -{formatBRLFine(r.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

