import { getSupabase } from "@/lib/supabase/client";
import { DEFAULT_SECTORS } from "@/store/sector-store";
import { useAuthStore } from "@/store/auth-store";
import { useExpenseStore } from "@/store/expense-store";
import { usePlanStore } from "@/store/plan-store";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import type { Expense, ExpenseCategory } from "@/types/expense";
import type { Plan } from "@/types/plan";
import type { Sale, StockMovement } from "@/types/sale";
import type { Sector, SectorColorToken } from "@/types/sector";
import type { User as AppUser } from "@/types/user";
import type { Company } from "@/types/company";

type OrgRow = {
  id: string;
  name: string | null;
  plan: string | null;
  stock_base_sacas?: number | null;
};

export type LoadAuthResult = {
  ok: boolean;
  error?: string;
};

function newId(): string {
  return crypto.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isMissingRelation(message: string): boolean {
  return /relation|does not exist|schema cache|could not find the table/i.test(message);
}

function isMissingColumn(message: string, column: string): boolean {
  return new RegExp(column, "i").test(message) && /column|schema cache|does not exist/i.test(message);
}

/**
 * Compatível com:
 * A) schema Vercel/git: profiles.organization_id → organizations
 * B) schema live: organizations.id = auth.users.id (sem profiles)
 */
export async function loadProfileAndOrg(
  uid: string,
  emailFallback: string,
): Promise<boolean> {
  const result = await loadProfileAndOrgDetailed(uid, emailFallback);
  return result.ok;
}

export async function loadProfileAndOrgDetailed(
  uid: string,
  emailFallback: string,
): Promise<LoadAuthResult> {
  const supabase = getSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const meta = (authUser?.user_metadata ?? {}) as {
    name?: string;
    company_name?: string;
    telegram_id?: string;
    onboarding_completed_at?: string;
    onboarding_pending?: boolean;
  };
  const displayName =
    (typeof meta.name === "string" && meta.name.trim()) ||
    emailFallback.split("@")[0] ||
    "Produtor";
  const companyName =
    (typeof meta.company_name === "string" && meta.company_name.trim()) ||
    "Minha Fazenda";

  let orgId: string | null = null;
  let userName = displayName;
  let userEmail = authUser?.email || emailFallback;
  let telegramId: string | undefined =
    typeof meta.telegram_id === "string" && meta.telegram_id
      ? meta.telegram_id
      : undefined;

  // --- Caminho A: profiles (como no Vercel / git) ---
  const profileRes = await supabase
    .from("profiles")
    .select("id, name, email, telegram_id, organization_id, role")
    .eq("id", uid)
    .maybeSingle();

  if (!profileRes.error && profileRes.data?.organization_id) {
    orgId = profileRes.data.organization_id as string;
    userName = (profileRes.data.name as string) || displayName;
    userEmail = (profileRes.data.email as string) || userEmail;
    telegramId =
      (profileRes.data.telegram_id as string | null) ?? telegramId;
  } else if (profileRes.error && !isMissingRelation(profileRes.error.message)) {
    // tabela existe mas RLS/outro erro — tenta org direta antes de falhar
    console.warn("profiles:", profileRes.error.message);
  }

  // --- Caminho B: org.id = user.id ---
  if (!orgId) {
    orgId = uid;
  }

  async function fetchOrg(id: string) {
    const full = await supabase
      .from("organizations")
      .select("id, name, plan, stock_base_sacas")
      .eq("id", id)
      .maybeSingle();
    if (full.error && isMissingColumn(full.error.message, "stock_base_sacas")) {
      return supabase
        .from("organizations")
        .select("id, name, plan")
        .eq("id", id)
        .maybeSingle();
    }
    return full;
  }

  let orgQuery = await fetchOrg(orgId);
  let org = orgQuery.data as OrgRow | null;
  let orgError = orgQuery.error;

  // Se profiles apontou para um id inválido, tenta uid
  if ((!org || orgError) && orgId !== uid) {
    orgQuery = await fetchOrg(uid);
    org = orgQuery.data as OrgRow | null;
    orgError = orgQuery.error;
    if (org) orgId = uid;
  }

  // Cria org se não existir (só quando id = uid)
  if (!org && !orgError && orgId === uid) {
    const payload: Record<string, unknown> = {
      id: uid,
      name: companyName,
      plan: "standard",
      stock_base_sacas: 0,
    };
    let { error: insertError } = await supabase.from("organizations").insert(payload);
    if (insertError && isMissingColumn(insertError.message, "stock_base_sacas")) {
      delete payload.stock_base_sacas;
      ({ error: insertError } = await supabase.from("organizations").insert(payload));
    }
    // já existe (corrida / RLS escondeu o select)
    if (insertError && /duplicate|unique|already exists/i.test(insertError.message)) {
      orgQuery = await fetchOrg(uid);
      org = orgQuery.data as OrgRow | null;
      orgError = orgQuery.error;
    } else if (insertError) {
      console.error("Falha ao criar organização", insertError);
      return {
        ok: false,
        error: `Auth ok, mas não consegui criar a organização: ${insertError.message}`,
      };
    } else {
      orgQuery = await fetchOrg(uid);
      org = orgQuery.data as OrgRow | null;
      orgError = orgQuery.error;
    }

    // Bootstrap mínimo de profiles se a tabela existir (mantém Vercel alinhado)
    if (org) {
      const { error: profileInsertError } = await supabase.from("profiles").insert({
        id: uid,
        organization_id: uid,
        name: userName,
        email: userEmail,
        role: "owner",
      });
      if (
        profileInsertError &&
        !isMissingRelation(profileInsertError.message) &&
        !/duplicate|unique/i.test(profileInsertError.message)
      ) {
        console.warn("profiles insert:", profileInsertError.message);
      }
    }
  }

  if (orgError) {
    console.error("Organização não encontrada", orgError);
    return {
      ok: false,
      error: `Auth ok, mas a organização falhou: ${orgError.message}`,
    };
  }

  if (!org) {
    return {
      ok: false,
      error:
        "Auth ok, mas não há organização ligada a esta conta. No Supabase, confirma se existe linha em public.organizations (e/ou profiles) para o teu user id.",
    };
  }

  const onboardingCompleted =
    Boolean(meta.onboarding_completed_at) || meta.onboarding_pending !== true;

  const user: AppUser = {
    id: uid,
    name: userName,
    email: userEmail,
    companyId: org.id,
    telegramId,
  };
  const company: Company = {
    id: org.id,
    name: org.name || companyName,
    plan: (org.plan as Plan) || "standard",
    onboardingCompleted,
  };
  useAuthStore.getState().login({ user, company });
  usePlanStore.getState().setPlanLocal(company.plan);
  return { ok: true };
}

async function ensureDefaultSectors(organizationId: string): Promise<Sector[]> {
  const supabase = getSupabase();
  const existing = await supabase
    .from("sectors")
    .select("id, name, unit, color, icon")
    .eq("organization_id", organizationId)
    .order("created_at");

  if (existing.error) {
    console.error(existing.error);
    return [];
  }

  if ((existing.data ?? []).length > 0) {
    return (existing.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit,
      color: row.color as SectorColorToken,
      icon: row.icon,
    }));
  }

  const rows = DEFAULT_SECTORS.map((s) => ({
    id: newId(),
    organization_id: organizationId,
    name: s.name,
    unit: s.unit,
    color: s.color,
    icon: s.icon,
    status: "active",
  }));

  const { error: seedError } = await supabase.from("sectors").insert(rows);
  if (seedError && /status/i.test(seedError.message)) {
    const withoutStatus = rows.map(({ status: _s, ...rest }) => rest);
    const retry = await supabase.from("sectors").insert(withoutStatus);
    if (retry.error) {
      console.error(retry.error);
      return [];
    }
  } else if (seedError) {
    console.error(seedError);
    return [];
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    color: r.color as SectorColorToken,
    icon: r.icon,
  }));
}

export async function hydrateOperationalData(): Promise<void> {
  const id = useAuthStore.getState().company?.id;
  if (!id) return;
  const supabase = getSupabase();

  const sectors = await ensureDefaultSectors(id);

  // Datas: schema live usa "date"; git/Vercel antigo usava sale_date / etc.
  type LooseRow = Record<string, unknown>;
  let salesRows: LooseRow[] = [];
  let stockRows: LooseRow[] = [];
  let expenseRows: LooseRow[] = [];

  {
    const salesRes = await supabase
      .from("sales")
      .select("id, sector_id, date, quantity, unit_price, total_price, buyer")
      .eq("organization_id", id)
      .order("date", { ascending: false });
    if (salesRes.error && isMissingColumn(salesRes.error.message, "date")) {
      const alt = await supabase
        .from("sales")
        .select("id, sector_id, sale_date, quantity, unit_price, total_price, buyer")
        .eq("organization_id", id)
        .order("sale_date", { ascending: false });
      if (alt.error) console.error(alt.error);
      else salesRows = (alt.data ?? []) as LooseRow[];
    } else if (salesRes.error) {
      console.error(salesRes.error);
    } else {
      salesRows = (salesRes.data ?? []) as LooseRow[];
    }
  }

  {
    const stockRes = await supabase
      .from("stock_movements")
      .select("id, sector_id, date, type, quantity, note, related_sale_id")
      .eq("organization_id", id)
      .order("date", { ascending: false });
    if (stockRes.error && isMissingColumn(stockRes.error.message, "date")) {
      const alt = await supabase
        .from("stock_movements")
        .select("id, sector_id, movement_date, type, quantity, note, related_sale_id")
        .eq("organization_id", id)
        .order("movement_date", { ascending: false });
      if (alt.error) console.error(alt.error);
      else stockRows = (alt.data ?? []) as LooseRow[];
    } else if (stockRes.error) {
      console.error(stockRes.error);
    } else {
      stockRows = (stockRes.data ?? []) as LooseRow[];
    }
  }

  {
    const expensesRes = await supabase
      .from("expenses")
      .select("id, sector_id, date, description, amount, category")
      .eq("organization_id", id)
      .order("date", { ascending: false });
    if (expensesRes.error && isMissingColumn(expensesRes.error.message, "date")) {
      const alt = await supabase
        .from("expenses")
        .select("id, sector_id, expense_date, description, amount, category")
        .eq("organization_id", id)
        .order("expense_date", { ascending: false });
      if (alt.error) console.error(alt.error);
      else expenseRows = (alt.data ?? []) as LooseRow[];
    } else if (expensesRes.error) {
      console.error(expensesRes.error);
    } else {
      expenseRows = (expensesRes.data ?? []) as LooseRow[];
    }
  }

  let stockTotal = 0;
  const orgStock = await supabase
    .from("organizations")
    .select("stock_base_sacas")
    .eq("id", id)
    .maybeSingle();
  if (!orgStock.error && orgStock.data && orgStock.data.stock_base_sacas != null) {
    stockTotal = Number(orgStock.data.stock_base_sacas);
  } else {
    const settings = await supabase
      .from("organization_settings")
      .select("stock_total_sacas")
      .eq("organization_id", id)
      .maybeSingle();
    if (!settings.error) {
      stockTotal = Number(settings.data?.stock_total_sacas ?? 0);
    }
  }

  useSectorStore.setState({ sectors });

  const sales: Sale[] = salesRows.map((row) => ({
    id: String(row.id),
    sectorId: String(row.sector_id),
    date: String(row.date ?? row.sale_date ?? ""),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    buyer: row.buyer as string,
  }));

  const stockMovements: StockMovement[] = stockRows.map((row) => ({
    id: String(row.id),
    sectorId: String(row.sector_id),
    date: String(row.date ?? row.movement_date ?? ""),
    type: row.type as "entry" | "exit",
    quantity: Number(row.quantity),
    note: (row.note as string | null) ?? undefined,
    relatedSaleId: (row.related_sale_id as string | null) ?? undefined,
  }));

  const expenses: Expense[] = expenseRows.map((row) => ({
    id: String(row.id),
    sectorId: row.sector_id ? String(row.sector_id) : undefined,
    date: String(row.date ?? row.expense_date ?? ""),
    description: row.description as string,
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
  }));

  useSalesStore.setState({
    sales,
    stockMovements,
    stockTotalSacas: stockTotal,
  });
  useExpenseStore.setState({ expenses });
}

export function resetOperationalStores() {
  useSalesStore.setState({ sales: [], stockMovements: [], stockTotalSacas: 0 });
  useExpenseStore.setState({ expenses: [] });
  useSectorStore.setState({ sectors: [], selectedSectorId: null });
  usePlanStore.setState({ currentPlan: "standard" });
}

export async function signOutAll() {
  try {
    const { getSupabase, getSupabaseEnv } = await import("@/lib/supabase/client");
    if (getSupabaseEnv().configured) {
      await getSupabase().auth.signOut();
    }
  } finally {
    useAuthStore.getState().logout();
    resetOperationalStores();
  }
}
