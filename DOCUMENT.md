# CopperAgro / Coffee Sales Intelligence — Documentação de arquitetura

Este documento descreve como o projeto está montado para **você ou uma IA** conseguirem evoluir o sistema (por exemplo ligar um **banco de dados**, API externa ou outro monorepo) sem redescobrir a estrutura à mão.

---

## 1. Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router) |
| UI | **React 19**, **Tailwind CSS v4** |
| Estado cliente | **Zustand** + **`persist`** (localStorage) |
| Ícones | **lucide-react** |
| Linguagem | **TypeScript** |

**Importante:** hoje **não há servidor de dados**. Toda a lista de vendas nasce em memória (`mock`) ou no **localStorage** após hidratar o Zustand.

---

## 2. Como rodar o projeto localmente

Na raiz do repositório:

```bash
npm install
npm run dev
```

- Abra no navegador: **`http://localhost:3000`**  
- A página inicial **`/`** redireciona para **`/dashboard`**.

Scripts úteis:

| Script | Função |
|--------|--------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir build (`next start`) |
| `npm run clean` | Remove pasta `.next` |

---

## 3. Mapa de pastas relevante

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── dashboard/page.tsx
│   ├── vendas/page.tsx
│   ├── relatorios/page.tsx
│   ├── layout.tsx          # Shell + provedores + gate splash
│   └── globals.css
├── components/             # UI compartilhada (shell, drawer, splash…)
├── data/
│   └── mock-sales.ts       # Gerador determinístico de vendas de exemplo
├── design-system/          # Card, botões, inputs base
├── lib/                    # Helpers (ex.: time-intelligence, format)
├── modules/
│   ├── dashboard/          # Dashboard, filtros, gráficos de linha/barra
│   └── sales/              # Tabela de vendas
├── store/
│   ├── sales-store.ts      # Estado principal: vendas + filtro + estoque UI
│   ├── sales-metrics.ts    # Funções puras: filtros, KPIs, tendências
│   └── drawer-store.ts     # Drawer “Nova venda” aberto/fechado
└── types/
    └── sale.ts             # Tipos Sale, filtros, Stock, modos de comparação
```

---

## 4. Fluxo de dados (visão atual)

```
mock-sales.ts  →  estado inicial Zustand (sales[])
                         ↓
              persist (localStorage: "coffee-sales")
                         ↓
        UI lê vendas + filtro → sales-metrics.ts / chart-helpers.ts
                         ↓
                  KPIs, gráficos, insights
```

- **`addSale`** no store só altera o array **`sales`** no cliente (e persiste).
- **Não existe** POST para API: qualquer nova venda é **local** até você implementar persistência real.

---

## 5. Contratos de dados (para espelhar no BD)

Definidos em **`src/types/sale.ts`**:

### `Sale`

| Campo | Significado |
|-------|-------------|
| `id` | Identificador único (string) |
| `date` | `YYYY-MM-DD` |
| `quantity` | Sacas |
| `unitPrice` | Preço unitário |
| `totalPrice` | `quantity * unitPrice` |
| `buyer` | Nome do comprador |

### `SalesFilterState`

- **`dimension`**: `"period"` (calendário / presets) ou `"week"` (semana do mês em todos os anos).
- **`periodPreset`**: `7d`, `30d`, `90d`, `year`, `custom`.
- **`monthRef`**, **`weekOfMonth`**, datas custom quando aplicável.

### `Stock` (derivado)

- `total`, `sold`, `remaining` — hoje **`sold`** é a soma de `quantity` de todas as vendas e **`total`** vem de **`stockTotalSacas`** no store (capacidade contratada persistida).

### Modo de comparação nos gráficos

- **`ComparisonSeriesMode`**: `previous_period` | `same_period_last_year`  
  Controlado no **`sales-store`** (`comparisonMode`).

---

## 6. Estado global (`src/store/sales-store.ts`)

| Estado / ação | Descrição |
|---------------|-----------|
| `sales` | Lista completa de `Sale[]` |
| `stockTotalSacas` | Teto de estoque para validar nova venda |
| `filter` | `SalesFilterState` |
| `isComparing`, `comparisonMode` | Modo dos gráficos comparativos |
| `setSalesFilter`, `replaceSalesFilter` | Atualiza filtro |
| `addSale` | Nova venda (bloqueada se ultrapassar estoque) |
| `persist` | Chave **`coffee-sales`** — só persiste `sales` e `stockTotalSacas` |

**Hooks derivados:** `useSalesMetrics`, `useTrendComparison`, `useStockSnapshot` — usam **`useMemo`** sobre `sales`/`filter` para não causar loops com React 18/19.

---

## 7. Motor de métricas (`src/store/sales-metrics.ts`)

Funções **puras** sobre `Sale[]` + filtro:

- Intervalos ativos (`getActiveRange`), período anterior (`getComparisonRange`), mesmo intervalo ano anterior (`getSamePeriodLastYear`).
- Modo **semana do mês**: lista transversal em **todos os anos** (`filterSalesWeekMonthSlotAllYears`).
- KPIs agregados: `computeSalesMetrics`, `computeTrendComparison`.

**Não dependem de React** — podem ser reutilizadas num worker, API ou job se as vendas vierem do BD.

---

## 8. Agregações e gráficos (`src/modules/dashboard/chart-helpers.ts`)

Responsável por transformar **`Sale[]`** em séries para charts:

- **`aggregateSalesByDay`** → média diária e quantidade por dia.
- **`buildPeriodDailyPriceSeries`** → série diária com **carry-forward** de preço (sem buracos).
- **`getComparisonSeries`** → série cinza conforme **`comparisonMode`**.
- **`alignPriceSeriesPair`** → garante dois arrays do **mesmo comprimento** para linhas comparáveis.
- Barras mensais / slot semanal / pares ano a ano conforme o filtro.

Ao ligar BD, desde que você carregue `Sale[]` compatível com o tipo, **esta camada pode permanecer igual**.

---

## 9. Integração futura com banco de dados (guia prático)

### Passo A — Contrato estável

1. Mantenha (ou migre gradualmente) o tipo **`Sale`** como contrato único entre API e frontend.
2. Campos extras do BD (`created_at`, `tenant_id`, etc.) podem ficar apenas no servidor e serem omitidos na resposta “lean” para o cliente.

### Passo B — Onde encaixar persistência

Ordem sugerida:

1. **Camada API** (`app/api/vendas/route.ts` ou Route Handlers por método) OU **Server Actions** que recebem payload e fazem INSERT.
2. **Cliente:** em vez de só `set` no Zustand, **chamar fetch** → em sucesso atualizar `sales` no store (ou substituir por React Query/SWR mais tarde).
3. **`addSale`** no store pode virar **“otimista”**: atualiza UI e reverte se a API falhar.

### Passo C — Carregar dados iniciais

- **`getMockSales()`** deve ser substituído ou condicionado:
  - **Opção 1:** `fetch('/api/vendas')` no `layout` ou página (client/server).
  - **Opção 2:** Server Component que passa `initialSales` como prop para um provider que faz `hydrate` no Zustand uma vez.

### Passo D — Persistência atual (localStorage)

- Reduza ou remova **`partialize`** quando o BD for fonte da verdade, para não sobrescrever dados do servidor com cache velho — ou versione a chave (`coffee-sales-v3`) e migre limpo.

### Passo E — Schema SQL mínimo (exemplo)

Alinhado ao modelo atual:

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  buyer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opcional: estoque como tabela ou config por cooperativa
CREATE TABLE stock_capacity (
  id SERIAL PRIMARY KEY,
  total_sacas BIGINT NOT NULL
);
```

Derive `total_price` na query ou em trigger — ou armazene como coluna gerada.

### Passo F — Outro projeto / monorepo

- Publique um **pacote compartilhado** `@copperagro/types` com `Sale` + filtros **ou** gere tipos com OpenAPI a partir da sua API.
- O web app continua consumindo JSON idêntico ao que o mock produz hoje.

---

## 10. Rotas da aplicação

| Rota | Conteúdo |
|------|----------|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | KPIs, gráficos, insights, últimas vendas |
| `/vendas` | Tabela de vendas |
| `/relatorios` | Placeholder / relatórios |

---

## 11. Outros stores

- **`drawer-store.ts`**: só controla se o drawer “Nova venda” está aberto (UI).

---

## 12. Checklist rápido para “ligar o BD”

- [ ] Definir API + modelo SQL alinhado a `Sale`
- [ ] Substituir carregamento inicial (`getMockSales`) por fetch do servidor
- [ ] Persistir `addSale` via API e reconciliar lista
- [ ] Ajustar/remover `persist` do Zustand ou sincronizar após login
- [ ] (Opcional) paginar vendas na tabela em vez de carregar tudo na memória

---

*Última atualização orientada ao estado do repositório no momento da geração deste documento. Ajuste os caminhos se o projeto for renomeado ou movido.*
