"use client";

import { Info } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type CardHelpProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

/**
 * Ícone “i”: hover abre; sai o rato e fecha.
 * Clique fixa; clique fora fecha.
 * Balão centrado **acima** do botão (portal no body, sem sair da tela).
 */
export function CardHelp({
  children,
  className = "",
  label = "Ajuda",
}: CardHelpProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, arrowLeft: 50, below: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const place = useCallback(() => {
    const btn = btnRef.current;
    const bubble = bubbleRef.current;
    if (!btn || !bubble) return;

    const r = btn.getBoundingClientRect();
    const pad = 10;
    const gap = 8;
    const bw = bubble.offsetWidth || 232;
    const bh = bubble.offsetHeight || 72;
    const btnCenterX = r.left + r.width / 2;

    let left = btnCenterX - bw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - bw - pad));

    let below = false;
    let top = r.top - bh - gap;
    if (top < pad) {
      below = true;
      top = r.bottom + gap;
    }
    if (!below && top + bh > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - bh - pad);
    }

    const arrowLeft = Math.max(12, Math.min(bw - 12, btnCenterX - left));

    setCoords({ top, left, arrowLeft, below });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const id = requestAnimationFrame(() => place());
    return () => cancelAnimationFrame(id);
  }, [open, place, children]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (bubbleRef.current?.contains(t)) return;
      setOpen(false);
      setSticky(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const bubble =
    mounted && open
      ? createPortal(
          <div
            ref={bubbleRef}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 10000,
              pointerEvents: sticky ? "auto" : "none",
            }}
            className="w-[min(14.5rem,calc(100vw-1.25rem))] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left text-[11px] leading-snug text-gray-600 shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/5"
          >
            {children}
            <span
              aria-hidden
              className={`pointer-events-none absolute h-2 w-2 rotate-45 border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
                coords.below
                  ? "-top-1 border-l border-t"
                  : "-bottom-1 border-b border-r"
              }`}
              style={{ left: coords.arrowLeft, marginLeft: -4 }}
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      ref={rootRef}
      className={`relative inline-flex shrink-0 align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!sticky) setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (sticky) {
            setSticky(false);
            setOpen(false);
          } else {
            setSticky(true);
            setOpen(true);
          }
        }}
        className={`inline-flex size-5 items-center justify-center rounded-full transition-colors ${
          open
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            : "bg-gray-100/90 text-gray-400 hover:bg-gray-200/80 hover:text-gray-600 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        <Info className="size-3" strokeWidth={2.4} aria-hidden />
      </button>
      {bubble}
    </span>
  );
}

export function CardHelpLabel({
  children,
  help,
  className = "",
}: {
  children: ReactNode;
  help: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`}>
      <span className="min-w-0 truncate">{children}</span>
      <CardHelp>{help}</CardHelp>
    </span>
  );
}
