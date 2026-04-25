"use client";

import {
  useAnalyticsIntelligence,
  useAnalysesViewControls,
} from "@/hooks/use-analytics-intelligence";
import {
  buildWeeklyPnlSeries,
  kpiDeltasFromSeries,
  toSpark,
} from "@/lib/analytics-charts-data";
import { formatBRL } from "@/lib/format";
import { computeStockSnapshot } from "@/store/sales-store";
import { useSalesStore } from "@/store/sales-store";
import { useExpenseStore } from "@/store/expense-store";
import { SECTOR_COLOR_TOKENS } from "@/lib/sector-palette";
import { pluralizeUnit, useSectorStore } from "@/store/sector-store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KPIWithSparkline } from "./components/kpi-with-sparkline";
import { MainChart } from "./components/main-chart";
import { PieChart } from "./components/pie-distribution-chart";
import { ProjectionCard } from "./components/projection-card";
import { SimulationPanel } from "./components/simulation-panel";
import { InsightsList, type InsightTone, PrimaryInsightCard } from "./components/insights-list";
import { Card } from "@/design-system";
import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/types/expense";
import { ArrowUpRight, LayoutDashboard, Sparkles } from "lucide-react";
import { AN } from "./components/analytics-tokens";
import type { PieSlice } from "./components/pie-distribution-chart";

type InsightItem = {
  tone: InsightTone;
  message: string;
  sub?: string;
  action?: string;
  score: number;
};

type InsightCard = Omit<InsightItem, "score">;

function pickInsights(params: {
  viewMode: "global" | "sector";
  comp: ReturnType<typeof useAnalyticsIntelligence>["comparisons"];
  tr: ReturnType<typeof useAnalyticsIntelligence>["trends"];
  activeSector: ReturnType<typeof useAnalyticsIntelligence>["activeSector"];
  ps: ReturnType<typeof useAnalyticsIntelligence>["projections"]["sector"];
  pg: ReturnType<typeof useAnalyticsIntelligence>["projections"]["global"];
  g: ReturnType<typeof useAnalyticsIntelligence>["globalMetrics"];
  deltas: { rev: number; exp: number; prof: number };
}): { primary: InsightItem | null; secondary: InsightCard[] } {
  const { viewMode, comp, tr, activeSector, ps, pg, g, deltas } = params;
  const pool: InsightItem[] = [];

  if (viewMode === "sector" && ps && activeSector) {
    const wk = ps.weeksRemaining;
    if (wk != null && wk > 0 && wk < 2) {
      pool.push({
        score: 100,
        tone: "negative",
        message: `O stock de ${activeSector.sectorName} aproxima-se do fim neste ritmo`,
        sub: `Cerca de ${wk.toFixed(1)} sem. (≈${Math.round(wk * 7)} dias) com as vendas actuais.`,
        action: "Repus stock ou ajuste o ritmo de venda com tempo de antecedência.",
      });
    } else if (wk != null && wk < 4 && wk > 0) {
      pool.push({
        score: 85,
        tone: "warning",
        message: `Calendário apertado em ${activeSector.sectorName}`,
        sub: `≈${wk.toFixed(1)} sem. de folga a este ritmo.`,
        action: "Planeie reposição ou revisão de preço/mix.",
      });
    }
  }

  if (viewMode === "global" && pg?.financialRunwayWeeks) {
    const w = pg.financialRunwayWeeks;
    if (w < 3 && w > 0) {
      pool.push({
        score: 95,
        tone: "negative",
        message: "Cobertura financeira do inventário muito curta a este ritmo",
        sub: `≈${w.toFixed(1)} sem. de faturamento equivalente com o que mantém hoje no armazém.`,
        action: "Acelere vendas, repus ou reduza o burn semanal (despesas/ritmo).",
      });
    }
  }

  if (tr.risingCostCategory != null && tr.risingCostPct != null) {
    const p = tr.risingCostPct;
    pool.push({
      score: p > 50 ? 78 : 45,
      tone: p > 50 ? "negative" : "warning",
      message: `Pressão de custos: ${tr.risingCostCategory}`,
      sub:
        p > 500
          ? `Aumento extremo em relação ao mês anterior (+${p.toFixed(0)}%). Conferir lançamentos.`
          : `+${p.toFixed(0)}% vs. janela anterior.`,
      action: "Revise o detalhe em Despesas e renegocie ou cortar o pior gasto perdedor.",
    });
  }

  if (deltas.prof > 2.5) {
    pool.push({
      score: 70,
      tone: "positive",
      message: "O lucro semanal cresceu em relação à semana anterior",
      sub: `Var. ≈ +${deltas.prof.toFixed(1)}% no último ponto. Confirme se a margem acompanha.`,
      action: "Mantenha o que está a alimentar vendas e disciplina de custo.",
    });
  } else if (deltas.prof < -2.5) {
    pool.push({
      score: 68,
      tone: "warning",
      message: "O lucro semanal perdeu tração",
      sub: `Var. ≈ ${deltas.prof.toFixed(1)}% no último ponto. Verifique se foi despesa atípica ou preço/quantidade.`,
    });
  }

  if (comp.bestProfitName && (pool.length === 0 || pool.every((i) => i.score < 55))) {
    pool.push({
      score: 52,
      tone: "positive",
      message: `${comp.bestProfitName} puxa o resultado geral`,
      sub: `Lucro atribuído ≈ ${formatBRL(Math.round(comp.bestProfit))}.`,
    });
  }

  if (comp.worstProfitName && comp.worstProfit < 0) {
    pool.push({
      score: 60,
      tone: "negative",
      message: `Resultado negativo em ${comp.worstProfitName}`,
      sub: formatBRL(Math.round(comp.worstProfit)),
    });
  }

  if (viewMode === "sector" && activeSector && activeSector.totalRevenue > 0) {
    const m =
      (activeSector.totalRevenue - activeSector.totalExpenses) / activeSector.totalRevenue;
    if (m > 0.2) {
      pool.push({
        score: 40,
        tone: "positive",
        message: "Margem confortável neste setor",
        sub: `≈${(m * 100).toFixed(0)}% sobre o faturamento acumulado na visão actual.`,
      });
    }
  }

  if (viewMode === "global" && g.totalProfit > 0 && pool.length === 0) {
    pool.push({
      score: 30,
      tone: "positive",
      message: "Resultado global positivo — use a simulação para antecipar o próximo gargalo",
      sub: "Combine receita, estoque e despesas na mesma leitura.",
    });
  }

  pool.sort((a, b) => b.score - a.score);
  if (pool.length === 0) {
    return {
      primary: {
        score: 0,
        tone: "neutral",
        message: "Registe mais movimentos para priorizar a próxima acção com dados",
        sub: "Vendas, despesas e stock dão sinais mais claros.",
      },
      secondary: [],
    };
  }
  const [first, ...rest] = pool;
  return {
    primary: first!,
    secondary: rest.slice(0, 4).map(({ score: _s, ...x }) => x),
  };
}

function fmtLongLocal() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function AnalysesView() {
  const snap = useAnalyticsIntelligence();
  const {
    viewMode,
    setViewMode,
    analysesSectorId,
    setAnalysesSectorId,
    simulationScope,
    setSimulationScope,
  } = useAnalysesViewControls();

  const sales = useSalesStore((s) => s.sales);
  const stockTotalSacas = useSalesStore((s) => s.stockTotalSacas);
  const stockMovements = useSalesStore((s) => s.stockMovements);
  const expenses = useExpenseStore((s) => s.expenses);
  const sectors = useSectorStore((s) => s.sectors);

  const g = snap.globalMetrics;
  const comp = snap.comparisons;
  const tr = snap.trends;
  const pg = snap.projections.global;
  const ps = snap.projections.sector;
  const activeSector = snap.activeSector;

  const [sacasWeek, setSacasWeek] = useState(0);
  const [priceExpect, setPriceExpect] = useState(0);
  const [globalSimWeekly, setGlobalSimWeekly] = useState(0);

  const weeklySeries = useMemo(
    () =>
      buildWeeklyPnlSeries(sales, expenses, {
        viewMode,
        sectorId: viewMode === "sector" ? analysesSectorId : null,
        weeksBack: 24,
      }),
    [sales, expenses, viewMode, analysesSectorId],
  );

  const deltas = useMemo(
    () => kpiDeltasFromSeries(weeklySeries),
    [weeklySeries],
  );

  const kpi = useMemo(() => {
    if (viewMode === "global") {
      return {
        revenue: g.totalRevenue,
        expenses: g.totalExpenses,
        profit: g.totalProfit,
      };
    }
    if (activeSector) {
      return {
        revenue: activeSector.totalRevenue,
        expenses: activeSector.totalExpenses,
        profit: activeSector.totalProfit,
      };
    }
    return { revenue: 0, expenses: 0, profit: 0 };
  }, [viewMode, g, activeSector]);

  const sparkRev = toSpark(weeklySeries.map((w) => w.revenue), 16);
  const sparkExp = toSpark(weeklySeries.map((w) => w.expenses), 16);
  const sparkPro = toSpark(weeklySeries.map((w) => w.profit), 16);

  useEffect(() => {
    if (viewMode === "sector" && activeSector) {
      setSacasWeek(activeSector.unitsPerWeek);
      setPriceExpect(activeSector.averagePrice);
    }
  }, [viewMode, activeSector, analysesSectorId]);

  useEffect(() => {
    setGlobalSimWeekly(g.weeklyRevenue);
  }, [g.weeklyRevenue]);

  const stockForActive = useMemo(
    () =>
      viewMode === "sector" && analysesSectorId
        ? computeStockSnapshot(stockTotalSacas, stockMovements, analysesSectorId)
        : computeStockSnapshot(stockTotalSacas, stockMovements, null),
    [viewMode, analysesSectorId, stockTotalSacas, stockMovements],
  );

  const globalRunwaySim =
    viewMode === "global" && globalSimWeekly > 0
      ? g.inventoryValueRevenue / globalSimWeekly
      : null;

  const simWeeks =
    viewMode === "sector" && sacasWeek > 0
      ? stockForActive.remaining / sacasWeek
      : null;
  const simRevenue =
    viewMode === "sector" && priceExpect > 0
      ? stockForActive.remaining * priceExpect
      : null;

  const globalSimCurve = useMemo(() => {
    const inv = g.inventoryValueRevenue;
    const w = globalSimWeekly;
    if (inv <= 0) return [] as number[];
    if (w <= 0) return [inv, Math.max(0, inv * 0.5)];
    const n = Math.min(36, Math.max(2, Math.ceil(inv / w) + 1));
    return Array.from({ length: n }, (_, i) => Math.max(0, inv - i * w));
  }, [g.inventoryValueRevenue, globalSimWeekly]);

  const sectorSimCurve = useMemo(() => {
    if (viewMode !== "sector") return [] as number[];
    const rem = stockForActive.remaining;
    const w = sacasWeek;
    const p = priceExpect;
    if (p <= 0) return [] as number[];
    if (w <= 0) {
      const v = rem * p;
      return v > 0 ? [v, v] : [];
    }
    const n = Math.min(28, Math.max(2, Math.ceil(rem / w) + 1));
    return Array.from({ length: n }, (_, i) => Math.max(0, (rem - i * w) * p));
  }, [viewMode, stockForActive.remaining, sacasWeek, priceExpect]);

  const simCurveForPanel = viewMode === "global" ? globalSimCurve : sectorSimCurve;

  const pieSlices: PieSlice[] = useMemo(() => {
    if (viewMode === "global") {
      const withRev = snap.sectorMetrics.filter((m) => m.totalRevenue > 0);
      if (withRev.length === 0) return [];
      return withRev.map((m) => ({
        label: m.sectorName,
        value: m.totalRevenue,
        colorToken: sectors.find((s) => s.id === m.sectorId)?.color ?? "green",
      }));
    }
    if (!analysesSectorId) return [];
    const by: Partial<Record<ExpenseCategory, number>> = {};
    for (const e of expenses) {
      if (e.sectorId !== analysesSectorId) continue;
      const c = e.category;
      by[c] = (by[c] || 0) + e.amount;
    }
    return (Object.keys(by) as ExpenseCategory[])
      .filter((c) => (by[c] || 0) > 0)
      .map((c, i) => ({
        label: EXPENSE_CATEGORY_LABEL[c] ?? c,
        value: by[c]!,
        colorToken: SECTOR_COLOR_TOKENS[i % SECTOR_COLOR_TOKENS.length]!,
      }));
  }, [viewMode, snap.sectorMetrics, expenses, analysesSectorId, sectors]);

  const { primary: primaryInsight, secondary: secondaryInsights } = useMemo(
    () =>
      pickInsights({
        viewMode,
        comp,
        tr,
        activeSector,
        ps,
        pg,
        g,
        deltas,
      }),
    [viewMode, comp, tr, activeSector, ps, pg, g, deltas],
  );

  const unit = activeSector?.unit ?? "unidade";
  const trendRev = toSpark(weeklySeries.map((w) => w.revenue), 20);

  const globalWeeks = pg?.financialRunwayWeeks ?? null;
  const sectorW = ps?.weeksRemaining ?? null;

  const modeHeadline =
    viewMode === "global"
      ? "Visão geral da fazenda"
      : `Análise do setor: ${activeSector?.sectorName ?? "—"}`;

  const mainChartSub =
    viewMode === "global"
      ? "Todas as vendas e despesas agregadas (semanal)"
      : activeSector
        ? `Apenas ${activeSector.sectorName} – compare com a visão geral se precisar de contexto`
        : "Seleccione um setor";

  return (
    <div
      className="font-sans animate-dash-enter min-h-full bg-[#f7f9f8] pb-20 pt-4 antialiased"
      style={{ fontFamily: "var(--font-inter, ui-sans-serif, system-ui)" }}
    >
      <div className="mx-auto max-w-6xl space-y-7 px-4 sm:px-5">
        <header className="space-y-4 border-b border-[#e6eae8] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-[#1f7a63]/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: AN.green, background: "rgba(31, 122, 99, 0.08)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Controlo
              </span>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#5c6b66] transition-colors hover:text-[#1f7a63]"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Painel
              </Link>
            </div>
            <a
              href="#simulacao"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f7a63] hover:underline"
            >
              Simular impacto
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Análises
            </h1>
            <p
              className="mt-1.5 text-sm font-semibold text-[#1f7a63]"
              role="status"
              aria-live="polite"
            >
              {modeHeadline}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5c6b66]">
              O que muda, o que cabe a si decidir, e a simulação para testar o próximo passo.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="inline-flex gap-0.5 rounded-2xl border border-[#e6eae8] bg-white/90 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("global")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  viewMode === "global"
                    ? "bg-[#1f7a63] text-white shadow-sm"
                    : "text-[#5c6b66] hover:text-slate-900"
                }`}
              >
                Global
              </button>
              <button
                type="button"
                onClick={() => setViewMode("sector")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  viewMode === "sector"
                    ? "bg-[#1f7a63] text-white shadow-sm"
                    : "text-[#5c6b66] hover:text-slate-900"
                }`}
              >
                Por setor
              </button>
            </div>

            {viewMode === "sector" && (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#5c6b66]">
                  Setor
                </label>
                <select
                  value={analysesSectorId}
                  onChange={(e) => setAnalysesSectorId(e.target.value)}
                  className="min-w-[220px] rounded-xl border border-[#e6eae8] bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1f7a63]/30 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100"
                >
                  {snap.sectorMetrics.map((m) => (
                    <option key={m.sectorId} value={m.sectorId}>
                      {m.sectorName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        <section aria-label="Indicadores" className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#5c6b66]">Indicadores</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <KPIWithSparkline
              variant="revenue"
              value={kpi.revenue}
              changePct={deltas.rev}
              sparkline={sparkRev}
            />
            <KPIWithSparkline
              variant="expense"
              value={kpi.expenses}
              changePct={deltas.exp}
              sparkline={sparkExp}
            />
            <KPIWithSparkline
              variant="profit"
              value={kpi.profit}
              changePct={deltas.prof}
              sparkline={sparkPro}
            />
          </div>
        </section>

        {primaryInsight && (
          <section aria-label="Próxima decisão sugerida" className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#5c6b66]">
              Próxima decisão
            </h2>
            <PrimaryInsightCard
              item={{
                tone: primaryInsight.tone,
                message: primaryInsight.message,
                sub: primaryInsight.sub,
                action: primaryInsight.action,
              }}
            />
          </section>
        )}

        <section className="space-y-2" aria-label="Evolução e narrativa">
          <div className="min-h-[340px]">
            <MainChart
              data={weeklySeries}
              title="A história do negócio (semana a semana)"
              subtitle={mainChartSub}
            />
          </div>
        </section>

        <section
          className="grid items-stretch gap-5 lg:grid-cols-12"
          aria-label="Projeção e composição"
        >
          <div className="lg:col-span-7">
            {viewMode === "global" && pg && (
              <ProjectionCard
                mode="global"
                stockLabel="Valor de inventário (R$)"
                stockValue={formatBRL(Math.round(pg.inventoryValueRevenue))}
                weeksRemaining={globalWeeks}
                trendPoints={trendRev}
                runwayLabel="Fatur. projectado (esgotar stock)"
                runwayValue={formatBRL(Math.round(pg.totalProjectedRevenue))}
              />
            )}
            {viewMode === "sector" && ps && activeSector && (
              <ProjectionCard
                mode="sector"
                stockLabel={`Stock restante (${pluralizeUnit(ps.unit, ps.stockRemaining)})`}
                stockValue={`${Math.round(ps.stockRemaining).toLocaleString("pt-BR")} ${pluralizeUnit(
                  unit,
                  ps.stockRemaining,
                )}`}
                weeksRemaining={sectorW}
                trendPoints={trendRev}
                runwayValue={
                  ps.etaDate ? `≈ ${fmtLongLocal().format(new Date(ps.etaDate))}` : null
                }
                runwayLabel="Conclusão estimada"
              />
            )}
            {viewMode === "sector" && !ps && (
              <div className="flex min-h-[200px] items-center rounded-2xl border border-[#e6eae8] bg-white p-6 text-sm text-[#5c6b66]">
                Seleccione um setor com stock para acções de projeção.
              </div>
            )}
          </div>
          <div className="min-h-0 lg:col-span-5">
            <PieChart
              title={viewMode === "global" ? "Onde está o faturamento" : "Onde vão as despesas (setor)"}
              slices={pieSlices}
            />
          </div>
        </section>

        <section id="simulacao" className="scroll-mt-24 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Simulação</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[10px] font-bold uppercase text-[#5c6b66]">Aplicar a</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e6eae8] bg-white px-3 py-1.5 shadow-sm">
              <input
                type="radio"
                name="sim-scope"
                checked={simulationScope === "view"}
                onChange={() => setSimulationScope("view")}
              />
              <span>Visão actual</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e6eae8] bg-white px-3 py-1.5 shadow-sm">
              <input
                type="radio"
                name="sim-scope"
                checked={simulationScope === "allSectors"}
                onChange={() => setSimulationScope("allSectors")}
              />
              <span>Comparar setores (tabela)</span>
            </label>
          </div>

          {simulationScope === "view" && (
            <SimulationPanel
              mode={viewMode}
              unit={pluralizeUnit(unit, 2)}
              sacasWeek={sacasWeek}
              setSacasWeek={setSacasWeek}
              priceExpect={priceExpect}
              setPriceExpect={setPriceExpect}
              onReset={() => {
                if (viewMode === "global") {
                  setGlobalSimWeekly(g.weeklyRevenue);
                } else if (activeSector) {
                  setSacasWeek(activeSector.unitsPerWeek);
                  setPriceExpect(activeSector.averagePrice);
                }
              }}
              simRevenue={simRevenue}
              simWeeks={simWeeks}
              globalWeekly={globalSimWeekly}
              setGlobalWeekly={setGlobalSimWeekly}
              globalRunway={globalRunwaySim}
              simCurve={simCurveForPanel}
              baselineGlobalWeekly={g.weeklyRevenue}
              baselineGlobalRunway={g.financialRunwayWeeks}
              baselineProjectedRevenue={ps?.projectedRevenue ?? activeSector?.projectedRevenue ?? null}
              baselineWeeksSector={ps?.weeksRemaining ?? null}
            />
          )}

          {simulationScope === "allSectors" && viewMode === "sector" && (
            <Card className="overflow-x-auto border-[#e6eae8] p-0 shadow-sm">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e6eae8] bg-[#f7f9f8] text-xs uppercase text-[#5c6b66]">
                    <th className="p-3">Setor</th>
                    <th className="p-3">Un./sem</th>
                    <th className="p-3">Sem. rest.</th>
                    <th className="p-3">Fatur. projectado</th>
                    <th className="p-3">Lucro (período)</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.sectorMetrics.map((m) => (
                    <tr key={m.sectorId} className="border-b border-[#e6eae8]/80 last:border-0">
                      <td className="p-3 font-medium text-slate-900">{m.sectorName}</td>
                      <td className="p-3 tabular-nums text-[#5c6b66]">
                        {m.unitsPerWeek.toFixed(1)} {m.unit}
                      </td>
                      <td className="p-3 tabular-nums">
                        {m.weeksRemaining != null
                          ? m.weeksRemaining.toFixed(1)
                          : "—"}
                      </td>
                      <td className="p-3 tabular-nums">
                        {m.projectedRevenue != null
                          ? formatBRL(Math.round(m.projectedRevenue))
                          : "—"}
                      </td>
                      <td className="p-3 tabular-nums" style={{ color: AN.profit }}>
                        {formatBRL(Math.round(m.totalProfit))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {simulationScope === "allSectors" && viewMode === "global" && (
            <p className="text-sm text-[#5c6b66]">
              Mude para <strong className="text-slate-800">Por setor</strong> para abrir a tabela comparativa
              de setores.
            </p>
          )}
        </section>

        {secondaryInsights.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Outros sinais a considerar</h2>
            <InsightsList primary={null} secondary={secondaryInsights} />
          </section>
        )}
      </div>
    </div>
  );
}
