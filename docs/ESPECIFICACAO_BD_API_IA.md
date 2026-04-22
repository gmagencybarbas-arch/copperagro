# Especificação para BD + API (uso com IA)

Este ficheiro complementa **`VISAO_INVESTIDORES.md`**. Serve para colar noutra IA ou para um developer desenhar **PostgreSQL**, **Prisma**, **REST** ou **Route Handlers** Next.js com o mínimo de ambiguidade.

**Repo:** frontend Next.js 15 (App Router), estado em **Zustand** + `localStorage` (`coffee-sales`, versão persist). Objetivo: substituir persistência local por **API + BD** mantendo os mesmos tipos de domínio.

---

## 1. Entidades de domínio (espelho do TypeScript atual)

### `Sale` (`src/types/sale.ts`)

| Campo | Tipo app | Sugestão BD |
|-------|-----------|-------------|
| `id` | `string` (UUID) | `uuid` PK |
| `date` | `string` ISO `YYYY-MM-DD` | `date` |
| `quantity` | `number` inteiro ≥ 1 | `bigint` ou `integer` (sacas) |
| `unitPrice` | `number` | `numeric(14,4)` ou `decimal` |
| `totalPrice` | `number` | `numeric(14,2)` (pode ser coluna gerada `quantity * unit_price`) |
| `buyer` | `string` | `text` |

Segurança futura: todas as linhas devem ter **`organization_id`** (ou `coop_id`) FK → `organizations`.

### `StockMovement`

| Campo | Tipo app | Sugestão BD |
|-------|-----------|-------------|
| `id` | `string` UUID | `uuid` PK |
| `date` | `YYYY-MM-DD` | `date` |
| `type` | `'entry' \| 'exit'` | `enum movement_type` ou `varchar` check |
| `quantity` | inteiro positivo | `bigint`/`integer` |
| `note` | opcional | `text` nullable |
| `relatedSaleId` | opcional | `uuid` FK nullable → `sales(id)` ON DELETE SET NULL |

Regras:

- Saída ligada a venda: `type = exit`, `related_sale_id = sale.id`, `quantity` = sacas da venda (manter consistente ao atualizar/apagar venda).
- Entrada manual: `type = entry`, `related_sale_id` null.

### Contrato base de estoque

Na app está como **`stockTotalSacas`** (escalar no Zustand). Na BD faz sentido:

- **`organization_settings`** (1 linha por org): `stock_total_sacas` numérico, timestamps.

Variáveis só de UI (filtros gráficos) podem ficar só no cliente no MVP — não precisam de tabela até haver “guardar filtros por utilizador”.

---

## 2. Schema relacional sugerido (PostgreSQL)

```sql
-- Esboço — ajustar nomes ao teu ORM

CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization_settings (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  stock_total_sacas bigint NOT NULL CHECK (stock_total_sacas > 0),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sales (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_date        date NOT NULL,
  quantity         bigint NOT NULL CHECK (quantity > 0),
  unit_price       numeric(14, 4) NOT NULL CHECK (unit_price > 0),
  total_price      numeric(14, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  buyer            text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sales_org_date ON sales (organization_id, sale_date DESC);

CREATE TYPE movement_type AS ENUM ('entry', 'exit');

CREATE TABLE stock_movements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  movement_date    date NOT NULL,
  type             movement_type NOT NULL,
  quantity         bigint NOT NULL CHECK (quantity > 0),
  note             text,
  related_sale_id  uuid REFERENCES sales(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, related_sale_id)
);

CREATE INDEX stock_mov_org_date ON stock_movements (organization_id, movement_date DESC);
```

Invariantes (aplicação ou triggers):

- Para cada `sale`, existe exactamente uma linha `stock_movements` com `type = exit`, `related_sale_id = sale.id`.
- Somatório entradas/saídas + `stock_total_sacas` → saldo não negativo antes de gravar nova venda (igual à lógica `computeStockState` na app).

---

## 3. Contrato de API sugerido (REST)

Prefixo exemplo: `/api/v1/org/:orgId` (substituir por JWT com `org` no token).

| Método | Rota | Corpo | Comportamento |
|--------|------|-------|----------------|
| GET | `/sales` | — | Lista vendas da org (ordenar por data desc como a tabela). |
| POST | `/sales` | `{ date, quantity, unitPrice, buyer }` | Cria venda **e** movimento exit; falhar se ultrapassar stock. |
| PATCH | `/sales/:id` | patch parcial | Actualiza venda **e** movimento linked; validar stock. |
| DELETE | `/sales/:id` | — | Remove venda **e** exit associado. |
| GET | `/stock/movements` | — | Lista movimentos (para página Estoque). |
| POST | `/stock/entries` | `{ date, quantity, note? }` | Nova entrada (`entry`). |
| GET | `/settings/stock` | — | `{ stockTotalSacas }`. |
| PATCH | `/settings/stock` | `{ stockTotalSacas }` | Actualizar contrato base se saldo não ficar negativo. |

Respostas devem usar os **mesmos nomes camelCase** que o frontend já espera (`sale.date`, etc.), ou uma camada `map()` no cliente.

---

## 4. Onde ligar no código React (orientação para a IA)

1. **`useSalesStore`**: em vez de `persist` + mock, hidratar com `GET /sales` + `GET /stock/movements` + settings; cada `addSale` / `updateSale` / `deleteSale` / `addStockEntry` → chamada HTTP e depois atualizar estado ou invalidar cache.
2. **`ensureLedgerSynced`**: pode tornar-se `POST /sales/reconcile` no servidor ou manter só no servidor como rotina ao gravar vendas bem formadas.
3. **SSR**: remover dependência crítica de `localStorage` nos dados de negócio (já há memória SSR para evitar crash; dados reais viriam do fetch).

---

## 5. Prompt curto para colar noutra IA

```
Contexto: app Next.js 15 + Zustand. Domínio: cooperativa de café.
Tipos TS: Sale, StockMovement; stockTotalSacas por organização.
Persistência atual: localStorage key coffee-sales.

Tarefa:
1. Gera schema Prisma equivalente ao SQL acima (organizations, organization_settings, sales, stock_movements).
2. Gera Route Handlers Next.js ou Express com REST na secção 3.
3. Inclui validações de stock antes de criar/atualizar venda.
4. Opcional: seed com um organization_id fixo para desenvolvimento.

Referência completa dos campos e regras: ver ficheiros ESPECIFICACAO_BD_API_IA.md e types em src/types/sale.ts no repositório CopperAgro.
```

---

## 6. Checklist antes de produção

- [ ] Auth (sessão JWT ou similar) + `organization_id` em todas as queries.
- [ ] Índices em `(organization_id, sale_date)` e `(organization_id, movement_date)`.
- [ ] Transacções ao criar `sale` + `stock_movement` exit na mesma transação.
- [ ] Migrações versionadas (Prisma migrate, Flyway, etc.).

---

*Actua como contrato técnico mínimo; ajusta tipos monetários e escalas conforme regra fiscal/comercial.*
