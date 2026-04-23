"use client";

import { AnalysesView } from "@/modules/analyses/analyses-view";
import { useUIStore } from "@/store/ui-store";
import { useEffect } from "react";

export default function AnalisesPage() {
  const setModule = useUIStore((s) => s.setModule);
  useEffect(() => {
    setModule("analytics");
  }, [setModule]);
  return <AnalysesView />;
}
