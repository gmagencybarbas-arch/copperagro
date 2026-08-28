"use client";

import {
  DEFAULT_EXPENSE_CATEGORY,
} from "@/lib/expense-migrate";
import { persistExpense } from "@/lib/db/persist";
import type { Expense, ExpenseCategory, ExpenseFilters } from "@/types/expense";
import { create } from "zustand";

function uid(): string {
  return (
    crypto.randomUUID?.() ??
    `exp_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

type ExpenseState = {
  expenses: Expense[];
  filters: ExpenseFilters;
  addExpense: (input: Omit<Expense, "id">) => void;
  setFilters: (patch: Partial<ExpenseFilters>) => void;
  clearFilters: () => void;
};

const defaultFilters: ExpenseFilters = {
  dateFrom: "",
  dateTo: "",
  sectorId: "all",
};

export const useExpenseStore = create<ExpenseState>()((set) => ({
  expenses: [],
  filters: defaultFilters,

  addExpense: (input) => {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!input.description.trim()) return;
    const category: ExpenseCategory = input.category ?? DEFAULT_EXPENSE_CATEGORY;
    const expense: Expense = {
      id: uid(),
      date: input.date || todayISO(),
      description: input.description.trim(),
      amount,
      category,
      sectorId: input.sectorId || undefined,
    };
    set((s) => ({ expenses: [expense, ...s.expenses] }));
    void persistExpense(expense);
  },

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: defaultFilters }),
}));
