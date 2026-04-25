"use client";

import { useAuthStore } from "@/store/auth-store";
import { usePlanStore } from "@/store/plan-store";
import type { Plan } from "@/types/plan";
import { BarChart3, LineChart, Sprout, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setPlan = usePlanStore((s) => s.setPlan);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f1]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.14),transparent_60%)]" />
      <CoffeeRain />
      <RandomSystemIcons />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
        <div className="w-full space-y-5 rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-[0_14px_40px_-24px_rgba(21,83,45,0.35)]">
          <div>
            <p className="inline-flex rounded-full bg-[#166534] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              Login
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900">Entrar</h1>
            <p className="mt-1 text-sm text-gray-600">
              Entre na sua conta e tenha o controle do seu negocio na palma da mao.
            </p>
          </div>
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              type="email"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const plan: Plan = "standard";
              login({
                user: {
                  id: `u_${Date.now()}`,
                  name: name.trim() || "Usuário",
                  email: email.trim() || "user@copperagro.com",
                  companyId: "c_default",
                },
                company: {
                  id: "c_default",
                  name: "Minha Fazenda",
                  plan,
                },
              });
              setPlan(plan);
              router.replace("/dashboard");
            }}
            className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#14532d]"
          >
            Entrar
          </button>
          <p className="text-xs text-gray-500">
            Não tem conta?{" "}
            <Link className="font-semibold text-[#166534]" href="/signup">
              Criar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function CoffeeRain() {
  const beans = Array.from({ length: 11 }, (_, i) => ({
    id: i,
    left: `${6 + ((i * 11) % 88)}%`,
    top: `${8 + ((i * 17) % 80)}%`,
    scale: 0.55 + (i % 5) * 0.11,
  }));
  return (
    <div className="pointer-events-none absolute inset-0">
      {beans.map((b) => (
        <span
          key={b.id}
          className="absolute block rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: `${18 * b.scale}px`,
            height: `${26 * b.scale}px`,
            background: "linear-gradient(145deg,#3f2e22 0%,#1c1410 45%,#4a3628 100%)",
            animation: `beanFloat 7.2s ease-in-out ${b.id * 0.12}s infinite`,
            opacity: 0.22,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes beanFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(6deg); }
        }
      `}</style>
    </div>
  );
}

function RandomSystemIcons() {
  const icons = [BarChart3, LineChart, TrendingUp, Sprout];
  const nodes = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    Icon: icons[i % icons.length]!,
    left: `${10 + ((i * 19) % 76)}%`,
    top: `${14 + ((i * 13) % 72)}%`,
  }));
  return (
    <div className="pointer-events-none absolute inset-0">
      {nodes.map(({ id, Icon, left, top }) => (
        <span
          key={id}
          className="absolute text-emerald-600/20"
          style={{ left, top }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      ))}
    </div>
  );
}
