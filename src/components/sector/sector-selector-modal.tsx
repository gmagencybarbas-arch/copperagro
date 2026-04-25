"use client";

import { SectorGlyph } from "@/components/sector/sector-icon";
import { SECTOR_CHART_HEX } from "@/lib/sector-palette";
import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import { useSectorStore } from "@/store/sector-store";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SectorSelectorModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectSector: (sectorId: string) => void;
  onRequestCreateSector?: () => void;
};

export function SectorSelectorModal({
  open,
  onClose,
  onSelectSector,
  onRequestCreateSector,
}: SectorSelectorModalProps) {
  const sectors = useSectorStore((s) => s.sectors);
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
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-base font-medium text-gray-900 transition-transform hover:bg-gray-100 active:scale-95 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 dark:border-slate-600 dark:bg-slate-800/80"
                  aria-hidden
                >
                  <SectorGlyph icon={s.icon} sectorId={s.id} className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-tight">{s.name}</span>
                  <span
                    className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-gray-500"
                    aria-label={`cor ${s.color}`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: SECTOR_CHART_HEX[s.color] }}
                    />
                    {s.unit}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {canCreateSector && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestCreateSector?.();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 py-3 text-sm font-semibold text-gray-800 transition-transform hover:border-gray-300 hover:bg-gray-100 active:scale-[0.99] dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              + Criar novo setor
            </button>
            <p className="mt-2 text-center text-[10px] text-gray-500">
              Cor automática. Ícone escolhido na biblioteca (ou padrão 📦).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
