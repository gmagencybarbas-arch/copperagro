"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileMoreSheet } from "@/components/layout/mobile-more-sheet";
import { ExpenseDrawer } from "@/components/expense-drawer/expense-drawer";
import { SectorGlyph } from "@/components/sector/sector-icon";
import { SectorCreateModal } from "@/components/sector-create-modal";
import { SectorSelectorModal } from "@/components/sector/sector-selector-modal";
import { SaleDrawer } from "@/components/sale-drawer/sale-drawer";
import { StockEntryDrawer } from "@/components/stock-entry-drawer/stock-entry-drawer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useDrawerStore } from "@/store/drawer-store";
import { usePlanStore } from "@/store/plan-store";
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
  MoreHorizontal,
  PackageOpen,
  Plus,
  Settings,
  Sprout,
  UserRound,
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
  { href: `/setor/${DEFAULT_SECTOR_ID}` as const, shortLabel: "Vendas", Icon: ClipboardList },
  { href: "/despesas", shortLabel: "Despesas", Icon: Wallet },
  { href: "/estoque", shortLabel: "Estoque", Icon: PackageOpen },
  { href: "#more", shortLabel: "Mais", Icon: MoreHorizontal },
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
      className={`flex shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ease-app ${
        size === "sm" ? "h-9 w-9" : "h-10 w-10"
      } ${
        active
          ? "bg-white text-[#166534] shadow-sm ring-1 ring-green-200/90 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/40"
          : "text-gray-400 group-hover:bg-white/50 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:bg-slate-800"
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
  const createSector = useSectorStore((s) => s.createSector);
  const currentPlan = usePlanStore((s) => s.currentPlan);
  const [salesOpen, setSalesOpen] = useState(true);
  const isMobile = useIsMobile();
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [sectorCreateOpen, setSectorCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openSaleAfterSector, setOpenSaleAfterSector] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  const handleSectorPicked = (sectorId: string) => {
    setSelectedSector(sectorId);
    router.push(`/setor/${sectorId}`);
    setSectorModalOpen(false);
    if (openSaleAfterSector) {
      setOpenSaleAfterSector(false);
      requestAnimationFrame(() => {
        useDrawerStore.getState().openSaleDrawer();
      });
    }
  };

  const openSectorPicker = (opts: { forSale: boolean }) => {
    if (opts.forSale) setOpenSaleAfterSector(true);
    else setOpenSaleAfterSector(false);
    setSectorModalOpen(true);
  };

  const title = useMemo(() => {
    if (!pathname) return "CoopFinance";
    if (pathname.startsWith("/setor/")) {
      const id = pathname.split("/")[2] ?? "";
      const sector = sectors.find((s) => s.id === id);
      return sector?.name ?? "Setor";
    }
    return titles[pathname] ?? "CoopFinance";
  }, [pathname, sectors]);

  const headerSubtitle = useMemo(() => {
    if (!pathname) return "Gestão e inteligência operacional";
    if (pathname.startsWith("/setor/")) return "Desempenho e análise";
    if (pathname === "/despesas") return "Controle de custos e distribuição";
    if (pathname === "/estoque") return "Movimentações, saldos e rastreio";
    if (pathname === "/analises") return "Indicadores e comparações";
    if (pathname === "/planos") return "Assinatura e recursos do plano";
    if (pathname === "/relatorios") return "Relatórios e exportação";
    if (pathname === "/dashboard") return "Visão geral da operação";
    return "CoopFinance";
  }, [pathname]);

  const activeSectorId = useMemo(() => {
    if (pathname?.startsWith("/setor/")) {
      return pathname.split("/")[2] ?? null;
    }
    return selectedSectorId;
  }, [pathname, selectedSectorId]);

  useEffect(() => {
    if (!createFeedback) return;
    const t = window.setTimeout(() => setCreateFeedback(null), 2400);
    return () => window.clearTimeout(t);
  }, [createFeedback]);

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
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 antialiased dark:bg-slate-900 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-[17rem] flex-col border-r border-gray-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] dark:border-slate-700/90 dark:bg-slate-900 md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-gray-100 px-5 dark:border-slate-800">
          <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-slate-100">
            CoopFinance
          </span>
          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#166534] dark:bg-emerald-950/50 dark:text-emerald-300/90">
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
                className={`group flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  active
                    ? "border-green-200 bg-green-50 text-green-800 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-200"
                    : "border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
              className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                pathname?.startsWith("/setor/")
                  ? "border-green-200 bg-green-50 text-green-800 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/35 dark:text-emerald-200"
                  : "border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                        active
                          ? "border border-green-200 bg-green-50 font-medium text-green-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 dark:text-slate-300">
                        <SectorGlyph icon={sector.icon} sectorId={sector.id} className="h-4 w-4" />
                      </span>
                      <span>{sector.name}</span>
                    </Link>
                  );
                })}
                {currentPlan === "infinity" ? (
                  <button
                    type="button"
                    onClick={() => setSectorCreateOpen(true)}
                    className="mt-2 w-full rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-left text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
                  >
                    + Novo setor
                  </button>
                ) : (
                  <p className="mt-2 px-1 text-[11px] text-gray-500">
                    Disponível apenas no plano Infinity
                  </p>
                )}
              </div>
            )}
          </div>

          <Link
            href="/despesas"
            className={`group flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
              pathname === "/despesas"
                ? "border-rose-200 bg-rose-50 text-rose-900 shadow-sm dark:border-rose-800/50 dark:bg-rose-950/35 dark:text-rose-100"
                : "border-transparent text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
            aria-current={pathname === "/despesas" ? "page" : undefined}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                pathname === "/despesas"
                  ? "bg-rose-700 text-white shadow-sm ring-1 ring-rose-800/30"
                  : "text-gray-400 group-hover:bg-gray-50 group-hover:text-rose-700 dark:group-hover:bg-slate-800"
              }`}
            >
              <Wallet className="h-[18px] w-[18px]" strokeWidth={1.85} />
            </span>
            <span>Despesas</span>
          </Link>
          <QuickExpenseButton />
          <QuickSaleButton />
        </nav>
        <div className="mt-auto shrink-0 space-y-3 border-t border-gray-200/90 p-4 dark:border-slate-800">
          <Link
            href="/relatorios"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          >
            <FileBarChart className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span>Relatórios</span>
          </Link>
          <Link
            href="/conta"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          >
            <UserRound className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span>Conta</span>
          </Link>
          <Link
            href="/configuracoes"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
          >
            <Settings className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span>Configurações</span>
          </Link>
          <button
            type="button"
            onClick={() => router.push("/planos")}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#166534] to-[#15803d] py-2 font-medium text-white shadow-sm transition-all hover:scale-[1.01] hover:from-[#14532d] hover:to-[#166534] active:scale-[0.99]"
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
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-gray-200/90 bg-white/90 px-4 py-3 backdrop-blur transition-[background-color,box-shadow,border-color,backdrop-filter] duration-200 ease-app dark:border-slate-700/80 dark:bg-slate-900/90 md:px-8 md:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 sm:flex dark:bg-emerald-950/50">
              {pathname?.startsWith("/setor/") ? (
                <SectorGlyph
                  icon={sectors.find((s) => s.id === activeSectorId)?.icon}
                  sectorId={activeSectorId ?? undefined}
                  className="h-5 w-5 text-green-800 dark:text-emerald-400"
                />
              ) : (
                <Sprout className="h-5 w-5 text-green-800 dark:text-emerald-400" strokeWidth={1.75} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
                <span>CoopFinance</span>
                {pathname?.startsWith("/setor/") && (
                  <span className="text-gray-500"> / Vendas</span>
                )}
              </p>
              <h1 className="truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">
                {title}
              </h1>
              <p className="truncate text-sm text-gray-500 dark:text-slate-400">{headerSubtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="md:hidden">
              <ThemeToggle compact />
            </div>
            <PrimaryActionButton
              onOpenSectorPickerForSale={() => openSectorPicker({ forSale: true })}
            />
          </div>
        </header>

        <main
          key={pathname ?? ""}
          className="app-content-enter px-4 pb-28 pt-6 md:px-8 md:pb-16"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200/90 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md transition-shadow duration-200 ease-app dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
        aria-label="Navegação principal"
      >
        {mobileNav.map((item) => {
          const isMore = item.href === "#more";
          const isSales = item.href.startsWith("/setor/");
          const active = isSales
            ? Boolean(pathname?.startsWith("/setor/"))
            : isMore
              ? moreOpen
              : pathname === item.href;
          const isExpense = item.href === "/despesas";
          const Icon = item.Icon;

          if (isMore) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => setMoreOpen(true)}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-all duration-150 active:scale-[0.98] ${
                  active ? "text-[#166534] dark:text-emerald-400/95" : "text-gray-500 dark:text-slate-500"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                    active
                      ? "bg-[#166534] text-white shadow-sm shadow-emerald-900/20 ring-1 ring-[#14532d]/20"
                      : "bg-gray-100/90 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                  aria-hidden
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-semibold leading-tight ${
                    active ? "text-[#14532d] dark:text-emerald-300/90" : "text-gray-500"
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          }

          if (isSales) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  if (isMobile) {
                    setOpenSaleAfterSector(false);
                    setSectorModalOpen(true);
                  } else {
                    setSelectedSector(DEFAULT_SECTOR_ID);
                    router.push(`/setor/${DEFAULT_SECTOR_ID}`);
                  }
                }}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? "text-[#166534] dark:text-emerald-400/95"
                    : "text-gray-500 dark:text-slate-500"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                    active
                      ? "bg-[#166534] text-white shadow-sm shadow-emerald-900/20 ring-1 ring-[#14532d]/20"
                      : "bg-gray-100/90 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                  aria-hidden
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                </span>
                <span
                  className={`max-w-full truncate text-[10px] font-semibold leading-tight ${
                    active ? "text-[#14532d] dark:text-emerald-300/90" : "text-gray-500"
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors duration-150 active:opacity-90 ${
                active
                  ? isExpense
                    ? "text-rose-700 dark:text-rose-300/90"
                    : "text-[#166534] dark:text-emerald-400/95"
                  : "text-gray-500 dark:text-slate-500"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 ${
                  active
                    ? isExpense
                      ? "bg-rose-700 text-white shadow-sm shadow-rose-900/20 ring-1 ring-rose-800/25"
                      : "bg-[#166534] text-white shadow-sm shadow-emerald-900/20 ring-1 ring-[#14532d]/20"
                    : "bg-gray-100/90 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
                aria-hidden
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
              <span
                className={`max-w-full truncate text-[10px] font-semibold leading-tight ${
                  active ? (isExpense ? "text-rose-800 dark:text-rose-200" : "text-[#14532d] dark:text-emerald-300/90") : "text-gray-500"
                }`}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <SectorSelectorModal
        open={sectorModalOpen}
        onClose={() => {
          setSectorModalOpen(false);
          setOpenSaleAfterSector(false);
        }}
        onSelectSector={handleSectorPicked}
        onRequestCreateSector={() => setSectorCreateOpen(true)}
      />
      <SectorCreateModal
        open={sectorCreateOpen}
        onClose={() => setSectorCreateOpen(false)}
        onSubmit={(input) => {
          const id = createSector(input);
          if (!id) return;
          setSelectedSector(id);
          setSectorCreateOpen(false);
          router.push(`/setor/${id}`);
          setCreateFeedback(`Setor "${input.name}" criado com sucesso`);
        }}
      />
      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
      />
      {createFeedback && (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 shadow-md">
          {createFeedback}
        </div>
      )}
      <SaleDrawer />
      <StockEntryDrawer />
      <ExpenseDrawer />
    </div>
  );
}

function PrimaryActionButton({
  onOpenSectorPickerForSale,
}: {
  onOpenSectorPickerForSale: () => void;
}) {
  const pathname = usePathname();
  const currentModule = useUIStore((s) => s.currentModule);
  const selectedSectorId = useSectorStore((s) => s.selectedSectorId);
  const openSaleDrawer = useDrawerStore((s) => s.openSaleDrawer);
  const openExpenseDrawer = useDrawerStore((s) => s.openExpenseDrawer);
  const sectorFromPath = pathname?.match(/^\/setor\/([^/]+)/)?.[1] ?? null;
  const effectiveSectorId = sectorFromPath ?? selectedSectorId ?? null;

  const handlePrimaryAction = () => {
    if (currentModule === "expenses") {
      openExpenseDrawer();
      return;
    }

    if (currentModule === "sales") {
      if (!effectiveSectorId) {
        onOpenSectorPickerForSale();
        return;
      }
      openSaleDrawer();
      return;
    }

    openSaleDrawer();
  };

  const actionLabel = currentModule === "expenses" ? "Nova Despesa" : "Nova Venda";

  return (
    <button
      type="button"
      onClick={handlePrimaryAction}
      className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#166534] px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-app hover:scale-[1.01] hover:bg-[#14532d] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] focus-visible:ring-offset-2 dark:focus-visible:ring-emerald-600 sm:px-4"
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
      className="mt-2 w-full rounded-xl border border-rose-200 bg-white py-2 text-sm font-medium text-rose-800 shadow-sm transition-all hover:scale-[1.01] hover:bg-rose-50 active:scale-[0.99] dark:border-rose-800/50 dark:bg-slate-800 dark:text-rose-100 dark:hover:bg-slate-700"
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
      className="w-full rounded-xl bg-[#166534] py-2 text-sm font-medium text-white shadow-sm transition-all hover:scale-[1.01] hover:bg-[#14532d] active:scale-[0.99]"
    >
      Lançar venda
    </button>
  );
}
