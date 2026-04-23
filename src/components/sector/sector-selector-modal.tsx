"use client";

import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import { useSectorStore } from "@/store/sector-store";
import type { Sector } from "@/types/sector";
import { Building2, Coffee, Milk, Plus, Sprout, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const SECTOR_ICONS: Record<string, ReactNode> = {
  cafe: <Coffee className="h-5 w-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />,
  leite: <Milk className="h-5 w-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />,
  bovino: <Building2 className="h-5 w-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />,
  hortifruti: <Sprout className="h-5 w-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />,
};

function sectorIcon(s: Sector): ReactNode {
  return SECTOR_ICONS[s.id] ?? <Building2 className="h-5 w-5 text-gray-500" strokeWidth={1.75} />;
}

type SectorSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectSector: (sectorId: string) => void;
};

export function SectorSelectorModal({
  open,
  onClose,
  onSelectSector,
}: SectorSelectorModalProps) {
  const sectors = useSectorStore((s) => s.sectors);
  const createSector = useSectorStore((s) => s.createSector);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const [entered, setEntered] = useState(false);

  const canCreateSector = useMemo(() => {
    const max = PLANS[currentPlan].maxSectors;
    return max === null || sectors.length < max;
  }, [currentPlan, sectors.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Selecionar setor"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ease-app ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg transition-[transform,opacity] duration-[220ms] ease-app dark:border dark:border-slate-600 dark:bg-slate-900 ${
          entered ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            Selecionar setor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-transform hover:bg-gray-100 active:scale-95 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="flex max-h-[min(50vh,360px)] flex-col gap-2 overflow-y-auto overscroll-contain">
          {sectors.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelectSector(s.id)}
                className="flex w-full items-center gap-3 rounded-xl p-4 text-left text-base font-medium text-gray-900 transition-transform hover:bg-gray-100 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800/80">
                  {sectorIcon(s)}
                </span>
                <span>{s.name}</span>
              </button>
            </li>
          ))}
        </ul>

        {canCreateSector && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("Nome do novo setor", "");
                if (!name?.trim()) return;
                createSector({ name: name.trim(), unit: "saca" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-3 text-sm font-semibold text-gray-800 transition-transform hover:border-gray-300 hover:bg-gray-100 active:scale-[0.99] dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              + Criar novo setor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
