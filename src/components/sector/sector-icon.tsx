"use client";

import type { Sector } from "@/types/sector";
import {
  Beef,
  Boxes,
  Coffee,
  Droplets,
  Leaf,
  Milk,
  Sprout,
  Tractor,
  Wheat,
} from "lucide-react";

export type SectorIconToken =
  | "coffee"
  | "milk"
  | "beef"
  | "corn"
  | "swine"
  | "chicken"
  | "sprout"
  | "wheat"
  | "tractor"
  | "water"
  | "leaf"
  | "boxes";

export const SECTOR_ICON_LIBRARY: { token: SectorIconToken; label: string }[] = [
  { token: "coffee", label: "Café" },
  { token: "milk", label: "Leite" },
  { token: "beef", label: "Bovino" },
  { token: "corn", label: "Milho" },
  { token: "swine", label: "Suíno" },
  { token: "chicken", label: "Galinha" },
  { token: "sprout", label: "Hortifruti" },
  { token: "wheat", label: "Grãos" },
  { token: "tractor", label: "Máquinas" },
  { token: "water", label: "Irrigação" },
  { token: "leaf", label: "Insumos" },
  { token: "boxes", label: "Armazenagem" },
];

function normalizeToToken(icon: string | undefined, sectorId?: string): SectorIconToken | null {
  const v = (icon ?? "").trim().toLowerCase();
  if (v === "☕") return "coffee";
  if (v === "🥛") return "milk";
  if (v === "🐂") return "beef";
  if (v === "🥬") return "sprout";
  if (v === "🌽") return "corn";
  if (v === "🐖") return "swine";
  if (v === "🐔") return "chicken";
  if (v === "📦") return "boxes";
  if (
    v === "coffee" ||
    v === "milk" ||
    v === "beef" ||
    v === "corn" ||
    v === "swine" ||
    v === "chicken" ||
    v === "sprout" ||
    v === "wheat" ||
    v === "tractor" ||
    v === "water" ||
    v === "leaf" ||
    v === "boxes"
  ) {
    return v;
  }
  if (sectorId === "cafe") return "coffee";
  if (sectorId === "leite") return "milk";
  if (sectorId === "bovino") return "beef";
  if (sectorId === "hortifruti") return "sprout";
  return null;
}

export function SectorGlyph({
  icon,
  sectorId,
  className = "h-4 w-4",
}: {
  icon?: string;
  sectorId?: string;
  className?: string;
}) {
  const token = normalizeToToken(icon, sectorId);
  if (token === "coffee") return <Coffee className={className} strokeWidth={1.9} />;
  if (token === "milk") return <Milk className={className} strokeWidth={1.9} />;
  if (token === "beef") return <Beef className={className} strokeWidth={1.9} />;
  if (token === "corn") return <CornIcon className={className} />;
  if (token === "swine") return <SwineIcon className={className} />;
  if (token === "chicken") return <ChickenIcon className={className} />;
  if (token === "sprout") return <Sprout className={className} strokeWidth={1.9} />;
  if (token === "wheat") return <Wheat className={className} strokeWidth={1.9} />;
  if (token === "tractor") return <Tractor className={className} strokeWidth={1.9} />;
  if (token === "water") return <Droplets className={className} strokeWidth={1.9} />;
  if (token === "leaf") return <Leaf className={className} strokeWidth={1.9} />;
  if (token === "boxes") return <Boxes className={className} strokeWidth={1.9} />;
  return <Boxes className={className} strokeWidth={1.9} />;
}

export function sectorIconTokenFromSector(sector: Pick<Sector, "icon" | "id">): SectorIconToken | null {
  return normalizeToToken(sector.icon, sector.id);
}

function CornIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M12 4c3 0 5 2.5 5 5.5V15c0 3-2.2 5-5 5s-5-2-5-5V9.5C7 6.5 9 4 12 4Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M9 8.5h6M9 11h6M9 13.5h6M9 16h6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 11c-1.8.8-3 2.2-3.6 4M17 11c1.8.8 3 2.2 3.6 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function SwineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M5 14a7 7 0 1 1 14 0v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 9.5 6.5 7.8M16 9.5l1.5-1.7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="9" y="12.5" width="6" height="3.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 14.3v.01M13 14.3v.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChickenIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M10 18a6 6 0 1 1 7-9.7A5 5 0 0 1 10 18Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16 7.2c.2-1.2 1.1-2.2 2.3-2.5.4.8.3 1.7-.2 2.5M18.2 8.5c1-.7 2.3-.8 3.3-.3-.2 1-.8 1.8-1.7 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m9.8 12.7-1.8.8 1.7 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11.5v.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
