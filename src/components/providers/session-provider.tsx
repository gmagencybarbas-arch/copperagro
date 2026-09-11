"use client";

import { hydrateOperationalData, loadProfileAndOrg, resetOperationalStores } from "@/lib/db/hydrate";
import { ensureSupabaseEnv, getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    void (async () => {
      await ensureSupabaseEnv();
      if (cancelled) return;

      if (!getSupabaseEnv().configured) {
        useAuthStore.getState().setSessionReady(true);
        return;
      }

      const supabase = getSupabase();

      async function applySession(userId: string, email: string, hydrate: boolean) {
        const ok = await loadProfileAndOrg(userId, email);
        if (ok && hydrate) await hydrateOperationalData();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await applySession(session.user.id, session.user.email ?? "", true);
      }
      if (!cancelled) useAuthStore.getState().setSessionReady(true);

      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === "SIGNED_OUT") {
          useAuthStore.getState().logout();
          resetOperationalStores();
          return;
        }
        if (event === "PASSWORD_RECOVERY") {
          // Sessão de recovery: não hidrata o painel aqui; a página /redefinir-senha trata.
          return;
        }
        if (!nextSession?.user) return;
        if (event === "SIGNED_IN") {
          void applySession(nextSession.user.id, nextSession.user.email ?? "", true);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return children;
}
