import {
  inferExpenseCategory,
  parseExpenseCategory,
} from "@/lib/agro-ai/infer-expense-category";
import type { AgroLaunchDraft, AgroLaunchType } from "@/lib/agro-ai/types";
import type { ExpenseCategory } from "@/types/expense";

function uid() {
  return (
    crypto.randomUUID?.() ??
    `agro_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function stripAccents(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Match conservador: id exact, nome exact, ou includes mútuo sem ambiguidade. */
export function matchSector(
  sectors: { id: string; name: string }[],
  sectorId: string,
  sectorName: string,
): { id: string; name: string } | null {
  if (sectorId) {
    const byId = sectors.find((s) => s.id === sectorId);
    if (byId) return byId;
  }
  const needle = stripAccents(sectorName);
  if (!needle) return null;

  const exact = sectors.find((s) => stripAccents(s.name) === needle);
  if (exact) return exact;

  const partial = sectors.filter((s) => {
    const n = stripAccents(s.name);
    return n.includes(needle) || needle.includes(n);
  });
  if (partial.length === 1) return partial[0]!;
  return null;
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  // pt-BR: 1.200,50 → 1200.50
  const normalized = s.includes(",")
    ? s.replace(/\./g, "").replace(",", ".")
    : s.replace(/\s/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function normalizeAgroLaunch(
  raw: Record<string, unknown>,
  sectors: { id: string; name: string }[],
  sourceText = "",
): AgroLaunchDraft {
  const typeRaw = String(raw.type ?? "sale");
  const type: AgroLaunchType =
    typeRaw === "expense" || typeRaw === "stock" ? typeRaw : "sale";

  const sectorName = String(raw.sectorName ?? "");
  const givenId = String(raw.sectorId ?? "");
  const sector = matchSector(sectors, givenId, sectorName);

  const description = String(raw.description ?? "");
  const note = String(raw.note ?? "");
  const parsedCat = parseExpenseCategory(raw.category);
  const guessed = inferExpenseCategory(description, note, sectorName, sourceText);
  let category: ExpenseCategory | null = parsedCat;
  if (type === "expense") {
    if (!category || category === "outros") {
      category = guessed ?? category;
    }
  }

  const stockType =
    raw.stockType === "exit" || raw.stockType === "entry"
      ? raw.stockType
      : null;

  const dateRaw = String(raw.date ?? "").slice(0, 10);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : todayISO();

  return {
    localId: uid(),
    type,
    sectorId: sector?.id ?? "",
    sectorName: sector?.name ?? sectorName,
    date,
    quantity: num(raw.quantity),
    unitPrice: num(raw.unitPrice),
    buyer: String(raw.buyer ?? ""),
    amount: num(raw.amount),
    category,
    description,
    stockType,
    note: String(raw.note ?? ""),
    status: "pending",
  };
}
