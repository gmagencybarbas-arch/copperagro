"use client";

import { EditRecordModal } from "@/components/edit-record-modal";
import { CleanInput } from "@/design-system";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import type { StockMovement } from "@/types/sale";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function StockEditModal({
  movement,
  onClose,
}: {
  movement: StockMovement;
  onClose: () => void;
}) {
  const sectors = useSectorStore((s) => s.sectors);
  const updateStockMovement = useSalesStore((s) => s.updateStockMovement);
  const deleteStockMovement = useSalesStore((s) => s.deleteStockMovement);
  const locked = Boolean(movement.relatedSaleId);
  const [date, setDate] = useState(movement.date);
  const [type, setType] = useState(movement.type);
  const [quantity, setQuantity] = useState(movement.quantity);
  const [sectorId, setSectorId] = useState(movement.sectorId);
  const [note, setNote] = useState(movement.note ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <EditRecordModal
      title={type === "entry" ? "Entrada de estoque" : "Saída de estoque"}
      subtitle={
        locked
          ? "Esta saída veio de uma venda. Edita ou exclui pela venda registrada."
          : "Altera o que estiver errado e salva, ou exclui o lançamento."
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              if (!window.confirm("Excluir este movimento de estoque?")) return;
              if (!deleteStockMovement(movement.id)) {
                setError("Não deu para excluir este movimento.");
                return;
              }
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-rose-800 shadow-sm hover:bg-rose-50 disabled:opacity-40"
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
              disabled={locked}
              onClick={() => {
                const ok = updateStockMovement(movement.id, {
                  date,
                  type,
                  quantity,
                  sectorId,
                  note,
                });
                if (!ok) {
                  setError("Qtd. inválida ou estoque insuficiente para esta saída.");
                  return;
                }
                onClose();
              }}
              className="rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
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
        <CleanInput
          type="date"
          value={date}
          disabled={locked}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Tipo
        </span>
        <select
          value={type}
          disabled={locked}
          onChange={(e) => setType(e.target.value as "entry" | "exit")}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="entry">Entrada</option>
          <option value="exit">Saída</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Qtd.
        </span>
        <CleanInput
          type="number"
          min={1}
          step={1}
          value={quantity}
          disabled={locked}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="tabular-nums"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Setor
        </span>
        <select
          value={sectorId}
          disabled={locked}
          onChange={(e) => setSectorId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800"
        >
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Observação
        </span>
        <CleanInput
          value={note}
          disabled={locked}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm font-medium text-rose-800">{error}</p> : null}
    </EditRecordModal>
  );
}
