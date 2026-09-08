"use client";

import { ensureSupabaseEnv, getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/**
 * Destino seguro do e-mail Supabase.
 * Troca ?code=… (PKCE) e encaminha para /redefinir-senha (ou ?next=).
 */
function AuthCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [msg, setMsg] = useState("A validar o link…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const nextRaw = search.get("next") || "/redefinir-senha";
      const next = nextRaw.startsWith("/") ? nextRaw : "/redefinir-senha";

      await ensureSupabaseEnv();
      if (cancelled) return;

      if (!getSupabaseEnv().configured) {
        setMsg("Banco não configurado. Abre o site da Vercel com as chaves no ambiente.");
        return;
      }

      const supabase = getSupabase();
      const code = search.get("code");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMsg(error.message || "Link inválido ou expirado.");
            return;
          }
        } else {
          // Fluxo implícito: tokens no hash — o client já detecta
          await supabase.auth.getSession();
        }
        if (!cancelled) router.replace(next);
      } catch (e) {
        if (!cancelled) {
          setMsg(e instanceof Error ? e.message : "Não foi possível validar o link.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, search]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] px-4">
      <p className="rounded-2xl border border-[#e7ece8] bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm">
        {msg}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">
          A carregar…
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
