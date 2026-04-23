import { addDaysISO } from "@/lib/expense-analytics";
import type { Expense } from "@/types/expense";
import type { Sale } from "@/types/sale";

export type WeekPoint = {
  key: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
};

function startOfIsoWeekMon(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayN = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayN}`;
}

function parseIso(iso: string): number {
  return new Date(iso + "T12:00:00").getTime();
}

/**
 * Série semanal faturamento / despesas / lucro (seguindo segunda-feira da semana ISO aproximada)
 */
export function buildWeeklyPnlSeries(
  sales: Sale[],
  expenses: Expense[],
  options: {
    viewMode: "global" | "sector";
    sectorId: string | null;
    weeksBack: number;
  },
): WeekPoint[] {
  const { viewMode, sectorId, weeksBack } = options;
  const end = new Date();
  const endIso = addDaysISO(
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(
      end.getDate(),
    ).padStart(2, "0")}`,
    0,
  );
  const startIso = addDaysISO(endIso, -(weeksBack * 7 + 6));

  const salesF =
    viewMode === "global"
      ? sales
      : sales.filter((s) => s.sectorId === sectorId);
  const expensesF =
    viewMode === "global"
      ? expenses
      : expenses.filter((e) => e.sectorId === sectorId);

  const map = new Map<
    string,
    { r: number; e: number }
  >();
  for (const s of salesF) {
    if (s.date < startIso || s.date > endIso) continue;
    const wk = startOfIsoWeekMon(s.date);
    const cur = map.get(wk) ?? { r: 0, e: 0 };
    cur.r += s.totalPrice;
    map.set(wk, cur);
  }
  for (const e of expensesF) {
    if (e.date < startIso || e.date > endIso) continue;
    const wk = startOfIsoWeekMon(e.date);
    const cur = map.get(wk) ?? { r: 0, e: 0 };
    cur.e += e.amount;
    map.set(wk, cur);
  }

  const keySet = new Set(map.keys());
  for (const e of expensesF) {
    if (e.date >= startIso && e.date <= endIso)
      keySet.add(startOfIsoWeekMon(e.date));
  }
  for (const s of salesF) {
    if (s.date >= startIso && s.date <= endIso)
      keySet.add(startOfIsoWeekMon(s.date));
  }
  const keys = [...keySet].sort();
  const trimmed = keys.length > weeksBack ? keys.slice(-weeksBack) : keys;

  return trimmed.map((k) => {
    const d = map.get(k) ?? { r: 0, e: 0 };
    const prof = d.r - d.e;
    const label = `${k.slice(5).replace("-", "/")}`;
    return {
      key: k,
      label,
      revenue: d.r,
      expenses: d.e,
      profit: prof,
    };
  });
}

export function lastValues<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  return arr.slice(-n);
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Variação semana a semana (último bloco vs penúltimo) */
export function kpiDeltasFromSeries(points: WeekPoint[]) {
  if (points.length < 2) {
    return { rev: 0, exp: 0, prof: 0 };
  }
  const a = points[points.length - 1]!;
  const b = points[points.length - 2]!;
  return {
    rev: pctChange(a.revenue, b.revenue),
    exp: pctChange(a.expenses, b.expenses),
    prof: pctChange(a.profit, b.profit),
  };
}

export function toSpark(values: number[], maxLen = 14): number[] {
  const v = lastValues(values, maxLen);
  if (v.length === 0) return [0];
  return v;
}
