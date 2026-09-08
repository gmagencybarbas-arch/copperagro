import type { ExpenseCategory } from "@/types/expense";

export type AgroLaunchType = "sale" | "expense" | "stock";

export type AgroLaunchStatus =
  | "pending"
  | "discarded"
  | "success"
  | "error";

/** Rascunho pendente vindo do parser / edição local */
export type AgroLaunchDraft = {
  localId: string;
  type: AgroLaunchType;
  sectorId: string;
  sectorName: string;
  date: string;
  quantity: number | null;
  unitPrice: number | null;
  buyer: string;
  amount: number | null;
  category: ExpenseCategory | null;
  description: string;
  stockType: "entry" | "exit" | null;
  note: string;
  status: AgroLaunchStatus;
  error?: string;
};

export type AgroLaunchValidation = {
  valid: boolean;
  errors: Partial<
    Record<
      | "sectorId"
      | "date"
      | "quantity"
      | "unitPrice"
      | "buyer"
      | "amount"
      | "category"
      | "description"
      | "stockType"
      | "stock",
      string
    >
  >;
};
