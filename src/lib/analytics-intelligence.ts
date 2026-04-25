import {
  highestCategoryCostDelta,
} from "@/lib/analytics-trends";
import {
  bestMonthByAvgPrice,
  bestWeekOfMonthByAvgPrice,
  historicalAveragePrice,
  priceMomentumVsPriorWindow,
} from "@/lib/time-intelligence";
import { computeStockSnapshot } from "@/store/sales-store";
import {
  trailingWeeklyAvgBags,
  trailingWeeklyRevenue,
} from "@/store/sales-metrics";
import type { Expense } from "@/types/expense";
import type {
  AnalyticsSnapshot,
  AnalyticsTrends,
  GlobalMetrics,
  GlobalProjectionDetail,
  SectorComparisons,
  SectorMetrics,
  SectorProjectionDetail,
  AnalysesViewMode,
} from "@/types/analytics";
import type { Sale, StockMovement } from "@/types/sale";
import type { Sector } from "@/types/sector";

function sumRevenue(sales: Sale[]): number {
  return sales.reduce((a, s) => a + s.totalPrice, 0);
}

function sumExpensesForSector(expenses: Expense[], sectorId: string): number {
  return expenses
    .filter((e) => e.sectorId === sectorId)
    .reduce((a, e) => a + e.amount, 0);
}

function sumAllExpenses(expenses: Expense[]): number {
  return expenses.reduce((a, e) => a + e.amount, 0);
}

function buildSectorMetricsList(
  sales: Sale[],
  expenses: Expense[],
  stockTotalSacas: number,
  stockMovements: StockMovement[],
  sectors: Sector[],
): SectorMetrics[] {
  return sectors.map((sec) => {
    const sSales = sales.filter((s) => s.sectorId === sec.id);
    const sExp = sumExpensesForSector(expenses, sec.id);
    const sRev = sumRevenue(sSales);
    const stock = computeStockSnapshot(
      stockTotalSacas,
      stockMovements,
      sec.id,
    );
    const avgPrice = historicalAveragePrice(sSales);
    const weekly = trailingWeeklyAvgBags(sSales);
    const weeksRem =
      weekly > 0 ? stock.remaining / weekly : null;
    const proj =
      avgPrice > 0 ? stock.remaining * avgPrice : null;
    return {
      sectorId: sec.id,
      sectorName: sec.name,
      unit: sec.unit,
      totalRevenue: sRev,
      totalExpenses: sExp,
      totalProfit: sRev - sExp,
      unitsPerWeek: weekly,
      weeksRemaining: weeksRem,
      projectedRevenue: proj,
      averagePrice: avgPrice,
      stockRemaining: stock.remaining,
    };
  });
}

function buildComparisons(sectorMetrics: SectorMetrics[]): SectorComparisons {
  if (sectorMetrics.length === 0) {
    return {
      bestProfitSectorId: null,
      bestProfit: 0,
      bestProfitName: null,
      worstProfitSectorId: null,
      worstProfit: 0,
      worstProfitName: null,
      highestCostSectorId: null,
      highestCost: 0,
      highestCostName: null,
    };
  }
  const byProfit = [...sectorMetrics].sort((a, b) => b.totalProfit - a.totalProfit);
  const byCost = [...sectorMetrics].sort((a, b) => b.totalExpenses - a.totalExpenses);
  const best = byProfit[0]!;
  const worst = byProfit[byProfit.length - 1]!;
  const hiCost = byCost[0]!;
  return {
    bestProfitSectorId: best.sectorId,
    bestProfit: best.totalProfit,
    bestProfitName: best.sectorName,
    worstProfitSectorId: worst.sectorId,
    worstProfit: worst.totalProfit,
    worstProfitName: worst.sectorName,
    highestCostSectorId: hiCost.sectorId,
    highestCost: hiCost.totalExpenses,
    highestCostName: hiCost.sectorName,
  };
}

function buildGlobalMetrics(
  sales: Sale[],
  expenses: Expense[],
  stockTotalSacas: number,
  stockMovements: StockMovement[],
  sectors: Sector[],
): GlobalMetrics {
  const totalRevenue = sumRevenue(sales);
  const totalExpenses = sumAllExpenses(expenses);
  const weeklyRevenue = trailingWeeklyRevenue(sales);
  let inventoryValue = 0;
  let totalProjected = 0;
  for (const sec of sectors) {
    const sSales = sales.filter((s) => s.sectorId === sec.id);
    const avg = historicalAveragePrice(sSales);
    const st = computeStockSnapshot(stockTotalSacas, stockMovements, sec.id);
    const v = st.remaining * (avg > 0 ? avg : 0);
    inventoryValue += v;
    totalProjected += v;
  }
  const financialRunwayWeeks =
    weeklyRevenue > 0 ? inventoryValue / weeklyRevenue : null;
  return {
    totalRevenue,
    totalExpenses,
    totalProfit: totalRevenue - totalExpenses,
    weeklyRevenue,
    inventoryValueRevenue: inventoryValue,
    totalProjectedRevenueFromInventory: totalProjected,
    financialRunwayWeeks:
      financialRunwayWeeks !== null && Number.isFinite(financialRunwayWeeks)
        ? financialRunwayWeeks
        : null,
  };
}

function buildTrends(
  sales: Sale[],
  expenses: Expense[],
  viewMode: AnalysesViewMode,
  analysesSectorId: string,
): AnalyticsTrends {
  const salesScope =
    viewMode === "global"
      ? sales
      : sales.filter((s) => s.sectorId === analysesSectorId);
  const expScope =
    viewMode === "global"
      ? expenses
      : expenses.filter((e) => e.sectorId === analysesSectorId);
  const mom = priceMomentumVsPriorWindow(salesScope, 90);
  const rise = highestCategoryCostDelta(expScope);
  return {
    priceMomentumLabel: mom?.label ?? null,
    risingCostCategory: rise?.label ?? null,
    risingCostPct: rise?.pct ?? null,
  };
}

function sectorProjectionFromMetrics(
  m: SectorMetrics,
  stock: ReturnType<typeof computeStockSnapshot>,
): SectorProjectionDetail {
  const weeksRem =
    m.unitsPerWeek > 0 ? stock.remaining / m.unitsPerWeek : null;
  let eta: string | null = null;
  if (weeksRem != null && Number.isFinite(weeksRem) && weeksRem > 0) {
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(weeksRem) * 7);
    eta = d.toISOString();
  }
  return {
    unitsPerWeek: m.unitsPerWeek,
    weeksRemaining: weeksRem,
    projectedRevenue: m.projectedRevenue,
    etaDate: eta,
    averagePrice: m.averagePrice,
    stockRemaining: m.stockRemaining,
    unit: m.unit,
  };
}

/**
 * Ponto de entrada puro: agrega vendas, despesas, stock e modos.
 * Pode ser testado e reutilizado por APIs / IA.
 */
export function buildAnalyticsSnapshot(params: {
  sales: Sale[];
  expenses: Expense[];
  stockTotalSacas: number;
  stockMovements: StockMovement[];
  sectors: Sector[];
  viewMode: AnalysesViewMode;
  analysesSectorId: string;
}): AnalyticsSnapshot {
  const {
    sales,
    expenses,
    stockTotalSacas,
    stockMovements,
    sectors,
    viewMode,
    analysesSectorId,
  } = params;

  const sectorMetrics = buildSectorMetricsList(
    sales,
    expenses,
    stockTotalSacas,
    stockMovements,
    sectors,
  );
  const comparisons = buildComparisons(sectorMetrics);
  const trends = buildTrends(sales, expenses, viewMode, analysesSectorId);
  const globalMetrics = buildGlobalMetrics(
    sales,
    expenses,
    stockTotalSacas,
    stockMovements,
    sectors,
  );

  const activeSector =
    viewMode === "sector"
      ? sectorMetrics.find((m) => m.sectorId === analysesSectorId) ?? null
      : null;

  const gProj: GlobalProjectionDetail = {
    weeklyRevenue: globalMetrics.weeklyRevenue,
    totalProjectedRevenue: globalMetrics.totalProjectedRevenueFromInventory,
    financialRunwayWeeks: globalMetrics.financialRunwayWeeks,
    inventoryValueRevenue: globalMetrics.inventoryValueRevenue,
  };

  let sProj: SectorProjectionDetail | null = null;
  if (activeSector) {
    const st = computeStockSnapshot(
      stockTotalSacas,
      stockMovements,
      activeSector.sectorId,
    );
    sProj = sectorProjectionFromMetrics(activeSector, st);
  }

  return {
    viewMode,
    analysesSectorId: viewMode === "sector" ? analysesSectorId : null,
    globalMetrics,
    sectorMetrics,
    activeSector,
    comparisons,
    trends,
    projections: {
      global: viewMode === "global" ? gProj : null,
      sector: viewMode === "sector" ? sProj : null,
    },
  };
}

export function buildStrategicCardsInput(params: {
  sales: Sale[];
  viewMode: AnalysesViewMode;
  analysesSectorId: string;
}): {
  bestMonth: ReturnType<typeof bestMonthByAvgPrice>;
  bestWeek: ReturnType<typeof bestWeekOfMonthByAvgPrice>;
  momentum: ReturnType<typeof priceMomentumVsPriorWindow>;
} {
  const { sales, viewMode, analysesSectorId } = params;
  const scoped =
    viewMode === "global"
      ? sales
      : sales.filter((s) => s.sectorId === analysesSectorId);
  return {
    bestMonth: bestMonthByAvgPrice(scoped),
    bestWeek: bestWeekOfMonthByAvgPrice(scoped),
    momentum: priceMomentumVsPriorWindow(scoped, 90),
  };
}
