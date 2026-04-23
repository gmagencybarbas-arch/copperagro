"use client";

import { Card, CleanInput, PrimaryButton, Title } from "@/design-system";
import {
  formatPctDelta,
  pctDiffTotalVsMinTotal,
  pctDiffVsPreviousByUnitPriceAsc,
} from "@/lib/sale-price-benchmarks";
import { formatBRLFine, formatDateBR } from "@/lib/format";
import { addDays, isoDateFromDate } from "@/store/sales-metrics";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import {
  useSalesStore,
  useStockSnapshot,
} from "@/store/sales-store";
import type { Sale } from "@/types/sale";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "date" | "quantity" | "unitPrice" | "totalPrice" | "buyer";
type Dir = "asc" | "desc";

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "date", label: "Data" },
  { key: "quantity", label: "Quantidade", align: "right" },
  { key: "unitPrice", label: "Valor unitário", align: "right" },
  { key: "totalPrice", label: "Total", align: "right" },
  { key: "buyer", label: "Comprador" },
];

function pctClass(n: number | null) {
  if (n === null || Number.isNaN(n))
    return "text-gray-400 dark:text-slate-500";
  if (n >= 0) return "text-emerald-700 dark:text-emerald-400";
  return "text-rose-800 dark:text-rose-300/90";
}

export function SalesTable({ embed = false }: { embed?: boolean } = {}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 text-sm text-gray-500">
          Carregando vendas…
        </div>
      }
    >
      <SalesTableInner embed={embed} />
    </Suspense>
  );
}

function SalesTableInner({ embed = false }: { embed?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allSales = useSalesStore((s) => s.sales);
  const updateSale = useSalesStore((s) => s.updateSale);
  const deleteSale = useSalesStore((s) => s.deleteSale);
  const sectors = useSectorStore((s) => s.sectors);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [dir, setDir] = useState<Dir>("desc");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [detailId, setDetailId] = useState<string | null>(null);

  const selectedSector = useMemo(
    () => sectors.find((s) => s.id === selectedSectorId) ?? null,
    [sectors, selectedSectorId],
  );
  const unit = selectedSector?.unit ?? "unidade";
  const sales = useMemo(() => {
    if (!selectedSectorId) return allSales;
    return allSales.filter((s) => s.sectorId === selectedSectorId);
  }, [allSales, selectedSectorId]);

  const filtered = useMemo(() => {
    let list = sales;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.buyer.toLowerCase().includes(q));
    }
    if (dateFrom) {
      list = list.filter((s) => s.date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((s) => s.date <= dateTo);
    }
    return list;
  }, [sales, search, dateFrom, dateTo]);

  const sorted = useMemo(
    () => sortRows(filtered, sortKey, dir),
    [filtered, sortKey, dir],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages, sorted.length]);

  const pageSafe = Math.min(page, totalPages);
  const sliceStart = (pageSafe - 1) * pageSize;
  const pageRows = sorted.slice(sliceStart, sliceStart + pageSize);

  const saleBenchmarks = useMemo(() => {
    const vsPrevUnit = pctDiffVsPreviousByUnitPriceAsc(filtered);
    const vsMinTotal = pctDiffTotalVsMinTotal(filtered);
    return { vsPrevUnit, vsMinTotal };
  }, [filtered]);

  const saleFromUrl = searchParams.get("sale");
  useEffect(() => {
    if (!saleFromUrl) return;
    const exists = sales.some((s) => s.id === saleFromUrl);
    if (exists) setDetailId(saleFromUrl);
  }, [saleFromUrl, sales]);

  const openDetail = useCallback(
    (id: string) => {
      setDetailId(id);
      router.replace(`${pathname}?sale=${encodeURIComponent(id)}`, {
        scroll: false,
      });
    },
    [router, pathname],
  );

  const closeDetail = useCallback(() => {
    setDetailId(null);
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir(key === "date" || key === "totalPrice" ? "desc" : "asc");
    }
  }

  function applyPreset(
    from: string,
    to: string,
  ) {
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  const emptyAfterSearch = sales.length > 0 && filtered.length === 0;

  const detailSale = useMemo(
    () => (detailId ? sales.find((s) => s.id === detailId) ?? null : null),
    [detailId, sales],
  );

  return (
    <div className="space-y-5">
      {!embed && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">
              Histórico
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Filtros por data e comprador · ordenação · ir para página · linha
              para detalhar.
            </p>
          </div>
        </div>
      )}

      <Card className="border border-gray-100 p-5 shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end xl:gap-6">
          <div className="min-w-[min(100%,240px)] flex-1">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Buscar comprador
            </label>
            <CleanInput
              placeholder="Nome ou parte do comprador…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="transition-all duration-200 focus:ring-green-600"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                De
              </label>
              <CleanInput
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-[11rem] text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Até
              </label>
              <CleanInput
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-[11rem] text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PresetChip
              label="30 dias"
              onClick={() => {
                const now = new Date();
                applyPreset(
                  isoDateFromDate(addDays(now, -29)),
                  isoDateFromDate(now),
                );
              }}
            />
            <PresetChip
              label="Este mês"
              onClick={() => {
                const now = new Date();
                const start = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1,
                );
                applyPreset(isoDateFromDate(start), isoDateFromDate(now));
              }}
            />
            <PresetChip
              label="Mês anterior"
              onClick={() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = now.getMonth();
                const start = new Date(y, m - 1, 1);
                const end = new Date(y, m, 0);
                applyPreset(isoDateFromDate(start), isoDateFromDate(end));
              }}
            />
            <PresetChip
              label="Ano passado"
              onClick={() => {
                const y = new Date().getFullYear() - 1;
                applyPreset(`${y}-01-01`, `${y}-12-31`);
              }}
            />
            <button
              type="button"
              onClick={clearDates}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Limpar datas
            </button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-gray-100 p-0 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800">
        <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
          <Title className="text-gray-700 dark:text-slate-200">
            Vendas registradas
          </Title>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {filtered.length === sales.length
              ? `${sales.length} ${sales.length === 1 ? "linha" : "linhas"}`
              : `${filtered.length} de ${sales.length} linhas`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:border-slate-800 dark:text-slate-400">
                {columns.slice(0, 4).map((c) => (
                  <th
                    key={c.key}
                    className={`cursor-pointer select-none whitespace-nowrap px-6 py-3 font-semibold transition-colors duration-200 hover:bg-gray-50/90 dark:hover:bg-slate-800/80 ${
                      c.align === "right" ? "text-right" : ""
                    }`}
                    onClick={() => toggleSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      <SortGlyph
                        active={sortKey === c.key}
                        dir={sortKey === c.key ? dir : "asc"}
                      />
                    </span>
                  </th>
                ))}
                <th
                  className="max-w-[9rem] whitespace-normal px-4 py-3 text-right font-semibold leading-tight"
                  title={`No período filtrado, ordena por R$/${unit} (menor→maior): % do preço unitário face ao lançamento imediatamente anterior nessa ordem`}
                >
                  vs antecessor (↑ unit.)
                </th>
                <th
                  className="max-w-[9rem] whitespace-normal px-4 py-3 text-right font-semibold leading-tight"
                  title="% de diferença do valor total da linha face ao menor total entre todas as vendas do período filtrado"
                >
                  vs menor total
                </th>
                <th
                  className="cursor-pointer select-none whitespace-nowrap px-6 py-3 font-semibold transition-colors duration-200 hover:bg-gray-50/90 dark:hover:bg-slate-800/80"
                  onClick={() => toggleSort("buyer")}
                >
                  <span className="inline-flex items-center gap-1">
                    Comprador
                    <SortGlyph
                      active={sortKey === "buyer"}
                      dir={sortKey === "buyer" ? dir : "asc"}
                    />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetail(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openDetail(row.id);
                    }
                  }}
                  className={`cursor-pointer border-b border-gray-50 transition-all duration-200 hover:bg-green-50/50 hover:shadow-[inset_4px_0_0_0_#16a34a] focus-visible:bg-green-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 dark:border-slate-800/80 dark:hover:bg-emerald-950/25 dark:focus-visible:bg-emerald-950/30 ${
                    i % 2 === 0
                      ? "bg-white dark:bg-slate-900/40"
                      : "bg-gray-50/30 dark:bg-slate-900/70"
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-3.5 text-[15px] font-medium text-gray-800 dark:text-slate-200 sm:text-base">
                    {formatDateBR(row.date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right text-[15px] font-semibold tabular-nums text-gray-900 dark:text-slate-100 sm:text-base">
                    {new Intl.NumberFormat("pt-BR").format(row.quantity)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right text-[15px] font-semibold tabular-nums text-gray-800 dark:text-slate-200 sm:text-base">
                    {formatBRLFine(row.unitPrice)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right text-[15px] font-semibold tabular-nums text-gray-900 dark:text-slate-100 sm:text-base">
                    {formatBRLFine(row.totalPrice)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-[15px] font-bold tabular-nums sm:text-base ${pctClass(
                      saleBenchmarks.vsPrevUnit.get(row.id) ?? null,
                    )}`}
                  >
                    {formatPctDelta(
                      saleBenchmarks.vsPrevUnit.get(row.id) ?? null,
                    )}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3.5 text-right text-[15px] font-bold tabular-nums sm:text-base ${pctClass(
                      saleBenchmarks.vsMinTotal.get(row.id) ?? null,
                    )}`}
                  >
                    {formatPctDelta(
                      saleBenchmarks.vsMinTotal.get(row.id) ?? null,
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-6 py-3.5 text-[15px] text-gray-800 dark:text-slate-200 sm:text-base">
                    {row.buyer}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
                <PackageSearch className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-gray-900">
                Nenhuma venda encontrada
              </p>
              <p className="mt-2 max-w-md text-sm text-gray-600">
                {emptyAfterSearch
                  ? "Ajuste busca ou datas."
                  : "Comece registrando sua primeira operação pelo botão Nova Venda."}
              </p>
              {!emptyAfterSearch && (
                <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-[#16a34a]/40 bg-green-50/60 px-4 py-2 text-xs font-medium text-green-900">
                  <Plus className="h-4 w-4 text-[#16a34a]" strokeWidth={2} />
                  Nova Venda — canto superior direito
                </p>
              )}
            </div>
          )}

          {sorted.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  Página{" "}
                  <span className="font-semibold text-gray-700">{pageSafe}</span>{" "}
                  de{" "}
                  <span className="font-semibold text-gray-700">
                    {totalPages}
                  </span>
                </span>
                <span className="hidden sm:inline">·</span>
                <label className="inline-flex items-center gap-2">
                  Linhas:
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(
                        Number(e.target.value) as (typeof PAGE_SIZES)[number],
                      );
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="inline-flex items-center gap-2">
                  Ir para
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageSafe}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isFinite(v)) return;
                      setPage(Math.min(totalPages, Math.max(1, Math.floor(v))));
                    }}
                    className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-center text-xs font-semibold tabular-nums text-gray-900"
                  />
                </label>
                <span className="hidden sm:inline">
                  Unidade:{" "}
                  <span className="font-semibold text-gray-700">
                    {pluralizeUnit(unit, 2)}
                  </span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {detailSale && (
        <SaleDetailModal
          sale={detailSale}
          unit={unit}
          filteredSales={filtered}
          onClose={closeDetail}
          onUpdate={(id, patch) => updateSale(id, patch)}
          onDelete={(id) => {
            deleteSale(id);
            closeDetail();
          }}
        />
      )}
    </div>
  );
}

function PresetChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-100/90"
    >
      <CalendarRange className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </button>
  );
}

function SaleDetailModal({
  sale,
  unit,
  filteredSales,
  onClose,
  onUpdate,
  onDelete,
}: {
  sale: Sale;
  unit: string;
  /** Mesmo conjunto do histórico (filtros data + comprador) para os comparativos % */
  filteredSales: Sale[];
  onClose: () => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Sale, "date" | "quantity" | "unitPrice" | "buyer">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const stock = useStockSnapshot();

  const [date, setDate] = useState(sale.date);
  const [quantity, setQuantity] = useState(sale.quantity);
  const [unitPrice, setUnitPrice] = useState(sale.unitPrice);
  const [buyer, setBuyer] = useState(sale.buyer);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDate(sale.date);
    setQuantity(sale.quantity);
    setUnitPrice(sale.unitPrice);
    setBuyer(sale.buyer);
    setError(null);
  }, [sale]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    setError(null);
    const q = Math.floor(Number(quantity));
    const p = Number(unitPrice);
    if (q <= 0 || p <= 0 || !buyer.trim()) {
      setError("Preencha quantidade, preço e comprador.");
      return;
    }
    const maxForThisSale = stock.remaining + sale.quantity;
    if (q > maxForThisSale) {
      setError(
        "Quantidade acima do estoque disponível para esta operação.",
      );
      return;
    }
    onUpdate(sale.id, {
      date,
      quantity: q,
      unitPrice: p,
      buyer: buyer.trim(),
    });
    onClose();
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Excluir esta venda permanentemente?")
    ) {
      return;
    }
    onDelete(sale.id);
  }

  const total = Math.round(quantity * unitPrice * 100) / 100;

  const previewSale: Sale = useMemo(
    () => ({
      ...sale,
      date,
      quantity: Math.floor(Number(quantity)),
      unitPrice: Number(unitPrice),
      totalPrice: Math.round(Number(quantity) * Number(unitPrice) * 100) / 100,
      buyer: buyer.trim(),
    }),
    [sale, date, quantity, unitPrice, buyer],
  );

  const hypotheticalFiltered = useMemo(() => {
    const list = filteredSales.some((s) => s.id === sale.id)
      ? filteredSales
      : [...filteredSales, sale];
    return list.map((s) => (s.id === sale.id ? previewSale : s));
  }, [filteredSales, sale, previewSale]);

  const benchPreview = useMemo(() => {
    const vsPrevUnit =
      pctDiffVsPreviousByUnitPriceAsc(hypotheticalFiltered);
    const vsMinTotal = pctDiffTotalVsMinTotal(hypotheticalFiltered);
    return {
      vsPrevUnit: vsPrevUnit.get(sale.id) ?? null,
      vsMinTotal: vsMinTotal.get(sale.id) ?? null,
    };
  }, [hypotheticalFiltered, sale.id]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-detail-title"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-gray-100 bg-white p-6 shadow-2xl ring-1 ring-black/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Venda
            </p>
            <h2
              id="sale-detail-title"
              className="mt-1 text-xl font-semibold text-gray-900"
            >
              Detalhes e edição
            </h2>
            <p className="mt-1 break-all font-mono text-[11px] text-gray-400">
              ID: {sale.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Data
            </label>
            <CleanInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {pluralizeUnit(unit, 2)}
              </label>
              <CleanInput
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                R$/{unit}
              </label>
              <CleanInput
                type="number"
                min={0.01}
                step={0.01}
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Comprador
            </label>
            <CleanInput
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <p className="text-xs font-medium text-emerald-900">Total estimado</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-950">
              {formatBRLFine(total)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Comparativos no período filtrado
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                  vs antecessor (↑ R$/{unit})
                </p>
                <p
                  className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${pctClass(
                    benchPreview.vsPrevUnit,
                  )}`}
                >
                  {formatPctDelta(benchPreview.vsPrevUnit)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-slate-400">
                  vs menor total no filtro
                </p>
                <p
                  className={`mt-1 text-xl font-bold tabular-nums sm:text-2xl ${pctClass(
                    benchPreview.vsMinTotal,
                  )}`}
                >
                  {formatPctDelta(benchPreview.vsMinTotal)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-gray-500 dark:text-slate-500">
              Antecessor = lançamento anterior ao ordenar por menor preço
              unitário no mesmo recorte; menor total = menor valor total entre as
              linhas desse filtro.
            </p>
          </div>
          {error && (
            <p className="text-sm font-medium text-rose-800 dark:text-rose-300/90">{error}</p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:flex-wrap sm:justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 shadow-sm transition-colors hover:bg-rose-50 dark:border-rose-800/50 dark:bg-slate-800 dark:text-rose-100 dark:hover:bg-slate-700"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Excluir
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <PrimaryButton type="button" onClick={handleSave}>
              Salvar alterações
            </PrimaryButton>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Dica:{" "}
          <Link href="/dashboard" className="font-medium text-[#16a34a] hover:underline">
            Painel
          </Link>{" "}
          também abre esta venda pelo link com parâmetro na URL.
        </p>
      </div>
    </div>
  );
}

function SortGlyph({ active, dir }: { active: boolean; dir: Dir }) {
  return (
    <span
      className={`inline-flex flex-col leading-[0.5] text-[9px] transition-colors duration-200 ${
        active ? "text-[#16a34a]" : "text-gray-300"
      }`}
      aria-hidden
    >
      <span className={active && dir === "asc" ? "opacity-100" : "opacity-40"}>
        ▲
      </span>
      <span className={active && dir === "desc" ? "opacity-100" : "opacity-40"}>
        ▼
      </span>
    </span>
  );
}

function sortRows(rows: Sale[], key: SortKey, dir: Dir): Sale[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (key === "date") {
      return (
        mul *
        (new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    }
    if (typeof va === "string" && typeof vb === "string") {
      return mul * va.localeCompare(vb, "pt-BR");
    }
    return mul * ((va as number) - (vb as number));
  });
}
