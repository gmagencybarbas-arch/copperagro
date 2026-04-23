"use client";

import { useSectorStore } from "@/store/sector-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Navegação horizontal entre setores (estilo abas) na vista de vendas.
 */
export function SectorTabs() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const sectors = useSectorStore((s) => s.sectors);
  const setSelectedSector = useSectorStore((s) => s.setSelectedSector);

  useEffect(() => {
    if (!id) return;
    const el = document.getElementById(`sector-tab-${id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [id]);

  return (
    <div
      className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sectors.map((s) => {
        const active = s.id === id;
        return (
          <button
            id={`sector-tab-${s.id}`}
            key={s.id}
            type="button"
            onClick={() => {
              setSelectedSector(s.id);
              router.push(`/setor/${s.id}`);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-app active:scale-95 ${
              active
                ? "scale-[1.02] bg-green-600 text-white shadow-md ring-1 ring-green-600/30 dark:bg-emerald-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
