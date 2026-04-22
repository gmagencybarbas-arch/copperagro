"use client";

import { useEffect } from "react";
import { SectorVendasView } from "@/modules/sales/sector-vendas-view";
import { useUIStore } from "@/store/ui-store";

export default function SetorPage() {
  const setModule = useUIStore((s) => s.setModule);

  useEffect(() => {
    setModule("sales");
  }, [setModule]);

  return <SectorVendasView />;
}

