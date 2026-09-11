"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SectorGlyph } from "@/components/sector/sector-icon";
import { SectorCreateModal } from "@/components/sector-create-modal";
import { persistCompanyName, persistProfileName, persistTelegram } from "@/lib/db/persist";
import { signOutAll } from "@/lib/db/hydrate";
import { useAuthStore } from "@/store/auth-store";
import { useSectorStore } from "@/store/sector-store";
import type { Sector } from "@/types/sector";
import { FileBarChart, Pencil, SunMoon, Tags, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const setUser = useAuthStore((s) => s.setUser);
  const setCompany = useAuthStore((s) => s.setCompany);
  const sectors = useSectorStore((s) => s.sectors);
  const updateSector = useSectorStore((s) => s.updateSector);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [telegramIdInput, setTelegramIdInput] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [userName, setUserName] = useState(user?.name ?? "");
  const [companyName, setCompanyName] = useState(company?.name ?? "");
  const [savingIdentity, setSavingIdentity] = useState(false);

  useEffect(() => {
    setUserName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    setCompanyName(company?.name ?? "");
  }, [company?.name]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-50">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-500">Preferências gerais da conta e sessão.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/conta"
          className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <UserRound className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100">
              Conta
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              E-mail, empresa e plano atual.
            </span>
          </span>
        </Link>
        <Link
          href="/relatorios"
          className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <FileBarChart className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100">
              Relatórios
            </span>
            <span className="mt-0.5 block text-xs text-gray-500">
              Exportação e comparativos (em breve).
            </span>
          </span>
        </Link>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <SunMoon className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Aparência
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Tema claro ou escuro neste aparelho. Só muda a interface, não os dados.
            </p>
          </div>
        </div>
        <ThemeToggle hideLabel />
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <UserRound className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Identidade
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Nome de usuário e nome da empresa. Salva direto no banco.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Nome de usuário
            </label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Nome da empresa
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Minha Fazenda"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            disabled={savingIdentity}
            onClick={() => {
              if (!user || !company) return;
              const nextUser = userName.trim();
              const nextCompany = companyName.trim();
              if (!nextUser || !nextCompany) {
                setFeedback("Preencha nome de usuário e empresa.");
                setTimeout(() => setFeedback(null), 2200);
                return;
              }
              setSavingIdentity(true);
              setUser({ ...user, name: nextUser });
              setCompany({ ...company, name: nextCompany });
              void Promise.all([persistProfileName(nextUser), persistCompanyName(nextCompany)])
                .then(() => {
                  setFeedback("Nome e empresa atualizados.");
                  setTimeout(() => setFeedback(null), 2200);
                })
                .finally(() => setSavingIdentity(false));
            }}
            className="rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {savingIdentity ? "Salvando..." : "Salvar identidade"}
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Tags className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Editar categorias
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Altere nome, ícone e unidade das categorias (Café, Leite, Bovino, Hortifruti e as que
              você criar).
            </p>
          </div>
        </div>
        <ul className="space-y-2">
          {sectors.map((sector) => (
            <li
              key={sector.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white text-gray-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                <SectorGlyph icon={sector.icon} sectorId={sector.id} className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {sector.name}
                </p>
                <p className="text-xs text-gray-500">Unidade: {sector.unit}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(sector)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">Integrações</h2>
        <button
          type="button"
          onClick={() => setTelegramOpen(true)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        >
          Conectar Telegram
        </button>
        {user?.telegramId && (
          <p className="text-xs text-emerald-700">
            Telegram conectado: <strong>{user.telegramId}</strong>
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => {
            void signOutAll().then(() => router.replace("/login"));
          }}
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
        >
          Sair da conta
        </button>
      </section>
      {telegramOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/25" onClick={() => setTelegramOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              Conectar Telegram
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTelegramOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                  void persistTelegram(v);
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
      <SectorCreateModal
        key={editing?.id ?? "idle"}
        open={Boolean(editing)}
        mode="edit"
        initial={
          editing
            ? { name: editing.name, unit: editing.unit, icon: editing.icon }
            : undefined
        }
        onClose={() => setEditing(null)}
        onSubmit={(input) => {
          if (!editing) return;
          const ok = updateSector(editing.id, input);
          if (!ok) return;
          setEditing(null);
          setFeedback(`Categoria "${input.name}" atualizada.`);
          setTimeout(() => setFeedback(null), 2200);
        }}
      />
      {feedback && (
        <div className="fixed right-4 top-4 z-[90] rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 shadow-md">
          {feedback}
        </div>
      )}
    </div>
  );
}
