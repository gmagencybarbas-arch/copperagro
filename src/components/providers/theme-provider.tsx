"use client";

import { useThemeStore } from "@/store/theme-store";
import { useEffect } from "react";

/** Sincroniza tema persistido + classe `dark` na raíz (Tailwind). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useThemeStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return children;
}
