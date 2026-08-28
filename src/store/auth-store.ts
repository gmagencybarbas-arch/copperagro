"use client";

import type { Company } from "@/types/company";
import type { User } from "@/types/user";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  sessionReady: boolean;
  setSessionReady: (ready: boolean) => void;
  login: (payload: { user: User; company: Company }) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  company: null,
  isAuthenticated: false,
  sessionReady: false,
  setSessionReady: (ready) => set({ sessionReady: ready }),
  login: ({ user, company }) =>
    set({
      user,
      company,
      isAuthenticated: true,
    }),
  logout: () =>
    set({
      user: null,
      company: null,
      isAuthenticated: false,
    }),
  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user && get().company),
    }),
  setCompany: (company) =>
    set({
      company,
      isAuthenticated: Boolean(company && get().user),
    }),
}));
