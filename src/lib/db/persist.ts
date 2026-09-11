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

function missingColumn(message: string, column: string): boolean {
  return new RegExp(column, "i").test(message) && /column|schema cache|does not exist/i.test(message);
}

export async function persistSale(sale: Sale, movement: StockMovement) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();

  const salePayload: Record<string, unknown> = {
    id: sale.id,
    organization_id,
    sector_id: sale.sectorId,
    date: sale.date,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    total_price: sale.totalPrice,
    buyer: sale.buyer,
  };
  let { error: e1 } = await supabase.from("sales").insert(salePayload);
  if (e1 && missingColumn(e1.message, "date")) {
    delete salePayload.date;
    salePayload.sale_date = sale.date;
    ({ error: e1 } = await supabase.from("sales").insert(salePayload));
  }
  if (e1) {
    console.error(e1);
    return;
  }

  const movPayload: Record<string, unknown> = {
    id: movement.id,
    organization_id,
    sector_id: movement.sectorId,
    date: movement.date,
    type: movement.type,
    quantity: movement.quantity,
    note: movement.note ?? null,
    related_sale_id: movement.relatedSaleId ?? sale.id,
  };
  let { error: e2 } = await supabase.from("stock_movements").insert(movPayload);
  if (e2 && missingColumn(e2.message, "date")) {
    delete movPayload.date;
    movPayload.movement_date = movement.date;
    ({ error: e2 } = await supabase.from("stock_movements").insert(movPayload));
  }
  if (e2) console.error(e2);
}

export async function persistSaleUpdate(sale: Sale) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  let { error } = await supabase
    .from("sales")
    .update({
      date: sale.date,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      total_price: sale.totalPrice,
      buyer: sale.buyer,
    })
    .eq("id", sale.id)
    .eq("organization_id", organization_id);
  if (error && missingColumn(error.message, "date")) {
    ({ error } = await supabase
      .from("sales")
      .update({
        sale_date: sale.date,
        quantity: sale.quantity,
        unit_price: sale.unitPrice,
        total_price: sale.totalPrice,
        buyer: sale.buyer,
      })
      .eq("id", sale.id)
      .eq("organization_id", organization_id));
  }
  if (error) console.error(error);

  let movUpdate = await supabase
    .from("stock_movements")
    .update({
      quantity: sale.quantity,
      date: sale.date,
      sector_id: sale.sectorId,
    })
    .eq("related_sale_id", sale.id)
    .eq("organization_id", organization_id);
  if (movUpdate.error && missingColumn(movUpdate.error.message, "date")) {
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
  const payload: Record<string, unknown> = {
    id: mov.id,
    organization_id,
    sector_id: mov.sectorId,
    date: mov.date,
    type: mov.type,
    quantity: mov.quantity,
    note: mov.note ?? null,
    related_sale_id: mov.relatedSaleId ?? null,
  };
  let { error } = await supabase.from("stock_movements").insert(payload);
  if (error && missingColumn(error.message, "date")) {
    delete payload.date;
    payload.movement_date = mov.date;
    ({ error } = await supabase.from("stock_movements").insert(payload));
  }
  if (error) console.error(error);
}

export async function persistExpense(expense: Expense) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {
    id: expense.id,
    organization_id,
    sector_id: expense.sectorId ?? null,
    date: expense.date,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
  };
  let { error } = await supabase.from("expenses").insert(payload);
  if (error && missingColumn(error.message, "date")) {
    delete payload.date;
    payload.expense_date = expense.date;
    ({ error } = await supabase.from("expenses").insert(payload));
  }
  if (error) console.error(error);
}

export async function persistExpenseUpdate(expense: Expense) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {
    sector_id: expense.sectorId ?? null,
    date: expense.date,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
  };
  let { error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", expense.id)
    .eq("organization_id", organization_id);
  if (error && missingColumn(error.message, "date")) {
    delete payload.date;
    payload.expense_date = expense.date;
    ({ error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", expense.id)
      .eq("organization_id", organization_id));
  }
  if (error) console.error(error);
}

export async function persistExpenseDelete(id: string) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id);
  if (error) console.error(error);
}

export async function persistStockMovementUpdate(mov: StockMovement) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const payload: Record<string, unknown> = {
    sector_id: mov.sectorId,
    date: mov.date,
    type: mov.type,
    quantity: mov.quantity,
    note: mov.note ?? null,
  };
  let { error } = await supabase
    .from("stock_movements")
    .update(payload)
    .eq("id", mov.id)
    .eq("organization_id", organization_id);
  if (error && missingColumn(error.message, "date")) {
    delete payload.date;
    payload.movement_date = mov.date;
    ({ error } = await supabase
      .from("stock_movements")
      .update(payload)
      .eq("id", mov.id)
      .eq("organization_id", organization_id));
  }
  if (error) console.error(error);
}

export async function persistStockMovementDelete(id: string) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("stock_movements")
    .delete()
    .eq("id", id)
    .eq("organization_id", organization_id);
  if (error) console.error(error);
}

export async function persistSectorInsert(sector: Sector) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const payload = {
    organization_id,
    id: sector.id,
    name: sector.name,
    unit: sector.unit,
    color: sector.color,
    icon: sector.icon,
    status: "active",
  };
  const { error } = await supabase.from("sectors").insert(payload);
  if (error && /status/i.test(error.message)) {
    const { status: _s, ...rest } = payload;
    const retry = await supabase.from("sectors").insert(rest);
    if (retry.error) console.error(retry.error);
    return;
  }
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
    })
    .eq("organization_id", organization_id)
    .eq("id", sector.id);
  if (error) console.error(error);
}

export async function persistPlan(plan: Plan) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("organizations").update({ plan }).eq("id", organization_id);
  if (error) console.error(error);
}

export async function persistTelegram(telegramId: string) {
  const uid = userId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ telegram_id: telegramId })
    .eq("id", uid);
  if (profileError && !/relation|does not exist|schema cache/i.test(profileError.message)) {
    console.error(profileError);
  }
  const { error } = await supabase.auth.updateUser({
    data: { telegram_id: telegramId },
  });
  if (error) console.error(error);
}

export async function persistProfileName(name: string) {
  const uid = userId();
  if (!uid) return;
  const supabase = getSupabase();
  const { error: profileError } = await supabase.from("profiles").update({ name }).eq("id", uid);
  if (profileError && !/relation|does not exist|schema cache/i.test(profileError.message)) {
    console.error(profileError);
  }
  const { error } = await supabase.auth.updateUser({
    data: { name },
  });
  if (error) console.error(error);
}

export async function persistCompanyName(name: string) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("organizations").update({ name }).eq("id", organization_id);
  if (error) console.error(error);
}

export async function persistOnboardingComplete() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_completed_at: new Date().toISOString(),
      onboarding_pending: false,
    },
  });
  if (error) {
    console.error(error);
    return false;
  }
  return true;
}

export async function persistStockTotal(n: number) {
  const organization_id = orgId();
  if (!organization_id) return;
  const supabase = getSupabase();
  const value = Math.max(0, Math.round(n));
  const { error } = await supabase
    .from("organizations")
    .update({ stock_base_sacas: value })
    .eq("id", organization_id);
  if (error && missingColumn(error.message, "stock_base_sacas")) {
    const { error: settingsError } = await supabase.from("organization_settings").upsert(
      {
        organization_id,
        stock_total_sacas: value,
      },
      { onConflict: "organization_id" },
    );
    if (settingsError) console.error(settingsError);
    return;
  }
  if (error) console.error(error);
}
