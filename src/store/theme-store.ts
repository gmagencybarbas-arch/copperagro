"use client";

import { create } from "zustand";

export type AppThemeMode = "light" | "dark";

type ThemeState = {
  theme: AppThemeMode;
  setTheme: (t: AppThemeMode) => void;
  hydrateFromStorage: () => void;
};

const STORAGE_KEY = "coopfinance-theme";

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",

  setTheme: (t) => {
    set({ theme: t });
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    applyThemeClass(t);
  },

  hydrateFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const t =
        stored === "dark" || stored === "light"
          ? stored
          : ("light" satisfies AppThemeMode);
      set({ theme: t });
      applyThemeClass(t);
    } catch {
      applyThemeClass(get().theme);
    }
  },
}));

function applyThemeClass(t: AppThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}
