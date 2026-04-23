"use client";

import { buildAnalyticsSnapshot } from "@/lib/analytics-intelligence";
import { useAnalysesUIStore } from "@/store/analyses-ui-store";
import { useExpenseStore } from "@/store/expense-store";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import type { AnalyticsSnapshot } from "@/types/analytics";
import { useMemo } from "react";

/**
 * Lê stores e entrega o snapshot analítico (pronto para UI / IA).
 */
export function useAnalyticsIntelligence(): AnalyticsSnapshot {
  const sales = useSalesStore((s) => s.sales);
  const stockTotalSacas = useSalesStore((s) => s.stockTotalSacas);
  const stockMovements = useSalesStore((s) => s.stockMovements);
  const expenses = useExpenseStore((s) => s.expenses);
  const sectors = useSectorStore((s) => s.sectors);
  const viewMode = useAnalysesUIStore((s) => s.viewMode);
  const analysesSectorId = useAnalysesUIStore((s) => s.analysesSectorId);

  return useMemo(
    () =>
      buildAnalyticsSnapshot({
        sales,
        expenses,
        stockTotalSacas,
        stockMovements,
        sectors,
        viewMode,
        analysesSectorId,
      }),
    [
      sales,
      expenses,
      stockTotalSacas,
      stockMovements,
      sectors,
      viewMode,
      analysesSectorId,
    ],
  );
}

export function useAnalysesViewControls() {
  const viewMode = useAnalysesUIStore((s) => s.viewMode);
  const setViewMode = useAnalysesUIStore((s) => s.setViewMode);
  const analysesSectorId = useAnalysesUIStore((s) => s.analysesSectorId);
  const setAnalysesSectorId = useAnalysesUIStore((s) => s.setAnalysesSectorId);
  const simulationScope = useAnalysesUIStore((s) => s.simulationScope);
  const setSimulationScope = useAnalysesUIStore((s) => s.setSimulationScope);
  return {
    viewMode,
    setViewMode,
    analysesSectorId,
    setAnalysesSectorId,
    simulationScope,
    setSimulationScope,
  };
}
