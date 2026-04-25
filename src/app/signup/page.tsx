"use client";

import { useAuthStore } from "@/store/auth-store";
import { usePlanStore } from "@/store/plan-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setPlan = usePlanStore((s) => s.setPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f1]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.14),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full space-y-5 rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-[0_14px_40px_-24px_rgba(21,83,45,0.35)]">
        <div>
          <p className="inline-flex rounded-full bg-[#166534] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            Cadastro
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900">Criar conta</h1>
          <p className="mt-1 text-sm text-gray-600">Plano inicial Standard.</p>
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
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nome da empresa"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            login({
              user: {
                id: `u_${Date.now()}`,
                name: name.trim() || "Usuário",
                email: email.trim() || "user@copperagro.com",
                companyId: "c_default",
              },
              company: {
                id: "c_default",
                name: companyName.trim() || "Minha Fazenda",
                plan: "standard",
              },
            });
            setPlan("standard");
            router.replace("/dashboard");
          }}
          className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white"
        >
          Criar conta e entrar
        </button>
        <p className="text-xs text-gray-500">
          Já tem conta?{" "}
          <Link className="font-semibold text-[#166534]" href="/login">
            Entrar
          </Link>
        </p>
      </div>
    </div>
    </div>
  );
}
