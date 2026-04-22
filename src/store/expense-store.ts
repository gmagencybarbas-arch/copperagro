"use client";

import type { Expense, ExpenseFilters } from "@/types/expense";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

const ssrMemoryStorage: Storage = (() => {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear() {
      m.clear();
    },
    getItem(key: string) {
      return m.get(key) ?? null;
    },
    key(index: number) {
      return [...m.keys()][index] ?? null;
    },
    removeItem(key: string) {
      m.delete(key);
    },
    setItem(key: string, value: string) {
      m.set(key, value);
    },
  } as Storage;
})();

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

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set) => ({
      expenses: [],
      filters: defaultFilters,

      addExpense: (input) => {
        const amount = Number(input.amount);
        if (!Number.isFinite(amount) || amount <= 0) return;
        if (!input.description.trim()) return;
        const expense: Expense = {
          id: uid(),
          date: input.date || todayISO(),
          description: input.description.trim(),
          amount,
          sectorId: input.sectorId || undefined,
        };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
      },

      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      clearFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: "coopfinance-expenses",
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ssrMemoryStorage,
      ),
      partialize: (state) => ({
        expenses: state.expenses,
      }),
    },
  ),
);

