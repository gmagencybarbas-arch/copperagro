"use client";

import { beginRouteLoading, useNavLoadingStore } from "@/store/nav-loading-store";
import { Sprout } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const MIN_VISIBLE_MS = 450;

export function RouteLoadingOverlay() {
  const pathname = usePathname();
  const visible = useNavLoadingStore((s) => s.visible);
  const target = useNavLoadingStore((s) => s.target);
  const startedAt = useNavLoadingStore((s) => s.startedAt);
  const finish = useNavLoadingStore((s) => s.finish);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const el = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) return;
      const path = href.replace(window.location.origin, "").split("?")[0].split("#")[0];
      if (!path.startsWith("/")) return;
      if (path === pathname) return;
      beginRouteLoading(path);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const arrived = !target || pathname === target;
    if (!arrived) return;
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const t = window.setTimeout(() => finish(), wait);
    return () => window.clearTimeout(t);
  }, [pathname, visible, target, startedAt, finish]);

  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => finish(), 8000);
    return () => window.clearTimeout(t);
  }, [visible, finish]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex cursor-wait flex-col items-center justify-center bg-white/40 backdrop-blur-[1px] dark:bg-slate-950/40"
      aria-busy
      aria-live="polite"
      role="status"
    >
      <div className="flex flex-col items-center gap-2 px-6 text-center">
        <Sprout
          className="h-6 w-6 text-[#166534] copperagro-plant-pulse dark:text-emerald-300"
          strokeWidth={1.8}
        />
        <p className="text-[11px] font-medium tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
          CopperAgro
        </p>
      </div>
    </div>
  );
}
