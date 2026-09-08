import type { AgroLaunchDraft, AgroLaunchValidation } from "@/lib/agro-ai/types";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import { computeStockSnapshot } from "@/store/sales-store";
import type { StockMovement } from "@/types/sale";

export type ValidateContext = {
  sectorIds: Set<string>;
  stockTotalSacas: number;
  stockMovements: StockMovement[];
  /** Ajuste virtual de estoque por setor (entradas já confirmadas no mesmo lote) */
  pendingStockDelta?: Map<string, number>;
};

export function validateAgroLaunch(
  launch: AgroLaunchDraft,
  ctx: ValidateContext,
): AgroLaunchValidation {
  const errors: AgroLaunchValidation["errors"] = {};

  if (!launch.date || !/^\d{4}-\d{2}-\d{2}$/.test(launch.date)) {
    errors.date = "Informe uma data válida.";
  }

  if (launch.type === "sale") {
    if (!launch.sectorId || !ctx.sectorIds.has(launch.sectorId)) {
      errors.sectorId = "Selecione o setor antes de confirmar.";
    }
    const qty = launch.quantity;
    if (qty == null || !Number.isInteger(qty) || qty <= 0) {
      errors.quantity = "A quantidade precisa ser um número inteiro maior que zero.";
    }
    if (launch.unitPrice == null || !(launch.unitPrice > 0)) {
      errors.unitPrice = "Informe o preço unitário maior que zero.";
    }
    if (!launch.buyer.trim()) {
      errors.buyer = "Informe o comprador desta venda.";
    }
    if (!errors.sectorId && !errors.quantity && qty != null) {
      const snap = computeStockSnapshot(
        ctx.stockTotalSacas,
        ctx.stockMovements,
        launch.sectorId,
      );
      const delta = ctx.pendingStockDelta?.get(launch.sectorId) ?? 0;
      const available = snap.remaining + delta;
      if (qty > available) {
        errors.stock = `Não há estoque suficiente de ${launch.sectorName || "setor"}. Disponível: ${available}. Venda informada: ${qty}.`;
      }
    }
  }

  if (launch.type === "expense") {
    if (launch.sectorId && !ctx.sectorIds.has(launch.sectorId)) {
      errors.sectorId = "Setor inválido. Escolha um setor da lista ou deixe geral.";
    }
    if (launch.amount == null || !(launch.amount > 0)) {
      errors.amount = "O valor da despesa precisa ser maior que zero.";
    }
    const desc = launch.description.trim() || launch.note.trim();
    if (!desc) {
      errors.description = "Informe a descrição da despesa.";
    }
    if (
      !launch.category ||
      !(EXPENSE_CATEGORIES as readonly string[]).includes(launch.category)
    ) {
      errors.category = "Categoria inválida. Escolha uma das categorias disponíveis.";
    }
  }

  if (launch.type === "stock") {
    if (!launch.sectorId || !ctx.sectorIds.has(launch.sectorId)) {
      errors.sectorId = "Selecione o setor antes de confirmar.";
    }
    const qty = launch.quantity;
    if (qty == null || !Number.isInteger(qty) || qty <= 0) {
      errors.quantity = "A quantidade precisa ser um número inteiro maior que zero.";
    }
    if (launch.stockType !== "entry" && launch.stockType !== "exit") {
      errors.stockType = "Escolha se é entrada ou saída de estoque.";
    }
    if (
      launch.stockType === "exit" &&
      !errors.sectorId &&
      !errors.quantity &&
      qty != null
    ) {
      const snap = computeStockSnapshot(
        ctx.stockTotalSacas,
        ctx.stockMovements,
        launch.sectorId,
      );
      const delta = ctx.pendingStockDelta?.get(launch.sectorId) ?? 0;
      const available = snap.remaining + delta;
      if (qty > available) {
        errors.stock = `Não há estoque suficiente de ${launch.sectorName || "setor"}. Disponível: ${available}. Saída informada: ${qty}.`;
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Ordem segura: entradas → despesas → vendas → saídas manuais */
export function sortLaunchesForCommit(
  items: AgroLaunchDraft[],
): AgroLaunchDraft[] {
  const rank = (d: AgroLaunchDraft) => {
    if (d.type === "stock" && d.stockType === "entry") return 0;
    if (d.type === "expense") return 1;
    if (d.type === "sale") return 2;
    if (d.type === "stock" && d.stockType === "exit") return 3;
    return 4;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}
