import type { Sector, SectorColorToken } from "@/types/sector";

/**
 * Ordem de atribuição automática: sem repetição até esgotar a lista, depois ciclo.
 */
export const SECTOR_COLOR_TOKENS: readonly SectorColorToken[] = [
  "green",
  "blue",
  "amber",
  "rose",
  "purple",
  "teal",
] as const;

/** Cores de gráfico (SVG) — coerente em todos os gráficos por setor */
export const SECTOR_CHART_HEX: Record<SectorColorToken, string> = {
  green: "#1f7a63",
  blue: "#2563eb",
  amber: "#d97706",
  rose: "#e11d48",
  purple: "#7c3aed",
  teal: "#0d9488",
};

/**
 * Acento em UI: borda/ fundo muito leve; ícone e nome têm prioridade.
 */
export const SECTOR_ACCENT: Record<SectorColorToken, string> = {
  green: "border-l-emerald-600 bg-emerald-50/30",
  blue: "border-l-blue-600 bg-blue-50/30",
  amber: "border-l-amber-500 bg-amber-50/40",
  rose: "border-l-rose-600 bg-rose-50/30",
  purple: "border-l-violet-600 bg-violet-50/30",
  teal: "border-l-teal-600 bg-teal-50/30",
};

/** Aba ativa (contraste) */
export const SECTOR_TAB_ACTIVE: Record<SectorColorToken, string> = {
  green: "bg-[#1f7a63] text-white shadow-md ring-1 ring-emerald-600/30",
  blue: "bg-blue-600 text-white shadow-md ring-1 ring-blue-500/30",
  amber: "bg-amber-600 text-white shadow-md ring-1 ring-amber-500/30",
  rose: "bg-rose-600 text-white shadow-md ring-1 ring-rose-500/30",
  purple: "bg-violet-600 text-white shadow-md ring-1 ring-violet-500/30",
  teal: "bg-teal-600 text-white shadow-md ring-1 ring-teal-500/30",
};

export const DEFAULT_SECTOR_ICON = "boxes";

export function isSectorColorToken(s: string): s is SectorColorToken {
  return (SECTOR_COLOR_TOKENS as readonly string[]).includes(s);
}

/**
 * Próxima cor sem duplicar enquanto houver opções; depois reutiliza por ordem.
 */
export function nextAvailableSectorColor(
  existing: { color: SectorColorToken }[],
): SectorColorToken {
  const used = new Set(existing.map((e) => e.color));
  for (const t of SECTOR_COLOR_TOKENS) {
    if (!used.has(t)) return t;
  }
  return SECTOR_COLOR_TOKENS[existing.length % SECTOR_COLOR_TOKENS.length]!;
}

export function chartHexForSector(sector: Pick<Sector, "color"> | undefined, fallback: SectorColorToken = "green"): string {
  if (!sector?.color) return SECTOR_CHART_HEX[fallback];
  return SECTOR_CHART_HEX[sector.color] ?? SECTOR_CHART_HEX[fallback];
}

/** Ponto global de despesas / sem setor: identidade fixa (não é setor). */
export const NON_SECTOR_PIE_COLOR: SectorColorToken = "teal";

/** Barras (despesas por setor): gradiente por token */
export const SECTOR_BAR_GRADIENT: Record<SectorColorToken, string> = {
  green: "from-emerald-300 to-[#1f7a63] dark:from-emerald-900/60 dark:to-emerald-700/90",
  blue: "from-blue-300 to-blue-600 dark:from-blue-900/60 dark:to-blue-600/90",
  amber: "from-amber-300 to-amber-600 dark:from-amber-900/60 dark:to-amber-600/90",
  rose: "from-rose-300 to-rose-600 dark:from-rose-900/60 dark:to-rose-600/90",
  purple: "from-violet-300 to-violet-600 dark:from-violet-900/60 dark:to-violet-600/90",
  teal: "from-teal-300 to-teal-600 dark:from-teal-900/60 dark:to-teal-600/90",
};

