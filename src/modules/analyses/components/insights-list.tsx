"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, Lightbulb } from "lucide-react";
import { AN } from "./analytics-tokens";

export type InsightTone = "positive" | "warning" | "negative" | "neutral";

type Item = { tone: InsightTone; message: string; sub?: string; action?: string };

const toneMap: Record<
  InsightTone,
  { border: string; bg: string; icon: typeof Lightbulb; color: string }
> = {
  positive: {
    border: "border-emerald-200/90",
    bg: "bg-emerald-50/80",
    icon: ArrowUpRight,
    color: "#1f7a63",
  },
  negative: {
    border: "border-rose-200/90",
    bg: "bg-rose-50/80",
    icon: ArrowDownRight,
    color: AN.red,
  },
  warning: {
    border: "border-amber-200/90",
    bg: "bg-amber-50/70",
    icon: AlertTriangle,
    color: "#b45309",
  },
  neutral: {
    border: "border-slate-200/90",
    bg: "bg-slate-50/80",
    icon: Lightbulb,
    color: "#5c6b66",
  },
};

type ListProps = {
  /** 1 destaque — sinal mais forte, accionável */
  primary: Item | null;
  /** 2–4 secundários, mais discretos */
  secondary: Item[];
};

/** Card grande do insight primário (colocar acima do gráfico principal) */
export function PrimaryInsightCard({ item }: { item: Item }) {
  return <PrimaryBlock item={item} />;
}

/**
 * Secundários abaixo (2–4). O primário fica noutro sítio com `PrimaryInsightCard`.
 */
export function InsightsList({ primary, secondary }: ListProps) {
  if (!primary && secondary.length === 0) {
    return (
      <p className="text-sm text-[#5c6b66]">Sem outras pistas automáticas com estes dados.</p>
    );
  }

  return (
    <div className="space-y-4">
      {primary && <PrimaryBlock item={primary} />}
      {secondary.length > 0 && (
        <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Sinais secundários">
          {secondary.map((it, i) => {
            const t = toneMap[it.tone];
            const Icon = t.icon;
            return (
              <li
                key={i}
                className={`flex gap-2.5 rounded-xl border p-3 transition-all duration-200 hover:shadow-sm ${t.border} ${t.bg}`}
              >
                <span
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/90 shadow-sm"
                  style={{ color: t.color }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
                    {it.message}
                  </p>
                  {it.sub && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#5c6b66]">
                      {it.sub}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PrimaryBlock({ item }: { item: Item }) {
  const t = toneMap[item.tone];
  const Icon = t.icon;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 ${t.border} ${
        item.tone === "positive"
          ? "bg-gradient-to-br from-emerald-50/95 to-white"
          : item.tone === "negative"
            ? "bg-gradient-to-br from-rose-50/90 to-white"
            : item.tone === "warning"
              ? "bg-gradient-to-br from-amber-50/90 to-white"
              : "bg-gradient-to-br from-slate-50/90 to-white"
      } `}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm"
          style={{ color: t.color }}
        >
          <Icon className="h-6 w-6" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c6b66]">
            Principal
          </p>
          <p className="mt-1.5 text-base font-bold leading-tight text-slate-900 dark:text-slate-50 sm:text-lg">
            {item.message}
          </p>
          {item.sub && (
            <p className="mt-2 text-sm leading-relaxed text-[#5c6b66]">{item.sub}</p>
          )}
          {item.action && (
            <p className="mt-3 text-sm font-semibold text-[#1f7a63]">→ {item.action}</p>
          )}
        </div>
      </div>
    </div>
  );
}
