"use client";

import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/types/expense";
import { useExpenseStore } from "@/store/expense-store";
import { useSalesStore } from "@/store/sales-store";
import { useSectorStore } from "@/store/sector-store";
import { Check, Mic, Pencil, Send, Square, X } from "lucide-react";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    void parseText(t);
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data.size) chunks.current.push(ev.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
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
    } catch {
      push({
        id: uid(),
        role: "bot",
        text: "O browser bloqueou o microfone.",
      });
    }
  };

  const stopRec = () => {
    recorder.current?.stop();
    recorder.current = null;
    setRecording(false);
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {lines.map((line) => {
          if (line.role === "user") {
            return (
              <div key={line.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-[#166534] px-4 py-2 text-sm text-white">
                  {line.text}
                </p>
              </div>
            );
          }
          if (line.role === "bot") {
            return (
              <div key={line.id} className="flex justify-start">
                <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 text-sm text-gray-800 dark:bg-slate-800 dark:text-slate-100">
                  {line.text}
                </p>
              </div>
            );
          }
          const d = line.draft;
          const editing = editingId === d.localId;
          return (
            <div
              key={line.id}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-slate-50">
                {cardPrompt(d)}
              </p>
              {editing && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-gray-500">
                    Setor
                    <select
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
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
                  className="inline-flex items-center gap-1 rounded-lg bg-[#166534] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#14532d]"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingId(editing ? null : d.localId)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => dismissDraft(d)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-rose-700"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
          );
        })}
        {busy && (
          <p className="text-xs text-gray-400">A AGRO AI está a ler...</p>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-gray-100 p-3 dark:border-slate-800"
      >
        <button
          type="button"
          onClick={recording ? stopRec : startRec}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            recording
              ? "bg-rose-600 text-white"
              : "border border-gray-200 text-gray-600 dark:border-slate-600 dark:text-slate-300"
          }`}
          aria-label={recording ? "Parar gravação" : "Gravar áudio"}
        >
          {recording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          placeholder="Ex.: vendi 40 sacas de café a 890 para a Cooxupé hoje"
          className="min-h-11 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400 dark:border-slate-600 dark:bg-slate-800"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#166534] text-white disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
