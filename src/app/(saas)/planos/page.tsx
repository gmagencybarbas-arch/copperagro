"use client";

import { useState } from "react";
import { PLANS } from "@/config/plans";
import { usePlanStore } from "@/store/plan-store";
import type { Plan } from "@/types/plan";

const PLAN_ORDER: Plan[] = ["standard", "plus", "infinity"];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanosPage() {
  const [billing, setBilling] = useState<"quarterly" | "yearly">("quarterly");
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const setPlan = usePlanStore((s) => s.setPlan);
  const installments = billing === "quarterly" ? 3 : 12;

  const getPlanPrice = (plan: Plan) =>
    billing === "quarterly" ? PLANS[plan].priceQuarterly : PLANS[plan].priceYearly;

  const getAdvantageText = (plan: Plan): string => {
    if (plan === "standard") {
      const upgradeDiff = getPlanPrice("plus") - getPlanPrice("standard");
      return `Upgrade para Plus por +${formatBRL(upgradeDiff)} e destrave até 4 setores.`;
    }

    if (plan === "plus") {
      const prevDiff = getPlanPrice("plus") - getPlanPrice("standard");
      return `Plano mais escolhido: por +${formatBRL(prevDiff)} você multiplica capacidade e análises.`;
    }

    const prevDiff = getPlanPrice("infinity") - getPlanPrice("plus");
    return `Por +${formatBRL(prevDiff)} sobre o Plus, você libera setores ilimitados e IA avançada.`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-10">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
          Assinaturas CopperAgro
        </p>
        <h1 className="text-3xl font-semibold">Escolha seu plano</h1>
        <p className="text-sm text-gray-500 dark:text-cyan-100/70">
          Visual inspirado em conversão: valor parcelado em destaque, total discreto e comparação clara
          de vantagem.
        </p>
      </div>

      <div className="flex w-fit gap-2 rounded-xl bg-gray-100 p-1 dark:bg-[#091a2a]">
        <button
          onClick={() => setBilling("quarterly")}
          className={`rounded-lg px-4 py-2 text-sm transition-all ${
            billing === "quarterly"
              ? "bg-white shadow dark:bg-[#0f2437] dark:text-cyan-50"
              : "text-gray-600 dark:text-cyan-100/75"
          }`}
        >
          Trimestral
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`rounded-lg px-4 py-2 text-sm transition-all ${
            billing === "yearly"
              ? "bg-white shadow dark:bg-[#0f2437] dark:text-cyan-50"
              : "text-gray-600 dark:text-cyan-100/75"
          }`}
        >
          Anual (2 meses grátis)
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((key) => {
          const plan = PLANS[key];
          const totalPrice = getPlanPrice(key);
          const installmentPrice = totalPrice / installments;
          const isRecommended = key === "plus";
          const isCurrent = currentPlan === key;

          return (
            <div
              key={key}
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:ds-glass ${
                isRecommended
                  ? "scale-[1.02] border-emerald-500 ring-1 ring-emerald-300/40"
                  : "border-gray-200 dark:border-cyan-400/20"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200">
                      Mais vantajoso
                    </span>
                  ) : null}
                </div>

                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/90 to-emerald-300/90 px-4 py-4 text-emerald-950 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.8)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-900/70">
                    {installments}x de
                  </p>
                  <p className="text-4xl font-bold leading-none tabular-nums">
                    {formatBRL(installmentPrice)}
                  </p>
                </div>

                <p className="text-sm text-gray-500 dark:text-cyan-100/60">
                  Total: <span className="font-medium">{formatBRL(totalPrice)}</span> no{" "}
                  {billing === "quarterly" ? "trimestre" : "ano"}.
                </p>

                <p className="text-xs text-gray-500 dark:text-cyan-100/65">
                  +{plan.companiesUsing.toLocaleString("pt-BR")} empresas ativas nesse plano.
                </p>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                  {getAdvantageText(key)}
                </div>

                <ul className="space-y-1 text-sm text-gray-600 dark:text-cyan-100/78">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setPlan(key)}
                disabled={isCurrent}
                className={`mt-6 rounded-xl py-2 text-white transition-all ${
                  isCurrent
                    ? "cursor-not-allowed bg-gray-400 dark:bg-slate-600"
                    : "bg-green-600 hover:bg-green-700 hover:scale-[1.01] active:scale-[0.98]"
                }`}
              >
                {isCurrent ? "Plano atual" : "Escolher plano"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
