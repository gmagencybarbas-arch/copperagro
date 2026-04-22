import {
  addDays,
  endOfDay,
  filterSalesByState,
  filterSalesWeekMonthSlotAllYears,
  getActiveRange,
  getComparisonRange,
  getSamePeriodLastYear,
  getSamePeriodPreviousMonth,
  isoDateFromDate,
  prevMonthRef,
  saleInRange,
  startOfDay,
} from "@/store/sales-metrics";
import type { ComparisonSeriesMode } from "@/types/sale";
import type {
  PriceChartGranularity,
  Sale,
  SalesFilterState,
} from "@/types/sale";

export type PricePoint = { date: string; unitPrice: number };

export type MonthBar = { key: string; label: string; quantity: number };

/** Barras agrupadas: atual vs período de comparação */
export type PairedVolumeBar = {
  key: string;
  label: string;
  currentQty: number;
  comparisonQty: number;
};

/** Agregação diária por data ISO */
export type DailySaleAgg = {
  date: string;
  avgPrice: number;
  totalQty: number;
};

/** Mapa rápido para séries diárias */
export function aggregateSalesByDay(sales: Sale[]): DailySaleAgg[] {
  const map = new Map<string, { rev: number; qty: number }>();
  for (const s of sales) {
    const cur = map.get(s.date) ?? { rev: 0, qty: 0 };
    cur.rev += s.totalPrice;
    cur.qty += s.quantity;
    map.set(s.date, cur);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      avgPrice: v.qty > 0 ? v.rev / v.qty : 0,
      totalQty: v.qty,
    }));
}

function aggregateSalesByDayMap(
  sales: Sale[],
): Map<string, DailySaleAgg> {
  const byIso = aggregateSalesByDay(sales);
  return new Map(byIso.map((d) => [d.date, d]));
}

/** Dias corridos inclusivos [start .. end] (normalizados ao início do dia). */
export function eachCalendarDayInclusive(start: Date, end: Date): string[] {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  const out: string[] = [];
  for (let t = a; t <= b; t += 86400000) {
    out.push(isoDateFromDate(new Date(t)));
  }
  return out;
}

/** Segunda-feira (ISO) da semana que contém a data ISO (YYYY-MM-DD). */
export function mondayOfIsoWeek(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const jsDay = d.getDay();
  const offset = jsDay === 0 ? -6 : 1 - jsDay;
  const mon = addDays(new Date(d.getTime()), offset);
  return isoDateFromDate(startOfDay(mon));
}

function weekMondaysTouchingRange(start: Date, end: Date): string[] {
  const days = eachCalendarDayInclusive(start, end);
  const set = new Set(days.map(mondayOfIsoWeek));
  return [...set].sort();
}

function monthKeysTouchingRange(start: Date, end: Date): string[] {
  const keys = new Set<string>();
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  for (let t = a; t <= b; t += 86400000) {
    const d = new Date(t);
    keys.add(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return [...keys].sort();
}

/**
 * Preço médio ponderado por semana (segunda da semana ISO), só vendas no intervalo.
 * Semanas sem venda repetem o último preço (carry-forward), como na série diária.
 */
export function buildWeeklyWeightedAvgPriceInRange(
  sales: Sale[],
  start: Date,
  end: Date,
): PricePoint[] {
  const weekMondays = weekMondaysTouchingRange(start, end);
  const list = sales.filter((s) => saleInRange(s, start, end));
  let carry = 800;
  return weekMondays.map((wm) => {
    const weekSales = list.filter((s) => mondayOfIsoWeek(s.date) === wm);
    const rev = weekSales.reduce((a, s) => a + s.totalPrice, 0);
    const qty = weekSales.reduce((a, s) => a + s.quantity, 0);
    if (qty > 0) {
      carry = rev / qty;
    }
    return { date: wm, unitPrice: carry };
  });
}

/**
 * Preço médio ponderado por mês civil; meses sem venda usam carry-forward.
 */
export function buildMonthlyWeightedAvgPriceInRange(
  sales: Sale[],
  start: Date,
  end: Date,
): PricePoint[] {
  const monthKeys = monthKeysTouchingRange(start, end);
  const list = sales.filter((s) => saleInRange(s, start, end));
  let carry = 800;
  return monthKeys.map((mk) => {
    const [y, mo] = mk.split("-").map(Number);
    const monthSales = list.filter((s) => {
      const [sy, sm] = s.date.split("-").map(Number);
      return sy === y && sm === mo;
    });
    const rev = monthSales.reduce((a, s) => a + s.totalPrice, 0);
    const qty = monthSales.reduce((a, s) => a + s.quantity, 0);
    if (qty > 0) {
      carry = rev / qty;
    }
    return {
      date: `${mk}-01`,
      unitPrice: carry,
    };
  });
}

function resolveComparisonDateRange(
  mode: ComparisonSeriesMode,
  filter: SalesFilterState,
  refDate: Date,
  customInterval: { start: string; end: string } | null | undefined,
): { start: Date; end: Date } | null {
  if (filter.dimension === "week") return null;
  if (mode === "previous_period") return getComparisonRange(filter, refDate);
  if (mode === "same_period_last_year") {
    return getSamePeriodLastYear(filter, refDate);
  }
  if (mode === "previous_month") {
    return getSamePeriodPreviousMonth(filter, refDate);
  }
  if (mode === "custom_interval" && customInterval) {
    const [sy, sm, sd] = customInterval.start.split("-").map(Number);
    const [ey, em, ed] = customInterval.end.split("-").map(Number);
    if (!sy || !sm || !sd || !ey || !em || !ed) return null;
    const s = startOfDay(new Date(sy, sm - 1, sd));
    const e = endOfDay(new Date(ey, em - 1, ed));
    if (s > e) return null;
    return { start: s, end: e };
  }
  return null;
}

/** Série de comparação para gráfico semanal ou mensal (alinhamento por índice no dashboard). */
export function buildGranularComparisonPriceSeries(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date,
  mode: ComparisonSeriesMode,
  granularity: Exclude<PriceChartGranularity, "day">,
  customInterval: { start: string; end: string } | null | undefined,
): PricePoint[] {
  const cmp = resolveComparisonDateRange(mode, filter, refDate, customInterval);
  if (!cmp) return [];
  if (granularity === "week") {
    return buildWeeklyWeightedAvgPriceInRange(sales, cmp.start, cmp.end);
  }
  return buildMonthlyWeightedAvgPriceInRange(sales, cmp.start, cmp.end);
}

/** Série atual no modo Período com agregação escolhida (dia = comportamento já existente). */
export function buildPeriodPriceSeriesByGranularity(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date,
  granularity: PriceChartGranularity,
): PricePoint[] {
  const range = getActiveRange(filter, refDate);
  if (!range) return [];

  if (granularity === "week") {
    return buildWeeklyWeightedAvgPriceInRange(sales, range.start, range.end);
  }
  if (granularity === "month") {
    return buildMonthlyWeightedAvgPriceInRange(sales, range.start, range.end);
  }

  return buildPeriodDailyPriceSeries(sales, filter, refDate);
}

/**
 * Um ponto por dia na ordem de `days`; **carry-forward** do último preço médio
 * quando não há vendas naquele dia (nunca “dia vazio” na série).
 */
export function buildDailyPriceSeriesCarried(
  sales: Sale[],
  days: string[],
): PricePoint[] {
  const agg = aggregateSalesByDayMap(sales);
  let carry = 800;
  return days.map((iso) => {
    const row = agg.get(iso);
    if (row && row.totalQty > 0) {
      carry = row.avgPrice;
    }
    return { date: iso, unitPrice: carry };
  });
}

/**
 * Série diária do período filtrado (modo **Período**).
 * Preset **7d** → exatamente **7 pontos** (últimos 7 dias corridos até `refDate`).
 */
export function buildPeriodDailyPriceSeries(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date,
): PricePoint[] {
  const range = getActiveRange(filter, refDate);
  if (!range) return [];

  let days: string[];
  if (filter.periodPreset === "7d") {
    const end = startOfDay(refDate);
    days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(isoDateFromDate(addDays(end, -i)));
    }
  } else {
    days = eachCalendarDayInclusive(range.start, range.end);
  }

  return buildDailyPriceSeriesCarried(sales, days);
}

/**
 * Para cada dia do período atual, preço médio do **mesmo dia calendário no ano anterior**
 * (com carry-forward dentro da construção da série YoY).
 */
export function buildYoYDailyComparisonSeries(
  sales: Sale[],
  currentPeriodDays: string[],
): PricePoint[] {
  const agg = aggregateSalesByDayMap(sales);
  let carry = 800;
  return currentPeriodDays.map((iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return { date: iso, unitPrice: carry };
    const yoyIso = isoDateFromDate(new Date(y - 1, m - 1, d));
    const row = agg.get(yoyIso);
    if (row && row.totalQty > 0) {
      carry = row.avgPrice;
    }
    return { date: yoyIso, unitPrice: carry };
  });
}

/**
 * Série de comparação alinhada **índice a índice** com `currentPoints`
 * (mesmo número de pontos que o período atual).
 */
export function getComparisonSeries(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date,
  mode: ComparisonSeriesMode,
  currentPoints: PricePoint[],
  customInterval?: { start: string; end: string } | null,
): PricePoint[] {
  const weekMode =
    filter.dimension === "week"
      ? mode === "custom_interval" || mode === "previous_month"
        ? "previous_period"
        : mode
      : mode;

  if (filter.dimension === "week") {
    return getComparisonSeriesWeekSlot(
      sales,
      filter.monthRef,
      filter.weekOfMonth,
      weekMode as Exclude<
        ComparisonSeriesMode,
        "custom_interval" | "previous_month"
      >,
      currentPoints,
    );
  }

  if (currentPoints.length === 0) return [];

  const curDays = currentPoints.map((p) => p.date);

  if (mode === "same_period_last_year") {
    return buildYoYDailyComparisonSeries(sales, curDays);
  }

  if (mode === "custom_interval" && customInterval) {
    const [sy, sm, sd] = customInterval.start.split("-").map(Number);
    const [ey, em, ed] = customInterval.end.split("-").map(Number);
    if (!sy || !sm || !sd || !ey || !em || !ed) return [];
    const start = startOfDay(new Date(sy, sm - 1, sd));
    const end = startOfDay(new Date(ey, em - 1, ed));
    if (start > end) return [];
    const cmpDays = eachCalendarDayInclusive(start, end);
    const n = Math.min(curDays.length, cmpDays.length);
    return buildDailyPriceSeriesCarried(sales, cmpDays.slice(0, n));
  }

  if (mode === "previous_month") {
    const cmp = getSamePeriodPreviousMonth(filter, refDate);
    if (!cmp) return [];
    const cmpDays = eachCalendarDayInclusive(cmp.start, cmp.end);
    const n = Math.min(curDays.length, cmpDays.length);
    return buildDailyPriceSeriesCarried(sales, cmpDays.slice(0, n));
  }

  const cmp = getComparisonRange(filter, refDate);
  if (!cmp) return [];
  const cmpDays = eachCalendarDayInclusive(cmp.start, cmp.end);
  const n = Math.min(curDays.length, cmpDays.length);
  const slice = cmpDays.slice(0, n);
  return buildDailyPriceSeriesCarried(sales, slice);
}

function getComparisonSeriesWeekSlot(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
  mode: "previous_period" | "same_period_last_year",
  currentPoints: PricePoint[],
): PricePoint[] {
  if (currentPoints.length === 0) return [];

  if (mode === "previous_period") {
    return buildWeekSlotYearlyPriceSeries(
      sales,
      prevMonthRef(monthRef),
      week,
    );
  }

  const mm = monthRef.split("-")[1] ?? "01";
  return currentPoints.map((pt) => {
    const y = Number(pt.date.slice(0, 4));
    if (!Number.isFinite(y)) return { ...pt };
    const refPrevYear = `${y - 1}-${mm.padStart(2, "0")}`;
    const list = filterSalesWeekMonthSlotAllYears(
      sales,
      refPrevYear,
      week,
    ).filter((s) => new Date(s.date).getFullYear() === y - 1);
    const rev = list.reduce((a, s) => a + s.totalPrice, 0);
    const q = list.reduce((a, s) => a + s.quantity, 0);
    const avg = q > 0 ? rev / q : pt.unitPrice;
    return {
      date: `${y - 1}-06-15`,
      unitPrice: avg,
    };
  });
}

/** Alinha duas séries pelo menor comprimento (segurança). */
export function alignPriceSeriesPair(
  a: PricePoint[],
  b: PricePoint[],
): { current: PricePoint[]; compare: PricePoint[] } {
  const n = Math.min(a.length, b.length);
  return {
    current: a.slice(0, n),
    compare: b.slice(0, n),
  };
}

export function buildPriceSeries(
  sales: Sale[],
  filter: SalesFilterState,
): PricePoint[] {
  const list = filterSalesByState(sales, filter)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return list.map((s) => ({ date: s.date, unitPrice: s.unitPrice }));
}

export function buildPriceSeriesInRange(
  sales: Sale[],
  start: Date,
  end: Date,
): PricePoint[] {
  const list = sales
    .filter((s) => saleInRange(s, start, end))
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return list.map((s) => ({ date: s.date, unitPrice: s.unitPrice }));
}

function aggregateSalesByCalendarMonth(list: Sale[]): MonthBar[] {
  const map = new Map<string, number>();
  for (const s of list) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + s.quantity);
  }
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([key, quantity]) => {
    const [y, m] = key.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
    }).format(new Date(y, m - 1, 1));
    return { key, label, quantity };
  });
}

export function buildMonthlyQuantity(
  sales: Sale[],
  filter: SalesFilterState,
): MonthBar[] {
  const list = filterSalesByState(sales, filter);
  return aggregateSalesByCalendarMonth(list);
}

export function buildMonthlyQuantityInRange(
  sales: Sale[],
  start: Date,
  end: Date,
): MonthBar[] {
  const list = sales.filter((s) => saleInRange(s, start, end));
  return aggregateSalesByCalendarMonth(list);
}

/**
 * Volume mensal no filtro vs **mesmo mês no ano anterior** (lado a lado).
 */
export function buildMonthlyYoYPairedForFilter(
  sales: Sale[],
  filter: SalesFilterState,
): PairedVolumeBar[] {
  const cur = buildMonthlyQuantity(sales, filter);
  return cur.map((c) => {
    const [y, m] = c.key.split("-").map(Number);
    const prevKey = `${y - 1}-${String(m).padStart(2, "0")}`;
    const cmpQty = sales
      .filter((s) => {
        const [sy, sm] = s.date.split("-").map(Number);
        return (
          `${sy}-${String(sm).padStart(2, "0")}` === prevKey
        );
      })
      .reduce((a, s) => a + s.quantity, 0);
    return {
      key: c.key,
      label: c.label,
      currentQty: c.quantity,
      comparisonQty: cmpQty,
    };
  });
}

export function buildPairedMonthlyVolume(
  sales: Sale[],
  filter: SalesFilterState,
  refDate: Date,
): PairedVolumeBar[] {
  const cmp = getComparisonRange(filter, refDate);
  const cur = buildMonthlyQuantity(sales, filter);
  if (!cmp) {
    return cur.map((c) => ({
      key: c.key,
      label: c.label,
      currentQty: c.quantity,
      comparisonQty: 0,
    }));
  }
  const cmpBars = buildMonthlyQuantityInRange(sales, cmp.start, cmp.end);
  const n = Math.max(cur.length, cmpBars.length);
  const rows: PairedVolumeBar[] = [];
  for (let i = 0; i < n; i++) {
    const c = cur[i];
    const p = cmpBars[i];
    rows.push({
      key: `${c?.key ?? p?.key ?? `idx-${i}`}`,
      label: c?.label ?? p?.label ?? "—",
      currentQty: c?.quantity ?? 0,
      comparisonQty: p?.quantity ?? 0,
    });
  }
  return rows;
}

export function buildPairedWeekSlotVolume(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): PairedVolumeBar[] {
  const cur = buildWeekSlotYearlyQuantityBars(sales, monthRef, week);
  const cmp = buildWeekSlotYearlyQuantityBars(
    sales,
    prevMonthRef(monthRef),
    week,
  );
  const keys = [
    ...new Set([...cur.map((c) => c.key), ...cmp.map((c) => c.key)]),
  ].sort();
  return keys.map((k) => ({
    key: k,
    label: k,
    currentQty: cur.find((x) => x.key === k)?.quantity ?? 0,
    comparisonQty: cmp.find((x) => x.key === k)?.quantity ?? 0,
  }));
}

/** Semana do mês: volume no ano vs mesmo slot no ano anterior. */
export function buildWeekSlotYoYPairedVolume(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): PairedVolumeBar[] {
  const mm = monthRef.split("-")[1] ?? "01";
  const cur = buildWeekSlotYearlyQuantityBars(sales, monthRef, week);
  return cur.map((b) => {
    const y = Number(b.key);
    const prevRef = `${y - 1}-${mm.padStart(2, "0")}`;
    const cmpQty = filterSalesWeekMonthSlotAllYears(
      sales,
      prevRef,
      week,
    )
      .filter((s) => new Date(s.date).getFullYear() === y - 1)
      .reduce((a, s) => a + s.quantity, 0);
    return {
      key: b.key,
      label: b.label,
      currentQty: b.quantity,
      comparisonQty: cmpQty,
    };
  });
}

export function buildWeekSlotYearlyQuantityBars(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): MonthBar[] {
  const list = filterSalesWeekMonthSlotAllYears(sales, monthRef, week);
  const byYear = new Map<number, number>();
  for (const s of list) {
    const y = new Date(s.date).getFullYear();
    byYear.set(y, (byYear.get(y) ?? 0) + s.quantity);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, quantity]) => ({
      key: String(year),
      label: String(year),
      quantity,
    }));
}

export function buildWeekSlotYearlyPriceSeries(
  sales: Sale[],
  monthRef: string,
  week: 1 | 2 | 3 | 4,
): PricePoint[] {
  const list = filterSalesWeekMonthSlotAllYears(sales, monthRef, week);
  const byYear = new Map<number, { rev: number; qty: number }>();
  for (const s of list) {
    const y = new Date(s.date).getFullYear();
    const cur = byYear.get(y) ?? { rev: 0, qty: 0 };
    cur.rev += s.totalPrice;
    cur.qty += s.quantity;
    byYear.set(y, cur);
  }
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, agg]) => ({
      date: `${year}-06-15`,
      unitPrice: agg.qty > 0 ? agg.rev / agg.qty : 0,
    }));
}
