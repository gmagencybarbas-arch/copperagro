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
  if (hydratePromise) return hydratePromise;
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
      /* tenta outra vez no próximo clique */
    } finally {
      if (!readBuildEnv().configured) hydratePromise = null;
    }
  })();
  return hydratePromise;
}

export async function describeSupabaseConfig() {
  await ensureSupabaseEnv();
  const env = readBuildEnv();
  if (env.configured) {
    return { configured: true, hint: "" };
  }
  try {
    const res = await fetch("/api/public-config", { cache: "no-store" });
    if (!res.ok) {
      return {
        configured: false,
        hint: `A API /api/public-config respondeu ${res.status}. Este site precisa de ser o deploy Next (Vercel), não o GitHub.`,
      };
    }
    const json = (await res.json()) as {
      missing?: { url?: boolean; anonKey?: boolean };
      onVercel?: boolean;
    };
    const falta: string[] = [];
    if (json.missing?.url) falta.push("NEXT_PUBLIC_SUPABASE_URL");
    if (json.missing?.anonKey) {
      falta.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }
    const where = json.onVercel
      ? "Vercel → Project → Settings → Environment Variables (Production + Preview), depois Redeploy sem cache."
      : "painel do host (Vercel). Se estás a abrir o GitHub, isso não corre o Next.";
    return {
      configured: false,
      hint: falta.length
        ? `Falta no servidor: ${falta.join(" e ")}. Coloca em ${where}`
        : `Chaves vazias no servidor. Coloca em ${where}`,
    };
  } catch {
    return {
      configured: false,
      hint: "Não consegui falar com /api/public-config. Confirma que o site é o da Vercel, não o repositório GitHub.",
    };
  }
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
