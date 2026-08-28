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

export async function loadProfileAndOrg(uid: string, emailFallback: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, name, email, telegram_id, organization_id, role")
    .eq("id", uid)
    .maybeSingle();

  if (error || !profile) {
    console.error("Perfil não encontrado", error);
    return false;
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, plan")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (orgError || !org) {
    console.error("Organização não encontrada", orgError);
    return false;
  }

  const user: AppUser = {
    id: profile.id,
    name: profile.name,
    email: profile.email || emailFallback,
    companyId: profile.organization_id,
    telegramId: profile.telegram_id ?? undefined,
  };
  const company: Company = {
    id: org.id,
    name: org.name,
    plan: org.plan as Plan,
  };
  useAuthStore.getState().login({ user, company });
  usePlanStore.getState().setPlanLocal(company.plan);
  return true;
}

export async function hydrateOperationalData(): Promise<void> {
  const id = useAuthStore.getState().company?.id;
  if (!id) return;
  const supabase = getSupabase();

  const [sectorsRes, salesRes, stockRes, expensesRes, settingsRes] = await Promise.all([
    supabase.from("sectors").select("id, name, unit, color, icon").eq("organization_id", id).order("created_at"),
    supabase
      .from("sales")
      .select("id, sector_id, sale_date, quantity, unit_price, total_price, buyer")
      .eq("organization_id", id)
      .order("sale_date", { ascending: false }),
    supabase
      .from("stock_movements")
      .select("id, sector_id, movement_date, type, quantity, note, related_sale_id")
      .eq("organization_id", id)
      .order("movement_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, sector_id, expense_date, description, amount, category")
      .eq("organization_id", id)
      .order("expense_date", { ascending: false }),
    supabase.from("organization_settings").select("stock_total_sacas").eq("organization_id", id).maybeSingle(),
  ]);

  const sectors: Sector[] = (sectorsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    unit: row.unit,
    color: row.color as SectorColorToken,
    icon: row.icon,
  }));

  useSectorStore.setState({
    sectors: sectors.length > 0 ? sectors : DEFAULT_SECTORS,
  });

  const sales: Sale[] = (salesRes.data ?? []).map((row) => ({
    id: row.id,
    sectorId: row.sector_id,
    date: row.sale_date,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    totalPrice: Number(row.total_price),
    buyer: row.buyer,
  }));

  const stockMovements: StockMovement[] = (stockRes.data ?? []).map((row) => ({
    id: row.id,
    sectorId: row.sector_id,
    date: row.movement_date,
    type: row.type as "entry" | "exit",
    quantity: Number(row.quantity),
    note: row.note ?? undefined,
    relatedSaleId: row.related_sale_id ?? undefined,
  }));

  const expenses: Expense[] = (expensesRes.data ?? []).map((row) => ({
    id: row.id,
    sectorId: row.sector_id ?? undefined,
    date: row.expense_date,
    description: row.description,
    amount: Number(row.amount),
    category: row.category as ExpenseCategory,
  }));

  useSalesStore.setState({
    sales,
    stockMovements,
    stockTotalSacas: Number(settingsRes.data?.stock_total_sacas ?? 0),
  });
  useExpenseStore.setState({ expenses });
}

export function resetOperationalStores() {
  useSalesStore.setState({ sales: [], stockMovements: [], stockTotalSacas: 0 });
  useExpenseStore.setState({ expenses: [] });
  useSectorStore.setState({ sectors: DEFAULT_SECTORS, selectedSectorId: null });
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
