"use client";

import { BigNumber, CleanInput, PrimaryButton } from "@/design-system";
import { useDrawerStore } from "@/store/drawer-store";
import { useExpenseStore } from "@/store/expense-store";
import { useSectorStore } from "@/store/sector-store";
import { formatBRLFine } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function ExpenseDrawer() {
  const open = useDrawerStore((s) => s.expenseDrawerOpen);
  const close = useDrawerStore((s) => s.closeExpenseDrawer);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const sectors = useSectorStore((s) => s.sectors);
  const dateRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [sectorId, setSectorId] = useState<string>("global");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setAmount(0);
    setDescription("");
    setSectorId("global");
    setAttempted(false);
    requestAnimationFrame(() => dateRef.current?.focus());
  }, [open]);

  if (!open) return null;

  const invalid = attempted && (amount <= 0 || !description.trim());

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]" onClick={close} />
      <aside
        className="fixed inset-y-0 right-0 z-[110] flex w-full max-w-xl flex-col border-l border-gray-200/90 bg-white shadow-[0_0_60px_-12px_rgba(15,23,42,0.35)]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
              Lançar despesa
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Nova despesa
            </p>
          </div>
          <button type="button" onClick={close} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100">
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAttempted(true);
            if (amount <= 0 || !description.trim()) return;
            addExpense({
              date,
              amount,
              description: description.trim(),
              sectorId: sectorId === "global" ? undefined : sectorId,
            });
            close();
          }}
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-8"
        >
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Data</label>
            <CleanInput ref={dateRef} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Valor</label>
            <CleanInput type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Descrição</label>
            <CleanInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Frete, adubo, manutenção..." />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Setor</label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
            >
              <option value="global">Global</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[22px] border border-red-100 bg-red-50/70 p-6">
            <p className="text-sm font-semibold text-red-900">Pré-visualização</p>
            <BigNumber className="mt-2 text-red-700">{amount > 0 ? `-${formatBRLFine(amount)}` : "—"}</BigNumber>
          </div>
          {invalid && <p className="text-sm font-medium text-red-600">Preencha valor e descrição.</p>}

          <div className="mt-auto flex gap-3">
            <button type="button" onClick={close} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              Cancelar
            </button>
            <PrimaryButton type="submit" className="flex-1">
              Salvar despesa
            </PrimaryButton>
          </div>
        </form>
      </aside>
    </>
  );
}

