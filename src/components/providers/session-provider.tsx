"use client";

import { hydrateOperationalData, loadProfileAndOrg, resetOperationalStores } from "@/lib/db/hydrate";
import { getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useEffect } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    const { configured } = getSupabaseEnv();
    if (!configured) {
      useAuthStore.getState().setSessionReady(true);
      return;
    }

    const supabase = getSupabase();

    async function applySession(userId: string, email: string, hydrate: boolean) {
      const ok = await loadProfileAndOrg(userId, email);
      if (ok && hydrate) await hydrateOperationalData();
    }

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await applySession(session.user.id, session.user.email ?? "", true);
      }
      if (!cancelled) useAuthStore.getState().setSessionReady(true);
    })();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        useAuthStore.getState().logout();
        resetOperationalStores();
        return;
      }
      if (!session?.user) return;
      if (event === "SIGNED_IN") {
        void applySession(session.user.id, session.user.email ?? "", true);
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return children;
}
