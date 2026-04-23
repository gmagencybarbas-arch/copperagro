"use client";

import { useThemeStore } from "@/store/theme-store";
import type { AppThemeMode } from "@/store/theme-store";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({
  compact = false,
  subtle = false,
}: {
  /** Ícones apenas (ex.: cabeçalho mobile). */
  compact?: boolean;
  /** Variante discreta para rodapé/sidebar. */
  subtle?: boolean;
}) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  function pick(mode: AppThemeMode) {
    setTheme(mode);
  }

  if (compact) {
    return (
      <div className="flex items-center rounded-xl border border-gray-200/90 bg-gray-50/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/90">
        <button
          type="button"
          onClick={() => pick("light")}
          aria-pressed={theme === "light"}
          title="Modo claro"
          className={`rounded-lg p-2 transition-colors duration-200 ${
            theme === "light"
              ? "bg-white text-amber-600 shadow-sm dark:bg-slate-700 dark:text-amber-300"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Sun className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => pick("dark")}
          aria-pressed={theme === "dark"}
          title="Modo escuro"
          className={`rounded-lg p-2 transition-colors duration-200 ${
            theme === "dark"
              ? "bg-slate-700 text-emerald-400 shadow-inner ring-1 ring-slate-600/80"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Moon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className={subtle ? "space-y-1.5 opacity-95" : "space-y-2"}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
        Aparência
      </p>
      <div
        className={`flex rounded-xl border border-gray-200/90 bg-gray-50/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 ${
          subtle ? "scale-[0.97]" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => pick("light")}
          aria-pressed={theme === "light"}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${
            theme === "light"
              ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Sun className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Claro
        </button>
        <button
          type="button"
          onClick={() => pick("dark")}
          aria-pressed={theme === "dark"}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${
            theme === "dark"
              ? "bg-slate-700 text-emerald-400 shadow-inner ring-1 ring-slate-600/80"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Moon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Escuro
        </button>
      </div>
    </div>
  );
}
