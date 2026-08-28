import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Só no servidor. Nunca importar em componente client. */
export function getSupabaseAdmin(): SupabaseClient {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";
  if (!url || !secret) {
    throw new Error(
      "Supabase admin não configurado (NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY).",
    );
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
