# BrainLex Report

App de leitura (somente leitura) dos estudos de apólice de seguro garantia rodados pelo BrainLex Sentinel.

Compartilha o mesmo Supabase do repo principal [`judicial-policy-ai`](https://github.com/bernardesrafael/judicial-policy-ai). Este repo **não contém edge functions nem migrations** — a fonte da verdade continua no repo operador.

## Papéis

- **Operador** (via agente Telegram ou app `judicial-policy-ai`): dispara buscas, seleciona amostra, roda análise profunda, recupera batches com erro.
- **Consumidor** (este app): abre no navegador, vê lista de estudos, drilldown por CNJ, exporta CSV. Não consome crédito das APIs externas.

## O que tem aqui

- Página inicial: lista de estudos (buscas) ordenada por data.
- Dashboard por busca: tabs **Liberáveis**, **Revisar**, **Com Apólice**, **Sem Apólice**, **Pendentes**.
- Detalhe por CNJ: pontuação de criticidade, parecer de cancelabilidade, apólices canônicas (com endossos agrupados), sentenças, timeline de movimentações.
- Histórico: lista completa com filtros.
- Export CSV dos liberáveis.

## O que **não** tem (é por design)

- Formulário de busca por CNPJ (custo — só o operador dispara).
- Botão "Pontuar com IA" / "Analisar agora".
- Batch retry, seleção de modelo Flash/Pro.
- Edge functions / migrations (vivem no repo operador).

## Stack

Vite + React + TypeScript + TanStack Query + Supabase + Tailwind + shadcn-ui.

## Dev

```bash
npm install
npm run dev     # http://localhost:8080
npm run build
```

Precisa de `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` apontando pro projeto Supabase compartilhado.
