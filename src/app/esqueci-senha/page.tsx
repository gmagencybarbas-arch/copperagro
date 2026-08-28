"use client";

import { authErrorMessage } from "@/lib/auth/messages";
import { getSupabase, getSupabaseEnv } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ForgotInner() {
  const search = useSearchParams();
  const preset = search.get("email") ?? "";
  const alreadySent = search.get("enviado") === "1";
  const [email, setEmail] = useState(preset);
  const [note, setNote] = useState<string | null>(
    alreadySent
      ? "Enviamos o link para redefinir a senha. Confere a caixa de entrada e o spam."
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const configured = getSupabaseEnv().configured;

  useEffect(() => {
    setEmail(preset);
  }, [preset]);

  async function sendReset() {
    setError(null);
    const mail = email.trim();
    if (!mail) {
      setError("Informe o e-mail da conta.");
      return;
    }
    if (!configured) {
      setError("Banco não configurado.");
      return;
    }
    setPending(true);
    try {
      const supabase = getSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (resetError) {
        setError(authErrorMessage(resetError.message));
        return;
      }
      setNote("Enviamos o link para redefinir a senha. Confere a caixa de entrada e o spam.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não deu para enviar agora.");
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
            <h1 className="mt-3 text-2xl font-semibold text-gray-900">Esqueci minha senha</h1>
            <p className="mt-1 text-sm text-gray-600">
              A gente manda um e-mail com o link para criar uma senha nova.
            </p>
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
          {note ? <p className="text-sm font-medium text-emerald-800">{note}</p> : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void sendReset()}
            className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Enviando..." : note ? "Reenviar e-mail" : "Enviar link"}
          </button>
          <p className="text-xs text-gray-500">
            Lembrou a senha?{" "}
            <Link className="font-semibold text-[#166534]" href="/login">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotInner />
    </Suspense>
  );
}
