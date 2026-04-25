"use client";

import { DEFAULT_SECTOR_ICON, nextAvailableSectorColor } from "@/lib/sector-palette";
import type { Sector, SectorColorToken } from "@/types/sector";
import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import { create } from "zustand";

export const DEFAULT_SECTORS: Sector[] = [
  { id: "cafe", name: "Café", unit: "saca", color: "green", icon: "coffee" },
  { id: "leite", name: "Leite", unit: "litro", color: "blue", icon: "milk" },
  { id: "bovino", name: "Bovino", unit: "arroba", color: "amber", icon: "beef" },
  { id: "hortifruti", name: "Hortifruti", unit: "caixa", color: "rose", icon: "sprout" },
];

export const DEFAULT_SECTOR_ID = DEFAULT_SECTORS[0].id;

export type CreateSectorInput = {
  name: string;
  unit: string;
  color?: SectorColorToken;
  icon?: string;
};

type SectorState = {
  sectors: Sector[];
  selectedSectorId: string | null;
  setSelectedSector: (id: string | null) => void;
  createSector: (input: CreateSectorInput) => string | null;
};

export const useSectorStore = create<SectorState>((set) => ({
  sectors: DEFAULT_SECTORS,
  selectedSectorId: null,
  setSelectedSector: (id) => set({ selectedSectorId: id }),
  createSector: (input) => {
    let createdId: string | null = null;
    set((state) => {
      const plan = usePlanStore.getState().currentPlan;
      const config = PLANS[plan];

      if (config.maxSectors !== null && state.sectors.length >= config.maxSectors) {
        alert(`Seu plano permite até ${config.maxSectors} setores`);
        return state;
      }

      const name = input.name.trim();
      if (!name) return state;

      const id = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const uniqueId = id || `setor-${Date.now()}`;
      if (state.sectors.some((existing) => existing.id === uniqueId)) {
        return state;
      }

      const color = input.color ?? nextAvailableSectorColor(state.sectors);
      const iconRaw = input.icon?.trim() ?? "";
      const icon = iconRaw.length > 0 ? iconRaw : DEFAULT_SECTOR_ICON;

      createdId = uniqueId;
      return {
        sectors: [
          ...state.sectors,
          {
            id: uniqueId,
            name,
            unit: input.unit,
            color,
            icon,
          },
        ],
      };
    });
    return createdId;
  },
}));

export function pluralizeUnit(unit: string, quantity: number): string {
  const normalized = Math.abs(quantity) === 1 ? unit : `${unit}s`;
  return normalized;
}

