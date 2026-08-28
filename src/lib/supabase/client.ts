import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e a chave publicável no .env.local.",
    );
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
