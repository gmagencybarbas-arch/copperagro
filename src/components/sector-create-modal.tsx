"use client";

import { SECTOR_ICON_LIBRARY, SectorGlyph, type SectorIconToken } from "@/components/sector/sector-icon";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; unit: string; icon?: string }) => void;
  mode?: "create" | "edit";
  initial?: { name: string; unit: string; icon?: string };
};

/**
 * Modal de criação/edição de setor: sem seletor de cor.
 */
export function SectorCreateModal({ open, onClose, onSubmit, mode = "create", initial }: Props) {
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [iconToken, setIconToken] = useState<SectorIconToken | null>(null);
  const [attempted, setAttempted] = useState(false);
  const isEdit = mode === "edit";

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
    setName(initial?.name ?? "");
    setUnit(initial?.unit ?? "");
    const token = initial?.icon;
    setIconToken(
      token && SECTOR_ICON_LIBRARY.some((i) => i.token === token)
        ? (token as SectorIconToken)
        : null,
    );
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open, initial]);

  if (!open) return null;
  const invalid = attempted && (!name.trim() || !unit.trim());

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Editar categoria" : "Criar setor"}
    >
      <button
        type="button"
        className={`fixed inset-0 bg-black/25 transition-opacity duration-200 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative flex min-h-[100dvh] items-end justify-center px-3 py-4 sm:items-center sm:p-6">
      <div
        className={`relative mb-[max(0.75rem,env(safe-area-inset-bottom))] flex max-h-[min(92dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-[transform,opacity] duration-200 dark:border-slate-700 dark:bg-slate-900 ${
          entered ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-5 py-3 dark:border-slate-800">
          <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            {isEdit ? "Editar categoria" : "Novo setor"}
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
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            const n = name.trim();
            const u = unit.trim();
            if (!n || !u) return;
            onSubmit({ name: n, unit: u, icon: iconToken ?? undefined });
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {isEdit ? "Nome da categoria" : "Nome do setor"}
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
                Preencha nome e unidade para {isEdit ? "salvar" : "criar o setor"}.
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
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
              {isEdit ? "Salvar alterações" : "Criar setor"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
