"use client";

import { BigNumber, CleanInput, PrimaryButton } from "@/design-system";
import { useDrawerStore } from "@/store/drawer-store";
import {
  DEFAULT_SECTOR_ID,
  pluralizeUnit,
  useSectorStore,
} from "@/store/sector-store";
import { useSalesStore } from "@/store/sales-store";
import { useEffect, useMemo, useRef, useState } from "react";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function StockEntryDrawer() {
  const open = useDrawerStore((s) => s.stockDrawerOpen);
  const close = useDrawerStore((s) => s.closeStockDrawer);
  const addStockEntry = useSalesStore((s) => s.addStockEntry);
  const sectors = useSectorStore((s) => s.sectors);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const currentSectorId = selectedSectorId ?? DEFAULT_SECTOR_ID;
  const currentSector =
    sectors.find((s) => s.id === currentSectorId) ?? sectors[0];
  const unit = currentSector?.unit ?? "unidade";

  const dateRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(todayISO);
  const [type, setType] = useState<"entry" | "exit">("entry");
  const [sectorId, setSectorId] = useState(currentSectorId);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setType("entry");
      setSectorId(currentSectorId);
      setQuantity(1);
      setNote("");
      setAttempted(false);
      requestAnimationFrame(() => {
        dateRef.current?.focus();
      });
    }
  }, [open, currentSectorId]);

  const qtyInvalid = attempted && quantity <= 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (quantity <= 0) return;

    addStockEntry({
      date,
      type,
      sectorId,
      quantity: Math.floor(Number(quantity)),
      note: note.trim() || undefined,
    });
    close();
  }

  function onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA") return;
    e.preventDefault();
    e.currentTarget.requestSubmit();
  }

  const previewHint = useMemo(() => {
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q) || q <= 0) return null;
    const current = sectors.find((s) => s.id === sectorId);
    const unitSel = current?.unit ?? unit;
    const signal = type === "entry" ? "+" : "-";
    return `${signal}${q.toLocaleString("pt-BR")} ${pluralizeUnit(unitSel, q)}`;
  }, [quantity, sectors, sectorId, type, unit]);

  if (!open) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/25 transition-opacity duration-200 ease-app ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={close}
      />
      <aside
        className={`app-drawer-surface fixed inset-y-0 right-0 z-[110] flex w-full flex-col border-l border-gray-200/90 bg-white shadow-[0_0_60px_-12px_rgba(15,23,42,0.25)] will-change-transform transition-transform duration-[300ms] ease-app sm:max-w-xl lg:max-w-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-entry-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Lançamento de estoque
            </p>
            <p
              id="stock-entry-title"
              className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 lg:text-[1.65rem]"
            >
              Registrar movimento
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Escolha setor, tipo, quantidade e data para lançar no estoque.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-xl p-2 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Fechar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={onFormKeyDown}
          className="flex flex-1 flex-col gap-8 overflow-y-auto px-8 py-8"
        >
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Data
            </label>
            <CleanInput
              ref={dateRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Setor
              </label>
              <select
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
              >
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "entry" | "exit")}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
              >
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Quantidade ({pluralizeUnit(sectors.find((s) => s.id === sectorId)?.unit ?? unit, 2)})
            </label>
            <CleanInput
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {qtyInvalid && (
              <p className="text-xs font-medium text-rose-800">
                Informe uma quantidade maior que zero.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Observação{" "}
              <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <CleanInput
              placeholder="Nota interna, lote, referência…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="rounded-[22px] border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-8 shadow-inner ring-1 ring-emerald-500/10 transition-all duration-300">
            <p className="text-sm font-semibold text-emerald-900/90">
              Pré-visualização
            </p>
            <BigNumber className="mt-2 text-[#15803d] lg:text-5xl">
              {previewHint ?? "—"}
            </BigNumber>
          </div>

          <div className="mt-auto flex gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" className="flex-1">
              Salvar movimento
            </PrimaryButton>
          </div>
        </form>
      </aside>
    </>
  );
}
