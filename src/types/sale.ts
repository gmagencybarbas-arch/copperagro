/** Movimento de estoque (entrada manual ou saída ligada à venda) */
export type StockMovement = {
  id: string;
  date: string;
  type: "entry" | "exit";
  quantity: number;
  sectorId: string;
  note?: string;
  /** Saídas geradas por uma venda */
  relatedSaleId?: string;
};

/** Estado agregado do estoque + histórico */
export type StockState = {
  /** Contrato base + todas as entradas registradas */
  total: number;
  /** Unidades efetivamente saídas (somente saídas) */
  sold: number;
  /** Saldo atual */
  remaining: number;
  movements: StockMovement[];
};

export type Sale = {
  id: string;
  sectorId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  buyer: string;
};

/** Período relativo ou intervalo customizado */
export type PeriodPreset = "7d" | "30d" | "90d" | "year" | "custom";

/** Dimensão do filtro no painel */
export type FilterDimension = "period" | "week";

/** Série de comparação no gráfico de linhas */
export type ComparisonSeriesMode =
  | "previous_period"
  /** Mesmo comprimento do filtro atual, deslocado um mês calendário para trás */
  | "previous_month"
  | "same_period_last_year"
  /** Apenas modo Período: segundo intervalo definido pelo utilizador */
  | "custom_interval";

/** Agregação do eixo X no gráfico “Preço por saca” (modo Período) */
export type PriceChartGranularity = "day" | "week" | "month";

/**
 * Estado do filtro avançado.
 * Semana do mês: dias 1–7, 8–14, 15–21, 22–fim (calendarístico).
 */
export type SalesFilterState = {
  dimension: FilterDimension;
  periodPreset: PeriodPreset;
  customStart: string;
  customEnd: string;
  weekOfMonth: 1 | 2 | 3 | 4;
  /** Referência YYYY-MM para filtro por semana */
  monthRef: string;
  /** Apenas dimension === "period": dia / semana ISO / mês calendário */
  priceChartGranularity: PriceChartGranularity;
};
