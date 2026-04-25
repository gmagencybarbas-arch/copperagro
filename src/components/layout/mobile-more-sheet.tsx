"use client";

import { useAuthStore } from "@/store/auth-store";
import { BookOpen, LineChart, Rocket, Settings, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileMoreSheet({ open, onClose }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  if (!open) return null;

  const closeWithReset = () => {
    setDragY(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[85] md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={closeWithReset}
        aria-label="Fechar menu"
      />
      <section
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-gray-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_40px_-18px_rgba(15,23,42,0.35)] transition-transform duration-200"
        style={{ transform: `translateY(${Math.max(0, dragY)}px)` }}
        onTouchStart={(e) => {
          startY.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(e) => {
          if (startY.current == null) return;
          const y = e.touches[0]?.clientY ?? startY.current;
          const d = y - startY.current;
          setDragY(Math.max(0, d));
        }}
        onTouchEnd={() => {
          if (dragY > 88) closeWithReset();
          else setDragY(0);
          startY.current = null;
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
          <button
            type="button"
            onClick={closeWithReset}
            className="absolute right-3 top-2 rounded-lg p-2 text-gray-500"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => go("/planos")}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-[#166534] to-[#22a763] px-4 py-3 text-left text-white shadow-[0_12px_30px_-18px_rgba(22,101,52,0.85)]"
          >
            <span>
              <span className="block text-sm font-semibold">Fazer upgrade 🚀</span>
              <span className="block text-xs text-emerald-100/90">
                {user ? "Destrave recursos premium do seu plano" : "Ative recursos premium"}
              </span>
            </span>
            <Rocket className="h-4 w-4 shrink-0" />
          </button>

          <Section title="Conta">
            <Item icon={<UserRound className="h-4 w-4" />} label="Conta" onClick={() => go("/conta")} />
            <Item icon={<Settings className="h-4 w-4" />} label="Configurações" onClick={() => go("/configuracoes")} />
          </Section>

          <Section title="Inteligência">
            <Item icon={<LineChart className="h-4 w-4" />} label="Análises" onClick={() => go("/analises")} />
          </Section>

          <Section title="Sistema">
            <Item icon={<BookOpen className="h-4 w-4" />} label="Tutoriais" onClick={() => go("/home")} />
          </Section>
        </div>
      </section>
    </div>
  );

  function go(href: string) {
    closeWithReset();
    router.push(href);
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Item({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        {icon}
      </span>
      {label}
    </button>
  );
}
