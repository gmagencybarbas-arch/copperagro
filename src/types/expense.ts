export type Expense = {
  id: string;
  sectorId?: string;
  date: string;
  description: string;
  amount: number;
};

export type ExpenseFilters = {
  dateFrom: string;
  dateTo: string;
  sectorId: string | "all";
};

