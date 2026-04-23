"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Beef,
  CalendarRange,
  Coffee,
  Layers,
  LineChart,
  Milk,
  Sparkles,
  TrendingUp,
  Wheat,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const GREEN = "#16a34a";

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /** Evita primeiro frame “em branco” se o IntersectionObserver atrasar ou falhar no 1º paint. */
    const revealIfOnScreen = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.height <= 0) return;
      const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (overlap > vh * 0.08) setShow(true);
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setShow(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    obs.observe(el);

    revealIfOnScreen();
    const raf = requestAnimationFrame(revealIfOnScreen);
    const t = window.setTimeout(revealIfOnScreen, 80);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      obs.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className} ${
        show
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const center = rect.top + rect.height / 2;
    const dist = (center - vh / 2) / vh;
    setY(dist * -36);
  }, []);

  useEffect(() => {
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, [tick]);

  return { ref, y };
}

function usePreviewFloat() {
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(
        0,
        Math.min(1, 1 - rect.top / (vh + rect.height)),
      );
      setShift(p * 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { ref, shift };
}

export function CopperAgroLanding() {
  const problemParallax = useParallax();
  const previewFloat = usePreviewFloat();

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      {/* Top bar */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-gray-900"
          >
            Copper<span style={{ color: GREEN }}>Agro</span>
          </Link>
          <nav className="flex items-center gap-3">
            <a
              href="#dashboard-preview"
              className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline"
            >
              Demonstração
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-green-700 hover:shadow-xl active:scale-[0.98]"
            >
              Testar agora
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </nav>
        </div>
      </header>

      {/* SECTION 1 — HERO */}
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-16">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/50"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-[420px] w-[420px] rounded-full bg-emerald-400/25 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-1/4 h-[380px] w-[380px] rounded-full bg-green-300/30 blur-[90px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/3 top-20 h-56 w-56 rounded-full bg-white/60 blur-3xl"
          aria-hidden
        />

        <Reveal className="relative z-10 mx-auto max-w-5xl px-4 text-center md:px-8">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700/90">
            Agricultural Intelligence Platform
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-gray-950 md:text-6xl md:leading-[1.05] lg:text-7xl">
            Você não perde dinheiro por plantar mal.
            <br />
            <span className="bg-gradient-to-r from-[#15803d] via-[#16a34a] to-emerald-600 bg-clip-text text-transparent">
              Você perde por não prever.
            </span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-600 md:text-xl">
            Transforme dados de venda em decisões estratégicas.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#16a34a] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-600/25 transition-all hover:bg-green-700 hover:shadow-2xl active:scale-[0.98]"
            >
              Testar agora
            </Link>
            <a
              href="#dashboard-preview"
              className="text-sm font-semibold text-emerald-800 underline-offset-4 transition-colors hover:text-emerald-950 hover:underline"
            >
              Ver demonstração abaixo
            </a>
          </div>
        </Reveal>

        <div
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-emerald-600/50"
          aria-hidden
        >
          <div className="h-10 w-6 rounded-full border-2 border-current" />
        </div>
      </section>

      {/* SECTION 2 — PROBLEM */}
      <section
        ref={problemParallax.ref}
        className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-[#052e16] to-black py-28 md:py-36"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(22,163,74,0.35), transparent)",
          }}
          aria-hidden
        />
        <div
          style={{ transform: `translateY(${problemParallax.y}px)` }}
          className="relative z-10 mx-auto max-w-4xl px-4 md:px-8"
        >
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-white md:text-5xl">
              A maioria dos produtores vende no escuro.
            </h2>
          </Reveal>
          <ul className="mt-16 space-y-6">
            {[
              "Não sabe o melhor momento para vender",
              "Não tem previsibilidade de preço",
              "Não controla estoque com estratégia",
            ].map((line, i) => (
              <Reveal key={line} delay={i * 120}>
                <li className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-sm transition-colors hover:border-emerald-500/30 hover:bg-white/[0.07]">
                  <span
                    className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-[#16a34a]"
                    aria-hidden
                  />
                  <span className="text-lg leading-snug text-gray-200 md:text-xl">
                    {line}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* SECTION 3 — SOLUTION */}
      <section className="relative bg-black py-28 md:py-36">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[min(100%,900px)] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-white md:text-5xl">
              O CopperAgro transforma dados em decisão.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: CalendarRange,
                title: "Análise por semana",
                desc: "Ritmo de vendas com granularidade que importa na safra.",
              },
              {
                Icon: LineChart,
                title: "Comparação entre períodos",
                desc: "Mesmo intervalo, ano anterior ou janela personalizada.",
              },
              {
                Icon: TrendingUp,
                title: "Projeção de lucro",
                desc: "Cenários simples com base no histórico e no estoque.",
              },
              {
                Icon: Layers,
                title: "Controle de estoque inteligente",
                desc: "Entradas, saídas e saldo ligados à operação real.",
              },
            ].map(({ Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group h-full rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
                  <div className="mb-6 inline-flex rounded-2xl bg-emerald-500/15 p-3 text-emerald-400 ring-1 ring-emerald-500/25 transition-transform group-hover:scale-105">
                    <Icon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — MULTI PRODUCT */}
      <section className="border-t border-gray-100 bg-white py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-5xl">
              Uma plataforma.{" "}
              <span className="text-[#16a34a]">Todos os seus produtos.</span>
            </h2>
          </Reveal>
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {[
              { name: "Café", Icon: Coffee },
              { name: "Milho", Icon: Wheat },
              { name: "Leite", Icon: Milk },
              { name: "Gado", Icon: Beef },
              { name: "Artesanais", Icon: Sparkles },
            ].map(({ name, Icon }, i) => (
              <Reveal key={name} delay={i * 60}>
                <div className="flex flex-col items-center rounded-3xl border border-gray-100 bg-gray-50/80 px-4 py-10 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-600/10">
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                    <Icon
                      className="h-10 w-10 text-[#16a34a]"
                      strokeWidth={1.25}
                    />
                  </div>
                  <p className="mt-5 text-sm font-semibold text-gray-900">
                    {name}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — DASHBOARD PREVIEW */}
      <section
        id="dashboard-preview"
        className="scroll-mt-24 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white py-24 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Preview
            </p>
            <h2 className="mt-4 text-center text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
              O painel que você sempre quis ter na palma da mão
            </h2>
          </Reveal>

          <div ref={previewFloat.ref} className="mt-16 flex justify-center">
            <div
              style={{
                transform: `translateY(${-previewFloat.shift}px)`,
              }}
              className="relative w-full max-w-4xl rounded-[28px] border border-gray-200/90 bg-white p-2 shadow-[0_32px_80px_-24px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] transition-transform duration-300 ease-out"
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400/75" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                </div>
                <span className="ml-3 text-[11px] font-medium text-gray-400">
                  CopperAgro · Painel
                </span>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-4">
                {[
                  { label: "Faturamento", val: "R$ 2,4M", hint: "+12%" },
                  { label: "Sacas", val: "18.420", hint: "período" },
                  { label: "Preço médio", val: "R$ 892", hint: "ponderado" },
                  { label: "Estoque", val: "1,2M", hint: "sacas" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-gray-100 bg-gray-50/90 p-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {k.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                      {k.val}
                    </p>
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      {k.hint}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mx-6 mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-6 py-8">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    Volume × Preço
                  </span>
                  <BarChart3 className="h-5 w-5 text-emerald-600/70" />
                </div>
                <div className="flex h-36 items-end justify-between gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#16a34a] to-emerald-400/90 opacity-90 transition-all duration-500 hover:opacity-100"
                        style={{ height: `${h}%` }}
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TRANSITION */}
      <section className="bg-black py-20 md:py-28">
        <Reveal>
          <p className="text-center text-2xl font-medium leading-relaxed text-white md:text-4xl md:leading-snug">
            Dados sem decisão são só números.
          </p>
        </Reveal>
      </section>

      {/* SECTION 7 — FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/50 to-white py-28 md:py-36">
        <div
          className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-400/20 blur-[100px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center md:px-8">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-gray-950 md:text-6xl">
              Preveja. Decida. Lucre.
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/dashboard"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#16a34a] px-10 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-600/25 transition-all hover:bg-green-700 active:scale-[0.98]"
            >
              Testar agora
            </Link>
            <a
              href="#dashboard-preview"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border-2 border-gray-200 bg-white px-10 py-4 text-base font-semibold text-gray-800 transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              Ver demonstração
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white py-10 text-center text-sm text-gray-500">
        <p>
          © {new Date().getFullYear()} CopperAgro · Agricultural Intelligence
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-block font-medium text-[#16a34a] hover:underline"
        >
          Aceder à aplicação
        </Link>
      </footer>
    </div>
  );
}
