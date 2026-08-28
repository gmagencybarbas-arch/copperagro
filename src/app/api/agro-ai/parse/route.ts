import { NextResponse } from "next/server";

type SectorIn = { id: string; name: string };

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "Falta OPENAI_API_KEY no servidor. Coloca a chave no .env.local e reinicia o Next.",
      },
      { status: 501 },
    );
  }

  let body: { text?: string; sectors?: SectorIn[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const sectors = Array.isArray(body.sectors) ? body.sectors : [];
  if (!text) {
    return NextResponse.json({ error: "Escreve ou grava um lançamento." }, { status: 400 });
  }

  const sectorLines = sectors
    .map((s) => `- ${s.name} (id: ${s.id})`)
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `És um extrator de lançamentos agrícolas. O utilizador fala em português do Brasil.
Hoje é ${today}.
Setores disponíveis:
${sectorLines || "(nenhum setor)"}

Devolve JSON com esta forma:
{"launches":[{"type":"sale"|"expense"|"stock","sectorId":"id ou vazio","sectorName":"nome","date":"YYYY-MM-DD","quantity":number|null,"unitPrice":number|null,"buyer":"string","amount":number|null,"category":"combustível"|"manutenção"|"mão de obra"|"insumos"|"outros"|null,"description":"string","stockType":"entry"|"exit"|null,"note":"string"}]}

Regras:
- type sale: venda (quantidade, preço unitário, comprador se existir)
- type expense: despesa (amount em reais, description, category)
- type stock: entrada ou saída de estoque (quantity, stockType)
- Mapeia o setor pelo nome mais próximo da lista. Se não houver match, sectorId vazio e sectorName como o utilizador disse.
- Se a data não for dita, usa hoje.
- Vários lançamentos no mesmo texto: um objeto por lançamento, na ordem.
- Números em pt-BR (1.200,50) converte para number.
- Não inventes valores que o utilizador não disse. Usa null.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(errText);
    return NextResponse.json(
      { error: "A OpenAI não conseguiu ler o lançamento. Tenta de novo." },
      { status: 502 },
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  let parsed: { launches?: unknown };
  try {
    parsed = JSON.parse(raw) as { launches?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Resposta da IA inválida." },
      { status: 502 },
    );
  }

  const launches = Array.isArray(parsed.launches) ? parsed.launches : [];
  return NextResponse.json({ launches });
}
