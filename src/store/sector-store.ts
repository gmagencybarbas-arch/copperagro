"use client";

import { persistSectorInsert, persistSectorUpdate } from "@/lib/db/persist";
import { DEFAULT_SECTOR_ICON, nextAvailableSectorColor } from "@/lib/sector-palette";
import type { Sector, SectorColorToken } from "@/types/sector";
import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import { create } from "zustand";

/** Templates de seed — o id real no banco é sempre UUID. */
export const DEFAULT_SECTORS: Sector[] = [
  { id: "cafe", name: "Café", unit: "saca", color: "green", icon: "coffee" },
  { id: "leite", name: "Leite", unit: "litro", color: "blue", icon: "milk" },
  { id: "bovino", name: "Bovino", unit: "arroba", color: "amber", icon: "beef" },
  { id: "hortifruti", name: "Hortifruti", unit: "caixa", color: "rose", icon: "sprout" },
];

/** Fallback legado; preferir `sectors[0]?.id` em runtime. */
export const DEFAULT_SECTOR_ID = "";

export function pickDefaultSectorId(
  sectors: Sector[],
  preferred?: string | null,
): string {
  if (preferred && sectors.some((s) => s.id === preferred)) return preferred;
  return sectors[0]?.id ?? "";
}

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
  updateSector: (id: string, input: CreateSectorInput) => boolean;
};

export const useSectorStore = create<SectorState>()((set) => ({
  sectors: [],
  selectedSectorId: null,
  setSelectedSector: (id) => set({ selectedSectorId: id }),
  updateSector: (id, input) => {
    let next: Sector | null = null;
    set((state) => {
      const name = input.name.trim();
      const unit = input.unit.trim();
      if (!name || !unit) return state;
      const iconRaw = input.icon?.trim() ?? "";
      const icon = iconRaw.length > 0 ? iconRaw : DEFAULT_SECTOR_ICON;
      const current = state.sectors.find((s) => s.id === id);
      if (!current) return state;
      next = {
        ...current,
        name,
        unit,
        icon,
        ...(input.color ? { color: input.color } : {}),
      };
      return {
        sectors: state.sectors.map((s) => (s.id === id ? next! : s)),
      };
    });
    if (next) void persistSectorUpdate(next as Sector);
    return Boolean(next);
  },
  createSector: (input) => {
    let created: Sector | null = null;
    set((state) => {
      const plan = usePlanStore.getState().currentPlan;
      const config = PLANS[plan];

      if (config.maxSectors !== null && state.sectors.length >= config.maxSectors) {
        alert(`Seu plano permite até ${config.maxSectors} setores`);
        return state;
      }

      const name = input.name.trim();
      if (!name) return state;

      const uniqueId =
        crypto.randomUUID?.() ??
        `setor_${Date.now()}_${Math.random().toString(16).slice(2)}`;

      const color = input.color ?? nextAvailableSectorColor(state.sectors);
      const iconRaw = input.icon?.trim() ?? "";
      const icon = iconRaw.length > 0 ? iconRaw : DEFAULT_SECTOR_ICON;

      created = {
        id: uniqueId,
        name,
        unit: input.unit,
        color,
        icon,
      };
      return {
        sectors: [...state.sectors, created],
      };
    });
    if (created) void persistSectorInsert(created as Sector);
    return (created as Sector | null)?.id ?? null;
  },
}));

export function pluralizeUnit(unit: string, quantity: number): string {
  const normalized = Math.abs(quantity) === 1 ? unit : `${unit}s`;
  return normalized;
}
