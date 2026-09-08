"use client";

import { commitAgroLaunches } from "@/lib/agro-ai/commit";
import { normalizeAgroLaunch } from "@/lib/agro-ai/normalize";
import type { AgroLaunchDraft } from "@/lib/agro-ai/types";
import type { ValidateContext } from "@/lib/agro-ai/validate";
import { AgroLaunchCard } from "@/modules/agro-ai/agro-launch-card";
import { useExpenseStore } from "@/store/expense-store";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import { Check, Mic, Send, Sprout, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatLine =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "card"; draft: AgroLaunchDraft };

function uid() {
  return (
    crypto.randomUUID?.() ??
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
  );
}

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function WaveBars({ levels }: { levels: number[] }) {
  return (
    <div className="flex h-8 flex-1 items-center gap-[3px] px-1" aria-hidden>
      {levels.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-rose-500"
          style={{ height: `${Math.max(4, Math.min(28, h))}px` }}
        />
      ))}
    </div>
  );
}

function summarizeCommit(ok: number, fail: number) {
  if (fail === 0 && ok > 0) {
    return ok === 1
      ? "1 lançamento registrado com sucesso."
      : `${ok} lançamentos registrados com sucesso.`;
  }
  if (ok === 0 && fail > 0) {
    return fail === 1
      ? "1 lançamento precisa de correção."
      : `${fail} lançamentos precisam de correção.`;
  }
  return `${ok} lançamento${ok === 1 ? "" : "s"} registrado${ok === 1 ? "" : "s"}. ${fail} precisa${fail === 1 ? "" : "m"} de correção.`;
}

export function AgroAiChat() {
  const sectors = useSectorStore((s) => s.sectors);
  const addSale = useSalesStore((s) => s.addSale);
  const addStockEntry = useSalesStore((s) => s.addStockEntry);
  const stockTotalSacas = useSalesStore((s) => s.stockTotalSacas);
  const stockMovements = useSalesStore((s) => s.stockMovements);
  const addExpense = useExpenseStore((s) => s.addExpense);

  const [input, setInput] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([
    {
      id: "hello",
      role: "bot",
      text: "Diz o que vendeste, o que gastaste ou o que queres lançar no estoque — podes misturar vários na mesma mensagem. Escreve ou grava áudio. Confira os cards antes de salvar.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: 28 }, () => 6),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const recTimer = useRef<number>(0);
  const discardRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const sectorIds = useMemo(
    () => new Set(sectors.map((s) => s.id)),
    [sectors],
  );

  const validateCtx: ValidateContext = useMemo(
    () => ({
      sectorIds,
      stockTotalSacas,
      stockMovements,
    }),
    [sectorIds, stockTotalSacas, stockMovements],
  );

  const pendingDrafts = useMemo(
    () =>
      lines
        .filter((l): l is Extract<ChatLine, { role: "card" }> => l.role === "card")
        .map((l) => l.draft)
        .filter((d) => d.status === "pending" || d.status === "error"),
    [lines],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy, recording]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      window.clearInterval(recTimer.current);
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => undefined);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const push = (line: ChatLine) => setLines((prev) => [...prev, line]);

  const updateDraft = (localId: string, patch: Partial<AgroLaunchDraft>) => {
    setLines((prev) =>
      prev.map((l) =>
        l.role === "card" && l.draft.localId === localId
          ? { ...l, draft: { ...l.draft, ...patch } }
          : l,
      ),
    );
  };

  const applyCommitResults = (
    targets: AgroLaunchDraft[],
  ): { ok: number; fail: number } => {
    const results = commitAgroLaunches(targets, {
      addSale,
      addExpense,
      addStockEntry,
      getContext: () => ({
        sectorIds,
        stockTotalSacas: useSalesStore.getState().stockTotalSacas,
        stockMovements: useSalesStore.getState().stockMovements,
      }),
    });

    const byId = new Map(results.map((r) => [r.localId, r]));
    const ok = results.filter((r) => r.ok).length;
    const fail = results.filter((r) => !r.ok).length;

    setLines((prev) =>
      prev.map((l) => {
        if (l.role !== "card") return l;
        const r = byId.get(l.draft.localId);
        if (!r) return l;
        if (r.ok) {
          return {
            ...l,
            draft: {
              ...l.draft,
              status: "success",
              error: undefined,
            },
          };
        }
        return {
          ...l,
          draft: {
            ...l.draft,
            status: "error",
            error: r.error,
          },
        };
      }),
    );

    return { ok, fail };
  };

  const confirmOne = (d: AgroLaunchDraft) => {
    if (committing) return;
    setCommitting(true);
    try {
      const { ok, fail } = applyCommitResults([d]);
      push({
        id: uid(),
        role: "bot",
        text: summarizeCommit(ok, fail),
      });
      setEditingId(null);
    } finally {
      setCommitting(false);
    }
  };

  const confirmAllPending = () => {
    if (committing || pendingDrafts.length === 0) return;
    setCommitting(true);
    try {
      const { ok, fail } = applyCommitResults(pendingDrafts);
      push({
        id: uid(),
        role: "bot",
        text: summarizeCommit(ok, fail),
      });
      setEditingId(null);
    } finally {
      setCommitting(false);
    }
  };

  const discardOne = (d: AgroLaunchDraft) => {
    updateDraft(d.localId, { status: "discarded", error: undefined });
    setEditingId(null);
  };

  const discardAllPending = () => {
    const ids = new Set(pendingDrafts.map((d) => d.localId));
    setLines((prev) =>
      prev.map((l) =>
        l.role === "card" && ids.has(l.draft.localId)
          ? {
              ...l,
              draft: { ...l.draft, status: "discarded", error: undefined },
            }
          : l,
      ),
    );
    setEditingId(null);
    push({
      id: uid(),
      role: "bot",
      text:
        pendingDrafts.length === 1
          ? "1 lançamento descartado."
          : `${pendingDrafts.length} lançamentos descartados.`,
    });
  };

  const startFresh = () => {
    setEditingId(null);
    push({
      id: uid(),
      role: "bot",
      text: "Pronto para um novo lançamento. Diz o que aconteceu na fazenda.",
    });
  };

  const parseText = async (text: string) => {
    setBusy(true);
    push({ id: uid(), role: "user", text });
    try {
      const res = await fetch("/api/agro-ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          sectors: sectors.map((s) => ({ id: s.id, name: s.name })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        launches?: Record<string, unknown>[];
      };
      if (!res.ok) {
        push({
          id: uid(),
          role: "bot",
          text: data.error ?? "Não consegui ler isso.",
        });
        return;
      }
      const drafts = (data.launches ?? []).map((l) =>
        normalizeAgroLaunch(l, sectors),
      );
      if (!drafts.length) {
        push({
          id: uid(),
          role: "bot",
          text: "Não encontrei nenhum lançamento nesse texto.",
        });
        return;
      }

      const n = drafts.length;
      setLines((prev) => [
        ...prev,
        {
          id: uid(),
          role: "bot",
          text:
            n === 1
              ? "Encontramos 1 lançamento. Confira antes de salvar."
              : `Encontramos ${n} lançamentos. Confira antes de salvar.`,
        },
        ...drafts.map(
          (draft): ChatLine => ({ id: uid(), role: "card", draft }),
        ),
      ]);
    } catch {
      push({
        id: uid(),
        role: "bot",
        text: "Falha de rede ao falar com a IA.",
      });
    } finally {
      setBusy(false);
    }
  };

  const sendText = () => {
    const t = input.trim();
    if (!t || busy || recording) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "44px";
    void parseText(t);
  };

  const stopWave = () => {
    cancelAnimationFrame(rafRef.current);
    window.clearInterval(recTimer.current);
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    setRecSeconds(0);
    setLevels(Array.from({ length: 28 }, () => 6));
  };

  const startRec = async () => {
    try {
      discardRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunks.current.push(ev.data);
      };
      rec.onstop = async () => {
        const dropped = discardRef.current;
        stopWave();
        if (dropped) return;
        const blob = new Blob(chunks.current, {
          type: rec.mimeType || "audio/webm",
        });
        setBusy(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, "audio.webm");
          const res = await fetch("/api/agro-ai/transcribe", {
            method: "POST",
            body: fd,
          });
          const data = (await res.json()) as { error?: string; text?: string };
          if (!res.ok || !data.text) {
            push({
              id: uid(),
              role: "bot",
              text: data.error ?? "Não deu para ouvir o áudio.",
            });
            return;
          }
          await parseText(data.text);
        } catch {
          push({
            id: uid(),
            role: "bot",
            text: "Falha ao enviar o áudio.",
          });
        } finally {
          setBusy(false);
        }
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
      setRecSeconds(0);
      recTimer.current = window.setInterval(() => {
        setRecSeconds((n) => n + 1);
      }, 1000);

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const slice = Array.from({ length: 28 }, (_, i) => {
          const v = data[i + 2] ?? 0;
          return 5 + (v / 255) * 24;
        });
        setLevels(slice);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      push({
        id: uid(),
        role: "bot",
        text: "O browser bloqueou o microfone.",
      });
    }
  };

  const finishRec = () => {
    discardRef.current = false;
    recorder.current?.stop();
    recorder.current = null;
  };

  const cancelRec = () => {
    discardRef.current = true;
    recorder.current?.stop();
    recorder.current = null;
  };

  const hasAnyCard = lines.some((l) => l.role === "card");

  return (
    <div className="mx-auto flex h-[calc(100dvh-10.5rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-900 md:h-[calc(100dvh-8.5rem)]">
      <header className="flex shrink-0 items-center gap-3 border-b border-black/5 bg-[#f0f2f5] px-4 py-2.5 dark:border-white/10 dark:bg-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#166534] text-white">
          <Sprout className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            AGRO AI
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            {busy
              ? "a escrever..."
              : recording
                ? "a ouvir..."
                : committing
                  ? "a gravar..."
                  : "online"}
          </p>
        </div>
      </header>

      <div className="agro-chat-paper flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {lines.map((line) => {
          if (line.role === "user") {
            return (
              <div key={line.id} className="flex justify-end">
                <p className="max-w-[82%] rounded-2xl rounded-br-sm bg-[#d9fdd3] px-3 py-2 text-[15px] leading-snug text-gray-900 shadow-sm">
                  {line.text}
                </p>
              </div>
            );
          }
          if (line.role === "bot") {
            return (
              <div key={line.id} className="flex justify-start">
                <p className="max-w-[82%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-[15px] leading-snug text-gray-800 shadow-sm dark:bg-slate-800 dark:text-slate-100">
                  {line.text}
                </p>
              </div>
            );
          }
          const d = line.draft;
          return (
            <div key={line.id} className="flex justify-start">
              <AgroLaunchCard
                draft={d}
                sectors={sectors}
                editing={editingId === d.localId}
                validateCtx={validateCtx}
                onToggleEdit={() =>
                  setEditingId(editingId === d.localId ? null : d.localId)
                }
                onChange={(patch) => updateDraft(d.localId, patch)}
                onConfirm={() => confirmOne(d)}
                onDiscard={() => discardOne(d)}
              />
            </div>
          );
        })}

        {hasAnyCard && pendingDrafts.length === 0 && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={startFresh}
              className="min-h-11 rounded-full border border-[#166534]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#166534] shadow-sm dark:bg-slate-800"
            >
              Novo lançamento
            </button>
          </div>
        )}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-2.5 shadow-sm dark:bg-slate-800">
              <span className="agro-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="agro-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400 [animation-delay:120ms]" />
              <span className="agro-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400 [animation-delay:240ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingDrafts.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2 border-t border-black/5 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-slate-900">
          <button
            type="button"
            disabled={committing}
            onClick={confirmAllPending}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Check className="h-4 w-4" />
            Salvar todos ({pendingDrafts.length})
          </button>
          <button
            type="button"
            disabled={committing}
            onClick={discardAllPending}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-black/5 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:bg-white/10 dark:text-slate-100"
          >
            Descartar todos
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (recording) {
            finishRec();
            return;
          }
          sendText();
        }}
        className="flex shrink-0 items-end gap-2 bg-[#f0f2f5] px-3 py-2.5 dark:bg-slate-800"
      >
        {recording ? (
          <>
            <button
              type="button"
              onClick={cancelRec}
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-rose-600"
              aria-label="Descartar áudio"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="mb-0.5 flex min-h-11 flex-1 items-center rounded-full bg-white px-3 py-1.5 dark:bg-slate-900">
              <span className="mr-2 h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-500" />
              <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-rose-600">
                {formatClock(recSeconds)}
              </span>
              <WaveBars levels={levels} />
            </div>
            <button
              type="submit"
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#166534] text-white"
              aria-label="Enviar áudio"
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void startRec()}
              disabled={busy}
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5 disabled:opacity-40 dark:text-slate-300"
              aria-label="Gravar áudio"
            >
              <Mic className="h-5 w-5" />
            </button>
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendText();
                }
              }}
              rows={1}
              placeholder="Ex.: vendi 10 sacas de café a 800 pro João..."
              className="max-h-[168px] min-h-11 flex-1 resize-none overflow-y-auto rounded-[22px] border-0 bg-white px-4 py-2.5 text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-400 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#166534] text-white disabled:bg-[#c5c9cc] disabled:text-white"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
