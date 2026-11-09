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
| Resumos publicados e verificados | **58** — 3 inconclusivos fora do ar (P6) |
| Bloco renderizado | 58 páginas, logo após o `<h1>` |
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

### P6 — resumos inconclusivos: fora do ar até ter recorte

Três rotas só tinham total agregado e um texto que dizia, três vezes, que nada
se conclui. Resumo assim não ajuda o leitor: fica no disco como pendência e
não entra no índice público. Marcadas com `inconclusivo: true`.

| Rota | O que a página tem | O que falta para publicar |
|---|---|---|
| `/judiciario` | total de 44.812 registros | perfil por tribunal, ano e tipo; ou resumo escrito a partir de `listarTribunais()` |
| `/judiciario/jurisprudencia` | o mesmo total agregado | recorte por tribunal, tema e período, com contagem por decisão |
| `/paraopeba/correlacao` | 1.174 registros, sendo 1.168 em um conjunto | lista ou recorte por ano, tipo e origem que componha os 1.168 |

Correção planejada: montar perfil com os arquivos secundários da própria rota
(como já é feito em `/judiciario/tribunais` e `/judiciario/numeros`) e só
regerar quando houver pelo menos um recorte além do total. Até lá, a página
mostra o dado na tela, sem o bloco de resumo.

## Regra que não muda

Resumo sem verificação não é publicado.
Resumo vencido some da página.
Número só vem da contagem; nunca do modelo.
