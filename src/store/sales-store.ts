"use client";

import {
  addDays,
  computeSalesMetrics,
  computeTrendComparison,
  createDefaultSalesFilter,
  isoDateFromDate,
} from "@/store/sales-metrics";
import { DEFAULT_SECTOR_ID, useSectorStore } from "@/store/sector-store";
import type {
  ComparisonSeriesMode,
  Sale,
  SalesFilterState,
  StockMovement,
  StockState,
} from "@/types/sale";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Instância única em memória — substitui `localStorage` no SSR. */
const ssrMemoryStorage: Storage = (() => {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear() {
      m.clear();
    },
    getItem(key: string) {
      return m.get(key) ?? null;
    },
    key(index: number) {
      return [...m.keys()][index] ?? null;
    },
    removeItem(key: string) {
      m.delete(key);
    },
    setItem(key: string, value: string) {
      m.set(key, value);
    },
  } as Storage;
})();

function uid(): string {
  return (
    crypto.randomUUID?.() ??
    `stk_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

/** Contrato base em sacas; 0 até configurares entradas ou valor de contrato */
const DEFAULT_STOCK_TOTAL = 0;

function defaultComparisonCustomRange(): {
  comparisonCustomStart: string;
  comparisonCustomEnd: string;
} {
  const now = new Date();
  return {
    comparisonCustomStart: isoDateFromDate(addDays(now, -29)),
    comparisonCustomEnd: isoDateFromDate(now),
  };
}

/**
 * Contrato base (`stockTotalSacas`) + entradas − saídas.
 * `total` = base + todas as entradas registradas (volume que entrou no sistema).
 */
export function computeStockState(
  stockTotalSacas: number,
  movements: StockMovement[],
): StockState {
  let entriesSum = 0;
  let exitsSum = 0;
  for (const m of movements) {
    if (m.type === "entry") entriesSum += m.quantity;
    else exitsSum += m.quantity;
  }
  const remaining = Math.max(0, stockTotalSacas + entriesSum - exitsSum);
  const sold = exitsSum;
  const total = stockTotalSacas + entriesSum;
  return {
    total,
    sold,
    remaining,
    movements,
  };
}

/** Garante uma saída por venda e remove saídas órfãs */
function reconcileMovements(
  sales: Sale[],
  movements: StockMovement[],
): StockMovement[] {
  const saleIds = new Set(sales.map((s) => s.id));
  let next = movements.filter((m) => {
    if (m.relatedSaleId) return saleIds.has(m.relatedSaleId);
    return true;
  });

  const exitBySale = new Map<string, StockMovement>();
  for (const m of next) {
    if (m.type === "exit" && m.relatedSaleId) {
      exitBySale.set(m.relatedSaleId, m);
    }
  }

  for (const sale of sales) {
    const cur = exitBySale.get(sale.id);
    if (!cur) {
      next.push({
        id: uid(),
        date: sale.date,
        type: "exit",
        quantity: sale.quantity,
        sectorId: sale.sectorId,
        relatedSaleId: sale.id,
      });
      continue;
    }
    if (
      cur.quantity !== sale.quantity ||
      cur.date !== sale.date ||
      cur.sectorId !== sale.sectorId
    ) {
      next = next.map((m) =>
        m.id === cur.id
          ? {
              ...m,
              quantity: sale.quantity,
              date: sale.date,
              sectorId: sale.sectorId,
            }
          : m,
      );
    }
  }
  return next;
}

type SalesState = {
  sales: Sale[];
  stockTotalSacas: number;
  stockMovements: StockMovement[];
  filter: SalesFilterState;
  isComparing: boolean;
  toggleComparison: () => void;
  comparisonMode: ComparisonSeriesMode;
  setComparisonMode: (mode: ComparisonSeriesMode) => void;
  comparisonCustomStart: string;
  comparisonCustomEnd: string;
  setComparisonCustomRange: (start: string, end: string) => void;
  comparisonModalOpen: boolean;
  openComparisonModal: () => void;
  closeComparisonModal: () => void;
  setSalesFilter: (patch: Partial<SalesFilterState>) => void;
  replaceSalesFilter: (filter: SalesFilterState) => void;
  setStockTotalSacas: (n: number) => void;
  /** Alinha movimentos com vendas (executar após hidratar). */
  ensureLedgerSynced: () => void;
  addStockEntry: (input: {
    date: string;
    type: "entry" | "exit";
    quantity: number;
    sectorId: string;
    note?: string;
  }) => void;
  addSale: (
    input: Pick<Sale, "date" | "quantity" | "unitPrice" | "buyer" | "sectorId">,
  ) => void;
  updateSale: (
    id: string,
    patch: Partial<Pick<Sale, "date" | "quantity" | "unitPrice" | "buyer">>,
  ) => void;
  deleteSale: (id: string) => void;
};

export const useSalesStore = create<SalesState>()(
  persist(
    (set) => ({
      sales: [],
      stockTotalSacas: DEFAULT_STOCK_TOTAL,
      stockMovements: [],
      filter: createDefaultSalesFilter(),
      isComparing: false,
      comparisonMode: "previous_period",
      ...defaultComparisonCustomRange(),
      comparisonModalOpen: false,

      toggleComparison: () =>
        set((s) => ({ isComparing: !s.isComparing })),

      setComparisonMode: (mode) => set({ comparisonMode: mode }),

      setComparisonCustomRange: (start, end) =>
        set({ comparisonCustomStart: start, comparisonCustomEnd: end }),

      openComparisonModal: () => set({ comparisonModalOpen: true }),
      closeComparisonModal: () => set({ comparisonModalOpen: false }),

      setSalesFilter: (patch) =>
        set((s) => ({ filter: { ...s.filter, ...patch } })),

      replaceSalesFilter: (filter) => set({ filter }),

      ensureLedgerSynced: () =>
        set((s) => ({
          stockMovements: reconcileMovements(s.sales, s.stockMovements),
        })),

      setStockTotalSacas: (n) => {
        const next = Math.floor(Number(n));
        if (!Number.isFinite(next) || next < 0) return;
        set((s) => {
          const movements = reconcileMovements(s.sales, s.stockMovements);
          const { remaining } = computeStockState(next, movements);
          if (remaining < 0) return s;
          return { stockTotalSacas: next, stockMovements: movements };
        });
      },

      addStockEntry: (input) => {
        const qty = Math.floor(Number(input.quantity));
        if (qty <= 0) return;
        set((s) => {
          const movements = reconcileMovements(s.sales, s.stockMovements);
          const mov: StockMovement = {
            id: uid(),
            date: input.date,
            type: input.type,
            quantity: qty,
            sectorId: input.sectorId,
            note: input.note?.trim() || undefined,
          };
          return { stockMovements: [mov, ...movements] };
        });
      },

      addSale: (input) => {
        const qty = Math.floor(Number(input.quantity));
        const price = Number(input.unitPrice);
        if (qty <= 0 || price <= 0) return;

        set((s) => {
          const movements = reconcileMovements(s.sales, s.stockMovements);
          const { remaining } = computeStockState(s.stockTotalSacas, movements);
          if (qty > remaining) return s;

          const saleId = uid();
          const totalPrice = qty * price;
          const sale: Sale = {
            id: saleId,
            sectorId: input.sectorId,
            date: input.date,
            quantity: qty,
            unitPrice: price,
            totalPrice,
            buyer: input.buyer.trim(),
          };
          const mov: StockMovement = {
            id: uid(),
            date: input.date,
            type: "exit",
            quantity: qty,
            sectorId: input.sectorId,
            relatedSaleId: saleId,
          };
          return {
            sales: [sale, ...s.sales],
            stockMovements: [mov, ...movements],
          };
        });
      },

      updateSale: (id, patch) => {
        set((s) => {
          const movements = reconcileMovements(s.sales, s.stockMovements);
          const idx = s.sales.findIndex((x) => x.id === id);
          if (idx < 0) return s;
          const cur = s.sales[idx]!;
          const nextQty =
            patch.quantity !== undefined
              ? Math.floor(Number(patch.quantity))
              : cur.quantity;
          const nextPrice =
            patch.unitPrice !== undefined
              ? Number(patch.unitPrice)
              : cur.unitPrice;
          const nextDate = patch.date ?? cur.date;
          const nextBuyer =
            patch.buyer !== undefined ? patch.buyer.trim() : cur.buyer;
          if (nextQty <= 0 || nextPrice <= 0 || !nextBuyer) return s;

          const movementsSansThisExit = movements.filter(
            (m) => !(m.type === "exit" && m.relatedSaleId === id),
          );
          const { remaining: poolWithoutSale } = computeStockState(
            s.stockTotalSacas,
            movementsSansThisExit,
          );
          if (nextQty > poolWithoutSale) return s;

          const updated: Sale = {
            ...cur,
            date: nextDate,
            quantity: nextQty,
            unitPrice: nextPrice,
            totalPrice: nextQty * nextPrice,
            buyer: nextBuyer,
          };
          const sales = [...s.sales];
          sales[idx] = updated;

          const stockMovements = movements.map((m) =>
            m.relatedSaleId === id
              ? { ...m, quantity: nextQty, date: nextDate }
              : m,
          );

          return { sales, stockMovements };
        });
      },

      deleteSale: (id) =>
        set((s) => {
          const movements = reconcileMovements(s.sales, s.stockMovements);
          return {
            sales: s.sales.filter((x) => x.id !== id),
            stockMovements: movements.filter((m) => m.relatedSaleId !== id),
          };
        }),
    }),
    {
      name: "coffee-sales",
      version: 4,
      migrate: (persisted: unknown, fromVersion?: number) => {
        const p = persisted as Partial<SalesState> & {
          stockMovements?: StockMovement[];
        };
        if (typeof fromVersion === "number" && fromVersion < 3) {
          return {
            ...p,
            sales: [],
            stockTotalSacas: 0,
            stockMovements: [],
          };
        }
        const sales = (p.sales ?? []).map((s) => ({
          ...s,
          sectorId: s.sectorId ?? DEFAULT_SECTOR_ID,
        }));
        const movements = (p.stockMovements ?? []).map((m) => ({
          ...m,
          sectorId: m.sectorId ?? DEFAULT_SECTOR_ID,
        }));
        return {
          ...p,
          sales,
          stockMovements: reconcileMovements(sales, movements),
        };
      },
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ssrMemoryStorage,
      ),
      partialize: (state) => ({
        sales: state.sales,
        stockTotalSacas: state.stockTotalSacas,
        stockMovements: state.stockMovements,
      }),
    },
  ),
);

export function useSalesMetrics() {
  const sales = useSalesStore((s) => s.sales);
  const filter = useSalesStore((s) => s.filter);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const scopedSales = useMemo(() => {
    if (!selectedSectorId) return sales;
    return sales.filter((s) => s.sectorId === selectedSectorId);
  }, [sales, selectedSectorId]);
  return useMemo(
    () => computeSalesMetrics(scopedSales, filter),
    [scopedSales, filter],
  );
}

export function useTrendComparison() {
  const sales = useSalesStore((s) => s.sales);
  const filter = useSalesStore((s) => s.filter);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const scopedSales = useMemo(() => {
    if (!selectedSectorId) return sales;
    return sales.filter((s) => s.sectorId === selectedSectorId);
  }, [sales, selectedSectorId]);
  return useMemo(
    () => computeTrendComparison(scopedSales, filter),
    [scopedSales, filter],
  );
}

export function useStockSnapshot(): StockState {
  const stockTotalSacas = useSalesStore((s) => s.stockTotalSacas);
  const stockMovements = useSalesStore((s) => s.stockMovements);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const scopedMovements = useMemo(() => {
    if (!selectedSectorId) return stockMovements;
    return stockMovements.filter((m) => m.sectorId === selectedSectorId);
  }, [stockMovements, selectedSectorId]);
  return useMemo(
    () =>
      computeStockState(
        selectedSectorId ? 0 : stockTotalSacas,
        scopedMovements,
      ),
    [selectedSectorId, scopedMovements, stockTotalSacas],
  );
}
