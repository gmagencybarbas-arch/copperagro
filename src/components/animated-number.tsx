"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof matchMedia === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Props = {
  value: number;
  /** Casas decimais (arredondamento final) */
  decimals?: number;
  durationMs?: number;
  className?: string;
  format?: (n: number) => string;
};

export function AnimatedNumber({
  value,
  decimals = 0,
  durationMs = 650,
  className = "",
  format,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (prefersReducedMotion() || durationMs <= 0) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    const ms = Math.min(720, Math.max(280, durationMs));
    let startAt: number | null = null;

    const tick = (ts: number) => {
      if (startAt === null) startAt = ts;
      const elapsed = ts - startAt;
      const t = Math.min(1, elapsed / ms);
      const eased = 1 - (1 - t) ** 4;
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, durationMs]);

  const rounded =
    decimals === 0
      ? Math.round(display)
      : Math.round(display * 10 ** decimals) / 10 ** decimals;

  const text = format ? format(rounded) : String(rounded);

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}
