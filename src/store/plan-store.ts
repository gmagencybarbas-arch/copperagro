"use client";

import { persistPlan } from "@/lib/db/persist";
import type { Plan } from "@/types/plan";
import { useAuthStore } from "@/store/auth-store";
import { create } from "zustand";

type PlanState = {
  currentPlan: Plan;
  setPlanLocal: (plan: Plan) => void;
  setPlan: (plan: Plan) => void;
};

export const usePlanStore = create<PlanState>()((set) => ({
  currentPlan: "standard",
  setPlanLocal: (plan) => set({ currentPlan: plan }),
  setPlan: (plan) => {
    set({ currentPlan: plan });
    const company = useAuthStore.getState().company;
    if (company && company.plan !== plan) {
      useAuthStore.getState().setCompany({ ...company, plan });
    }
    void persistPlan(plan);
  },
}));
