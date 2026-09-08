"use client";

import type { AnalysesViewMode, SimulationApplyScope } from "@/types/analytics";
import { create } from "zustand";

type AnalysesUIState = {
  viewMode: AnalysesViewMode;
  /** Setor em foco quando `viewMode === "sector"` */
  analysesSectorId: string;
  simulationScope: SimulationApplyScope;
  setViewMode: (m: AnalysesViewMode) => void;
  setAnalysesSectorId: (id: string) => void;
  setSimulationScope: (s: SimulationApplyScope) => void;
};

export const useAnalysesUIStore = create<AnalysesUIState>((set) => ({
  viewMode: "global",
  analysesSectorId: "",
  simulationScope: "view",
  setViewMode: (m) => set({ viewMode: m }),
  setAnalysesSectorId: (id) => set({ analysesSectorId: id }),
  setSimulationScope: (s) => set({ simulationScope: s }),
}));
