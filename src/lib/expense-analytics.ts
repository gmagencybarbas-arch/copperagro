import type { Expense, ExpenseCategory } from "@/types/expense";
import { EXPENSE_CATEGORY_LABEL } from "@/types/expense";
import type { Sale } from "@/types/sale";

export function inDateRange(
  date: string,
  from?: string,
  to?: string,
): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function filterExpenses(
  expenses: Expense[],
  opts: { sectorId?: "all" | "global" | string; from?: string; to?: string },
): Expense[] {
  return expenses.filter((e) => {
    if (opts.sectorId !== undefined && opts.sectorId !== "all") {
      if (opts.sectorId === "global") {
        if (e.sectorId) return false;
      } else {
        if ((e.sectorId ?? "global") !== opts.sectorId) return false;
      }
    }
    return inDateRange(e.date, opts.from, opts.to);
  });
}

export function totalAmount(list: Expense[]): number {
  return list.reduce((a, e) => a + e.amount, 0);
}

export type SectorBarRow = { sectorId: string; label: string; total: number };

export function bySectorBars(
  expenses: Expense[],
  sectorName: (id: string | undefined) => string,
): SectorBarRow[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = e.sectorId ?? "global";
    map.set(key, (map.get(key) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([sectorId, total]) => ({
      sectorId,
      label:
        sectorId === "global" ? sectorName(undefined) : sectorName(sectorId),
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export type CategoryRow = { category: ExpenseCategory; label: string; total: number; pct: number };

export function byCategory(
  expenses: Expense[],
): CategoryRow[] {
  const map = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    const c = e.category;
    map.set(c, (map.get(c) ?? 0) + e.amount);
  }
  const total = expenses.reduce((a, e) => a + e.amount, 0) || 1;
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      label: EXPENSE_CATEGORY_LABEL[category],
      total: v,
      pct: (v / total) * 100,
    }))
    .sort((a, b) => b.total - a.total);
}

export type DayPoint = { day: string; total: number };

export function addDaysISO(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return addDaysISO(new Date().toISOString().slice(0, 10), 0);
}

function eachDayInRange(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 500) {
    out.push(cur);
    cur = addDaysISO(cur, 1);
  }
  return out;
}

/** Agrega despesas por dia (YYYY-MM-DD) */
export function seriesByDay(
  expenses: Expense[],
  from: string,
  to: string,
): DayPoint[] {
  const dayMap = new Map<string, number>();
  for (const e of expenses) {
    if (!inDateRange(e.date, from, to)) continue;
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + e.amount);
  }
  return eachDayInRange(from, to).map((day) => ({
    day,
    total: dayMap.get(day) ?? 0,
  }));
}

export function lastNDaysWindow(n: number, end: string = todayISO()): {
  from: string;
  to: string;
} {
  return { from: addDaysISO(end, -(n - 1)), to: end };
}

export function totalUnitsSold(
  sales: Sale[],
  sectorId: string,
  from?: string,
  to?: string,
): number {
  return sales
    .filter((s) => s.sectorId === sectorId)
    .filter((s) => inDateRange(s.date, from, to))
    .reduce((a, s) => a + s.quantity, 0);
}

export function trendCompareLast30d(
  expenses: Expense[],
  sectorFilter: "all" | "global" | string = "all",
): {
  current: number;
  previous: number;
  pct: number;
  up: boolean;
} {
  const { from: aFrom, to: aTo } = lastNDaysWindow(30);
  const { from: bFrom, to: bTo } = {
    from: addDaysISO(aFrom, -30),
    to: addDaysISO(aTo, -30),
  };
  const cur = totalAmount(
    filterExpenses(expenses, { from: aFrom, to: aTo, sectorId: sectorFilter }),
  );
  const prev = totalAmount(
    filterExpenses(expenses, { from: bFrom, to: bTo, sectorId: sectorFilter }),
  );
  if (prev <= 0 && cur <= 0) {
    return { current: cur, previous: prev, pct: 0, up: true };
  }
  const base = prev > 0 ? prev : cur > 0 ? cur : 1;
  const delta = ((cur - prev) / base) * 100;
  return { current: cur, previous: prev, pct: delta, up: cur >= prev };
}

/** Projeção: média diária dos últimos 30d × 30 (≈ soma 30d com ritmo homogéneo) */
export function projectNext30FromLast30(totalLast30: number): number {
  if (totalLast30 <= 0) return 0;
  return (totalLast30 / 30) * 30;
}
