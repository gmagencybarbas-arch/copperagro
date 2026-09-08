"use client";

import { SectorGlyph } from "@/components/sector/sector-icon";
import { PLANS } from "@/config/plans";
import { formatBRL } from "@/lib/format";
import {
  persistCompanyName,
  persistOnboardingComplete,
} from "@/lib/db/persist";
import { useAuthStore } from "@/store/auth-store";
import { usePlanStore } from "@/store/plan-store";
import { DEFAULT_SECTORS } from "@/store/sector-store";
import { Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type StepId = "farm" | "stock" | "ops" | "analytics";

const STEPS: { id: StepId; title: string; blurb: string }[] = [
  { id: "farm", title: "Fazenda", blurb: "Nome da operação." },
  { id: "stock", title: "Estoque", blurb: "Por setor." },
  { id: "ops", title: "Lançamentos", blurb: "Venda e despesa." },
  { id: "analytics", title: "Análises", blurb: "Decisão e plano." },
];

const DEMO_SECTORS = DEFAULT_SECTORS;

type SimStock = { sectorId: string; quantity: number };
type SimSale = {
  sectorId: string;
  date: string;
  quantity: number;
  unitPrice: number;
  note: string;
};
type SimExpense = {
  scope: string; // sectorId | "geral"
  date: string;
  amount: number;
  note: string;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

function sectorById(id: string) {
  return DEMO_SECTORS.find((s) => s.id === id) ?? DEMO_SECTORS[0]!;
}

/** Plus trimestral ÷ 3 — copy “menos de X / mês” */
function plusMonthlyCeil(): number {
  return Math.ceil(PLANS.plus.priceQuarterly / 3);
}

export function OnboardingWizard() {
  const router = useRouter();
  const company = useAuthStore((s) => s.company);
  const setCompany = useAuthStore((s) => s.setCompany);
  const setPlan = usePlanStore((s) => s.setPlan);

  const [step, setStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const [farmName, setFarmName] = useState(company?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [simStock, setSimStock] = useState<SimStock | null>(null);
  const [simSale, setSimSale] = useState<SimSale | null>(null);
  const [simExpense, setSimExpense] = useState<SimExpense | null>(null);

  const [celebrate, setCelebrate] = useState(false);
  const [premiumOn, setPremiumOn] = useState(false);

  const current = STEPS[step]!;
  const progressPct = ((step + 1) / STEPS.length) * 100;

  const goToStep = useCallback(async (next: number) => {
    setFadeIn(false);
    await wait(200);
    setStep(next);
    setError(null);
    await wait(30);
    setFadeIn(true);
  }, []);

  async function goNext() {
    setError(null);

    if (current.id === "farm") {
      const name = farmName.trim();
      if (name.length < 2) {
        setError("Diz o nome da fazenda (mín. 2 letras).");
        return;
      }
      setPending(true);
      try {
        await persistCompanyName(name);
        if (company) setCompany({ ...company, name });
      } finally {
        setPending(false);
      }
      await goToStep(step + 1);
      return;
    }

    if (current.id === "stock") {
      if (!simStock || simStock.quantity <= 0) {
        setError("Simula um lançamento de estoque num setor para continuar.");
        return;
      }
      await goToStep(step + 1);
      return;
    }

    if (current.id === "ops") {
      if (!simSale && !simExpense) {
        setError("Simula pelo menos uma venda ou uma despesa.");
        return;
      }
      await goToStep(step + 1);
      return;
    }

    if (current.id === "analytics") {
      setPending(true);
      try {
        const ok = await persistOnboardingComplete();
        if (!ok) {
          setError("Não deu para gravar. Tenta de novo ou faz logout/login.");
          return;
        }
        if (company) setCompany({ ...company, onboardingCompleted: true });
        router.replace("/dashboard");
      } finally {
        setPending(false);
      }
    }
  }

  function goBack() {
    if (step <= 0) return;
    void goToStep(step - 1);
  }

  function activatePremium() {
    setPlan("plus");
    setPremiumOn(true);
    setCelebrate(true);
    playRuralJingle();
    window.setTimeout(() => setCelebrate(false), 4200);
  }

  return (
    <main className="text-foreground relative isolate flex min-h-svh w-full flex-col overflow-x-hidden bg-[#f4f7f4]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(22,163,74,0.12),transparent_55%)]"
      />

      {celebrate ? <ConfettiBurst /> : null}
      {premiumOn && celebrate ? (
        <div className="pointer-events-none fixed inset-x-0 top-8 z-50 flex justify-center px-4">
          <p className="rounded-full bg-[#166534] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 animate-[ob-pop_0.5s_ease]">
            Plus ativado — análises e setores liberados
          </p>
        </div>
      ) : null}

      {/* Progress top — verde + blur */}
      <div className="relative z-20 px-4 pt-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <Sprout className="size-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium text-emerald-900/80">
                {current.title}
              </p>
              <p className="shrink-0 text-[11px] tabular-nums text-emerald-800/55">
                {step + 1}/{STEPS.length}
              </p>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-emerald-900/8 backdrop-blur-md ring-1 ring-emerald-700/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400 shadow-[0_0_12px_rgba(52,211,153,0.55)] transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="relative z-10 flex min-w-0 flex-1 items-stretch justify-center px-4 pb-6 pt-6 sm:px-8 sm:pt-10">
        <div className="flex w-full max-w-[26rem] flex-col">
          <div
            className={`flex flex-1 flex-col transition-all duration-200 ease-out ${
              fadeIn
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-6">
              {current.id === "farm" && (
                <StepFarm farmName={farmName} setFarmName={setFarmName} />
              )}
              {current.id === "stock" && (
                <StepStock sim={simStock} onSim={setSimStock} />
              )}
              {current.id === "ops" && (
                <StepOps
                  simSale={simSale}
                  simExpense={simExpense}
                  onSale={setSimSale}
                  onExpense={setSimExpense}
                  stockSectorId={simStock?.sectorId}
                />
              )}
              {current.id === "analytics" && (
                <StepAnalytics
                  farmName={farmName.trim()}
                  stock={simStock}
                  sale={simSale}
                  expense={simExpense}
                  premiumOn={premiumOn}
                  onActivate={activatePremium}
                  monthlyCeil={plusMonthlyCeil()}
                />
              )}
            </div>

            {error ? (
              <p className="mt-4 text-sm font-medium text-rose-700">{error}</p>
            ) : null}

            <div className="mt-auto flex flex-col gap-2 pt-8">
              <button
                type="button"
                disabled={pending}
                onClick={() => void goNext()}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#166534] text-sm font-semibold text-white transition hover:bg-[#14532d] active:scale-[0.99] disabled:opacity-60"
              >
                {pending
                  ? "Salvando…"
                  : current.id === "analytics"
                    ? "Ir para o painel"
                    : "Continuar"}
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="h-10 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-xl font-semibold leading-7 text-balance text-gray-900 sm:text-[1.35rem]">
        {title}
      </h1>
      <p className="text-sm leading-5 text-pretty text-gray-600">{description}</p>
    </div>
  );
}

function StepFarm({
  farmName,
  setFarmName,
}: {
  farmName: string;
  setFarmName: (v: string) => void;
}) {
  return (
    <>
      <StepHeader
        title="Nome da fazenda"
        description="É assim que a operação aparece no painel."
      />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-800">
          Nome <span className="text-rose-600">*</span>
        </span>
        <input
          value={farmName}
          onChange={(e) => setFarmName(e.target.value)}
          placeholder="Ex.: Fazenda Santa Clara"
          autoComplete="organization"
          className="h-11 w-full rounded-xl border border-gray-200/90 bg-white/90 px-3 text-sm outline-none backdrop-blur-sm focus:border-emerald-600/40 focus:ring-2 focus:ring-emerald-600/20"
        />
      </label>
    </>
  );
}

function StepStock({
  sim,
  onSim,
}: {
  sim: SimStock | null;
  onSim: (v: SimStock) => void;
}) {
  const [sectorId, setSectorId] = useState(sim?.sectorId ?? DEMO_SECTORS[0]!.id);
  const [qty, setQty] = useState(sim?.quantity ? String(sim.quantity) : "");
  const [flash, setFlash] = useState(false);
  const sector = sectorById(sectorId);

  function launch() {
    const n = Math.floor(Number(qty.replace(",", ".")));
    if (!Number.isFinite(n) || n <= 0) return;
    onSim({ sectorId, quantity: n });
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
  }

  return (
    <>
      <StepHeader
        title="Estoque por setor"
        description="Cada setor tem o próprio estoque e a própria unidade. No plano gratuito já vêm estes quatro."
      />

      <div className="grid grid-cols-4 gap-2">
        {DEMO_SECTORS.map((s) => {
          const active = s.id === sectorId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectorId(s.id)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-center transition ${
                active
                  ? "border-emerald-500/50 bg-emerald-50 shadow-sm"
                  : "border-gray-200/80 bg-white/80 hover:border-emerald-200"
              }`}
            >
              <span
                className={`flex size-9 items-center justify-center rounded-xl ${
                  active ? "bg-emerald-600 text-white" : "bg-gray-50 text-emerald-800"
                }`}
              >
                <SectorGlyph icon={s.icon} sectorId={s.id} className="size-4" />
              </span>
              <span className="text-[10px] font-semibold leading-tight text-gray-800">
                {s.name}
              </span>
              <span className="text-[9px] text-gray-500">{s.unit}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-emerald-300/70 bg-white/70 p-4 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">
          Simular lançamento
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Entrada em <strong>{sector.name}</strong> ({sector.unit}s)
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            placeholder={`Qtd. em ${sector.unit}s`}
            className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-600/40 focus:ring-2 focus:ring-emerald-600/20"
          />
          <button
            type="button"
            onClick={launch}
            className="h-11 shrink-0 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
          >
            Lançar
          </button>
        </div>
        {sim ? (
          <p
            className={`mt-3 text-sm font-medium text-emerald-800 transition ${
              flash ? "scale-[1.02]" : ""
            }`}
          >
            ✓ +{sim.quantity} {sectorById(sim.sectorId).unit}
            {sim.quantity === 1 ? "" : "s"} em {sectorById(sim.sectorId).name}
          </p>
        ) : (
          <p className="mt-3 text-xs text-gray-500">Faz um lançamento para continuar.</p>
        )}
      </div>
    </>
  );
}

function StepOps({
  simSale,
  simExpense,
  onSale,
  onExpense,
  stockSectorId,
}: {
  simSale: SimSale | null;
  simExpense: SimExpense | null;
  onSale: (v: SimSale) => void;
  onExpense: (v: SimExpense) => void;
  stockSectorId?: string;
}) {
  const [tab, setTab] = useState<"sale" | "expense">("sale");
  const defaultSector = stockSectorId ?? DEMO_SECTORS[0]!.id;

  const [saleSector, setSaleSector] = useState(simSale?.sectorId ?? defaultSector);
  const [saleDate, setSaleDate] = useState(simSale?.date ?? todayISO());
  const [saleQty, setSaleQty] = useState(simSale ? String(simSale.quantity) : "1");
  const [salePrice, setSalePrice] = useState(simSale ? String(simSale.unitPrice) : "800");
  const [saleNote, setSaleNote] = useState(simSale?.note ?? "");

  const [expScope, setExpScope] = useState(simExpense?.scope ?? "geral");
  const [expDate, setExpDate] = useState(simExpense?.date ?? todayISO());
  const [expAmount, setExpAmount] = useState(
    simExpense ? String(simExpense.amount) : "150",
  );
  const [expNote, setExpNote] = useState(simExpense?.note ?? "");

  const saleUnit = sectorById(saleSector).unit;

  function launchSale() {
    const q = Math.floor(Number(saleQty));
    const p = Number(String(salePrice).replace(",", "."));
    if (q <= 0 || !(p > 0)) return;
    onSale({
      sectorId: saleSector,
      date: saleDate,
      quantity: q,
      unitPrice: p,
      note: saleNote.trim(),
    });
  }

  function launchExpense() {
    const a = Number(String(expAmount).replace(",", "."));
    if (!(a > 0)) return;
    onExpense({
      scope: expScope,
      date: expDate,
      amount: a,
      note: expNote.trim(),
    });
  }

  return (
    <>
      <StepHeader
        title="Vendas e despesas"
        description="Separa por setor, data e observação. Despesa pode ser de um setor ou geral da fazenda."
      />

      <div className="flex gap-1 rounded-xl bg-gray-100/90 p-1">
        <button
          type="button"
          onClick={() => setTab("sale")}
          className={`h-9 flex-1 rounded-lg text-sm font-semibold transition ${
            tab === "sale" ? "bg-white text-emerald-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Venda
        </button>
        <button
          type="button"
          onClick={() => setTab("expense")}
          className={`h-9 flex-1 rounded-lg text-sm font-semibold transition ${
            tab === "expense" ? "bg-white text-emerald-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Despesa
        </button>
      </div>

      {tab === "sale" ? (
        <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white/80 p-4">
          <SectorChips value={saleSector} onChange={setSaleSector} />
          <Field label="Data">
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Qtd (${saleUnit})`}>
              <input
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
                inputMode="numeric"
                className={fieldClass}
              />
            </Field>
            <Field label={`R$/${saleUnit}`}>
              <input
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                inputMode="decimal"
                className={fieldClass}
              />
            </Field>
          </div>
          <Field label="Observação">
            <input
              value={saleNote}
              onChange={(e) => setSaleNote(e.target.value)}
              placeholder="Opcional"
              className={fieldClass}
            />
          </Field>
          <button
            type="button"
            onClick={launchSale}
            className="h-10 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white"
          >
            Simular venda
          </button>
          {simSale ? (
            <p className="text-sm font-medium text-emerald-800">
              ✓ {simSale.quantity} × {formatBRL(simSale.unitPrice)} ·{" "}
              {sectorById(simSale.sectorId).name}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-gray-200/80 bg-white/80 p-4">
          <div className="flex flex-wrap gap-1.5">
            <Chip
              active={expScope === "geral"}
              onClick={() => setExpScope("geral")}
              label="Geral da fazenda"
            />
            {DEMO_SECTORS.map((s) => (
              <Chip
                key={s.id}
                active={expScope === s.id}
                onClick={() => setExpScope(s.id)}
                label={s.name}
              />
            ))}
          </div>
          <Field label="Data">
            <input
              type="date"
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Valor (R$)">
            <input
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              inputMode="decimal"
              className={fieldClass}
            />
          </Field>
          <Field label="Observação">
            <input
              value={expNote}
              onChange={(e) => setExpNote(e.target.value)}
              placeholder="Ex.: combustível, mão de obra…"
              className={fieldClass}
            />
          </Field>
          <button
            type="button"
            onClick={launchExpense}
            className="h-10 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white"
          >
            Simular despesa
          </button>
          {simExpense ? (
            <p className="text-sm font-medium text-emerald-800">
              ✓ {formatBRL(simExpense.amount)} ·{" "}
              {simExpense.scope === "geral"
                ? "Geral"
                : sectorById(simExpense.scope).name}
            </p>
          ) : null}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Simula pelo menos uma venda ou despesa para ver o reflexo nas análises.
      </p>
    </>
  );
}

function StepAnalytics({
  farmName,
  stock,
  sale,
  expense,
  premiumOn,
  onActivate,
  monthlyCeil,
}: {
  farmName: string;
  stock: SimStock | null;
  sale: SimSale | null;
  expense: SimExpense | null;
  premiumOn: boolean;
  onActivate: () => void;
  monthlyCeil: number;
}) {
  const revenue = sale ? sale.quantity * sale.unitPrice : 0;
  const cost = expense?.amount ?? 0;
  const profit = revenue - cost;
  const remaining =
    stock && sale && stock.sectorId === sale.sectorId
      ? Math.max(0, stock.quantity - sale.quantity)
      : stock?.quantity ?? 0;

  return (
    <>
      <StepHeader
        title={farmName ? `${farmName} em números` : "Prévia das análises"}
        description="Leitura rápida do que você acabou de simular — no painel real fica vivo com os teus dados."
      />

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Faturamento" value={formatBRL(revenue)} />
        <MiniStat label="Despesas" value={formatBRL(cost)} />
        <MiniStat
          label="Lucro simulado"
          value={formatBRL(profit)}
          accent={profit >= 0 ? "good" : "bad"}
        />
        <MiniStat
          label="Estoque restante"
          value={
            stock
              ? `${remaining} ${sectorById(stock.sectorId).unit}${remaining === 1 ? "" : "s"}`
              : "—"
          }
        />
      </div>

      <div className="h-16 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-100 via-white to-lime-100 ring-1 ring-emerald-200/60">
        <MockBars revenue={revenue} cost={cost} />
      </div>

      <div className="relative isolate overflow-hidden rounded-2xl bg-[#0b1220] p-5 text-white shadow-[0_20px_50px_-28px_rgba(11,18,32,0.85)] ring-1 ring-white/10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 0%, rgba(52,211,153,0.28), transparent 45%), radial-gradient(ellipse at 90% 100%, rgba(251,191,36,0.12), transparent 40%)",
          }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
              Plano Plus
            </p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100 ring-1 ring-white/15">
              Recomendado
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white/75">
            Análises e setores personalizados liberados — por menos de
          </p>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-lime-400 px-4 py-4 text-emerald-950 shadow-[0_14px_40px_-18px_rgba(16,185,129,0.9)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-950/65">
              a partir de
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
                {formatBRL(monthlyCeil)}
              </span>
              <span className="text-sm font-semibold text-emerald-950/70">/mês</span>
            </p>
            <p className="mt-2 text-xs font-medium text-emerald-950/60">
              ou {formatBRL(PLANS.plus.priceQuarterly)} no trimestre
            </p>
          </div>

          <ul className="space-y-1.5 text-xs text-white/70">
            {PLANS.plus.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-[10px] text-emerald-300">
                  ✓
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onActivate}
            disabled={premiumOn}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-emerald-950 shadow-lg shadow-black/20 transition hover:bg-emerald-50 active:scale-[0.99] disabled:opacity-70"
          >
            {premiumOn ? "Plus já ativo" : "Ativar agora"}
          </button>
        </div>
      </div>
    </>
  );
}

const fieldClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-emerald-600/40 focus:ring-2 focus:ring-emerald-600/20";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectorChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DEMO_SECTORS.map((s) => (
        <Chip
          key={s.id}
          active={value === s.id}
          onClick={() => onChange(s.id)}
          label={s.name}
          icon={
            <SectorGlyph icon={s.icon} sectorId={s.id} className="size-3.5" />
          }
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-emerald-500/50 bg-emerald-50 text-emerald-900"
          : "border-gray-200 bg-white text-gray-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/90 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold tabular-nums ${
          accent === "good"
            ? "text-emerald-700"
            : accent === "bad"
              ? "text-rose-700"
              : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function MockBars({ revenue, cost }: { revenue: number; cost: number }) {
  const max = Math.max(revenue, cost, 1);
  const rH = Math.max(12, (revenue / max) * 48);
  const cH = Math.max(8, (cost / max) * 48);
  return (
    <div className="flex h-full items-end justify-center gap-6 px-6 pb-2 pt-3">
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 rounded-t-md bg-emerald-500/90 transition-all duration-700"
          style={{ height: rH }}
        />
        <span className="text-[9px] font-medium text-emerald-800/70">Receita</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 rounded-t-md bg-rose-400/80 transition-all duration-700"
          style={{ height: cH }}
        />
        <span className="text-[9px] font-medium text-rose-800/60">Custo</span>
      </div>
    </div>
  );
}

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        color: ["#16a34a", "#84cc16", "#fbbf24", "#f97316", "#22c55e"][
          i % 5
        ]!,
        size: 6 + Math.random() * 8,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animation: `ob-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/** Jingle curto estilo “campo” via Web Audio (sem ficheiro). */
function playRuralJingle() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const notes = [196, 247, 294, 330, 392, 330, 294]; // G minor-ish folk climb
    const t0 = ctx.currentTime + 0.05;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, t0 + i * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.14 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + i * 0.14);
      osc.stop(t0 + i * 0.14 + 0.32);
    });
    window.setTimeout(() => void ctx.close(), 2500);
  } catch {
    /* silêncio se o browser bloquear áudio */
  }
}
