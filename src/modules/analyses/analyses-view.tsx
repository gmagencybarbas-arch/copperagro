"use client";

import { AnimatedNumber } from "@/components/animated-number";
import {
  bestMonthByAvgPrice,
  bestWeekOfMonthByAvgPrice,
  historicalAveragePrice,
  priceMomentumVsPriorWindow,
} from "@/lib/time-intelligence";
import { formatBRL, formatBRLFine } from "@/lib/format";
import {
  Card,
  Title,
  CleanInput,
  PrimaryButton,
  BigNumber,
} from "@/design-system";
import {
  trailingWeeklyAvgBags,
} from "@/store/sales-metrics";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import { useSalesStore, useStockSnapshot } from "@/store/sales-store";
import {
  Sparkles,
  Calculator,
  CalendarDays,
  CalendarRange,
  LineChart,
  Boxes,
  Timer,
  Wallet,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function AnalysesView() {
  const allSales = useSalesStore((s) => s.sales);
  const stock = useStockSnapshot();
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const sectors = useSectorStore((s) => s.sectors);
  const unit =
    sectors.find((s) => s.id === selectedSectorId)?.unit ?? "unidade";
  const sales = useMemo(() => {
    if (!selectedSectorId) return allSales;
    return allSales.filter((s) => s.sectorId === selectedSectorId);
  }, [allSales, selectedSectorId]);

  const weeklyAvg = useMemo(() => trailingWeeklyAvgBags(sales), [sales]);
  const avgPrice = useMemo(() => historicalAveragePrice(sales), [sales]);

  const weeksRemaining =
    weeklyAvg > 0 ? stock.remaining / weeklyAvg : null;
  const projectedRevenue =
    avgPrice > 0 ? stock.remaining * avgPrice : null;
  const etaEnd =
    weeksRemaining !== null &&
    Number.isFinite(weeksRemaining) &&
    weeksRemaining > 0
      ? (() => {
          const d = new Date();
          d.setDate(d.getDate() + Math.ceil(weeksRemaining) * 7);
          return d;
        })()
      : null;

  const baselineSacas = weeklyAvg;
  const baselinePrice = avgPrice;

  const [sacasWeek, setSacasWeek] = useState<number>(baselineSacas);
  const [priceExpect, setPriceExpect] = useState<number>(baselinePrice);

  const simWeeks =
    sacasWeek > 0 ? stock.remaining / sacasWeek : null;
  const simRevenue =
    priceExpect > 0 ? stock.remaining * priceExpect : null;

  const bestMonth = useMemo(() => bestMonthByAvgPrice(sales), [sales]);
  const bestWeek = useMemo(() => bestWeekOfMonthByAvgPrice(sales), [sales]);
  const momentum = useMemo(
    () => priceMomentumVsPriorWindow(sales, 90),
    [sales],
  );

  const fmtLong = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  return (
    <div className="animate-dash-enter mx-auto max-w-6xl space-y-16 pb-20 pt-4">
      <header className="space-y-3 border-b border-gray-200/80 pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#15803d]">
            Decisão
          </span>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-gray-400 hover:text-gray-700"
          >
            Painel
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Análises
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
          Centro de decisão: veja para onde o estoque aponta, teste cenários de
          ritmo e preço, e leia padrões simples do histórico.
        </p>
      </header>

      {/* Projeção */}
      <section className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Projeção futura
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Com base no ritmo recente de vendas e no preço médio histórico.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-6 md:grid-cols-3">
          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 to-white p-7 ring-1 ring-emerald-900/[0.04]">
            <div className="flex items-start justify-between gap-2">
              <Title>Estoque restante</Title>
              <Boxes
                className="h-5 w-5 shrink-0 text-emerald-700/70"
                strokeWidth={1.75}
              />
            </div>
            <BigNumber className="mt-5 text-emerald-950 tabular-nums">
              <AnimatedNumber
                value={stock.remaining}
                format={(n) =>
                      `${Math.round(n).toLocaleString("pt-BR")} ${pluralizeUnit(unit, n)}`
                }
              />
            </BigNumber>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-sky-100/90 bg-gradient-to-br from-sky-50/90 to-white p-7 ring-1 ring-sky-900/[0.04]">
            <div className="flex items-start justify-between gap-2">
              <Title>Média semanal (ritmo atual)</Title>
              <Gauge
                className="h-5 w-5 shrink-0 text-sky-700/70"
                strokeWidth={1.75}
              />
            </div>
            <BigNumber className="mt-5 text-sky-950 tabular-nums">
              <AnimatedNumber
                value={weeklyAvg}
                decimals={1}
                format={(n) =>
                  `${n.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })} ${pluralizeUnit(unit, 2)} / sem`
                }
              />
            </BigNumber>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-violet-100/90 bg-gradient-to-br from-violet-50/85 to-white p-7 ring-1 ring-violet-900/[0.04]">
            <div className="flex items-start justify-between gap-2">
              <Title>Preço médio histórico</Title>
              <Wallet
                className="h-5 w-5 shrink-0 text-violet-700/70"
                strokeWidth={1.75}
              />
            </div>
            <BigNumber className="mt-5 text-violet-950 tabular-nums">
              <AnimatedNumber
                value={avgPrice}
                decimals={2}
                format={(n) => formatBRLFine(n)}
              />
            </BigNumber>
          </Card>
        </div>

        <div className="grid min-w-0 gap-6 md:grid-cols-3">
          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-gray-100 bg-white p-7">
            <div className="flex items-start justify-between gap-2">
              <Title>Semanas restantes (ao ritmo atual)</Title>
              <Timer className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} />
            </div>
            <p className="mt-5 max-w-full min-w-0 break-words text-[clamp(1.35rem,3.8vmin,2.85rem)] font-semibold tracking-tight text-gray-900 tabular-nums leading-tight sm:text-[clamp(1.65rem,3.2vw,3rem)]">
              {weeksRemaining !== null &&
              Number.isFinite(weeksRemaining) ? (
                <>
                  {weeksRemaining >= 100
                    ? "100+"
                    : weeksRemaining.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                  <span className="ml-2 text-lg font-medium text-gray-500">
                    sem.
                  </span>
                </>
              ) : (
                <span className="text-xl text-gray-400">—</span>
              )}
            </p>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-gray-100 bg-white p-7">
            <div className="flex items-start justify-between gap-2">
              <Title>Faturamento projetado (estoque × preço médio)</Title>
              <Sparkles className="h-5 w-5 shrink-0 text-amber-500/80" strokeWidth={1.75} />
            </div>
            <p className="mt-5 max-w-full min-w-0 break-words text-[clamp(1.25rem,3.6vmin,2.75rem)] font-semibold tracking-tight text-gray-900 tabular-nums leading-tight sm:text-[clamp(1.5rem,3vw,2.85rem)]">
              {projectedRevenue !== null && projectedRevenue > 0 ? (
                formatBRL(Math.round(projectedRevenue))
              ) : (
                <span className="text-xl text-gray-400">—</span>
              )}
            </p>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-[22px] border border-gray-100 bg-white p-7">
            <div className="flex items-start justify-between gap-2">
              <Title>Estimativa de término do estoque</Title>
              <CalendarDays
                className="h-5 w-5 shrink-0 text-gray-400"
                strokeWidth={1.75}
              />
            </div>
            <p className="mt-5 min-w-0 max-w-full text-base font-semibold leading-snug text-gray-900 sm:text-lg">
              {etaEnd ? (
                <>
                  Por volta de{" "}
                  <span className="text-emerald-800">{fmtLong.format(etaEnd)}</span>
                  , se o ritmo se mantiver.
                </>
              ) : (
                <span className="text-xl font-normal text-gray-400">
                  Sem ritmo de venda suficiente para projetar.
                </span>
              )}
            </p>
          </Card>
        </div>
      </section>

      {/* Simulação */}
      <section id="simulacao" className="space-y-8 scroll-mt-24">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Simulação</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ajuste unidades por semana e preço esperado — o resultado atualiza na
            hora.
          </p>
        </div>

        <Card className="min-w-0 overflow-hidden rounded-[22px] border border-gray-100 bg-white p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-6">
              <div className="flex min-w-[200px] flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {pluralizeUnit(unit, 2)} por semana
                </span>
                <CleanInput
                  type="number"
                  min={0}
                  step={1}
                  value={Number.isFinite(sacasWeek) ? sacasWeek : ""}
                  onChange={(e) =>
                    setSacasWeek(Number(e.target.value) || 0)
                  }
                  className="tabular-nums"
                />
              </div>
              <div className="flex min-w-[200px] flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {`Preço médio esperado (R$/${unit})`}
                </span>
                <CleanInput
                  type="number"
                  min={0}
                  step={0.5}
                  value={Number.isFinite(priceExpect) ? priceExpect : ""}
                  onChange={(e) =>
                    setPriceExpect(Number(e.target.value) || 0)
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
            <PrimaryButton
              type="button"
              className="shrink-0 gap-2"
              onClick={() => {
                setSacasWeek(baselineSacas);
                setPriceExpect(baselinePrice);
              }}
            >
              <Calculator className="h-4 w-4" strokeWidth={2} />
              Simular cenário (restaurar ritmo atual)
            </PrimaryButton>
          </div>

          <div className="mt-10 grid min-w-0 gap-6 border-t border-gray-100 pt-10 sm:grid-cols-2">
            <div className="min-w-0 overflow-hidden rounded-2xl bg-gray-50/90 p-6 ring-1 ring-gray-100">
              <Title>Faturamento estimado</Title>
              <p className="mt-3 max-w-full break-words text-[clamp(1.25rem,3.5vmin,2rem)] font-semibold tabular-nums leading-tight text-gray-900 sm:text-[clamp(1.35rem,2.8vw,2.25rem)]">
                {simRevenue !== null && simRevenue > 0 ? (
                  formatBRL(Math.round(simRevenue))
                ) : (
                  <span className="text-gray-400">Defina preço &gt; 0</span>
                )}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Considera vender todo o estoque restante ao preço médio
                indicado.
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-2xl bg-gray-50/90 p-6 ring-1 ring-gray-100">
              <Title>Duração do estoque</Title>
              <p className="mt-3 max-w-full break-words text-[clamp(1.25rem,3.5vmin,2rem)] font-semibold tabular-nums leading-tight text-gray-900 sm:text-[clamp(1.35rem,2.8vw,2.25rem)]">
                {simWeeks !== null &&
                Number.isFinite(simWeeks) &&
                simWeeks > 0 ? (
                  <>
                    {simWeeks >= 500
                      ? "500+"
                      : simWeeks.toLocaleString("pt-BR", {
                          maximumFractionDigits: 1,
                        })}{" "}
                    <span className="text-lg font-medium text-gray-500">
                      semanas
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xl font-normal">
                    Informe unidades/semana &gt; 0
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Quanto tempo levaria para zerar o estoque nesse ritmo.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Insights */}
      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Insights estratégicos
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Padrões agregados do histórico — linguagem direta, sem ruído.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="rounded-[18px] border border-gray-100 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CalendarRange className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Melhor mês para preço
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-800">
                  {bestMonth ? (
                    <>
                      Em média,{" "}
                      <strong>{bestMonth.monthName}</strong> registrou o maior
                      preço médio ponderado{" "}
                      <span className="text-emerald-700">
                        ({formatBRLFine(bestMonth.avgPrice)})
                      </span>
                      .
                    </>
                  ) : (
                    "Sem dados suficientes."
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[18px] border border-gray-100 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Melhor semana do mês
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-800">
                  {bestWeek ? (
                    <>
                      A <strong>semana {bestWeek.week}</strong> costuma ter o
                      melhor preço médio{" "}
                      <span className="text-sky-800">
                        ({formatBRLFine(bestWeek.avgPrice)})
                      </span>{" "}
                      frente às demais faixas do mês.
                    </>
                  ) : (
                    "Sem dados suficientes."
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[18px] border border-gray-100 bg-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <LineChart className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tendência de preço
                </p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-gray-800">
                  {momentum ? (
                    <span
                      className={
                        momentum.up ? "text-emerald-800" : "text-rose-800"
                      }
                    >
                      {momentum.label}
                    </span>
                  ) : (
                    "Não há janela recente comparável para medir tendência."
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
