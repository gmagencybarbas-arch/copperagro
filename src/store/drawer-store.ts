"use client";

import { create } from "zustand";

type DrawerState = {
  saleDrawerOpen: boolean;
  openSaleDrawer: () => void;
  closeSaleDrawer: () => void;
  stockDrawerOpen: boolean;
  openStockDrawer: () => void;
  closeStockDrawer: () => void;
  expenseDrawerOpen: boolean;
  openExpenseDrawer: () => void;
  closeExpenseDrawer: () => void;
};

export const useDrawerStore = create<DrawerState>((set) => ({
  saleDrawerOpen: false,
  openSaleDrawer: () =>
    set({ saleDrawerOpen: true, stockDrawerOpen: false }),
  closeSaleDrawer: () => set({ saleDrawerOpen: false }),

  stockDrawerOpen: false,
  openStockDrawer: () =>
    set({ stockDrawerOpen: true, saleDrawerOpen: false, expenseDrawerOpen: false }),
  closeStockDrawer: () => set({ stockDrawerOpen: false }),

  expenseDrawerOpen: false,
  openExpenseDrawer: () =>
    set({ expenseDrawerOpen: true, saleDrawerOpen: false, stockDrawerOpen: false }),
  closeExpenseDrawer: () => set({ expenseDrawerOpen: false }),
}));
