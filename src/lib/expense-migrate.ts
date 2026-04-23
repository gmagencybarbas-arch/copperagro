import type { Expense, ExpenseCategory } from "@/types/expense";
import { EXPENSE_CATEGORIES } from "@/types/expense";

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategory = "outros";

function isCategory(x: unknown): x is ExpenseCategory {
  return (
    typeof x === "string" && (EXPENSE_CATEGORIES as readonly string[]).includes(x)
  );
}

/** Garante `Expense` completo a partir de dados persistidos (versões antigas). */
export function normalizeExpense(row: Expense | Record<string, unknown>): Expense {
  const o = row as Record<string, unknown>;
  return {
    id: String(o.id ?? ""),
    date: String(o.date ?? ""),
    description: String(o.description ?? ""),
    amount: Number(o.amount) || 0,
    sectorId:
      o.sectorId === undefined || o.sectorId === null
        ? undefined
        : String(o.sectorId),
    category: isCategory(o.category) ? o.category : DEFAULT_EXPENSE_CATEGORY,
  };
}
