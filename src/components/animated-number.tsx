"use client";

import { useEffect, useRef, useState } from "react";

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
    let startAt: number | null = null;

    const tick = (ts: number) => {
      if (startAt === null) startAt = ts;
      const elapsed = ts - startAt;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - t) ** 3;
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
