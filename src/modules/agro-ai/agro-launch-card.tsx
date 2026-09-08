"use client";

import type { AgroLaunchDraft } from "@/lib/agro-ai/types";
import { validateAgroLaunch, type ValidateContext } from "@/lib/agro-ai/validate";
import { pluralizeUnit } from "@/store/sector-store";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
} from "@/types/expense";
import { Check, Pencil, X } from "lucide-react";

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

const fieldClass =
  "mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-base dark:border-white/10 dark:bg-slate-900";

const TYPE_LABEL: Record<AgroLaunchDraft["type"], string> = {
  sale: "Venda",
  expense: "Despesa",
  stock: "Estoque",
};

type SectorOpt = { id: string; name: string; unit: string };

type Props = {
  draft: AgroLaunchDraft;
  sectors: SectorOpt[];
  editing: boolean;
  validateCtx: ValidateContext;
  onToggleEdit: () => void;
  onChange: (patch: Partial<AgroLaunchDraft>) => void;
  onConfirm: () => void;
  onDiscard: () => void;
};

export function AgroLaunchCard({
  draft: d,
  sectors,
  editing,
  validateCtx,
  onToggleEdit,
  onChange,
  onConfirm,
  onDiscard,
}: Props) {
  const sector = sectors.find((s) => s.id === d.sectorId);
  const unit = sector?.unit ?? "unidade";
  const validation = validateAgroLaunch(d, validateCtx);
  const locked = d.status === "success" || d.status === "discarded";
  const canConfirm = d.status === "pending" || d.status === "error";

  const border =
    d.status === "success"
      ? "border-emerald-400/60 bg-emerald-50/80 dark:bg-emerald-950/40"
      : d.status === "error"
        ? "border-rose-300/70 bg-rose-50/70 dark:bg-rose-950/30"
        : d.status === "discarded"
          ? "border-black/5 bg-gray-50 opacity-70 dark:bg-slate-800/60"
          : "border-black/5 bg-white dark:border-white/10 dark:bg-slate-800";

  return (
    <div className={`max-w-[94%] rounded-2xl rounded-bl-sm border p-3.5 shadow-sm ${border}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:bg-white/10 dark:text-slate-200">
          {TYPE_LABEL[d.type]}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-slate-400">
          {formatDateBR(d.date)}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-[15px] leading-snug text-gray-900 dark:text-slate-50">
        {d.type === "sale" && (
          <>
            <p className="font-semibold">{d.sectorName || "Setor não definido"}</p>
            <p>
              {d.quantity ?? "?"} {pluralizeUnit(unit, d.quantity ?? 0)}
              {d.unitPrice != null ? ` · ${formatBRL(d.unitPrice)} / ${unit}` : ""}
            </p>
            <p className="text-gray-600 dark:text-slate-300">
              Comprador: {d.buyer.trim() || "—"}
            </p>
            {d.quantity != null && d.unitPrice != null && (
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Total: {formatBRL(d.quantity * d.unitPrice)}
              </p>
            )}
          </>
        )}
        {d.type === "expense" && (
          <>
            <p className="font-semibold">
              {d.category
                ? EXPENSE_CATEGORY_LABEL[d.category]
                : "Categoria ?"}
            </p>
            <p>
              {d.amount != null ? formatBRL(d.amount) : "Valor ?"}
            </p>
            <p className="text-gray-600 dark:text-slate-300">
              {d.sectorId
                ? d.sectorName || "Setor"
                : "Geral da fazenda"}
            </p>
            {(d.description || d.note) && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {d.description || d.note}
              </p>
            )}
          </>
        )}
        {d.type === "stock" && (
          <>
            <p className="font-semibold">{d.sectorName || "Setor não definido"}</p>
            <p>
              {d.stockType === "exit" ? "−" : "+"}
              {d.quantity ?? "?"} {pluralizeUnit(unit, d.quantity ?? 0)}
            </p>
            <p className="text-gray-600 dark:text-slate-300">
              {d.stockType === "exit"
                ? "Saída de estoque"
                : d.stockType === "entry"
                  ? "Entrada de estoque"
                  : "Tipo de movimento ?"}
            </p>
            {d.note.trim() && (
              <p className="text-sm text-gray-500">{d.note}</p>
            )}
          </>
        )}
      </div>

      {(d.status === "error" || (!validation.valid && canConfirm && !editing)) && (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
          {d.error ?? Object.values(validation.errors)[0]}
        </p>
      )}

      {d.status === "success" && (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          Registrado com sucesso
        </p>
      )}
      {d.status === "discarded" && (
        <p className="mt-2 text-sm text-gray-500">Descartado</p>
      )}

      {editing && canConfirm && (
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {(d.type === "sale" || d.type === "stock" || d.type === "expense") && (
            <label className="text-xs font-medium text-gray-500">
              Setor{d.type === "expense" ? " (opcional)" : ""}
              <select
                className={fieldClass}
                value={d.sectorId}
                onChange={(e) => {
                  const s = sectors.find((x) => x.id === e.target.value);
                  onChange({
                    sectorId: e.target.value,
                    sectorName: s?.name ?? "",
                    error: undefined,
                    status: "pending",
                  });
                }}
              >
                <option value="">
                  {d.type === "expense" ? "Geral da fazenda" : "Escolher"}
                </option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs font-medium text-gray-500">
            Data
            <input
              type="date"
              className={fieldClass}
              value={d.date}
              onChange={(e) =>
                onChange({ date: e.target.value, error: undefined, status: "pending" })
              }
            />
          </label>

          {d.type === "sale" && (
            <>
              <label className="text-xs font-medium text-gray-500">
                Quantidade
                <input
                  type="number"
                  inputMode="numeric"
                  className={fieldClass}
                  value={d.quantity ?? ""}
                  onChange={(e) =>
                    onChange({
                      quantity: e.target.value === "" ? null : Math.floor(Number(e.target.value)),
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium text-gray-500">
                Preço unitário
                <input
                  type="number"
                  inputMode="decimal"
                  className={fieldClass}
                  value={d.unitPrice ?? ""}
                  onChange={(e) =>
                    onChange({
                      unitPrice: e.target.value === "" ? null : Number(e.target.value),
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium text-gray-500 sm:col-span-2">
                Comprador
                <input
                  className={fieldClass}
                  value={d.buyer}
                  onChange={(e) =>
                    onChange({
                      buyer: e.target.value,
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
            </>
          )}

          {d.type === "expense" && (
            <>
              <label className="text-xs font-medium text-gray-500">
                Valor
                <input
                  type="number"
                  inputMode="decimal"
                  className={fieldClass}
                  value={d.amount ?? ""}
                  onChange={(e) =>
                    onChange({
                      amount: e.target.value === "" ? null : Number(e.target.value),
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium text-gray-500">
                Categoria
                <select
                  className={fieldClass}
                  value={d.category ?? ""}
                  onChange={(e) =>
                    onChange({
                      category: (e.target.value || null) as ExpenseCategory | null,
                      error: undefined,
                      status: "pending",
                    })
                  }
                >
                  <option value="">Escolher</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-gray-500 sm:col-span-2">
                Descrição
                <input
                  className={fieldClass}
                  value={d.description}
                  onChange={(e) =>
                    onChange({
                      description: e.target.value,
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
            </>
          )}

          {d.type === "stock" && (
            <>
              <label className="text-xs font-medium text-gray-500">
                Quantidade
                <input
                  type="number"
                  inputMode="numeric"
                  className={fieldClass}
                  value={d.quantity ?? ""}
                  onChange={(e) =>
                    onChange({
                      quantity: e.target.value === "" ? null : Math.floor(Number(e.target.value)),
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
              <label className="text-xs font-medium text-gray-500">
                Entrada / saída
                <select
                  className={fieldClass}
                  value={d.stockType ?? ""}
                  onChange={(e) =>
                    onChange({
                      stockType:
                        e.target.value === "entry" || e.target.value === "exit"
                          ? e.target.value
                          : null,
                      error: undefined,
                      status: "pending",
                    })
                  }
                >
                  <option value="">Escolher</option>
                  <option value="entry">Entrada</option>
                  <option value="exit">Saída</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-500 sm:col-span-2">
                Observação
                <input
                  className={fieldClass}
                  value={d.note}
                  onChange={(e) =>
                    onChange({
                      note: e.target.value,
                      error: undefined,
                      status: "pending",
                    })
                  }
                />
              </label>
            </>
          )}
        </div>
      )}

      {!locked && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canConfirm || !validation.valid}
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Check className="h-4 w-4" strokeWidth={2.2} />
            Confirmar
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-black/5 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:bg-white/10 dark:text-slate-100"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Fechar" : "Editar"}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-gray-500"
          >
            <X className="h-4 w-4" />
            Descartar
          </button>
        </div>
      )}
    </div>
  );
}
