"use client";

import { CleanInput, PrimaryButton } from "@/design-system";
import { useSalesStore } from "@/store/sales-store";
import type { ComparisonSeriesMode } from "@/types/sale";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MODE_HELP: Record<
  ComparisonSeriesMode,
  { title: string; hint: string }
> = {
  previous_period: {
    title: "Período imediatamente anterior",
    hint:
      "Usa o bloco de dias que vem logo antes do período que você filtrou, com a mesma duração. Ideal para ver se o ritmo atual melhorou ou piorou em relação ao recorte anterior.",
  },
  previous_month: {
    title: "Mesmo intervalo no mês anterior",
    hint:
      "Desloca o período filtrado um mês calendário para trás (mesma duração). Ex.: 1–30 de março vs o bloco equivalente em fevereiro. Bom para comparar mês atual com o mês passado.",
  },
  same_period_last_year: {
    title: "Mesmo intervalo no ano passado",
    hint:
      "Compara com as mesmas datas no calendário do ano anterior (ex.: seus 30 dias atuais vs os 30 dias equivalentes há um ano). Bom para ver sazonalidade e tendência anual.",
  },
  custom_interval: {
    title: "Outro intervalo (datas livres)",
    hint:
      "Você define início e fim calendário da linha cinza. O gráfico mantém o mesmo número de pontos do período filtrado, alinhados ao primeiro dia desse intervalo escolhido.",
  },
};

function formatShortIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function ComparisonModal() {
  const open = useSalesStore((s) => s.comparisonModalOpen);
  const closeComparisonModal = useSalesStore((s) => s.closeComparisonModal);
  const filter = useSalesStore((s) => s.filter);
  const isComparing = useSalesStore((s) => s.isComparing);
  const comparisonMode = useSalesStore((s) => s.comparisonMode);
  const comparisonCustomStart = useSalesStore((s) => s.comparisonCustomStart);
  const comparisonCustomEnd = useSalesStore((s) => s.comparisonCustomEnd);
  const setComparisonMode = useSalesStore((s) => s.setComparisonMode);
  const setComparisonCustomRange = useSalesStore((s) => s.setComparisonCustomRange);
  const toggleComparison = useSalesStore((s) => s.toggleComparison);

  const [mode, setMode] = useState<ComparisonSeriesMode>(comparisonMode);
  const [start, setStart] = useState(comparisonCustomStart);
  const [end, setEnd] = useState(comparisonCustomEnd);

  useEffect(() => {
    if (!open) return;
    setMode(comparisonMode);
    setStart(comparisonCustomStart);
    setEnd(comparisonCustomEnd);
  }, [
    open,
    comparisonMode,
    comparisonCustomStart,
    comparisonCustomEnd,
  ]);

  const periodMode = filter.dimension === "period";

  const apply = useCallback(() => {
    let nextMode = mode;
    if (!periodMode && (mode === "custom_interval" || mode === "previous_month")) {
      nextMode = "previous_period";
    }
    setComparisonMode(nextMode);
    setComparisonCustomRange(start, end);
    if (!isComparing) toggleComparison();
    closeComparisonModal();
  }, [
    mode,
    periodMode,
    start,
    end,
    setComparisonMode,
    setComparisonCustomRange,
    toggleComparison,
    isComparing,
    closeComparisonModal,
  ]);

  const disableCustom = !periodMode;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px] transition-colors duration-200"
        aria-label="Fechar"
        onClick={closeComparisonModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-modal-title"
        className="relative z-[10051] max-h-[min(90vh,calc(100%-2rem))] w-full max-w-lg overflow-y-auto rounded-[22px] border border-gray-100 bg-white p-6 shadow-2xl ring-1 ring-black/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="comparison-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              Comparar períodos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Escolha como a linha cinza do gráfico deve ser calculada em relação
              ao período filtrado.
            </p>
          </div>
          <button
            type="button"
            onClick={closeComparisonModal}
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {!periodMode && (
          <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-950">
            No modo <strong>Semana do mês</strong>, a comparação usa sempre o mês
            anterior ou o ano anterior. Intervalo livre e “mesmo intervalo no mês
            anterior” só estão disponíveis em <strong>Período</strong>.
          </p>
        )}

        <div className="mt-6 space-y-3">
          {(
            [
              "previous_period",
              "previous_month",
              "same_period_last_year",
              "custom_interval",
            ] as const
          ).map((id) => {
            const disabled =
              disableCustom &&
              (id === "custom_interval" || id === "previous_month");
            const active = mode === id;
            const meta = MODE_HELP[id];
            return (
              <label
                key={id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-all ${
                  disabled
                    ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                    : active
                      ? "border-green-600/40 bg-green-50/90 ring-1 ring-green-600/20"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="cmp-mode"
                  className="mt-1 shrink-0"
                  checked={active}
                  disabled={disabled}
                  onChange={() => {
                    if (!disabled) setMode(id);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-gray-800">
                    {meta.title}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-gray-500">
                    {meta.hint}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        {mode === "custom_interval" && periodMode && (
          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase text-gray-400">
                Início da comparação
              </span>
              <CleanInput
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-44 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase text-gray-400">
                Fim da comparação
              </span>
              <CleanInput
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-44 text-xs"
              />
            </div>
            <p className="w-full text-xs text-gray-500">
              A série cinza terá o mesmo número de pontos que o período atual,
              alinhada ao primeiro dia deste intervalo.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              if (isComparing) toggleComparison();
              closeComparisonModal();
            }}
            className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-gray-800 hover:underline"
          >
            Não comparar agora
          </button>
          <PrimaryButton type="button" onClick={apply}>
            Aplicar comparação
          </PrimaryButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function comparisonSummaryLabel(params: {
  mode: ComparisonSeriesMode;
  customStart: string;
  customEnd: string;
}): string {
  if (params.mode === "same_period_last_year") return "ano anterior";
  if (params.mode === "previous_month") return "mês anterior (mesmo recorte)";
  if (params.mode === "custom_interval") {
    return `${formatShortIso(params.customStart)} — ${formatShortIso(params.customEnd)}`;
  }
  return "período anterior";
}
