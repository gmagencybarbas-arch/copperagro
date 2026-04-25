"use client";

import { AnalysesView } from "@/modules/analyses/analyses-view";
import { usePlanStore } from "@/store/plan-store";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";

export default function AnalisesPage() {
  const setModule = useUIStore((s) => s.setModule);
  const plan = usePlanStore((s) => s.currentPlan);
  useEffect(() => {
    setModule("analytics");
  }, [setModule]);
  if (plan === "standard") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Análises avançadas</h1>
        <p className="text-sm text-gray-600">
          Este módulo está disponível a partir do plano Plus.
        </p>
        <a
          href="/planos"
          className="inline-flex rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white"
        >
          Ver planos
        </a>
      </div>
    );
  }
  return <AnalysesView />;
}
