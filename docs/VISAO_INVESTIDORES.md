# CoopFinance · Visão do produto e arquitetura

Documento para **investidores e stakeholders**: o que o sistema faz hoje, como está organizado tecnicamente e qual o caminho natural de evolução.

---

## Resumo executivo

**CoopFinance** é um MVP de **inteligência comercial para cooperativas e exportadoras de café**. Centraliza **vendas**, **estoque** e **análises** num painel web responsivo (desktop e telemóvel), com UX pensada para decisão rápida: filtros por período, tendências, projeções simples e controlo de saldo de sacas.

O produto atual demonstra **fluxo completo no browser**: dados persistidos localmente, sem servidor obrigatório — ideal para **validação com utilizadores** e para **pitch** com demo ao vivo. A base técnica (Next.js, TypeScript, estado global tipado) está preparada para ligar a **API**, **autenticação** e **multi-tenant** sem recomeçar do zero.

---

## O que o utilizador vê e faz

### Entrada na aplicação

- **Splash inicial** (~3 s) com identidade **CoopFinance** e mensagem de “inteligência comercial”.
- Redirecionamento automático para o **Painel** (`/dashboard`).

### Navegação

| Área | Rota | Função principal |
|------|------|------------------|
| Painel | `/dashboard` | Visão agregada do negócio: métricas filtráveis, gráficos de preço/volume, comparação com períodos anteriores ou ano anterior, insights de mercado. |
| Análises | `/analises` | Centro de decisão: projeções (ritmo de venda, preço médio, “quando acaba” o estoque em semanas), simulações simples, leitura de padrões do histórico. |
| Vendas | `/vendas` | Tabela com pesquisa, filtros por data, ordenação, paginação; detalhe/edição de cada venda; integração com URL (`?sale=id`). |
| Estoque | `/estoque` | Dashboard de **total / vendido / restante**, **movimentos** (entradas verdes, saídas vermelhas), **entrada manual** de stock (drawer), **histórico gráfico** do saldo ao longo do tempo. |
| Relatórios | `/relatorios` | Placeholder para relatórios exportáveis (evolução natural do produto). |

### Ações transversais

- **Nova venda** (botão no topo): drawer lateral com validação contra **estoque disponível**.
- **Adicionar estoque** (na página Estoque): drawer com data, quantidade e observação opcional.
- **Mobile**: barra de navegação **inferior** com os mesmos destinos; **desktop**: barra lateral com ícones e estado ativo alinhado à identidade visual (verde).

---

## Lógica de negócio relevante

### Vendas

- Cada venda tem: data, quantidade (sacas), preço unitário, total, comprador.
- **Nova venda** gera automaticamente um **movimento de saída** no estoque, ligado ao ID da venda.
- Alterar ou apagar uma venda **mantém o ledger coerente** (reconciliação entre vendas e movimentos).

### Estoque

- **Contrato base** (`stockTotalSacas`, valor por defeito alto — configurável no estado).
- **Entradas manuais** aumentam o volume total disponível.
- **Saídas** incluem todas as vendas (e podem incluir outras saídas no modelo).
- **Saldo restante** = contrato + soma das entradas − soma das saídas (nunca negativo na UI).
- Não é permitido **vender mais do que o disponível** (nem no registo de nova venda nem na edição de uma venda existente).

### Painel e análises

- Métricas derivam das **vendas** e dos **filtros** (período, semana do mês, etc.).
- O **estoque restante** alimenta cartões e projeções nas **Análises** (ex.: semanas até esgotar ao ritmo atual).

---

## Arquitetura técnica (para CTO / advisor)

### Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | **Next.js 15** (App Router) |
| UI | **React 19**, **Tailwind CSS 4** |
| Estado global | **Zustand 5** com middleware **`persist`** |
| Ícones | **Lucide React** |
| Linguagem | **TypeScript** |

### Organização do código (alto nível)

```
src/
├── app/                 # Rotas (pages) — layout raiz + uma pasta por rota
├── components/          # Shell, drawers, modais, splash, animações
├── modules/             # Vistas por domínio (dashboard, vendas, estoque, análises)
├── store/               # Zustand: vendas, estoque, filtros, comparações, drawers
├── data/                # Dados de demonstração (vendas sintéticas determinísticas)
├── lib/                 # Formatação, inteligência temporal sobre vendas
├── types/               # Contratos TypeScript (Sale, StockMovement, StockState, filtros)
└── design-system/       # Componentes reutilizáveis (Card, inputs, botões)
```

### Fluxo de dados

1. **Arranque**: estado inicial inclui vendas **mock** + movimentos de estoque **reconciliados** com essas vendas.
2. **Persistência**: no browser, `sales`, `stockTotalSacas` e `stockMovements` são guardados em **`localStorage`** (chave versionada). No **SSR**, usa-se armazenamento em memória para não quebrar o render no servidor.
3. **Sincronização**: ao carregar a app, **`ensureLedgerSynced`** alinha movimentos com o conjunto atual de vendas (útil após migrações ou dados antigos).
4. **UI**: componentes subscrevem fatias do store (`useSalesStore`, hooks como `useSalesMetrics`, `useStockSnapshot`) e **memoizam** cálculos pesados quando faz sentido.

### Modelo de dados central (tipos)

- **`Sale`**: registo comercial unitário.
- **`StockMovement`**: `entry` | `exit`, quantidade, data, nota opcional; saídas de venda referenciam `relatedSaleId`.
- **`StockState`**: agregados derivados (`total`, `sold`, `remaining`) + lista de movimentos.

### Gráficos e métricas

- Funções puras em `store/sales-metrics.ts` e `modules/dashboard/chart-helpers.ts` transformam vendas filtradas em séries para **SVG** (barras, linhas) — sem biblioteca de charts pesada, bom para bundle e controlo visual.

---

## Estado atual vs. próximos passos (mensagem para investimento)

**Hoje (MVP)**

- Produto **funcional ponta a ponta** na mesma base de código.
- **Sem backend obrigatório**: demo e testes de UX rápidos.
- Dados **locais ao dispositivo** — adequado a protótipo, não a produção multi-utilizador.

**Evolução natural (roadmap técnico)**

1. **API** (REST ou tRPC) + base de dados (PostgreSQL ou similar).
2. **Autenticação** e **organizações** (cooperativa = tenant).
3. **Relatórios** PDF/Excel e envio agendado.
4. **Integrações**: ERP, pesagem, financeiro.
5. **Observabilidade**: logs, métricas, backups.

Este roadmap encaixa no mesmo **modelo mental** já implementado (vendas + ledger de estoque + métricas derivadas).

---

## Como usar este documento num pitch

- **Primeiros 5 minutos**: “Resumo executivo” + tabela “O que o utilizador vê”.
- **Perguntas de produto**: secção “Lógica de negócio”.
- **Due diligence técnica**: secção “Arquitetura técnica” e “Estado atual vs. próximos passos”.

---

*Última atualização: alinhada ao comportamento da aplicação no repositório (rotas, Zustand persist, estoque reconciliado com vendas, navegação desktop/mobile).*
