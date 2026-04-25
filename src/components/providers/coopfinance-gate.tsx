"use client";

import { useAuthStore } from "@/store/auth-store";
import { usePlanStore } from "@/store/plan-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SPLASH_MS = 3000;

export function CoopFinanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const company = useAuthStore((s) => s.company);
  const setPlan = usePlanStore((s) => s.setPlan);
  const [phase, setPhase] = useState<"splash" | "done">("splash");

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("done"), SPLASH_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (company) setPlan(company.plan);
  }, [company, setPlan]);

  const splashVisible = phase === "splash";

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[9998] flex flex-col items-center justify-center overflow-hidden bg-[#050505] transition-opacity duration-700 ease-out ${
          splashVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!splashVisible}
        aria-busy={splashVisible}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(22,163,74,0.14),transparent_55%)]" />

        <CoffeeBeans />

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400/90">
            Inteligência comercial
          </p>
          <h1 className="bg-gradient-to-br from-white via-gray-100 to-gray-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
            CoopFinance
          </h1>
          <p className="mt-4 font-mono text-xs text-gray-500 sm:text-sm">
            a system by{" "}
            <span className="text-emerald-400/90">gabs</span>
          </p>
          <div className="mt-10 flex h-1 w-40 overflow-hidden rounded-full bg-gray-800">
            <div className="coop-progress-fill h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-400" />
          </div>
        </div>
      </div>

      <div
        className={`transition-opacity duration-700 ease-out ${
          splashVisible
            ? "pointer-events-none select-none opacity-0"
            : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}

function CoffeeBeans() {
  const beans = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${8 + ((i * 13) % 84)}%`,
    top: `${12 + ((i * 17) % 76)}%`,
    scale: 0.6 + (i % 4) * 0.15,
  }));

  return (
    <div className="pointer-events-none absolute inset-0">
      {beans.map((b) => (
        <span
          key={b.id}
          className="coop-bean absolute block rounded-full shadow-sm"
          style={{
            left: b.left,
            top: b.top,
            width: `${18 * b.scale}px`,
            height: `${26 * b.scale}px`,
            background:
              "linear-gradient(145deg,#3f2e22 0%,#1c1410 45%,#4a3628 100%)",
            animationDelay: `${b.id * 0.14}s`,
          }}
        />
      ))}
    </div>
  );
}
