import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";

function strip(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const ALIAS: Record<string, ExpenseCategory> = {
  combustivel: "combustível",
  combustível: "combustível",
  gasolina: "combustível",
  diesel: "combustível",
  etanol: "combustível",
  alcool: "combustível",
  manutencao: "manutenção",
  manutenção: "manutenção",
  "mao de obra": "mão de obra",
  "mão de obra": "mão de obra",
  maodeobra: "mão de obra",
  mao: "mão de obra",
  insumos: "insumos",
  insumo: "insumos",
  outros: "outros",
};

/** Aceita o que a IA devolver (sem acento, sinónimo). */
export function parseExpenseCategory(raw: unknown): ExpenseCategory | null {
  const s = strip(String(raw ?? "").trim());
  if (!s) return null;
  if ((EXPENSE_CATEGORIES as readonly string[]).includes(String(raw).trim())) {
    return String(raw).trim() as ExpenseCategory;
  }
  if (ALIAS[s]) return ALIAS[s];
  return null;
}

const RULES: { category: ExpenseCategory; needles: string[] }[] = [
  {
    category: "combustível",
    needles: [
      "combustivel",
      "diesel",
      "gasolina",
      "etanol",
      "alcool",
      "abastec",
      "posto",
      "oleo diesel",
    ],
  },
  {
    category: "insumos",
    needles: [
      "insumo",
      "fertiliz",
      "adubo",
      "ureia",
      "npk",
      "calcario",
      "semente",
      "defensivo",
      "herbicida",
      "inseticida",
      "fungicida",
      "formicida",
      "veneno",
      "racao",
      "sal mineral",
      "vacina",
      "vermifugo",
      "medicamento",
      "calda",
    ],
  },
  {
    category: "mão de obra",
    needles: [
      "mao de obra",
      "diarista",
      "diaria",
      "peao",
      "peoes",
      "salario",
      "empreita",
      "funcionario",
      "trabalhador",
      "operario",
      "paguei um cara",
      "paguei um homem",
      "paguei o cara",
      "contratei",
      "arar",
      "aracao",
      "arado",
      "capin",
      "rocar",
      "roçada",
      "colher",
      "colheita",
      "ordenh",
    ],
  },
  {
    category: "manutenção",
    needles: [
      "manutenc",
      "conserto",
      "concerto",
      "consertar",
      "concertar",
      "reparo",
      "reparar",
      "arrumar",
      "cerca",
      "arame",
      "portao",
      "solda",
      "peca",
      "pecas",
      "funilaria",
      "reforma",
      "quebra",
      "quebrou",
      "motor",
      "pneu",
      "borracharia",
      "oleo do",
      "filtro",
    ],
  },
];

/**
 * Presume categoria pelo texto (cerca → manutenção, arar → mão de obra, adubo → insumos).
 * Só devolve match claro; senão null.
 */
export function inferExpenseCategory(...parts: (string | null | undefined)[]): ExpenseCategory | null {
  const text = strip(parts.filter(Boolean).join(" "));
  if (!text) return null;
  for (const rule of RULES) {
    if (rule.needles.some((n) => text.includes(n))) return rule.category;
  }
  return null;
}
