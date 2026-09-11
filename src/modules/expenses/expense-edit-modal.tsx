"use client";

import { EditRecordModal } from "@/components/edit-record-modal";
import { CleanInput } from "@/design-system";
import { useExpenseStore } from "@/store/expense-store";
import { useSectorStore } from "@/store/sector-store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type Expense,
  type ExpenseCategory,
} from "@/types/expense";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function ExpenseEditModal({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  const sectors = useSectorStore((s) => s.sectors);
  const updateExpense = useExpenseStore((s) => s.updateExpense);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const [date, setDate] = useState(expense.date);
  const [amount, setAmount] = useState(expense.amount);
  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [sectorId, setSectorId] = useState(expense.sectorId ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <EditRecordModal
      title="Despesa"
      subtitle="Altera o que estiver errado e salva, ou exclui o lançamento."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Excluir esta despesa?")) return;
              deleteExpense(expense.id);
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 shadow-sm hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                const ok = updateExpense(expense.id, {
                  date,
                  amount,
                  description,
                  category,
                  sectorId: sectorId || undefined,
                });
                if (!ok) {
                  setError("Preenche descrição e um valor maior que zero.");
                  return;
                }
                onClose();
              }}
              className="rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Salvar alterações
            </button>
          </div>
        </>
      }
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Data
        </span>
        <CleanInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Valor (R$)
        </span>
        <CleanInput
          type="number"
          min={0.01}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="tabular-nums"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Descrição
        </span>
        <CleanInput
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Categoria
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Setor
        </span>
        <select
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">Fazenda (geral)</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm font-medium text-rose-800">{error}</p> : null}
    </EditRecordModal>
  );
}
