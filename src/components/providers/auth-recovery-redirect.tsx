"use client";

import { ensureSupabaseEnv, getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function isRecoveryUrl(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const query = new URLSearchParams(window.location.search);
  return (
    hashParams.get("type") === "recovery" ||
    query.get("type") === "recovery" ||
    hashParams.get("type") === "invite" ||
    query.get("type") === "invite"
  );
}

/**
 * Se o e-mail de recovery redirecionar para a home (Site URL),
 * captura tokens/sessão e manda para /redefinir-senha.
 */
export function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let unsub = () => {};

    void (async () => {
      await ensureSupabaseEnv();
      if (cancelled || !getSupabaseEnv().configured) return;

      const supabase = getSupabase();

      const goReset = () => {
        if (cancelled) return;
        if (pathname === "/redefinir-senha") return;
        router.replace("/redefinir-senha");
      };

      if (isRecoveryUrl()) {
        // Dá tempo ao client de ler o hash (#access_token&type=recovery)
        window.setTimeout(goReset, 80);
      }

      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") goReset();
      });
      unsub = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [pathname, router]);

  return null;
}
