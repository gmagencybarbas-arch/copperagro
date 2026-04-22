"use client";

import type { Sector } from "@/types/sector";
import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import { create } from "zustand";

export const DEFAULT_SECTORS: Sector[] = [
  { id: "cafe", name: "Café", unit: "saca" },
  { id: "leite", name: "Leite", unit: "litro" },
  { id: "bovino", name: "Bovino", unit: "arroba" },
  { id: "hortifruti", name: "Hortifruti", unit: "caixa" },
];

export const DEFAULT_SECTOR_ID = DEFAULT_SECTORS[0].id;

type SectorState = {
  sectors: Sector[];
  selectedSectorId: string | null;
  setSelectedSector: (id: string | null) => void;
  createSector: (sector: Omit<Sector, "id">) => void;
};

export const useSectorStore = create<SectorState>((set) => ({
  sectors: DEFAULT_SECTORS,
  selectedSectorId: null,
  setSelectedSector: (id) => set({ selectedSectorId: id }),
  createSector: (sector) =>
    set((state) => {
      const plan = usePlanStore.getState().currentPlan;
      const config = PLANS[plan];

      if (config.maxSectors !== null && state.sectors.length >= config.maxSectors) {
        alert(`Seu plano permite até ${config.maxSectors} setores`);
        return state;
      }

      const id = sector.name
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const uniqueId = id || `setor-${Date.now()}`;
      if (state.sectors.some((existing) => existing.id === uniqueId)) {
        return state;
      }

      return {
        sectors: [...state.sectors, { id: uniqueId, ...sector }],
      };
    }),
}));

export function pluralizeUnit(unit: string, quantity: number): string {
  const normalized = Math.abs(quantity) === 1 ? unit : `${unit}s`;
  return normalized;
}

