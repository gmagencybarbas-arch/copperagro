import type { Sale } from "@/types/sale";

/** % de diferença do preço unitário face à média de referência */
export function pctDiffVsAvg(
  unitPrice: number,
  avg: number | null | undefined,
): number | null {
  if (avg == null || avg <= 0 || !Number.isFinite(unitPrice)) return null;
  return ((unitPrice - avg) / avg) * 100;
}

export function formatPctDelta(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/**
 * Ordenação estável: menor R$/saca primeiro, depois data, depois id.
 * Para cada venda, % do preço unitário face ao **lançamento anterior** nessa ordem
 * (comparativo dentro do período filtrado).
 */
export function pctDiffVsPreviousByUnitPriceAsc(
  sales: Sale[],
): Map<string, number | null> {
  const sorted = [...sales].sort((a, b) => {
    if (a.unitPrice !== b.unitPrice) return a.unitPrice - b.unitPrice;
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
  const map = new Map<string, number | null>();
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    if (i === 0) {
      map.set(cur.id, null);
      continue;
    }
    const prev = sorted[i - 1]!;
    map.set(cur.id, pctDiffVsAvg(cur.unitPrice, prev.unitPrice));
  }
  return map;
}

/**
 * % da diferença do **valor total** da linha face ao **menor total**
 * entre todas as vendas do conjunto filtrado (0% na linha que é o mínimo).
 */
export function pctDiffTotalVsMinTotal(
  sales: Sale[],
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  if (sales.length === 0) return map;
  const minT = Math.min(...sales.map((s) => s.totalPrice));
  if (!Number.isFinite(minT) || minT <= 0) {
    for (const s of sales) map.set(s.id, null);
    return map;
  }
  for (const s of sales) {
    map.set(s.id, ((s.totalPrice - minT) / minT) * 100);
  }
  return map;
}
