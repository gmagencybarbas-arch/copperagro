import type { Plan } from "@/types/plan";

export type Company = {
  id: string;
  name: string;
  plan: Plan;
  /** null/false = precisa passar pelo onboarding */
  onboardingCompleted?: boolean;
};
