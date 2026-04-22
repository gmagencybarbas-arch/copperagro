import { AppShell } from "@/components/layout/app-shell";
import { CoopFinanceGate } from "@/components/providers/coopfinance-gate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CoopFinance",
  description:
    "Painel premium de vendas e estoque — café. Inteligência comercial cooperativa.",
};

export default function SaasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CoopFinanceGate>
      <AppShell>{children}</AppShell>
    </CoopFinanceGate>
  );
}
