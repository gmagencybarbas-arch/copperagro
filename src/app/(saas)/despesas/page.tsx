"use client";

import { useEffect } from "react";
import { ExpensesView } from "@/modules/expenses/expenses-view";
import { useUIStore } from "@/store/ui-store";

export default function DespesasPage() {
  const setModule = useUIStore((s) => s.setModule);

  useEffect(() => {
    setModule("expenses");
  }, [setModule]);

  return <ExpensesView />;
}

