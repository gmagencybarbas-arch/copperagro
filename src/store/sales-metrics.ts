import type { Sale, SalesFilterState } from "@/types/sale";

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isoDateFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Meses inclusivos entre duas datas ISO */
function inclusiveDaysBetween(start: Date, end: Date): number {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  return Math.round((b - a) / 86400000) + 1;
}

/** Range do calendário para semana N no mês monthRef (YYYY-MM) */
export function weekRangeInMonth(
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): { start: Date; end: Date } | null {
  const [ys, ms] = monthRef.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!y || !m || m < 1 || m > 12) return null;

  const first = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0).getDate();

  let startDay: number;
  let endDay: number;
  switch (week) {
    case 1:
      startDay = 1;
      endDay = 7;
      break;
    case 2:
      startDay = 8;
      endDay = 14;
      break;
    case 3:
      startDay = 15;
      endDay = 21;
      break;
    case 4:
      startDay = 22;
      endDay = lastDay;
      break;
    default:
      return null;
  }

  endDay = Math.min(endDay, lastDay);

  return {
    start: startOfDay(new Date(y, m - 1, startDay)),
    end: endOfDay(new Date(y, m - 1, endDay)),
  };
}

/** Semanas do mês: 1–7, 8–14, 15–21, 22–fim */
export function isDayInWeekOfMonth(
  day: number,
  week: 1 | 2 | 3 | 4,
  lastDayOfMonth: number,
): boolean {
  if (week === 1) return day >= 1 && day <= 7;
  if (week === 2) return day >= 8 && day <= 14;
  if (week === 3) return day >= 15 && day <= 21;
  return day >= 22 && day <= lastDayOfMonth;
}

/**
 * Todas as vendas na semana S do mês M (M vem de monthRef), **em qualquer ano**.
 */
export function filterSalesWeekMonthSlotAllYears(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): Sale[] {
  const ms = Number(monthRef.split("-")[1]);
  if (!ms || ms < 1 || ms > 12) return [];
  return sales.filter((s) => {
    const [y, m, day] = s.date.split("-").map(Number);
    if (!y || !m || !day || m !== ms) return false;
    const last = new Date(y, m, 0).getDate();
    return isDayInWeekOfMonth(day, week, last);
  });
}

export function prevMonthRef(monthRef: string): string {
  const [ys, ms] = monthRef.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Intervalo ativo do filtro (datas inclusivas).
 */
export function getActiveRange(
  filter: SalesFilterState,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  const today = startOfDay(refDate);

  /** Modo semana: faixa contínua não se aplica — filtro é por slot de calendário em todos os anos */
  if (filter.dimension === "week") {
    return null;
  }

  switch (filter.periodPreset) {
    case "7d":
      return {
        start: addDays(today, -6),
        end: endOfDay(today),
      };
    case "30d":
      return {
        start: addDays(today, -29),
        end: endOfDay(today),
      };
    case "90d":
      return {
        start: addDays(today, -89),
        end: endOfDay(today),
      };
    case "year": {
      const y = today.getFullYear();
      const jan1 = startOfDay(new Date(y, 0, 1));
      return { start: jan1, end: endOfDay(today) };
    }
    case "custom": {
      const [sy, sm, sd] = filter.customStart.split("-").map(Number);
      const [ey, em, ed] = filter.customEnd.split("-").map(Number);
      if (!sy || !sm || !sd || !ey || !em || !ed) return null;
      const start = startOfDay(new Date(sy, sm - 1, sd));
      const end = endOfDay(new Date(ey, em - 1, ed));
      if (start > end) return null;
      return { start, end };
    }
    default:
      return null;
  }
}

/**
 * Período anterior para comparação de tendência (mesma “forma” que o atual).
 */
export function getComparisonRange(
  filter: SalesFilterState,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  if (filter.dimension === "week") {
    return null;
  }

  const active = getActiveRange(filter, refDate);
  if (!active) return null;

  const today = startOfDay(refDate);

  /** Ano corrente (YTD): compara com mesmo comprimento em Jan–Dez do ano anterior */
  if (filter.periodPreset === "year") {
    const y = today.getFullYear();
    const startYtd = startOfDay(new Date(y, 0, 1));
    const n = inclusiveDaysBetween(startYtd, today);
    const prevStart = startOfDay(new Date(y - 1, 0, 1));
    const prevEnd = endOfDay(addDays(prevStart, n - 1));
    return { start: prevStart, end: prevEnd };
  }

  const { start, end } = active;
  const n = inclusiveDaysBetween(start, end);
  const prevEnd = addDays(startOfDay(start), -1);
  const prevStart = addDays(prevEnd, -(n - 1));
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
}

/** Alias explícito: período imediatamente anterior ao filtro atual. */
export function getPreviousPeriod(
  filter: SalesFilterState,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  return getComparisonRange(filter, refDate);
}

/** Mesmo intervalo de calendário há um ano (YoY). */
export function getSamePeriodLastYear(
  filter: SalesFilterState,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  if (filter.dimension === "week") {
    return null;
  }

  const active = getActiveRange(filter, refDate);
  if (!active) return null;
  const s = new Date(active.start.getTime());
  const e = new Date(active.end.getTime());
  s.setFullYear(s.getFullYear() - 1);
  e.setFullYear(e.getFullYear() - 1);
  return { start: startOfDay(s), end: endOfDay(e) };
}

/** Mesmo intervalo deslocado um mês calendário para trás (início e fim). */
export function getSamePeriodPreviousMonth(
  filter: SalesFilterState,
  refDate: Date = new Date(),
): { start: Date; end: Date } | null {
  if (filter.dimension === "week") {
    return null;
  }

  const active = getActiveRange(filter, refDate);
  if (!active) return null;
  const s = new Date(active.start.getTime());
  const e = new Date(active.end.getTime());
  s.setMonth(s.getMonth() - 1);
  e.setMonth(e.getMonth() - 1);
  return { start: startOfDay(s), end: endOfDay(e) };
}

export function saleInRange(sale: Sale, start: Date, end: Date): boolean {
  const [y, m, d] = sale.date.split("-").map(Number);
  if (!y || !m || !d) return false;
  const t = startOfDay(new Date(y, m - 1, d)).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function filterSalesByState(
  sales: Sale[],
  filter: SalesFilterState,
  refDate?: Date,
): Sale[] {
  if (filter.dimension === "week") {
    return filterSalesWeekMonthSlotAllYears(
      sales,
      filter.monthRef,
      filter.weekOfMonth,
    );
  }

  const range = getActiveRange(filter, refDate ?? new Date());
  if (!range) return sales;
  const { start, end } = range;
  return sales.filter((s) => saleInRange(s, start, end));
}

export type SalesMetrics = {
  totalRevenue: number;
  totalBagsSold: number;
  averagePrice: number;
};

export function computeSalesMetrics(
  sales: Sale[],
  filter: SalesFilterState,
  refDate?: Date,
): SalesMetrics {
  const list = filterSalesByState(sales, filter, refDate);

  const totalRevenue = list.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalBagsSold = list.reduce((acc, s) => acc + s.quantity, 0);
  const averagePrice =
    totalBagsSold > 0 ? totalRevenue / totalBagsSold : 0;

  return { totalRevenue, totalBagsSold, averagePrice };
}

export type TrendComparison = {
  revenueDeltaPct: number | null;
  bagsDeltaPct: number | null;
  avgPriceDeltaPct: number | null;
  revenueUp: boolean | null;
  bagsUp: boolean | null;
  avgPriceUp: boolean | null;
  /** Variação vs mesmo período no ano anterior */
  revenueYoyPct: number | null;
  bagsYoyPct: number | null;
  avgYoyPct: number | null;
  revenueYoyUp: boolean | null;
  bagsYoyUp: boolean | null;
  avgYoyUp: boolean | null;
};

function pctDelta(cur: number, prev: number): number | null {
  if (prev > 0) return ((cur - prev) / prev) * 100;
  if (cur > 0) return 100;
  return null;
}

/** Métricas só para vendas desse ano no slot semana+mês atual */
function metricsWeekSlotYear(
  sales: Sale[],
  filter: SalesFilterState,
  year: number,
): SalesMetrics {
  const list = filterSalesWeekMonthSlotAllYears(
    sales,
    filter.monthRef,
    filter.weekOfMonth,
  ).filter((s) => new Date(s.date).getFullYear() === year);
  const totalRevenue = list.reduce((a, s) => a + s.totalPrice, 0);
  const totalBagsSold = list.reduce((a, s) => a + s.quantity, 0);
  const averagePrice =
    totalBagsSold > 0 ? totalRevenue / totalBagsSold : 0;
  return { totalRevenue, totalBagsSold, averagePrice };
}

export function computeTrendComparison(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date = new Date(),
): TrendComparison {
  const current = computeSalesMetrics(sales, filter, refDate);
  const prevRange = getComparisonRange(filter, refDate);

  const baseNull = (): Pick<
    TrendComparison,
    | "revenueDeltaPct"
    | "bagsDeltaPct"
    | "avgPriceDeltaPct"
    | "revenueUp"
    | "bagsUp"
    | "avgPriceUp"
  > => ({
    revenueDeltaPct: null,
    bagsDeltaPct: null,
    avgPriceDeltaPct: null,
    revenueUp: null,
    bagsUp: null,
    avgPriceUp: null,
  });

  let prevBlock = baseNull();

  if (filter.dimension === "week") {
    const prevFilter: SalesFilterState = {
      ...filter,
      monthRef: prevMonthRef(filter.monthRef),
    };
    const prevM = computeSalesMetrics(sales, prevFilter, refDate);

    const rd = pctDelta(current.totalRevenue, prevM.totalRevenue);
    const bd = pctDelta(current.totalBagsSold, prevM.totalBagsSold);
    const ad = pctDelta(current.averagePrice, prevM.averagePrice);
    prevBlock = {
      revenueDeltaPct: rd,
      bagsDeltaPct: bd,
      avgPriceDeltaPct: ad,
      revenueUp: rd === null ? null : rd >= 0,
      bagsUp: bd === null ? null : bd >= 0,
      avgPriceUp: ad === null ? null : ad >= 0,
    };
  } else if (prevRange) {
    const prevSales = sales.filter((s) =>
      saleInRange(s, prevRange.start, prevRange.end),
    );
    const prevRevenue = prevSales.reduce((a, s) => a + s.totalPrice, 0);
    const prevBags = prevSales.reduce((a, s) => a + s.quantity, 0);
    const prevAvgPrice = prevBags > 0 ? prevRevenue / prevBags : 0;

    const revenueDeltaPct =
      prevRevenue > 0
        ? ((current.totalRevenue - prevRevenue) / prevRevenue) * 100
        : current.totalRevenue > 0
          ? 100
          : null;

    const bagsDeltaPct =
      prevBags > 0
        ? ((current.totalBagsSold - prevBags) / prevBags) * 100
        : current.totalBagsSold > 0
          ? 100
          : null;

    const avgPriceDeltaPct =
      prevAvgPrice > 0
        ? ((current.averagePrice - prevAvgPrice) / prevAvgPrice) * 100
        : current.averagePrice > 0
          ? 100
          : null;

    prevBlock = {
      revenueDeltaPct,
      bagsDeltaPct,
      avgPriceDeltaPct,
      revenueUp:
        revenueDeltaPct === null ? null : revenueDeltaPct >= 0,
      bagsUp: bagsDeltaPct === null ? null : bagsDeltaPct >= 0,
      avgPriceUp:
        avgPriceDeltaPct === null ? null : avgPriceDeltaPct >= 0,
    };
  }

  let revenueYoyPct: number | null = null;
  let bagsYoyPct: number | null = null;
  let avgYoyPct: number | null = null;

  if (filter.dimension === "week") {
    const y = refDate.getFullYear();
    const curY = metricsWeekSlotYear(sales, filter, y);
    const prevY = metricsWeekSlotYear(sales, filter, y - 1);

    revenueYoyPct = pctDelta(curY.totalRevenue, prevY.totalRevenue);
    bagsYoyPct = pctDelta(curY.totalBagsSold, prevY.totalBagsSold);
    avgYoyPct = pctDelta(curY.averagePrice, prevY.averagePrice);
  } else {
    const yoyRange = getSamePeriodLastYear(filter, refDate);

    if (yoyRange) {
      const yoySales = sales.filter((s) =>
        saleInRange(s, yoyRange.start, yoyRange.end),
      );
      const yoyRevenue = yoySales.reduce((a, s) => a + s.totalPrice, 0);
      const yoyBags = yoySales.reduce((a, s) => a + s.quantity, 0);
      const yoyAvg = yoyBags > 0 ? yoyRevenue / yoyBags : 0;

      revenueYoyPct =
        yoyRevenue > 0
          ? ((current.totalRevenue - yoyRevenue) / yoyRevenue) * 100
          : current.totalRevenue > 0
            ? 100
            : null;

      bagsYoyPct =
        yoyBags > 0
          ? ((current.totalBagsSold - yoyBags) / yoyBags) * 100
          : current.totalBagsSold > 0
            ? 100
            : null;

      avgYoyPct =
        yoyAvg > 0
          ? ((current.averagePrice - yoyAvg) / yoyAvg) * 100
          : current.averagePrice > 0
            ? 100
            : null;
    }
  }

  return {
    ...prevBlock,
    revenueYoyPct,
    bagsYoyPct,
    avgYoyPct,
    revenueYoyUp:
      revenueYoyPct === null ? null : revenueYoyPct >= 0,
    bagsYoyUp: bagsYoyPct === null ? null : bagsYoyPct >= 0,
    avgYoyUp: avgYoyPct === null ? null : avgYoyPct >= 0,
  };
}

/** Segunda-feira ISO (YYYY-MM-DD) da semana da data — alinhado ao gráfico “por semana”. */
function mondayOfIsoWeekFromIso(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const jsDay = d.getDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  const mon = addDays(new Date(d.getTime()), offset);
  return isoDateFromDate(startOfDay(mon));
}

/**
 * Quantas semanas ISO distintas encostam no intervalo [start .. end] (dias corridos inclusivos).
 * Em ~28 dias isso é em geral 4 ou 5 — nunca assumir “sempre 4”.
 */
function countIsoWeeksOverlapping(start: Date, end: Date): number {
  const seen = new Set<string>();
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  for (let t = a; t <= b; t += 86400000) {
    seen.add(mondayOfIsoWeekFromIso(isoDateFromDate(new Date(t))));
  }
  return seen.size;
}

/** Estado inicial sensato (30d, mês atual para modo semana) */
/**
 * Média de sacas por **semana ISO** nos últimos 28 dias até a venda mais recente.
 * Total de sacas ÷ número de semanas ISO que intersectam esse período (≥1).
 */
export function trailingWeeklyAvgBags(sales: Sale[]): number {
  if (sales.length === 0) return 0;
  const latestTs = Math.max(
    ...sales.map((s) => new Date(s.date).getTime()),
  );
  const windowStartTs = latestTs - 28 * 86400000;
  const slice = sales.filter(
    (s) => new Date(s.date).getTime() >= windowStartTs,
  );
  if (slice.length === 0) return 0;

  const bags = slice.reduce((a, s) => a + s.quantity, 0);
  const nWeeks = countIsoWeeksOverlapping(
    new Date(windowStartTs),
    new Date(latestTs),
  );
  return bags / Math.max(nWeeks, 1);
}

export function createDefaultSalesFilter(now: Date = new Date()): SalesFilterState {
  const y = now.getFullYear();
  const mo = now.getMonth() + 1;
  const monthRef = `${y}-${String(mo).padStart(2, "0")}`;
  const customEnd = isoDateFromDate(now);
  const customStart = isoDateFromDate(addDays(now, -29));

  return {
    dimension: "period",
    periodPreset: "30d",
    customStart,
    customEnd,
    weekOfMonth: 2,
    monthRef,
    priceChartGranularity: "day",
  };
}

export function formatWeekMonthLabel(
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): string {
  const [ys, ms] = monthRef.split("-").map(Number);
  if (!ys || !ms) return monthRef;
  const d = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ys, ms - 1, 1));
  return `Semana ${week} — ${d}`;
}
