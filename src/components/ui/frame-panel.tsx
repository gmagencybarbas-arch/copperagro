import type { HTMLAttributes, ReactNode } from "react";
import { CardHelp } from "@/components/ui/card-help";

type FramePanelProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Texto curto de ajuda ao lado do título */
  help?: ReactNode;
  /** Sem padding interno no body (útil para tabelas full-bleed). */
  flush?: boolean;
  bodyClassName?: string;
};

/**
 * Painel estilo ReUI Frame — paper no light, charcoal no dark.
 * Mantém a cara CopperAgro (verde agro), só o “chrome” muda.
 */
export function FramePanel({
  title,
  description,
  actions,
  help,
  flush = false,
  className = "",
  bodyClassName = "",
  children,
  ...props
}: FramePanelProps) {
  const hasHeader = title != null || description != null || actions != null;
  return (
    <div className={`frame-panel ${className}`} {...props}>
      {hasHeader && (
        <div className="frame-panel-header">
          <div className="min-w-0 space-y-0.5">
            {title != null && (
              <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-gray-900 dark:text-slate-50">
                <span className="min-w-0 truncate">{title}</span>
                {help != null ? <CardHelp>{help}</CardHelp> : null}
              </h2>
            )}
            {description != null && (
              <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {actions != null && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div className={`${flush ? "" : "p-5"} ${bodyClassName}`}>{children}</div>
    </div>
  );
}


export function DeltaBadge({
  value,
  suffix = "%",
  className = "",
}: {
  value: number | null | undefined;
  suffix?: string;
  className?: string;
}) {
  if (value == null || Number.isNaN(value)) {
    return (
      <span className={`inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}>
        —
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
        up
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      } ${className}`}
    >
      {up ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

export function RiskBadge({
  level,
}: {
  level: "healthy" | "watch" | "risk";
}) {
  const map = {
    healthy: {
      label: "Saudável",
      cls: "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/45 dark:text-emerald-200 dark:ring-emerald-800/50",
    },
    watch: {
      label: "Atenção",
      cls: "bg-amber-50 text-amber-900 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50",
    },
    risk: {
      label: "Risco",
      cls: "bg-rose-50 text-rose-800 ring-rose-200/80 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800/50",
    },
  } as const;
  const item = map[level];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${item.cls}`}
    >
      {item.label}
    </span>
  );
}
