import { getSupabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import type { Expense } from "@/types/expense";
import type { Plan } from "@/types/plan";
import type { Sale, StockMovement } from "@/types/sale";
import type { Sector } from "@/types/sector";

function orgId(): string | null {
  return useAuthStore.getState().company?.id ?? null;
}

function userId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

export async function persistSale(sale: Sale, movement: StockMovement) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const created_by = userId();
  const { error: e1 } = await supabase.from("sales").insert({
    id: sale.id,
    organization_id,
    sector_id: sale.sectorId,
    sale_date: sale.date,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    total_price: sale.totalPrice,
    buyer: sale.buyer,
    created_by,
  });
  if (e1) {
    console.error(e1);
    return;
  }
  const { error: e2 } = await supabase.from("stock_movements").insert({
    id: movement.id,
    organization_id,
    sector_id: movement.sectorId,
    movement_date: movement.date,
    type: movement.type,
    quantity: movement.quantity,
    note: movement.note ?? null,
    related_sale_id: movement.relatedSaleId ?? sale.id,
    created_by,
  });
  if (e2) console.error(e2);
}

export async function persistSaleUpdate(sale: Sale) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("sales")
    .update({
      sale_date: sale.date,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      total_price: sale.totalPrice,
      buyer: sale.buyer,
    })
    .eq("id", sale.id)
    .eq("organization_id", organization_id);
  if (error) console.error(error);
  await supabase
    .from("stock_movements")
    .update({
      quantity: sale.quantity,
      movement_date: sale.date,
      sector_id: sale.sectorId,
    })
    .eq("related_sale_id", sale.id)
    .eq("organization_id", organization_id);
}

export async function persistSaleDelete(id: string) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  await supabase.from("stock_movements").delete().eq("related_sale_id", id).eq("organization_id", organization_id);
  await supabase.from("sales").delete().eq("id", id).eq("organization_id", organization_id);
}

export async function persistStockMovement(mov: StockMovement) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("stock_movements").insert({
    id: mov.id,
    organization_id,
    sector_id: mov.sectorId,
    movement_date: mov.date,
    type: mov.type,
    quantity: mov.quantity,
    note: mov.note ?? null,
    related_sale_id: mov.relatedSaleId ?? null,
    created_by: userId(),
  });
  if (error) console.error(error);
}

export async function persistStockTotal(n: number) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("organization_settings")
    .update({ stock_total_sacas: n, updated_at: new Date().toISOString() })
    .eq("organization_id", organization_id);
  if (error) console.error(error);
}

export async function persistExpense(expense: Expense) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("expenses").insert({
    id: expense.id,
    organization_id,
    sector_id: expense.sectorId ?? null,
    expense_date: expense.date,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    created_by: userId(),
  });
  if (error) console.error(error);
}

export async function persistSectorInsert(sector: Sector) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("sectors").insert({
    organization_id,
    id: sector.id,
    name: sector.name,
    unit: sector.unit,
    color: sector.color,
    icon: sector.icon,
  });
  if (error) console.error(error);
}

export async function persistSectorUpdate(sector: Sector) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("sectors")
    .update({
      name: sector.name,
      unit: sector.unit,
      icon: sector.icon,
      color: sector.color,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organization_id)
    .eq("id", sector.id);
  if (error) console.error(error);
}

export async function persistPlan(plan: Plan) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("organizations")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", organization_id);
  if (error) console.error(error);
}

export async function persistTelegram(telegramId: string) {
  const uid = userId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("profiles").update({ telegram_id: telegramId }).eq("id", uid);
  if (error) console.error(error);
}

export async function persistProfileName(name: string) {
  const uid = userId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("profiles").update({ name, updated_at: new Date().toISOString() }).eq("id", uid);
  if (error) console.error(error);
}

export async function persistCompanyName(name: string) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("organizations")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", organization_id);
  if (error) console.error(error);
}
