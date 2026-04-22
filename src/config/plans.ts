import type { Plan, PlanConfig } from "@/types/plan";

export const PLANS: Record<Plan, PlanConfig> = {
  standard: {
    name: "Standard",
    maxSectors: 1,
    priceQuarterly: 1197,
    priceYearly: 3591,
    features: ["1 setor ativo", "Controle de vendas", "Controle de despesas", "Dashboard básico"],
    companiesUsing: 1840,
  },
  plus: {
    name: "Plus",
    maxSectors: 4,
    priceQuarterly: 2069,
    priceYearly: 6209,
    features: [
      "Até 4 setores",
      "Dashboard avançado",
      "Comparações por período",
      "Análises estratégicas",
    ],
    companiesUsing: 1260,
  },
  infinity: {
    name: "Infinity",
    maxSectors: null,
    priceQuarterly: 2548,
    priceYearly: 7645,
    features: [
      "Setores ilimitados",
      "IA de análise",
      "Previsibilidade avançada",
      "Integrações futuras",
    ],
    companiesUsing: 540,
  },
};
