/** Modo de leitura no módulo Análises (independe do setor "global" do resto do app) */
export type AnalysesViewMode = "global" | "sector";

export type SimulationApplyScope = "view" | "allSectors";

export type GlobalMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  /** Faturamento médio por semana (28d) em R$ */
  weeklyRevenue: number;
  /** Valor do inventário a preços de referência (só R$) */
  inventoryValueRevenue: number;
  /** Faturamento projetado ao esgotar stock (soma por setor, em R$) */
  totalProjectedRevenueFromInventory: number;
  /** Semanas de cobertura: valor inventário / ritmo semanal (R$) */
  financialRunwayWeeks: number | null;
};

export type SectorMetrics = {
  sectorId: string;
  sectorName: string;
  unit: string;
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  /** Unidades / sem (28d) */
  unitsPerWeek: number;
  /** Semanas para esgotar stock ao ritmo actual */
  weeksRemaining: number | null;
  /** Faturamento projetado: remaining * avg price */
  projectedRevenue: number | null;
  /** Preço médio ponderado */
  averagePrice: number;
  /** Stock remanescente (unidade do setor) */
  stockRemaining: number;
};

export type SectorComparisons = {
  bestProfitSectorId: string | null;
  bestProfit: number;
  bestProfitName: string | null;
  worstProfitSectorId: string | null;
  worstProfit: number;
  worstProfitName: string | null;
  highestCostSectorId: string | null;
  highestCost: number;
  highestCostName: string | null;
};

export type AnalyticsTrends = {
  /** Rótulo de momentum de preço (vendas no âmbito actual) */
  priceMomentumLabel: string | null;
  /** Categoria de despesa com maior crescimento % (janela 30d) */
  risingCostCategory: string | null;
  risingCostPct: number | null;
};

export type SectorProjectionDetail = {
  unitsPerWeek: number;
  weeksRemaining: number | null;
  projectedRevenue: number | null;
  etaDate: string | null;
  averagePrice: number;
  stockRemaining: number;
  unit: string;
};

export type GlobalProjectionDetail = {
  weeklyRevenue: number;
  totalProjectedRevenue: number;
  financialRunwayWeeks: number | null;
  inventoryValueRevenue: number;
};

/**
 * Estrutura pronta para consumo por UI ou por IA (não contém funções)
 */
export type AnalyticsSnapshot = {
  viewMode: AnalysesViewMode;
  /** Em modo sector, o setor em foco */
  analysesSectorId: string | null;
  globalMetrics: GlobalMetrics;
  /** Todos os setores conhecidos (tabela / comparações) */
  sectorMetrics: SectorMetrics[];
  /** Métricas do setor em foco (modo sector) */
  activeSector: SectorMetrics | null;
  comparisons: SectorComparisons;
  trends: AnalyticsTrends;
  projections: {
    global: GlobalProjectionDetail | null;
    sector: SectorProjectionDetail | null;
  };
};
