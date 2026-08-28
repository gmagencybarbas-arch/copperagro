"use client";

import { create } from "zustand";

function pathOnly(href: string): string {
  const raw = href.split("?")[0].split("#")[0];
  if (raw.startsWith("http")) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw || "/";
}

type NavLoadingState = {
  visible: boolean;
  target: string | null;
  startedAt: number;
  start: (href: string) => void;
  finish: () => void;
};

export const useNavLoadingStore = create<NavLoadingState>((set, get) => ({
  visible: false,
  target: null,
  startedAt: 0,
  start: (href) => {
    const target = pathOnly(href);
    if (typeof window !== "undefined" && target === window.location.pathname) {
      return;
    }
    if (get().visible && get().target === target) return;
    set({ visible: true, target, startedAt: Date.now() });
  },
  finish: () => set({ visible: false, target: null }),
}));

export function beginRouteLoading(href: string) {
  useNavLoadingStore.getState().start(href);
}
