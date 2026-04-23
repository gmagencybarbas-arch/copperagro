import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

const cardBase =
  "bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 ease-app hover:shadow-md hover:-translate-y-0.5 active:scale-[0.998] dark:border-slate-700/80 dark:bg-slate-800/90 dark:hover:shadow-lg";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${cardBase} ${className}`} {...props} />;
}

export type HeroCardProps = {
  title: ReactNode;
  value: ReactNode;
  subtitle?: ReactNode;
  growth?: ReactNode;
  className?: string;
};

export function HeroCard({ title, value, subtitle, growth, className = "" }: HeroCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-700 to-green-900 p-6 text-white shadow-lg transition-all duration-300 ease-app hover:scale-[1.008] active:scale-[0.998] dark:from-emerald-900 dark:to-slate-900 ${className}`}
    >
      <p className="mb-2 text-sm opacity-80">{title}</p>

      <h2 className="text-3xl font-bold tracking-tight">{value}</h2>

      {subtitle != null && subtitle !== false && <p className="mt-1 text-sm opacity-80">{subtitle}</p>}

      {growth != null && growth !== false && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
          {growth}
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-6xl opacity-10" aria-hidden>
        🌿
      </div>
    </div>
  );
}

export function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        positive
          ? "bg-green-100 text-green-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200"
      }`}
    >
      {positive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

export function Title({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm font-medium tracking-wide text-gray-500 dark:text-slate-400 ${className}`}
      {...props}
    />
  );
}

export function BigNumber({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`max-w-full min-w-0 text-balance break-words text-[clamp(1.65rem,3.6vmin,2.85rem)] font-semibold tabular-nums tracking-tight leading-[1.12] text-gray-900 dark:text-slate-50 sm:text-[clamp(1.85rem,3.2vw,3rem)] lg:text-[clamp(2rem,2.8vw,3.25rem)] ${className}`}
      {...props}
    />
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-app hover:scale-[1.015] hover:bg-green-800 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600 dark:focus-visible:ring-emerald-500 dark:focus-visible:ring-offset-slate-900 ${className}`}
      {...props}
    />
  );
}

export const CleanInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function CleanInput({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all duration-200 ease-app placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-700/80 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-emerald-600/80 ${className}`}
      {...props}
    />
  );
});
