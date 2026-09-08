import type { AgroLaunchDraft } from "@/lib/agro-ai/types";
import {
  sortLaunchesForCommit,
  validateAgroLaunch,
  type ValidateContext,
} from "@/lib/agro-ai/validate";

export type CommitHandlers = {
  addSale: (input: {
    sectorId: string;
    date: string;
    quantity: number;
    unitPrice: number;
    buyer: string;
  }) => boolean;
  addExpense: (input: {
    sectorId?: string;
    date: string;
    amount: number;
    description: string;
    category: NonNullable<AgroLaunchDraft["category"]>;
  }) => boolean;
  addStockEntry: (input: {
    sectorId: string;
    date: string;
    quantity: number;
    type: "entry" | "exit";
    note?: string;
  }) => boolean;
  getContext: () => ValidateContext;
};

export type CommitResult = {
  localId: string;
  ok: boolean;
  error?: string;
};

/**
 * Confirma um subconjunto de drafts na ordem segura.
 * Atualiza pendingStockDelta entre itens do mesmo lote.
 */
export function commitAgroLaunches(
  items: AgroLaunchDraft[],
  handlers: CommitHandlers,
): CommitResult[] {
  const ordered = sortLaunchesForCommit(
    items.filter((i) => i.status === "pending"),
  );
  const results: CommitResult[] = [];
  const pendingStockDelta = new Map<string, number>();

  for (const item of ordered) {
    const ctx = handlers.getContext();
    ctx.pendingStockDelta = pendingStockDelta;
    const validation = validateAgroLaunch(item, ctx);
    if (!validation.valid) {
      const first =
        Object.values(validation.errors)[0] ?? "Corrige os campos antes de confirmar.";
      results.push({ localId: item.localId, ok: false, error: first });
      continue;
    }

    try {
      if (item.type === "sale") {
        const ok = handlers.addSale({
          sectorId: item.sectorId,
          date: item.date,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          buyer: item.buyer.trim(),
        });
        if (!ok) {
          results.push({
            localId: item.localId,
            ok: false,
            error:
              validation.errors.stock ??
              "Não foi possível gravar a venda (estoque insuficiente ou dados inválidos).",
          });
          continue;
        }
        pendingStockDelta.set(
          item.sectorId,
          (pendingStockDelta.get(item.sectorId) ?? 0) - item.quantity!,
        );
        results.push({ localId: item.localId, ok: true });
        continue;
      }

      if (item.type === "expense") {
        const ok = handlers.addExpense({
          sectorId: item.sectorId || undefined,
          date: item.date,
          amount: item.amount!,
          description:
            item.description.trim() || item.note.trim() || "Despesa",
          category: item.category ?? "outros",
        });
        if (!ok) {
          results.push({
            localId: item.localId,
            ok: false,
            error: "Não foi possível gravar a despesa.",
          });
          continue;
        }
        results.push({ localId: item.localId, ok: true });
        continue;
      }

      // stock
      const kind = item.stockType === "exit" ? "exit" : "entry";
      const ok = handlers.addStockEntry({
        sectorId: item.sectorId,
        date: item.date,
        quantity: item.quantity!,
        type: kind,
        note: item.note.trim() || undefined,
      });
      if (!ok) {
        results.push({
          localId: item.localId,
          ok: false,
          error:
            kind === "exit"
              ? "Saída bloqueada: estoque insuficiente."
              : "Não foi possível gravar o movimento de estoque.",
        });
        continue;
      }
      const sign = kind === "entry" ? 1 : -1;
      pendingStockDelta.set(
        item.sectorId,
        (pendingStockDelta.get(item.sectorId) ?? 0) + sign * item.quantity!,
      );
      results.push({ localId: item.localId, ok: true });
    } catch {
      results.push({
        localId: item.localId,
        ok: false,
        error: "Falha inesperada ao gravar. Tenta de novo.",
      });
    }
  }

  return results;
}
