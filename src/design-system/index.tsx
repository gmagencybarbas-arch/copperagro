import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
} from "react";

const cardBase =
  "rounded-[22px] bg-white p-6 shadow-[0_10px_38px_-22px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] transition-all duration-300 hover:-translate-y-px hover:shadow-[0_18px_44px_-24px_rgba(15,23,42,0.26)] dark:ds-glass dark:shadow-[0_20px_48px_-28px_rgba(0,0,0,0.8)] dark:ring-cyan-400/20";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${cardBase} ${className}`} {...props} />
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
      className={`rounded-xl bg-[#16a34a] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-emerald-500 dark:text-slate-950 dark:shadow-[0_0_0_1px_rgba(16,185,129,0.25),0_14px_30px_-18px_rgba(16,185,129,0.85)] dark:hover:bg-emerald-400 dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-slate-950 ${className}`}
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
      className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#16a34a] dark:border-cyan-400/30 dark:bg-[#05101a]/90 dark:text-cyan-50 dark:placeholder:text-cyan-200/40 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_0_1px_rgba(34,211,238,0.08)] dark:focus:ring-cyan-300 ${className}`}
      {...props}
    />
  );
});
