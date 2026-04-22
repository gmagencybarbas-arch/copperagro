export type Plan = "standard" | "plus" | "infinity";

export type PlanConfig = {
  maxSectors: number | null;
  name: string;
  priceQuarterly: number;
  priceYearly: number;
  features: string[];
  companiesUsing: number;
};
