"use client";

import { SECTOR_ICON_LIBRARY, SectorGlyph, type SectorIconToken } from "@/components/sector/sector-icon";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; unit: string; icon?: string }) => void;
};

/**
 * Modal de criação de setor (Infinity): sem seletor de cor.
 */
export function SectorCreateModal({ open, onClose, onSubmit }: Props) {
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [iconToken, setIconToken] = useState<SectorIconToken | null>(null);
  const [attempted, setAttempted] = useState(false);

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
      setName("");
      setUnit("");
      setIconToken(null);
      setAttempted(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;
  const invalid = attempted && (!name.trim() || !unit.trim());

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Criar setor">
      <button
        type="button"
        className={`absolute inset-0 bg-black/25 transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl transition-[transform,opacity] duration-200 dark:border-slate-700 dark:bg-slate-900 ${
          entered ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            Novo setor
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            const n = name.trim();
            const u = unit.trim();
            if (!n || !u) return;
            onSubmit({ name: n, unit: u, icon: iconToken ?? undefined });
          }}
        >
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Nome do setor
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Café especial"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#166534]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Unidade de medida
            </label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Ex.: saca, litro, arroba"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#166534]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Ícone (opcional)
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {SECTOR_ICON_LIBRARY.map((item) => {
                const active = iconToken === item.token;
                return (
                  <button
                    key={item.token}
                    type="button"
                    onClick={() => setIconToken(item.token)}
                    className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                      active
                        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-label={item.label}
                  >
                    <span className="mx-auto flex h-5 w-5 items-center justify-center">
                      <SectorGlyph icon={item.token} className="h-4 w-4" />
                    </span>
                    <span className="mt-1 block truncate text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setIconToken(null)}
              className="mt-2 text-xs font-medium text-gray-500 underline-offset-2 hover:underline"
            >
              Sem ícone específico (usar padrão 📦)
            </button>
            <p className="mt-1 text-[11px] text-gray-500">
              Cor é atribuída automaticamente pela paleta. Sem seletor livre.
            </p>
          </div>

          {invalid && (
            <p className="text-sm font-medium text-rose-700">
              Preencha nome e unidade para criar o setor.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#14532d]"
            >
              Criar setor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
