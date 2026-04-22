# CoopFinance · café

MVP de **inteligência comercial** para cooperativas e exportadoras de café: painel de vendas, estoque integrado, análises e projeções — **Next.js 15**, **React 19**, **Zustand**, **TypeScript**, **Tailwind CSS 4**.

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) (redireciona para `/dashboard`).

## Documentação para investidores / visão do sistema

Descrição funcional e técnica atualizada do produto, adequada para apresentar a investidores ou advisors:

**[docs/VISAO_INVESTIDORES.md](./docs/VISAO_INVESTIDORES.md)**

Para **montar base de dados + API** (e usar com outra IA ou developer), usa o ficheiro técnico:

**[docs/ESPECIFICACAO_BD_API_IA.md](./docs/ESPECIFICACAO_BD_API_IA.md)**

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |

## Estado do MVP

- Dados de demonstração + persistência **local** no browser (`localStorage`) para vendas e movimentos de estoque.
- Rotas principais: **Painel**, **Análises**, **Vendas**, **Estoque**, **Relatórios** (placeholder).
