import { NextResponse } from "next/server";

/** Chaves publicáveis: o browser precisa delas para Auth. Nunca devolve a secret. */
export function GET() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ""
  ).trim();
  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  return NextResponse.json({
    url,
    anonKey,
    configured: Boolean(url && anonKey),
  });
}
