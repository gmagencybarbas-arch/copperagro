"use client";

import { AgroAiChat } from "@/modules/agro-ai/agro-ai-chat";
import { usePlanStore } from "@/store/plan-store";
import Link from "next/link";

export default function AgroAiPage() {
  const currentPlan = usePlanStore((s) => s.currentPlan);

  if (currentPlan !== "infinity") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm dark:border-emerald-900/40 dark:bg-slate-900">
        <p className="text-lg font-semibold text-gray-900 dark:text-slate-50">
          AGRO AI está no plano Infinity
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
          Fala ou escreve vendas, despesas e estoque. A IA monta o lançamento e tu confirmas um a um.
        </p>
        <Link
          href="/planos"
          className="mt-6 inline-flex rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#14532d]"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return <AgroAiChat />;
}
