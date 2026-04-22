"use client";

import { create } from "zustand";

type UIState = {
  currentModule: "dashboard" | "sales" | "expenses" | "stock" | "analytics";
  setModule: (module: UIState["currentModule"]) => void;
};

export const useUIStore = create<UIState>((set) => ({
  currentModule: "dashboard",
  setModule: (module) => set({ currentModule: module }),
}));
