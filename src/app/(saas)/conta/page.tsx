"use client";

import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

export default function ContaPage() {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);

  if (!user || !company) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Conta</h1>
        <p className="mt-1 text-sm text-gray-500">Identidade do usuário e da empresa.</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-sm">
          <span className="font-semibold text-gray-700">Usuário:</span> {user.name}
        </p>
        <p className="text-sm">
          <span className="font-semibold text-gray-700">E-mail:</span> {user.email}
        </p>
        <p className="text-sm">
          <span className="font-semibold text-gray-700">Empresa:</span> {company.name}
        </p>
        <p className="text-sm">
          <span className="font-semibold text-gray-700">Plano atual:</span>{" "}
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-700">
            {company.plan}
          </span>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/planos" className="rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white">
            Upgrade
          </Link>
        </div>
      </section>
    </div>
  );
}
