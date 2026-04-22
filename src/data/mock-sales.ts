import type { Sale } from "@/types/sale";

const BUYERS = [
  "Cooperativa Sul de Minas",
  "Atlas Green Export",
  "Café do Cerrado Ltda",
  "Bloom Roasters SP",
  "Origem Verde Export",
  "Porto Seguro Commodities",
  "Cooxupé — Lote Premium",
  "NKG Stockler Brasil",
  "3 Corações Originação",
  "Volcafé Specialty",
  "Sucden Coffee Brasil",
  "Minasul — Raízes",
  "COMSA Honduras (blend)",
  "Triângulo Mineiro Agrícola",
  "Ipanema Coffees",
] as const;

/** PRNG determinístico */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * **730 dias consecutivos** (2 anos), **cada dia** com **1–3 vendas**.
 * Quantidade 40–160, preço 700–900 com **variação sazonal + tendência suave**.
 */
export function getMockSales(): Sale[] {
  const rng = mulberry32(42);
  const START = new Date(2024, 0, 1);
  const DAYS = 730;
  const rows: Omit<Sale, "id" | "totalPrice">[] = [];

  for (let dayOffset = 0; dayOffset < DAYS; dayOffset++) {
    const d = addDays(START, dayOffset);
    const isoStr = iso(d);
    const monthIndex = d.getMonth();
    const seasonWave = Math.sin((monthIndex / 11) * Math.PI * 2) * 26;
    const longDrift = (dayOffset / DAYS) * 32;
    const noiseAmp = 18 + monthIndex * 0.35;
    const baseCenter = 796 + seasonWave + longDrift;

    const salesToday = randomInt(rng, 1, 3);
    for (let j = 0; j < salesToday; j++) {
      const jitter = (rng() - 0.5) * noiseAmp;
      let unitPrice = Math.round(baseCenter + jitter);
      unitPrice = Math.max(700, Math.min(900, unitPrice));
      const qty = randomInt(rng, 40, 160);
      rows.push({
        sectorId: "cafe",
        date: isoStr,
        quantity: qty,
        unitPrice,
        buyer: BUYERS[randomInt(rng, 0, BUYERS.length - 1)],
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  /** Garante dados nos últimos 7 dias corridos (relativo a “hoje”) para filtros 7d em anos futuros */
  const tailRng = mulberry32(777);
  const today = new Date();
  const lastBaseIso = iso(addDays(START, DAYS - 1));
  for (let back = 6; back >= 0; back--) {
    const d = addDays(today, -back);
    const isoStr = iso(d);
    if (isoStr <= lastBaseIso) continue;
    const salesToday = randomInt(tailRng, 1, 3);
    for (let j = 0; j < salesToday; j++) {
      const unitPrice = randomInt(tailRng, 760, 880);
      const qty = randomInt(tailRng, 45, 140);
      rows.push({
        sectorId: "cafe",
        date: isoStr,
        quantity: qty,
        unitPrice,
        buyer: BUYERS[randomInt(tailRng, 0, BUYERS.length - 1)],
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));

  injectSimulationBoost(rows);

  rows.sort((a, b) => a.date.localeCompare(b.date));

  return rows.map((r, i) => ({
    id: `mock_${i}`,
    ...r,
    totalPrice: r.quantity * r.unitPrice,
  }));
}

/**
 * Reforço para simulações: todos os meses do ano civil anterior + jan/mar/abr
 * do ano atual (até “hoje”), com vendas extras distribuídas no mês.
 */
function injectSimulationBoost(rows: Omit<Sale, "id" | "totalPrice">[]): void {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const cy = today.getFullYear();
  const ly = cy - 1;

  const boostMonth = (
    year: number,
    month: number,
    seed: number,
    density: "high" | "medium",
  ) => {
    const rng = mulberry32(seed);
    const dim = new Date(year, month, 0).getDate();
    const targetDays =
      density === "high"
        ? Math.min(dim, 22)
        : Math.min(dim, 14);
    const picked = new Set<number>();
    let guard = 0;
    while (picked.size < targetDays && guard < 500) {
      guard++;
      picked.add(randomInt(rng, 1, dim));
    }
    for (const day of picked) {
      const d = new Date(year, month - 1, day);
      if (d > today) continue;
      const isoStr = iso(d);
      const salesToday = randomInt(rng, 1, 2);
      for (let j = 0; j < salesToday; j++) {
        const monthWave = Math.sin(((month - 1) / 11) * Math.PI * 2) * 22;
        let unitPrice = Math.round(790 + monthWave + (rng() - 0.5) * 24);
        unitPrice = Math.max(700, Math.min(920, unitPrice));
        const qty = randomInt(rng, 42, 155);
        rows.push({
          sectorId: "cafe",
          date: isoStr,
          quantity: qty,
          unitPrice,
          buyer: BUYERS[randomInt(rng, 0, BUYERS.length - 1)],
        });
      }
    }
  };

  for (let m = 1; m <= 12; m++) {
    boostMonth(ly, m, 4800 + m * 17, "high");
  }
  for (const m of [1, 3, 4] as const) {
    boostMonth(cy, m, 5100 + m * 31, "medium");
  }
}
