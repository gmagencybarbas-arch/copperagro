import type { HTMLAttributes, ReactNode } from "react";

type TableScrollProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Dica visual só no mobile (arraste lateral). */
  hint?: boolean;
};

/**
 * Wrapper de tabela com pan horizontal livre no touch (mobile).
 */
export function TableScroll({
  children,
  className = "",
  hint = true,
  ...props
}: TableScrollProps) {
  return (
    <div className="relative min-w-0">
      {hint && (
        <p className="px-4 pb-1 pt-2 text-[11px] font-medium text-gray-400 md:hidden dark:text-slate-500">
          Arraste a tabela para o lado para ver mais colunas
        </p>
      )}
      <div className={`table-scroll ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
}
