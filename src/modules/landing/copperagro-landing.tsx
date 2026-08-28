"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Beef,
  CalendarRange,
  Coffee,
  Layers,
  LineChart,
  Milk,
  Package,
  Tractor,
  TrendingUp,
  Wallet,
  Wheat,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const GREEN = "#16a34a";
const EASE = [0.16, 1, 0.3, 1] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.28 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const JOURNEY_SECTORS = [
  { name: "Café", Icon: Coffee },
  { name: "Milho", Icon: Wheat },
  { name: "Leite", Icon: Milk },
  { name: "Gado", Icon: Beef },
  { name: "Pecuária", Icon: Tractor },
] as const;

const JOURNEY_STEPS = [
  {
    title: "Lance o estoque de sua produção",
    desc: "Dá entrada no que saiu do campo e vê o saldo por setor.",
    Icon: Package,
  },
  {
    title: "Registre suas vendas",
    desc: "Preço, comprador e volume no momento certo.",
    Icon: TrendingUp,
  },
  {
    title: "Mantenha as despesas sob controle",
    desc: "Custos visíveis para a margem não escapar.",
    Icon: Wallet,
  },
] as const;

const FEATURES = [
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
] as const;

function SectorPreviewSection() {
  const rootRef = useRef<HTMLElement>(null);
  const started = useRef(false);
  const reduce = useReducedMotion();
  const [titleOn, setTitleOn] = useState(false);
  const [iconCount, setIconCount] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const timers: number[] = [];
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || started.current) return;
        started.current = true;
        setTitleOn(true);
        if (reduce) {
          setIconCount(JOURNEY_SECTORS.length);
          return;
        }
        JOURNEY_SECTORS.forEach((_, i) => {
          timers.push(
            window.setTimeout(() => setIconCount(i + 1), 480 + i * 280),
          );
        });
      },
      { threshold: 0.22 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      className="border-t border-zinc-100 bg-white py-24 dark:border-zinc-800 dark:bg-zinc-950 md:py-32"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <h2
          className="text-center text-3xl font-semibold tracking-tight text-zinc-900 transition-all duration-700 dark:text-zinc-50 md:text-5xl"
          style={
            reduce
              ? undefined
              : {
                  opacity: titleOn ? 1 : 0,
                  transform: titleOn ? "translateY(0)" : "translateY(16px)",
                }
          }
        >
          Tenha previsibilidade{" "}
          <span className="text-[#16a34a]">por setor</span>
        </h2>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {JOURNEY_SECTORS.map(({ name, Icon }, i) => {
            const on = i < iconCount;
            return (
              <div
                key={name}
                className="flex flex-col items-center gap-2 transition-[opacity,transform] duration-500"
                style={
                  reduce
                    ? undefined
                    : {
                        opacity: on ? 1 : 0,
                        transform: on
                          ? "translateY(0) scale(1)"
                          : "translateY(14px) scale(0.9)",
                      }
                }
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/80 text-[#16a34a] shadow-[0_10px_24px_-16px_rgba(22,163,74,0.55)] dark:border-emerald-900/60 dark:bg-emerald-950/40">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </span>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function JourneyStep({
  title,
  desc,
  Icon,
  index,
}: {
  title: string;
  desc: string;
  Icon: (typeof JOURNEY_STEPS)[number]["Icon"];
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduce = useReducedMotion();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      setOn(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setOn(true);
      },
      { threshold: 0.45, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduce]);

  const left = index % 2 === 0;

  return (
    <li
      ref={ref}
      className={`flex items-center gap-4 ${left ? "flex-row" : "flex-row-reverse"}`}
    >
      <div className={`w-[42%] ${left ? "text-right" : "text-left"}`}>
        <p
          className="text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50 md:text-lg"
          style={{ visibility: on ? "visible" : "hidden" }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 md:text-sm"
          style={{ visibility: on ? "visible" : "hidden" }}
        >
          {desc}
        </p>
      </div>
      <div className="relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-[0_10px_24px_-12px_rgba(22,163,74,0.9)] ring-4 ring-white dark:ring-zinc-950">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <div className="w-[42%]" />
    </li>
  );
}

function JourneyPathSection() {
  return (
    <section className="bg-white pb-24 dark:bg-zinc-950 md:pb-32">
      <div className="relative mx-auto max-w-md px-4 md:px-8">
        <div
          className="pointer-events-none absolute bottom-10 left-1/2 top-6 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-100 via-[#16a34a] to-emerald-200 dark:from-emerald-950 dark:to-emerald-800"
          aria-hidden
        />
        <ol className="relative space-y-16 py-4">
          {JOURNEY_STEPS.map((step, i) => (
            <JourneyStep key={step.title} {...step} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CopperAgroLanding() {
  const reduce = useReducedMotion();
  const FeaturedIcon = FEATURES[0].Icon;

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="fixed inset-x-0 top-0 z-[40] h-16 border-b border-zinc-100/80 bg-white/80 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80 [@media(prefers-reduced-transparency:reduce)]:bg-white dark:[@media(prefers-reduced-transparency:reduce)]:bg-zinc-950">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            Copper<span style={{ color: GREEN }}>Agro</span>
          </Link>
          <nav className="flex items-center gap-3">
            <a
              href="#dashboard-preview"
              className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 sm:inline"
            >
              Demonstração
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#16a34a] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(22,163,74,0.8)] transition-transform hover:bg-green-700 active:scale-[0.98]"
            >
              Testar agora
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative flex min-h-[100dvh] flex-col justify-center pt-16">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
          <div>
            <Reveal>
              <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 dark:text-zinc-50 md:text-5xl lg:text-6xl">
                Você não perde dinheiro por plantar mal.
                <br />
                <span className="text-[#16a34a]">
                  Você perde por não prever.
                </span>
              </h1>
              <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-xl">
                Transforme dados de venda em decisões estratégicas.
              </p>
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#16a34a] px-10 py-4 text-base font-semibold text-white shadow-[0_16px_32px_-16px_rgba(22,163,74,0.7)] transition-transform hover:bg-green-700 active:scale-[0.98]"
                >
                  Testar agora
                </Link>
                <a
                  href="#dashboard-preview"
                  className="text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400"
                >
                  Ver demonstração
                </a>
              </div>
            </Reveal>
          </div>

          <motion.div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: EASE }}
          >
            <Image
              src="/landing/hero-farm.jpg"
              alt="Cafezal brasileiro ao amanhecer, com névoa entre as linhas de plantio"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0c1912] py-24 text-white md:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 45% at 50% -10%, rgba(22,163,74,0.28), transparent)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
              A maioria dos produtores vende no escuro.
            </h2>
          </Reveal>
          <ul className="mt-12 max-w-2xl space-y-5">
            {[
              "Não sabe o melhor momento para vender",
              "Não tem previsibilidade de preço",
              "Não controla estoque com estratégia",
            ].map((line, i) => (
              <Reveal key={line} delay={i * 0.08}>
                <li className="border-l-2 border-[#16a34a] pl-5 text-lg leading-snug text-zinc-200 md:text-xl">
                  {line}
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal className="mt-20 md:mt-28">
            <h2 className="max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
              O CopperAgro transforma dados em decisão.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-10 md:grid-cols-12 md:gap-12">
            <Reveal className="md:col-span-7">
              <article className="h-full rounded-2xl bg-white/[0.06] p-8 ring-1 ring-white/10">
                <FeaturedIcon
                  className="h-7 w-7 text-emerald-400"
                  strokeWidth={1.5}
                />
                <h3 className="mt-6 text-2xl font-semibold">
                  {FEATURES[0].title}
                </h3>
                <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-zinc-400">
                  {FEATURES[0].desc}
                </p>
              </article>
            </Reveal>
            <div className="grid gap-8 md:col-span-5">
              {FEATURES.slice(1).map(({ Icon, title, desc }, i) => (
                <Reveal key={title} delay={0.06 * (i + 1)}>
                  <article>
                    <Icon className="h-6 w-6 text-emerald-400" strokeWidth={1.5} />
                    <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {desc}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal className="mt-20 md:mt-28">
            <p className="max-w-3xl text-2xl font-medium leading-snug md:text-4xl">
              Dados sem decisão são só números.
            </p>
          </Reveal>
        </div>
      </section>

      <SectorPreviewSection />
      <JourneyPathSection />

      <section
        id="dashboard-preview"
        className="scroll-mt-24 border-t border-zinc-100 bg-zinc-50 py-24 dark:border-zinc-800 dark:bg-zinc-900 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Reveal>
            <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl">
              O painel que você sempre quis ter na palma da mão
            </h2>
          </Reveal>
          <div className="relative mx-auto mt-14 aspect-[4/3] max-w-4xl overflow-hidden rounded-2xl bg-zinc-200 shadow-[0_32px_80px_-28px_rgba(15,23,42,0.35)] dark:bg-zinc-800">
            <Image
              src="/landing/preview-tablet.jpg"
              alt="Produtor no cafezal consultando o painel no tablet"
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-28 dark:bg-zinc-950 md:py-36">
        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 md:text-6xl">
              Preveja. Decida. Lucre.
            </h2>
          </Reveal>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/dashboard"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-[#16a34a] px-10 py-4 text-base font-semibold text-white shadow-[0_16px_32px_-16px_rgba(22,163,74,0.7)] transition-transform hover:bg-green-700 active:scale-[0.98]"
            >
              Testar agora
            </Link>
            <a
              href="#dashboard-preview"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full border-2 border-zinc-200 bg-white px-10 py-4 text-base font-semibold text-zinc-800 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
            >
              Ver demonstração
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 bg-white py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <p>© {new Date().getFullYear()} CopperAgro</p>
        <Link
          href="/dashboard"
          className="mt-2 inline-block font-medium text-[#16a34a] hover:underline"
        >
          Acessar a aplicação
        </Link>
      </footer>
    </div>
  );
}
