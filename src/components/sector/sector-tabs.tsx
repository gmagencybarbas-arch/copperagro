"use client";

import { SECTOR_TAB_ACTIVE } from "@/lib/sector-palette";
import { useSectorStore } from "@/store/sector-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Navegação entre setores com reforço por cor na aba ativa.
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
      role="tablist"
      aria-label="Setores"
    >
      {sectors.map((s) => {
        const active = s.id === id;
        const activeCls = SECTOR_TAB_ACTIVE[s.color] ?? SECTOR_TAB_ACTIVE.green;
        return (
          <button
            id={`sector-tab-${s.id}`}
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              setSelectedSector(s.id);
              router.push(`/setor/${s.id}`);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-app active:scale-95 ${
              active
                ? `scale-[1.02] ${activeCls}`
                : "border border-gray-200/90 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            } `}
          >
            <span>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}
