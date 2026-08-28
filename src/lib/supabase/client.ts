import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let runtimeUrl = "";
let runtimeAnonKey = "";
let hydratePromise: Promise<void> | null = null;

function readBuildEnv() {
  const url = (
    runtimeUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  const anonKey = (
    runtimeAnonKey ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getSupabaseEnv() {
  return readBuildEnv();
}

/** No Vercel as NEXT_PUBLIC_* só entram no JS no build. Isto lê o servidor em runtime. */
export function ensureSupabaseEnv(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (readBuildEnv().configured) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = (async () => {
      try {
        const res = await fetch("/api/public-config", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          url?: string;
          anonKey?: string;
        };
        runtimeUrl = (json.url ?? "").trim();
        runtimeAnonKey = (json.anonKey ?? "").trim();
        browserClient = null;
      } catch {
        /* vazio: fica sem banco até o próximo try */
      }
    })();
  }
  return hydratePromise;
}

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { url, anonKey, configured } = readBuildEnv();
  if (!configured) {
    throw new Error(
      "Banco não configurado no servidor. No Vercel: Settings → Environment Variables → NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, depois Redeploy.",
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
