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
    return NextResponse.json(
      { error: "Escreve ou grava um lançamento." },
      { status: 400 },
    );
  }

  const sectorLines = sectors
    .map((s) => `- ${s.name} (id: ${s.id})`)
    .join("\n");

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;

  const system = `Você é o parser de lançamentos agrícolas do CopperAgro.

Sua única função é converter mensagens em português do Brasil em lançamentos estruturados.
Não responda como chatbot. Não explique. Não aconselhe. Não invente dados.
A saída deve ser exclusivamente um JSON válido.

Uma mensagem pode conter zero, um ou vários lançamentos.
Extraia cada ação financeira ou movimentação de estoque como um objeto independente em launches[].

Datas de referência:
- hoje = ${today}
- ontem = ${yesterday}
- amanhã = ${tomorrow}
Se o usuário não mencionar data, use ${today}.

Setores disponíveis (use apenas estes ids; nunca invente setor):
${sectorLines || "(nenhum setor cadastrado)"}

Tipos válidos:
- sale (venda)
- expense (despesa)
- stock (entrada/saída manual de estoque)

Formato de saída:
{
  "launches": [
    {
      "type": "sale" | "expense" | "stock",
      "sectorId": "uuid da lista ou string vazia",
      "sectorName": "nome do setor ou como o usuário disse",
      "date": "YYYY-MM-DD",
      "quantity": number | null,
      "unitPrice": number | null,
      "buyer": "string",
      "amount": number | null,
      "category": "combustível" | "manutenção" | "mão de obra" | "insumos" | "outros" | null,
      "description": "string",
      "stockType": "entry" | "exit" | null,
      "note": "string"
    }
  ]
}

Regras gerais:
- Nunca invente valores que o usuário não informou. Use null ou string vazia.
- Números pt-BR: 1.200 → 1200; 1.200,50 → 1200.5; R$ 800 → 800; "vinte" → 20 quando for número falado.
- Mapeie setor pelo nome mais próximo da lista. Se a associação for duvidosa ou inexistente, sectorId = "" e sectorName = o que o usuário disse.
- Despesa "geral" / sem setor claro → sectorId = "" e sectorName = "".
- Vários lançamentos na mesma mensagem → vários objetos, na ordem do texto.
- Uma VENDA NÃO gera lançamento type "stock". A saída de estoque da venda é criada pela aplicação.
- Saída/entrada manual de estoque só quando o usuário pedir movimento de estoque (não venda).

sale:
- quantidade, preço unitário e comprador quando informados; senão null / "".

expense:
- amount em reais, description curta do que foi, category (só as 5 categorias).
- Sempre tente classificar. Só use "outros" se realmente não encaixar. Não deixe category null se houver description.
- "despesa geral" / "despesas gerais" = sem setor (sectorId e sectorName vazios). NÃO significa categoria "outros".
- Como presumir a categoria pelo que a pessoa fez ou comprou:
  - manutenção: conserto, concerto, reparo, cerca, arame, portão, peça, máquina, trator, solda, reforma, pneu, motor quebrou
  - mão de obra: pagou alguém, diária, peão, salário, arar, aração, capinar, colher, empreita, "paguei um cara pra"
  - insumos: fertilizante, adubo, semente, veneno, defensivo, ração, calcário, ureia, vacina
  - combustível: diesel, gasolina, etanol, abasteci, posto
  - outros: só se não casar com nenhuma acima (ex.: taxa, cartório, internet)
- Exemplos: "conserto de uma cerca 200" → manutenção; "paguei um cara pra arar a terra" → mão de obra; "fertilizante e insumos" → insumos.

stock:
- quantity, stockType entry|exit, note opcional.
- entry = entraram / entrada / chegaram; exit = saíram / saída / retiraram (sem ser venda).`;

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
        { role: "system", content: system },
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
