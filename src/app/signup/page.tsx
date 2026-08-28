"use client";

import { authErrorMessage } from "@/lib/auth/messages";
import { hydrateOperationalData, loadProfileAndOrg } from "@/lib/db/hydrate";
import { getSupabase, getSupabaseEnv, ensureSupabaseEnv } from "@/lib/supabase/client";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [existingEmail, setExistingEmail] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [configured, setConfigured] = useState(getSupabaseEnv().configured);

  useEffect(() => {
    void ensureSupabaseEnv().then(() => setConfigured(getSupabaseEnv().configured));
  }, []);

  async function emailAlreadyRegistered(mail: string): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/email-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });
      if (!res.ok) return false;
      const json = (await res.json()) as { exists?: boolean };
      return Boolean(json.exists);
    } catch {
      return false;
    }
  }

  async function handleSignup() {
    setError(null);
    setResendNote(null);
    setExistingEmail(false);
    await ensureSupabaseEnv();
    if (!getSupabaseEnv().configured) {
      setError(
        "Banco não configurado no servidor. No Vercel adiciona NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e faz Redeploy.",
      );
      return;
    }
    const mail = email.trim();
    if (!mail || password.length < 6) {
      setError("E-mail válido e senha com pelo menos 6 caracteres.");
      return;
    }
    setPending(true);
    try {
      if (await emailAlreadyRegistered(mail)) {
        setExistingEmail(true);
        return;
      }
      const supabase = getSupabase();
      const { data, error: authError } = await supabase.auth.signUp({
        email: mail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name: name.trim() || mail.split("@")[0],
            company_name: companyName.trim() || "Minha Fazenda",
          },
        },
      });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered")) {
          setExistingEmail(true);
          return;
        }
        setError(authErrorMessage(authError.message));
        return;
      }
      if (!data.session || !data.user) {
        setAwaitingEmail(true);
        return;
      }
      const ok = await loadProfileAndOrg(data.user.id, data.user.email ?? mail);
      if (ok) await hydrateOperationalData();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no cadastro.");
    } finally {
      setPending(false);
    }
  }

  async function goResetPassword() {
    const mail = email.trim();
    setPending(true);
    try {
      const supabase = getSupabase();
      await supabase.auth.resetPasswordForEmail(mail, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      router.push(`/esqueci-senha?email=${encodeURIComponent(mail)}&enviado=1`);
    } catch {
      router.push(`/esqueci-senha?email=${encodeURIComponent(mail)}`);
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setResendNote(null);
    try {
      const supabase = getSupabase();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/login` },
      });
      if (resendError) {
        setResendNote(authErrorMessage(resendError.message));
        return;
      }
      setResendNote("Pronto. Enviamos outro e-mail.");
    } catch {
      setResendNote("Não deu para reenviar agora. Tente de novo em instantes.");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5f1]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(22,163,74,0.14),transparent_60%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <div className="w-full space-y-5 rounded-2xl border border-[#e7ece8] bg-white p-6 shadow-[0_14px_40px_-24px_rgba(21,83,45,0.35)]">
          {existingEmail ? (
            <div className="space-y-4">
              <p className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-900">
                Conta existente
              </p>
              <h1 className="text-2xl font-semibold text-gray-900">Este e-mail já existe</h1>
              <p className="text-sm text-gray-600">
                <strong>{email.trim()}</strong> já tem cadastro. Quer entrar ou resetar a senha?
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`/login?email=${encodeURIComponent(email.trim())}`)
                }
                className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white"
              >
                Quero logar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void goResetPassword()}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-semibold text-emerald-900 disabled:opacity-60"
              >
                {pending ? "Enviando..." : "Resetar a senha"}
              </button>
              <button
                type="button"
                onClick={() => setExistingEmail(false)}
                className="w-full text-sm font-medium text-gray-500"
              >
                Usar outro e-mail
              </button>
            </div>
          ) : awaitingEmail ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#166534]">
                <Mail className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Quase lá
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-gray-900">Confirme seu e-mail</h1>
                <p className="mt-2 text-sm text-gray-600">
                  Enviamos um link para{" "}
                  <strong className="text-gray-900">{email.trim()}</strong>. Abra a mensagem, confirme
                  a conta e depois volte para entrar.
                </p>
              </div>
              {resendNote ? (
                <p className="text-sm font-medium text-emerald-800">{resendNote}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void resend()}
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-sm font-semibold text-emerald-900"
              >
                Reenviar e-mail
              </button>
              <Link href="/login" className="inline-block text-sm font-semibold text-[#166534]">
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <div>
                <p className="inline-flex rounded-full bg-[#166534] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  Cadastro
                </p>
                <h1 className="mt-3 text-2xl font-semibold text-gray-900">Criar conta</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Plano inicial Standard. Depois do cadastro você confirma o e-mail.
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
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha (mín. 6)"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da empresa"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleSignup()}
                className="w-full rounded-xl bg-[#166534] py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {pending ? "Verificando..." : "Criar conta"}
              </button>
              <p className="text-xs text-gray-500">
                Já tem conta?{" "}
                <Link className="font-semibold text-[#166534]" href="/login">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
