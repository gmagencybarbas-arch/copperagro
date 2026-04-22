"use client";

import { create } from "zustand";
import type { Plan } from "@/types/plan";

type PlanState = {
  currentPlan: Plan;
  setPlan: (plan: Plan) => void;
};

export const usePlanStore = create<PlanState>((set) => ({
  currentPlan: "standard",
  setPlan: (plan) => set({ currentPlan: plan }),
}));
