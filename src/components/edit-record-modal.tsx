"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function EditRecordModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[22px] border border-gray-100 bg-white p-6 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Editar lançamento
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-slate-50">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
        <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-between dark:border-slate-800">
          {footer}
        </div>
      </div>
    </div>
  );
}
