"use client";

import {
  ComparisonModal,
  comparisonSummaryLabel,
} from "@/components/comparison-modal/comparison-modal";
import { CleanInput } from "@/design-system";
import {
  addDays,
  formatWeekMonthLabel,
  isoDateFromDate,
} from "@/store/sales-metrics";
import { useSalesStore } from "@/store/sales-store";
import type {
  FilterDimension,
  PeriodPreset,
  PriceChartGranularity,
  SalesFilterState,
} from "@/types/sale";

const PERIOD_PILLS: { id: PeriodPreset; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "year", label: "Ano" },
  { id: "custom", label: "Personalizado" },
];

function monthPickerOptions(count = 36): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return out;
}

function formatMonthOption(monthRef: string): string {
  const [y, m] = monthRef.split("-").map(Number);
  if (!y || !m) return monthRef;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function SalesFilterBar() {
  const filter = useSalesStore((s) => s.filter);
  const setSalesFilter = useSalesStore((s) => s.setSalesFilter);
  const isComparing = useSalesStore((s) => s.isComparing);
  const openComparisonModal = useSalesStore((s) => s.openComparisonModal);
  const comparisonMode = useSalesStore((s) => s.comparisonMode);
  const comparisonCustomStart = useSalesStore((s) => s.comparisonCustomStart);
  const comparisonCustomEnd = useSalesStore((s) => s.comparisonCustomEnd);

  const monthOpts = monthPickerOptions();

  return (
    <div className="rounded-[22px] border border-gray-100 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="filter-dimension">
            Filtrar por
          </label>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Filtrar por
          </span>
          <select
            id="filter-dimension"
            value={filter.dimension}
            onChange={(e) => {
              const dimension = e.target.value as FilterDimension;
              setSalesFilter({ dimension });
            }}
            className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
          >
            <option value="period">Período</option>
            <option value="week">Semana do mês</option>
          </select>
        </div>

        {filter.dimension === "period" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              {PERIOD_PILLS.map((p) => {
                const active = filter.periodPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (p.id === "custom") {
                        const now = new Date();
                        setSalesFilter({
                          periodPreset: "custom",
                          customEnd: isoDateFromDate(now),
                          customStart: isoDateFromDate(addDays(now, -29)),
                        });
                      } else {
                        setSalesFilter({ periodPreset: p.id });
                      }
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                      active
                        ? "scale-100 bg-[#16a34a] text-white shadow-md shadow-green-900/10"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-[1.02]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            {filter.periodPreset === "custom" && (
              <div className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3 sm:border-0 sm:pt-0">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase text-gray-400">
                    De
                  </span>
                  <CleanInput
                    type="date"
                    value={filter.customStart}
                    onChange={(e) =>
                      setSalesFilter({ customStart: e.target.value })
                    }
                    className="w-40 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium uppercase text-gray-400">
                    Até
                  </span>
                  <CleanInput
                    type="date"
                    value={filter.customEnd}
                    onChange={(e) =>
                      setSalesFilter({ customEnd: e.target.value })
                    }
                    className="w-40 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase text-gray-400">
                Mês
              </span>
              <select
                value={filter.monthRef}
                onChange={(e) =>
                  setSalesFilter({ monthRef: e.target.value })
                }
                className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                {monthOpts.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthOption(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-medium uppercase text-gray-400">
                Semana
              </span>
              <div className="flex gap-2">
                {([1, 2, 3, 4] as const).map((w) => {
                  const active = filter.weekOfMonth === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSalesFilter({ weekOfMonth: w })}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "bg-[#16a34a] text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="rounded-xl border border-dashed border-green-200 bg-green-50/60 px-3 py-2 text-xs font-medium text-green-900 sm:self-center">
              {formatWeekMonthLabel(filter.monthRef, filter.weekOfMonth)}
            </p>
          </div>
        )}

        <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 pt-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Visualização
          </span>
          {filter.dimension === "period" && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="price-chart-granularity"
                className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
              >
                Preço no gráfico
              </label>
              <select
                id="price-chart-granularity"
                value={filter.priceChartGranularity}
                onChange={(e) =>
                  setSalesFilter({
                    priceChartGranularity: e.target.value as PriceChartGranularity,
                  })
                }
                className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                <option value="day">Por dia</option>
                <option value="week">Por semana</option>
                <option value="month">Por mês</option>
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => openComparisonModal()}
            aria-pressed={isComparing}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300 ease-out active:scale-[0.98] ${
              isComparing
                ? "bg-green-600 text-white shadow-green-900/15 ring-2 ring-green-600/30 ring-offset-2"
                : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Comparar
          </button>
          {isComparing && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Comparando com
              </span>
              <button
                type="button"
                onClick={() => openComparisonModal()}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-left text-[11px] font-medium leading-snug text-gray-700 transition-colors hover:bg-gray-100"
              >
                <span className="block font-semibold text-gray-900">
                  {comparisonSummaryLabel({
                    mode: comparisonMode,
                    customStart: comparisonCustomStart,
                    customEnd: comparisonCustomEnd,
                  })}
                </span>
                <span className="mt-0.5 block text-[10px] font-normal text-gray-500">
                  Toque para alterar o modo ou as datas
                </span>
              </button>
            </div>
          )}
          <p className="max-w-[14rem] text-[11px] leading-snug text-gray-500">
            {isComparing
              ? comparisonMode === "same_period_last_year"
                ? "Linha cinza = mesmo calendário no ano passado."
                : comparisonMode === "previous_month"
                  ? "Linha cinza = mesmo comprimento um mês calendário antes."
                  : comparisonMode === "custom_interval"
                    ? "Linha cinza = intervalo que você definiu no modal."
                    : "Linha cinza = período imediatamente anterior ao filtro."
              : "Use Comparar para escolher período anterior, mês anterior, ano passado ou datas livres."}
          </p>
        </div>
      </div>
      <ComparisonModal />
    </div>
  );
}
