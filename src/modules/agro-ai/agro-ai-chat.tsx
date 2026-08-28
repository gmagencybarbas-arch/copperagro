"use client";

import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";
import { useExpenseStore } from "@/store/expense-store";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import { Check, Mic, Pencil, Send, Sprout, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LaunchType = "sale" | "expense" | "stock";

type LaunchDraft = {
  localId: string;
  type: LaunchType;
  sectorId: string;
  sectorName: string;
  date: string;
  quantity: number | null;
  unitPrice: number | null;
  buyer: string;
  amount: number | null;
  category: ExpenseCategory | null;
  description: string;
  stockType: "entry" | "exit" | null;
  note: string;
};

type ChatLine =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "bot"; text: string }
  | { id: string; role: "card"; draft: LaunchDraft };

function uid() {
  return crypto.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatClock(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function cardPrompt(d: LaunchDraft) {
  if (d.type === "sale") {
    const qty = d.quantity ?? "?";
    const price = d.unitPrice != null ? `R$ ${d.unitPrice}` : "valor ?";
    const buyer = d.buyer.trim() || "comprador não dito";
    return `Você pediu para criar venda no setor ${d.sectorName || "?"} de ${qty} unidade(s) no valor ${price} para ${buyer} no dia ${formatDateBR(d.date)}?`;
  }
  if (d.type === "expense") {
    const amount = d.amount != null ? `R$ ${d.amount}` : "valor ?";
    return `Despesa do setor ${d.sectorName || "?"} de ${amount} com a observação ${d.description || d.note || "sem observação"} na data ${formatDateBR(d.date)}`;
  }
  const kind = d.stockType === "exit" ? "saída" : "entrada";
  return `Estoque (${kind}) no setor ${d.sectorName || "?"} de ${d.quantity ?? "?"} unidade(s)${d.note ? ` com a observação ${d.note}` : ""} na data ${formatDateBR(d.date)}`;
}

function normalizeDraft(
  raw: Record<string, unknown>,
  sectors: { id: string; name: string }[],
): LaunchDraft {
  const typeRaw = String(raw.type ?? "sale");
  const type: LaunchType =
    typeRaw === "expense" || typeRaw === "stock" ? typeRaw : "sale";
  const sectorName = String(raw.sectorName ?? "");
  const givenId = String(raw.sectorId ?? "");
  const byId = sectors.find((s) => s.id === givenId);
  const byName = sectors.find(
    (s) => s.name.toLowerCase() === sectorName.trim().toLowerCase(),
  );
  const sector = byId ?? byName;
  const cat = String(raw.category ?? "");
  const category = (EXPENSE_CATEGORIES as readonly string[]).includes(cat)
    ? (cat as ExpenseCategory)
    : "outros";
  const stockType =
    raw.stockType === "exit" || raw.stockType === "entry"
      ? raw.stockType
      : type === "stock"
        ? "entry"
        : null;

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    localId: uid(),
    type,
    sectorId: sector?.id ?? "",
    sectorName: sector?.name ?? sectorName,
    date: String(raw.date ?? todayISO()).slice(0, 10) || todayISO(),
    quantity: num(raw.quantity),
    unitPrice: num(raw.unitPrice),
    buyer: String(raw.buyer ?? ""),
    amount: num(raw.amount),
    category: type === "expense" ? category : null,
    description: String(raw.description ?? ""),
    stockType,
    note: String(raw.note ?? ""),
  };
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

export function AgroAiChat() {
  const sectors = useSectorStore((s) => s.sectors);
  const addSale = useSalesStore((s) => s.addSale);
  const addStockEntry = useSalesStore((s) => s.addStockEntry);
  const addExpense = useExpenseStore((s) => s.addExpense);

  const [input, setInput] = useState("");
  const [lines, setLines] = useState<ChatLine[]>([
    {
      id: "hello",
      role: "bot",
      text: "Diz o que vendeste, o que gastaste ou o que queres lançar no estoque. Podes escrever ou gravar áudio. Confirmo um lançamento de cada vez.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: 28 }, () => 6));
  const [editingId, setEditingId] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const recTimer = useRef<number>(0);
  const discardRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

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
  const updateDraft = (localId: string, patch: Partial<LaunchDraft>) => {
    setLines((prev) =>
      prev.map((l) =>
        l.role === "card" && l.draft.localId === localId
          ? { ...l, draft: { ...l.draft, ...patch } }
          : l,
      ),
    );
  };

  const commitDraft = (d: LaunchDraft) => {
    if (!d.sectorId) {
      push({
        id: uid(),
        role: "bot",
        text: "Escolhe um setor no Editar antes de confirmar.",
      });
      return;
    }
    if (d.type === "sale") {
      if (!d.quantity || !d.unitPrice) {
        push({
          id: uid(),
          role: "bot",
          text: "Venda precisa de quantidade e preço. Usa Editar.",
        });
        return;
      }
      addSale({
        sectorId: d.sectorId,
        date: d.date,
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        buyer: d.buyer.trim() || "Não informado",
      });
    } else if (d.type === "expense") {
      if (!d.amount) {
        push({
          id: uid(),
          role: "bot",
          text: "Despesa precisa do valor. Usa Editar.",
        });
        return;
      }
      addExpense({
        sectorId: d.sectorId,
        date: d.date,
        amount: d.amount,
        description: d.description.trim() || d.note.trim() || "Despesa",
        category: d.category ?? "outros",
      });
    } else {
      if (!d.quantity) {
        push({
          id: uid(),
          role: "bot",
          text: "Estoque precisa de quantidade. Usa Editar.",
        });
        return;
      }
      addStockEntry({
        sectorId: d.sectorId,
        date: d.date,
        quantity: d.quantity,
        type: d.stockType === "exit" ? "exit" : "entry",
        note: d.note.trim() || undefined,
      });
    }
    setLines((prev) =>
      prev.map((l) =>
        l.role === "card" && l.draft.localId === d.localId
          ? {
              id: l.id,
              role: "bot" as const,
              text: `Lançado. ${cardPrompt(d)}`,
            }
          : l,
      ),
    );
    setEditingId(null);
  };

  const dismissDraft = (d: LaunchDraft) => {
    setLines((prev) =>
      prev.map((l) =>
        l.role === "card" && l.draft.localId === d.localId
          ? { id: l.id, role: "bot" as const, text: "Lançamento cancelado." }
          : l,
      ),
    );
    setEditingId(null);
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
        normalizeDraft(l, sectors),
      );
      if (!drafts.length) {
        push({
          id: uid(),
          role: "bot",
          text: "Não encontrei nenhum lançamento nesse texto.",
        });
        return;
      }
      setLines((prev) => [
        ...prev,
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
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
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

  const fieldClass =
    "mt-1 w-full rounded-lg border border-black/5 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-slate-800";

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
            {busy ? "a escrever..." : recording ? "a ouvir..." : "online"}
          </p>
        </div>
      </header>

      <div className="agro-chat-paper flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
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
          const editing = editingId === d.localId;
          return (
            <div key={line.id} className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white p-3 shadow-sm dark:bg-slate-800">
                <p className="text-[15px] leading-snug text-gray-800 dark:text-slate-100">
                  {cardPrompt(d)}
                </p>
                {editing && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-xs text-gray-500">
                      Setor
                      <select
                        className={fieldClass}
                        value={d.sectorId}
                        onChange={(e) => {
                          const s = sectors.find((x) => x.id === e.target.value);
                          updateDraft(d.localId, {
                            sectorId: e.target.value,
                            sectorName: s?.name ?? d.sectorName,
                          });
                        }}
                      >
                        <option value="">Escolher</option>
                        {sectors.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-gray-500">
                      Data
                      <input
                        type="date"
                        className={fieldClass}
                        value={d.date}
                        onChange={(e) =>
                          updateDraft(d.localId, { date: e.target.value })
                        }
                      />
                    </label>
                    {d.type === "sale" && (
                      <>
                        <label className="text-xs text-gray-500">
                          Quantidade
                          <input
                            type="number"
                            className={fieldClass}
                            value={d.quantity ?? ""}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                quantity: Number(e.target.value) || null,
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-gray-500">
                          Preço unitário
                          <input
                            type="number"
                            className={fieldClass}
                            value={d.unitPrice ?? ""}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                unitPrice: Number(e.target.value) || null,
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-gray-500 sm:col-span-2">
                          Comprador
                          <input
                            className={fieldClass}
                            value={d.buyer}
                            onChange={(e) =>
                              updateDraft(d.localId, { buyer: e.target.value })
                            }
                          />
                        </label>
                      </>
                    )}
                    {d.type === "expense" && (
                      <>
                        <label className="text-xs text-gray-500">
                          Valor
                          <input
                            type="number"
                            className={fieldClass}
                            value={d.amount ?? ""}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                amount: Number(e.target.value) || null,
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-gray-500">
                          Categoria
                          <select
                            className={fieldClass}
                            value={d.category ?? "outros"}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                category: e.target.value as ExpenseCategory,
                              })
                            }
                          >
                            {EXPENSE_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-gray-500 sm:col-span-2">
                          Observação
                          <input
                            className={fieldClass}
                            value={d.description}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                description: e.target.value,
                              })
                            }
                          />
                        </label>
                      </>
                    )}
                    {d.type === "stock" && (
                      <>
                        <label className="text-xs text-gray-500">
                          Quantidade
                          <input
                            type="number"
                            className={fieldClass}
                            value={d.quantity ?? ""}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                quantity: Number(e.target.value) || null,
                              })
                            }
                          />
                        </label>
                        <label className="text-xs text-gray-500">
                          Tipo
                          <select
                            className={fieldClass}
                            value={d.stockType ?? "entry"}
                            onChange={(e) =>
                              updateDraft(d.localId, {
                                stockType: e.target.value as "entry" | "exit",
                              })
                            }
                          >
                            <option value="entry">Entrada</option>
                            <option value="exit">Saída</option>
                          </select>
                        </label>
                        <label className="text-xs text-gray-500 sm:col-span-2">
                          Observação
                          <input
                            className={fieldClass}
                            value={d.note}
                            onChange={(e) =>
                              updateDraft(d.localId, { note: e.target.value })
                            }
                          />
                        </label>
                      </>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => commitDraft(d)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#166534] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(editing ? null : d.localId)}
                    className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-slate-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissDraft(d)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-500"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
              placeholder="Mensagem"
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
