# Pendências — resumo de realidade por página

> **Tipo:** ESTADO
> **Domínio:** produto
> **Última medição:** 2026-11-08
> **Leitura estimada:** curta (<5 min)
> **Relacionados:** [HANDOFF-ORQUESTRACAO-SUBFRENTES.md](../planos/HANDOFF-ORQUESTRACAO-SUBFRENTES.md), [PLANO-TEMAS-GERAIS-E-TESES.md](../planos/PLANO-TEMAS-GERAIS-E-TESES.md)
> **Palavras-chave:** resumo de realidade, pendência, RAG, verificação, deploy

## Sumário

- [O que está pronto](#o-que-está-pronto)
- [Pendências abertas](#pendências-abertas)
- [Regra que não muda](#regra-que-não-muda)

## O que está pronto

| Item | Estado |
|---|---|
| Inventário das rotas | 348 rotas; 58 com dado próprio |
| Resumos publicados e verificados | **27** |
| Bloco renderizado | 27 páginas, logo após o `<h1>` |
| Índice do componente | `data/resumos-realidade/index.ts` gerado |
| Vigia de resumo vencido | `checar-resumos-vencidos.py` derruba `verificado` |
| Verificador | `verificar_resumo.py` — número, marca e fonte |
| Custo | R$ 0 (S5-free e GLM free) |

## Pendências abertas

### P1 — v2: link externo por afirmação
Hoje a fonte interna é `[medido — dados da página]`.
Falta consultar o RAG por rota e exigir link com página quando a afirmação
vier de documento externo. Depende de: consulta por rota (1 a 2 perguntas),
trechos no dossiê e verificação de link — que já existe.

### P2 — 21 rotas sem resumo por perfil insuficiente
O único dado é total agregado. Opções:
- melhorar o perfil (somar campos de arquivos secundários);
- escrever resumo curto de 2 parágrafos, declarando o limite;
- manter sem resumo e dizer na página que o dado é agregado.

### P3 — rotas sem dado próprio
240 rotas sem JSON de dado. Só entram quando a página passar a ter número.

### P4 — prova de renderização
`tsc` e os testes passam, mas nenhuma página foi aberta em build de produção.
Falta `npm run build` local e conferência visual em 390 px.

### P5 — deploy
Merge na `main`, push e publicação só depois de P4.
O deploy é manual e continua exigindo ordem do dono.

## Regra que não muda

Resumo sem verificação não é publicado.
Resumo vencido some da página.
Número só vem da contagem; nunca do modelo.
