"use client";

import { authErrorMessage } from "@/lib/auth/messages";
import { getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const configured = getSupabaseEnv().configured;

  async function save() {
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    if (!configured) {
      setError("Banco não configurado.");
      return;
    }
    setPending(true);
    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(authErrorMessage(updateError.message));
        return;
      }
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para salvar a senha.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f1]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.14),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full space-y-5 rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-[0_14px_40px_-24px_rgba(21,83,45,0.35)]">
          <div>
            <p className="inline-flex rounded-full bg-[#166534] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
              Senha
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900">Nova senha</h1>
            <p className="mt-1 text-sm text-gray-600">
              Defina a senha nova depois de abrir o link do e-mail.
            </p>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar senha"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void save()}
            className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar senha"}
          </button>
          <Link href="/login" className="block text-center text-xs font-semibold text-[#166534]">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
