"use client";

import type { Company } from "@/types/company";
import type { User } from "@/types/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  login: (payload: { user: User; company: Company }) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  setCompany: (company: Company | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
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
    }),
    {
      name: "copperagro-auth",
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
