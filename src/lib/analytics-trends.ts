import { addDaysISO, lastNDaysWindow, totalAmount } from "@/lib/expense-analytics";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL } from "@/types/expense";
import type { Expense } from "@/types/expense";

/**
 * Categoria de despesa com maior aumento % entre a janela de 30d mais recente e a janela anterior.
 */
export function highestCategoryCostDelta(
  expenses: Expense[],
): { label: string; pct: number; category: (typeof EXPENSE_CATEGORIES)[number] } | null {
  if (expenses.length === 0) return null;
  const { from: aFrom, to: aTo } = lastNDaysWindow(30);
  const bFrom = addDaysISO(aFrom, -30);
  const bTo = addDaysISO(aTo, -30);

  let best: { label: string; pct: number; category: (typeof EXPENSE_CATEGORIES)[number] } | null =
    null;
  for (const cat of EXPENSE_CATEGORIES) {
    const cur = totalAmount(
      expenses.filter(
        (e) => e.category === cat && e.date >= aFrom && e.date <= aTo,
      ),
    );
    const prev = totalAmount(
      expenses.filter(
        (e) => e.category === cat && e.date >= bFrom && e.date <= bTo,
      ),
    );
    if (cur <= 0) continue;
    const base = prev > 0 ? prev : 0.5;
    const pct = ((cur - (prev > 0 ? prev : 0)) / base) * 100;
    if (pct <= 0) continue;
    if (!best || pct > best.pct) {
      best = {
        label: EXPENSE_CATEGORY_LABEL[cat],
        pct,
        category: cat,
      };
    }
  }
  return best;
}
