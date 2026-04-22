"use client";

import {
  bestDayOfMonthByAvgPrice,
  bestMonthByAvgPrice,
  bestWeekOfMonthByAvgPrice,
  historicalAveragePrice,
  latestSalePrice,
  worstMonthByAvgPrice,
} from "@/lib/time-intelligence";
import { formatBRLFine } from "@/lib/format";
import type { Sale } from "@/types/sale";
import {
  Activity,
  CalendarDays,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type CardItem = {
  icon: typeof Activity;
  title: string;
  detail: string;
};

function InsightCard({ item }: { item: CardItem }) {
  const Icon = item.icon;
  return (
    <div className="flex gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#15803d] ring-1 ring-emerald-100">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold leading-snug text-gray-900">
          {item.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          {item.detail}
        </p>
      </div>
    </div>
  );
}

export function MarketInsightsSection({ sales }: { sales: Sale[] }) {
  const bestM = bestMonthByAvgPrice(sales);
  const worstM = worstMonthByAvgPrice(sales);
  const bestW = bestWeekOfMonthByAvgPrice(sales);
  const bestD = bestDayOfMonthByAvgPrice(sales);
  const hist = historicalAveragePrice(sales);
  const latest = latestSalePrice(sales);

  const items: CardItem[] = [];

  if (bestM) {
    const sign = bestM.vsGlobalAvgPct >= 0 ? "+" : "";
    items.push({
      icon: CalendarDays,
      title: `Melhor mês: ${bestM.monthName}`,
      detail: `Preço médio ${sign}${bestM.vsGlobalAvgPct.toFixed(
        1,
      )}% vs média histórica (${formatBRLFine(bestM.avgPrice)}).`,
    });
  }

  if (worstM && worstM.monthIndex !== bestM?.monthIndex) {
    items.push({
      icon: TrendingDown,
      title: `Mês mais defensivo: ${worstM.monthName}`,
      detail: `Preço médio ${formatBRLFine(
        worstM.avgPrice,
      )} — planeje margem neste ciclo.`,
    });
  }

  if (bestW) {
    items.push({
      icon: Activity,
      title: `Semana ${bestW.week} com maior valorização média`,
      detail: `Média de ${formatBRLFine(
        bestW.avgPrice,
      )} neste recorte semanal.`,
    });
  }

  if (bestD) {
    items.push({
      icon: Gauge,
      title: `Melhor dia calendário: dia ${bestD.day}`,
      detail: `Preço médio observado ${formatBRLFine(bestD.avgPrice)}.`,
    });
  }

  if (latest !== null && hist > 0) {
    const pct = ((latest - hist) / hist) * 100;
    const below = pct < 0;
    items.push({
      icon: below ? TrendingDown : TrendingUp,
      title: below
        ? "Preço recente abaixo da média histórica"
        : "Preço recente acima da média histórica",
      detail: `${below ? "" : "+"}${pct.toFixed(
        1,
      )}% vs média (${formatBRLFine(hist)}). Última venda ${formatBRLFine(
        latest,
      )}.`,
    });
  }

  return (
    <section className="rounded-[28px] border border-gray-200/90 bg-gray-50 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Insights de Mercado
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Leituras automáticas sobre timing e precificação com base no seu
          histórico.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.length === 0 ? (
            <p className="col-span-full text-sm text-gray-500">
              Registre vendas para gerar insights.
            </p>
          ) : (
            items.map((item, i) => (
              <InsightCard key={`${item.title}-${i}`} item={item} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
