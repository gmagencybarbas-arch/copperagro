"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { BigNumber, Card, CleanInput } from "@/design-system";
import { useDrawerStore } from "@/store/drawer-store";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import { useSalesStore } from "@/store/sales-store";
import type { StockMovement } from "@/types/sale";
import { Activity, Boxes, ChevronDown, Filter, History, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE = 50;
const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fmtInt = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));
type TypeFilter = "all" | "entry" | "exit";

function sortMovementsDesc(a: StockMovement, b: StockMovement) {
  const d = b.date.localeCompare(a.date);
  if (d !== 0) return d;
  return b.id.localeCompare(a.id);
}

function monthLabelPt(ym: string) {
  const [ys, ms] = ym.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym;
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(d);
}

type MonthlyBucket = { month: string; entries: number; exits: number };

function buildMonthlyVolumes(movements: StockMovement[]): MonthlyBucket[] {
  const map = new Map<string, { entries: number; exits: number }>();
  for (const m of movements) {
    const key = m.date.slice(0, 7);
    if (!map.has(key)) map.set(key, { entries: 0, exits: 0 });
    const cur = map.get(key)!;
    if (m.type === "entry") cur.entries += m.quantity;
    else cur.exits += m.quantity;
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, entries: v.entries, exits: v.exits }));
}

function MonthlyMovementChart({ data }: { data: MonthlyBucket[] }) {
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.entries, d.exits]));
  if (!data.length) {
    return <p className="text-sm text-gray-500">Sem dados no período filtrado.</p>;
  }
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.month} className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500">{monthLabelPt(row.month)}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-emerald-700">Entrada</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-green-600 transition-all duration-500 dark:bg-emerald-600"
                  style={{ width: `${Math.max(4, (row.entries / maxVal) * 100)}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-gray-700">
                {fmtInt(row.entries)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-rose-800 dark:text-rose-300/85">Saída</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-rose-500/80 transition-all duration-500"
                  style={{ width: `${Math.max(4, (row.exits / maxVal) * 100)}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-gray-700">
                {fmtInt(row.exits)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StockView() {
  const movements = useSalesStore((s) => s.stockMovements);
  const openDrawer = useDrawerStore((s) => s.openStockDrawer);
  const sectors = useSectorStore((s) => s.sectors);

  const [sectorFilter, setSectorFilter] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE);

  const sectorById = useMemo(() => new Map(sectors.map((s) => [s.id, s])), [sectors]);

  const stockBySector = useMemo(() => {
    return sectors.map((sector) => {
      const list = movements.filter((m) => m.sectorId === sector.id);
      const entries = list.filter((m) => m.type === "entry").reduce((a, m) => a + m.quantity, 0);
      const exits = list.filter((m) => m.type === "exit").reduce((a, m) => a + m.quantity, 0);
      return { sector, remaining: Math.max(0, entries - exits) };
    });
  }, [movements, sectors]);

  const filteredMovements = useMemo(() => {
    let list = [...movements];
    if (sectorFilter !== "all") list = list.filter((m) => m.sectorId === sectorFilter);
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          (m.note?.toLowerCase().includes(q) ?? false) ||
          (m.relatedSaleId?.toLowerCase().includes(q) ?? false),
      );
    }
    if (dateFrom) list = list.filter((m) => m.date >= dateFrom);
    if (dateTo) list = list.filter((m) => m.date <= dateTo);
    return list.sort(sortMovementsDesc);
  }, [movements, sectorFilter, typeFilter, search, dateFrom, dateTo]);

  useEffect(() => setVisibleCount(PAGE), [sectorFilter, typeFilter, search, dateFrom, dateTo]);

  const monthlyData = useMemo(() => buildMonthlyVolumes(filteredMovements), [filteredMovements]);
  const tableRows = useMemo(() => filteredMovements.slice(0, visibleCount), [filteredMovements, visibleCount]);
  const hasMore = filteredMovements.length > visibleCount;
  const remainingRows = filteredMovements.length - visibleCount;

  const selectedSector = sectorFilter === "all" ? null : sectors.find((s) => s.id === sectorFilter) ?? null;
  const selectedStock = selectedSector
    ? stockBySector.find((x) => x.sector.id === selectedSector.id)?.remaining ?? 0
    : 0;

  return (
    <div className="animate-dash-enter mx-auto max-w-6xl space-y-10 pb-20 pt-4">
      <header className="flex flex-col gap-4 border-b border-gray-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#15803d]">
              Operações
            </span>
            <Link href="/analises" className="text-xs font-medium text-gray-400 hover:text-gray-700">
              Análises
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Estoque</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
            Gestão global de movimentos com filtro por setor independente da tela de vendas.
          </p>
        </div>
        <button
          type="button"
          onClick={openDrawer}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#14532d] active:scale-[0.98]"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
          Adicionar estoque
        </button>
      </header>

      <section className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Setor</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSectorFilter("all")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              sectorFilter === "all"
                ? "bg-[#166534] text-white shadow-sm ring-1 ring-[#14532d]/25"
                : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            All sectors
          </button>
          {sectors.map((sector) => (
            <button
              key={sector.id}
              type="button"
              onClick={() => setSectorFilter(sector.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                sectorFilter === sector.id
                  ? "bg-[#166534] text-white shadow-sm ring-1 ring-[#14532d]/25"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </section>

      {sectorFilter === "all" ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stockBySector.map(({ sector, remaining }) => (
            <Card key={sector.id} className="border border-gray-100 p-6 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{sector.name}</p>
              <BigNumber className="mt-3 text-gray-900">
                <AnimatedNumber value={remaining} format={(n) => fmtInt(n)} />
              </BigNumber>
              <p className="mt-2 text-[11px] text-gray-500">{pluralizeUnit(sector.unit, remaining)} restantes</p>
            </Card>
          ))}
        </section>
      ) : (
        <section>
          <Card className="border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Estoque restante</p>
                <p className="mt-2 text-xs text-gray-500">{selectedSector?.name ?? "Setor"}</p>
              </div>
              <Activity className="h-5 w-5 text-emerald-600/80" strokeWidth={1.75} />
            </div>
            <BigNumber className="mt-4 text-gray-900">
              <AnimatedNumber value={selectedStock} format={(n) => fmtInt(n)} />
            </BigNumber>
            <p className="mt-2 text-[11px] text-gray-500">
              Remaining stock: {fmtInt(selectedStock)} {pluralizeUnit(selectedSector?.unit ?? "unidade", selectedStock)}
            </p>
          </Card>
        </section>
      )}

      <Card className="border border-gray-100 p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <History className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Movimento mensal</h2>
              <p className="mt-1 text-xs text-gray-500">Entradas e saídas por mês no filtro atual.</p>
            </div>
          </div>
        </div>
        <MonthlyMovementChart data={monthlyData} />
      </Card>

      <section className="space-y-4">
        <Card className="border border-gray-100 p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
            <Filter className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Filtros</span>
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end">
            <div className="flex flex-wrap gap-2">
              {(["all", "entry", "exit"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    typeFilter === value
                      ? "bg-[#166534] text-white shadow-sm ring-1 ring-[#14532d]/25"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {value === "all" ? "Todos" : value === "entry" ? "Entrada" : "Saída"}
                </button>
              ))}
            </div>
            <div className="min-w-[min(100%,200px)] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">Buscar</label>
              <CleanInput
                placeholder="Observação ou referência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <CleanInput type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[11rem] text-xs" />
              <CleanInput type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[11rem] text-xs" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden border border-gray-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Setor</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3 text-right">Quantidade</th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Observação</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      {movements.length > 0 ? "Nenhum movimento corresponde aos filtros." : "Sem movimentos registados."}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((m) => {
                    const entry = m.type === "entry";
                    const movementSector = sectorById.get(m.sectorId);
                    const movementUnit = movementSector?.unit ?? "unidade";
                    return (
                      <tr key={m.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-800">{fmtDate.format(new Date(m.date))}</td>
                        <td className="px-4 py-3 text-gray-700">{movementSector?.name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200/90"}`}>
                            {entry ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${entry ? "text-emerald-700 dark:text-emerald-300/90" : "text-rose-800 dark:text-rose-200/90"}`}>
                          {entry ? "+" : "−"}{new Intl.NumberFormat("pt-BR").format(m.quantity)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{pluralizeUnit(movementUnit, m.quantity)}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-gray-600">
                          {m.note ?? (m.relatedSaleId ? `Venda · ${m.relatedSaleId.slice(0, 8)}...` : "—")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <ChevronDown className="h-4 w-4 text-emerald-700" strokeWidth={2} />
                Carregar mais ({Math.min(PAGE, remainingRows)})
              </button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

