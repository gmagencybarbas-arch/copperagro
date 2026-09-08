"use client";

import { pickDefaultSectorId, useSectorStore } from "@/store/sector-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Redireciona para o primeiro setor (UUID real no banco). */
export default function VendasPage() {
  const router = useRouter();
  const sectors = useSectorStore((s) => s.sectors);

  useEffect(() => {
    const id = pickDefaultSectorId(sectors);
    if (id) router.replace(`/setor/${id}`);
  }, [sectors, router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-gray-500">
      Abrindo vendas…
    </div>
  );
}
