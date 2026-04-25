"use client";

import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramIdInput, setTelegramIdInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Preferências gerais da conta e sessão.</p>
      </header>
      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Integrações</h2>
        <button
          type="button"
          onClick={() => setTelegramOpen(true)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
        >
          Conectar Telegram
        </button>
        {user?.telegramId && (
          <p className="text-xs text-emerald-700">
            Telegram conectado: <strong>{user.telegramId}</strong>
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
        >
          Sair da conta
        </button>
      </section>
      {telegramOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/25" onClick={() => setTelegramOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Conectar Telegram</h2>
            <p className="mt-2 text-sm text-gray-600">
              Envie uma mensagem para nosso bot no Telegram. Após o webhook receber o retorno,
              vincule o ID aqui.
            </p>
            <a
              href="https://t.me/copperagro_bot"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[#166534] underline"
            >
              Abrir bot no Telegram
            </a>
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Telegram ID (retorno do webhook)
              </label>
              <input
                value={telegramIdInput}
                onChange={(e) => setTelegramIdInput(e.target.value)}
                placeholder="Ex.: 123456789"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTelegramOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) return;
                  const v = telegramIdInput.trim();
                  if (!v) return;
                  setUser({ ...user, telegramId: v });
                  setTelegramOpen(false);
                  setFeedback("Telegram vinculado com sucesso.");
                  setTimeout(() => setFeedback(null), 2200);
                }}
                className="rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white"
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
      {feedback && (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 shadow-md">
          {feedback}
        </div>
      )}
    </div>
  );
}
