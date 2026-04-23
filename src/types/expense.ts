export const EXPENSE_CATEGORIES = [
  "combustível",
  "manutenção",
  "mão de obra",
  "insumos",
  "outros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  combustível: "Combustível",
  manutenção: "Manutenção",
  "mão de obra": "Mão de obra",
  insumos: "Insumos",
  outros: "Outros",
};

export type Expense = {
  id: string;
  sectorId?: string;
  date: string;
  description: string;
  amount: number;
  /** Classificação analítica (legados sem campo assumem "outros" após migração) */
  category: ExpenseCategory;
};

export type ExpenseFilters = {
  dateFrom: string;
  dateTo: string;
  sectorId: string | "all";
};

