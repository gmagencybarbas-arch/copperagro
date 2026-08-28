import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function pick(...keys: string[]) {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return "";
}

/** Chaves publicáveis só. Nunca devolve a secret. Sempre dinâmico para ler o Vercel em runtime. */
export function GET() {
  const url = pick(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
  );
  const anonKey = pick(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
  );

  return NextResponse.json({
    url,
    anonKey,
    configured: Boolean(url && anonKey),
    missing: {
      url: !url,
      anonKey: !anonKey,
    },
    onVercel: Boolean(process.env.VERCEL),
  });
}
