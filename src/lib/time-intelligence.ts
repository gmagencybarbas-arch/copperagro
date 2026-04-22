import type { Sale } from "@/types/sale";
import {
  addDays,
  filterSalesWeekMonthSlotAllYears,
  isoDateFromDate,
  isDayInWeekOfMonth,
  startOfDay,
} from "@/store/sales-metrics";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

function avgPrice(list: Sale[]): number {
  const rev = list.reduce((a, s) => a + s.totalPrice, 0);
  const q = list.reduce((a, s) => a + s.quantity, 0);
  return q > 0 ? rev / q : 0;
}

export type MonthRank = {
  monthIndex: number;
  monthName: string;
  avgPrice: number;
  vsGlobalAvgPct: number;
};

/** Calendário mensal (1–12) com maior preço médio ponderado */
export function bestMonthByAvgPrice(sales: Sale[]): MonthRank | null {
  if (sales.length === 0) return null;
  const global = avgPrice(sales);
  let best: { m: number; avg: number } | null = null;

  for (let m = 1; m <= 12; m++) {
    const slice = sales.filter((s) => new Date(s.date).getMonth() + 1 === m);
    if (slice.length === 0) continue;
    const a = avgPrice(slice);
    if (!best || a > best.avg) best = { m, avg: a };
  }

  if (!best) return null;
  const vs =
    global > 0 ? ((best.avg - global) / global) * 100 : 0;
  return {
    monthIndex: best.m,
    monthName: MONTH_NAMES[best.m - 1]!,
    avgPrice: best.avg,
    vsGlobalAvgPct: vs,
  };
}

export function worstMonthByAvgPrice(sales: Sale[]): MonthRank | null {
  if (sales.length === 0) return null;
  const global = avgPrice(sales);
  let worst: { m: number; avg: number } | null = null;

  for (let m = 1; m <= 12; m++) {
    const slice = sales.filter((s) => new Date(s.date).getMonth() + 1 === m);
    if (slice.length === 0) continue;
    const a = avgPrice(slice);
    if (!worst || a < worst.avg) worst = { m, avg: a };
  }

  if (!worst) return null;
  const vs =
    global > 0 ? ((worst.avg - global) / global) * 100 : 0;
  return {
    monthIndex: worst.m,
    monthName: MONTH_NAMES[worst.m - 1]!,
    avgPrice: worst.avg,
    vsGlobalAvgPct: vs,
  };
}

/** Semana do mês (1–4) com maior preço médio global */
export function bestWeekOfMonthByAvgPrice(
  sales: Sale[],
): { week: 1 | 2 | 3 | 4; avgPrice: number } | null {
  if (sales.length === 0) return null;
  let best: { week: 1 | 2 | 3 | 4; avg: number } | null = null;

  for (const w of [1, 2, 3, 4] as const) {
    const slice = sales.filter((s) => {
      const [y, m, d] = s.date.split("-").map(Number);
      if (!y || !m || !d) return false;
      const last = new Date(y, m, 0).getDate();
      return isDayInWeekOfMonth(d, w, last);
    });
    if (slice.length === 0) continue;
    const a = avgPrice(slice);
    if (!best || a > best.avg) best = { week: w, avg: a };
  }

  return best ? { week: best.week, avgPrice: best.avg } : null;
}

/** Dia do mês (1–31) com maior preço médio (todas as ocorrências agregadas) */
export function bestDayOfMonthByAvgPrice(
  sales: Sale[],
): { day: number; avgPrice: number } | null {
  if (sales.length === 0) return null;
  let best: { day: number; avg: number } | null = null;

  for (let day = 1; day <= 31; day++) {
    const slice = sales.filter((s) => {
      const d = new Date(s.date).getDate();
      return d === day;
    });
    if (slice.length === 0) continue;
    const a = avgPrice(slice);
    if (!best || a > best.avg) best = { day, avg: a };
  }

  return best ? { day: best.day, avgPrice: best.avg } : null;
}

/** Preço médio histórico global */
export function historicalAveragePrice(sales: Sale[]): number {
  return avgPrice(sales);
}

/** Último preço registrado (mais recente por data) */
export function latestSalePrice(sales: Sale[]): number | null {
  if (sales.length === 0) return null;
  const sorted = [...sales].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return sorted[0]?.unitPrice ?? null;
}

export function formatVsHistPct(
  current: number | null,
  hist: number,
): { text: string; below: boolean } | null {
  if (current === null || hist <= 0) return null;
  const pct = ((current - hist) / hist) * 100;
  const below = pct < 0;
  return {
    text: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
    below,
  };
}

function parseIsoLocal(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return startOfDay(new Date(y, m - 1, d));
}

/**
 * Compara preço médio ponderado dos últimos `windowDays` dias (até a venda mais recente)
 * com o bloco imediatamente anterior de igual tamanho.
 */
export function priceMomentumVsPriorWindow(
  sales: Sale[],
  windowDays = 90,
): { pct: number; up: boolean; label: string } | null {
  if (sales.length === 0) return null;
  let maxIso = sales[0]!.date;
  for (const s of sales) {
    if (s.date > maxIso) maxIso = s.date;
  }
  const anchor = parseIsoLocal(maxIso);
  if (!anchor) return null;

  const recentStartIso = isoDateFromDate(
    addDays(anchor, -(windowDays - 1)),
  );
  const recent = sales.filter(
    (s) => s.date >= recentStartIso && s.date <= maxIso,
  );

  const priorEndIso = isoDateFromDate(addDays(anchor, -windowDays));
  const priorStartIso = isoDateFromDate(
    addDays(anchor, -(2 * windowDays - 1)),
  );
  const prior = sales.filter(
    (s) => s.date >= priorStartIso && s.date <= priorEndIso,
  );

  const avgRecent = avgPrice(recent);
  const avgPrior = avgPrice(prior);
  if (prior.length === 0 || recent.length === 0 || avgPrior <= 0) {
    return null;
  }

  const pct = ((avgRecent - avgPrior) / avgPrior) * 100;
  const up = pct >= 0;
  const rounded = Math.abs(pct).toFixed(1);
  return {
    pct,
    up,
    label: up
      ? `Nos últimos ${windowDays} dias o preço médio subiu cerca de ${rounded}% em relação aos ${windowDays} dias anteriores.`
      : `Nos últimos ${windowDays} dias o preço médio recuou cerca de ${rounded}% em relação aos ${windowDays} dias anteriores.`,
  };
}
