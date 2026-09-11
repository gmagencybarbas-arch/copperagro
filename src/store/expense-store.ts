"use client";

import {
  DEFAULT_EXPENSE_CATEGORY,
} from "@/lib/expense-migrate";
import { persistExpense, persistExpenseDelete, persistExpenseUpdate } from "@/lib/db/persist";
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
  addExpense: (input: Omit<Expense, "id">) => boolean;
  updateExpense: (id: string, patch: Partial<Omit<Expense, "id">>) => boolean;
  deleteExpense: (id: string) => void;
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
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (!input.description.trim()) return false;
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
    return true;
  },

  updateExpense: (id, patch) => {
    let next: Expense | null = null;
    set((s) => {
      const idx = s.expenses.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const cur = s.expenses[idx]!;
      const amount = Number(patch.amount ?? cur.amount);
      const description = (patch.description ?? cur.description).trim();
      if (!Number.isFinite(amount) || amount <= 0 || !description) return s;
      next = {
        ...cur,
        ...patch,
        amount,
        description,
        date: patch.date ?? cur.date,
        category: patch.category ?? cur.category,
        sectorId: patch.sectorId === "" ? undefined : (patch.sectorId ?? cur.sectorId),
      };
      const expenses = [...s.expenses];
      expenses[idx] = next;
      return { expenses };
    });
    if (next) void persistExpenseUpdate(next);
    return next != null;
  },

  deleteExpense: (id) => {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    void persistExpenseDelete(id);
  },

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: defaultFilters }),
}));
