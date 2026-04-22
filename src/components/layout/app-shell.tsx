"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ExpenseDrawer } from "@/components/expense-drawer/expense-drawer";
import { SaleDrawer } from "@/components/sale-drawer/sale-drawer";
import { StockEntryDrawer } from "@/components/stock-entry-drawer/stock-entry-drawer";
import { useDrawerStore } from "@/store/drawer-store";
import { useSalesStore } from "@/store/sales-store";
import { DEFAULT_SECTOR_ID, useSectorStore } from "@/store/sector-store";
import { useUIStore } from "@/store/ui-store";
import {
  ArrowUpRight,
  ClipboardList,
  ChevronDown,
  FileBarChart,
  LayoutGrid,
  LineChart,
  PackageOpen,
  Plus,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Painel",
    Icon: LayoutGrid,
  },
  {
    href: "/analises",
    label: "Análises",
    shortLabel: "Análises",
    Icon: LineChart,
  },
  {
    href: `/setor/${DEFAULT_SECTOR_ID}`,
    label: "Vendas",
    shortLabel: "Vendas",
    Icon: ClipboardList,
  },
  {
    href: "/estoque",
    label: "Estoque",
    shortLabel: "Estoque",
    Icon: PackageOpen,
  },
] as const;

/** Ordem: Painel, Análises, Vendas, Despesas, Estoque (Despesas logo após Vendas). */
const mobileNav = [
  { href: "/dashboard", shortLabel: "Painel", Icon: LayoutGrid },
  { href: "/analises", shortLabel: "Análises", Icon: LineChart },
  { href: `/setor/${DEFAULT_SECTOR_ID}` as const, shortLabel: "Vendas", Icon: ClipboardList },
  { href: "/despesas", shortLabel: "Despesas", Icon: Wallet },
  { href: "/estoque", shortLabel: "Estoque", Icon: PackageOpen },
] as const;

const titles: Record<string, string> = {
  "/dashboard": "Painel",
  "/analises": "Análises",
  "/despesas": "Despesas",
  "/estoque": "Estoque",
  "/planos": "Planos",
};

function NavIcon({
  Icon,
  active,
  size = "md",
}: {
  Icon: (typeof nav)[number]["Icon"];
  active: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-[17px] w-[17px]" : "h-[18px] w-[18px]";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
        size === "sm" ? "h-9 w-9" : "h-10 w-10"
      } ${
        active
          ? "bg-[#16a34a] text-white shadow-sm ring-1 ring-[#15803d]/20"
          : "text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:bg-slate-900 dark:group-hover:text-slate-300"
      }`}
      aria-hidden
    >
      <Icon className={dim} strokeWidth={1.85} />
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const setModule = useUIStore((s) => s.setModule);
  const sectors = useSectorStore((s) => s.sectors);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const setSelectedSector = useSectorStore((s) => s.setSelectedSector);
  const [salesOpen, setSalesOpen] = useState(true);

  const title = useMemo(() => {
    if (!pathname) return "CoopFinance";
    if (pathname.startsWith("/setor/")) {
      const id = pathname.split("/")[2] ?? "";
      const sector = sectors.find((s) => s.id === id);
      return sector?.name ?? "Setor";
    }
    return titles[pathname] ?? "CoopFinance";
  }, [pathname, sectors]);

  useEffect(() => {
    useSalesStore.getState().ensureLedgerSynced();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/setor/")) {
      const id = pathname.split("/")[2] ?? "";
      if (id) setSelectedSector(id);
    }
  }, [pathname, setSelectedSector]);

  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/setor/") || pathname.startsWith("/vendas")) {
      setModule("sales");
      return;
    }

    if (pathname.startsWith("/despesas")) {
      setModule("expenses");
      return;
    }

    if (pathname.startsWith("/estoque")) {
      setModule("stock");
      return;
    }

    if (pathname.startsWith("/analises")) {
      setModule("analytics");
      return;
    }

    setModule("dashboard");
  }, [pathname, setModule]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900 antialiased dark:bg-transparent dark:text-cyan-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-[17rem] flex-col border-r border-gray-200/80 bg-white/95 shadow-sm backdrop-blur dark:border-cyan-400/20 dark:bg-[#030d18]/92 dark:shadow-[inset_-1px_0_0_rgba(34,211,238,0.08)] md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-gray-100 px-5 dark:border-cyan-400/20">
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            CoopFinance
          </span>
          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#16a34a] dark:bg-emerald-950/80 dark:text-emerald-400">
            {selectedSectorId
              ? (sectors.find((s) => s.id === selectedSectorId)?.name ?? "setor")
              : "global"}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Principal">
          {nav.filter((item) => !item.href.startsWith("/setor/")).map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "bg-emerald-50/70 text-gray-900 shadow-sm ring-1 ring-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-800/60"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <NavIcon Icon={Icon} active={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-1 space-y-1">
            <button
              type="button"
              onClick={() => setSalesOpen((v) => !v)}
              className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                pathname?.startsWith("/setor/")
                  ? "bg-emerald-50/70 text-gray-900 shadow-sm ring-1 ring-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-50 dark:ring-emerald-800/60"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <NavIcon Icon={ClipboardList} active={Boolean(pathname?.startsWith("/setor/"))} />
              <span className="flex-1 text-left">Vendas</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${salesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {salesOpen && (
              <div className="ml-3 space-y-1 border-l border-emerald-100 pl-3 dark:border-emerald-900/70">
                {sectors.map((sector) => {
                  const active = pathname === `/setor/${sector.id}`;
                  return (
                    <Link
                      key={sector.id}
                      href={`/setor/${sector.id}`}
                      onClick={() => setSelectedSector(sector.id)}
                      className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-slate-900"
                      }`}
                    >
                      {sector.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/despesas"
            className={`group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
              pathname === "/despesas"
                ? "bg-red-50/80 text-red-900 shadow-sm ring-1 ring-red-100/80 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/50"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            }`}
            aria-current={pathname === "/despesas" ? "page" : undefined}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                pathname === "/despesas"
                  ? "bg-red-600 text-white shadow-sm ring-1 ring-red-700/20"
                  : "text-gray-400 group-hover:bg-gray-50 group-hover:text-red-600 dark:group-hover:bg-slate-900"
              }`}
            >
              <Wallet className="h-[18px] w-[18px]" strokeWidth={1.85} />
            </span>
            <span>Despesas</span>
          </Link>
          <QuickExpenseButton />
          <QuickSaleButton />
        </nav>
        <div className="mt-auto shrink-0 space-y-3 border-t border-gray-100 p-4 dark:border-slate-800">
          <Link
            href="/relatorios"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <FileBarChart className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span>Relatórios</span>
          </Link>
          <button
            type="button"
            onClick={() => router.push("/planos")}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2 font-medium text-white transition-all hover:scale-[1.02] hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98]"
          >
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
            Upgrade
          </button>
          <div className="pt-2">
            <ThemeToggle subtle />
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-600">
            MVP · apenas café
          </p>
        </div>
      </aside>

      <div className="md:pl-[17rem]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200/80 bg-[#f7f7f7]/90 px-4 py-3 backdrop-blur dark:border-cyan-400/15 dark:bg-[#04101b]/75 md:px-8 md:py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-slate-50">
              {title}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-slate-400">
              CoopFinance ·{" "}
              {selectedSectorId
                ? (sectors.find((s) => s.id === selectedSectorId)?.name ?? "setor")
                : "visão global"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <ThemeToggle compact />
            </div>
            <PrimaryActionButton />
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 md:px-8 md:pb-16">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200/90 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-cyan-400/20 dark:bg-[#030d18]/92 md:hidden"
        aria-label="Navegação principal"
      >
        {mobileNav.map((item) => {
          const isSales = item.href.startsWith("/setor/");
          const active = isSales
            ? Boolean(pathname?.startsWith("/setor/"))
            : pathname === item.href;
          const isExpense = item.href === "/despesas";
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={isSales ? () => setSelectedSector(DEFAULT_SECTOR_ID) : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors duration-150 active:opacity-90 ${
                active
                  ? isExpense
                    ? "text-red-600 dark:text-red-400"
                    : "text-[#16a34a] dark:text-emerald-400"
                  : "text-gray-500 dark:text-slate-500"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                  active
                    ? isExpense
                      ? "bg-red-600 text-white shadow-md shadow-red-600/25 ring-1 ring-red-700/15"
                      : "bg-[#16a34a] text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-700/15 dark:shadow-emerald-900/40"
                    : "bg-gray-100/90 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
              <span
                className={`max-w-full truncate text-[10px] font-semibold leading-tight ${
                  active ? (isExpense ? "text-red-700" : "text-[#15803d]") : "text-gray-500"
                }`}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <SaleDrawer />
      <StockEntryDrawer />
      <ExpenseDrawer />
    </div>
  );
}

function PrimaryActionButton() {
  const currentModule = useUIStore((s) => s.currentModule);
  const openSaleDrawer = useDrawerStore((s) => s.openSaleDrawer);
  const openExpenseDrawer = useDrawerStore((s) => s.openExpenseDrawer);

  const handlePrimaryAction = () => {
    if (currentModule === "sales") {
      openSaleDrawer();
      return;
    }

    if (currentModule === "expenses") {
      openExpenseDrawer();
      return;
    }

    openSaleDrawer();
  };

  const actionLabel = currentModule === "expenses" ? "Nova Despesa" : "Nova Venda";

  return (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#16a34a] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-green-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 sm:px-4"
    >
      <Plus className="h-[18px] w-[18px]" strokeWidth={2.25} />
      <span className="hidden sm:inline">{actionLabel}</span>
    </button>
  );
}

function QuickExpenseButton() {
  const openExpenseDrawer = useDrawerStore((s) => s.openExpenseDrawer);

  return (
    <button
      type="button"
      onClick={openExpenseDrawer}
      className="mt-2 w-full rounded-xl bg-red-500 py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-red-600 active:scale-[0.98]"
    >
      Lançar despesa
    </button>
  );
}

function QuickSaleButton() {
  const openSaleDrawer = useDrawerStore((s) => s.openSaleDrawer);

  return (
    <button
      type="button"
      onClick={openSaleDrawer}
      className="w-full rounded-xl bg-[#16a34a] py-2 text-sm font-medium text-white transition-all hover:scale-[1.02] hover:bg-green-700 active:scale-[0.98]"
    >
      Lançar venda
    </button>
  );
}
