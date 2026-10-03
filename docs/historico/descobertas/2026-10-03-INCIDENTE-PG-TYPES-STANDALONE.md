# 2026-10-03 — INCIDENTE: `pg-types` faltando no standalone, banco primário morto

> **Tipo:** INCIDENTE
> **Domínio:** operação do projeto
> **Última medição:** 2026-10-03
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [OPERACAO](../../05-operacao/OPERACAO.md), [ARQUITETURA](../../04-arquitetura/ARQUITETURA.md), [postmortem 08/09](../../incidentes/2026-09-08-next-start-morto.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** incidente, pg-types, standalone, outputFileTracingIncludes, banco primário, fallback neon, crash_loop, memória, smoke

## Sumário

- [Linha do tempo](#linha-do-tempo)
- [Impacto (medido)](#impacto-medido)
- [Causa](#causa)
- [Por que o site continuou de pé sem dado](#por-que-o-site-continuou-de-pé-sem-dado)
- [Conserto aplicado (Fase 0, 03/10/2026)](#conserto-aplicado)
- [Diagnóstico de memória](#diagnóstico-de-memória)
- [Solução de longo prazo (para não repetir)](#solução-de-longo-prazo-para-não-repetir)
- [Lição de uma linha](#lição-de-uma-linha)

## Linha do tempo

| Quando | O que se mediu |
|---|---|
| 20/09/2026 | O standalone já quebrou uma vez com `Cannot find module 'pg'`; o conserto copiou **só** a pasta `pg` para o build (registro no comentário de [`apps/web/next.config.ts`](../../../apps/web/next.config.ts)) |
| 03/10/2026, dia | Site `controlepopular.com.br` fora por **~5 h**; o serviço do Guara entrou em `crash_loop` e só reposou com `guara services start` |
| 03/10/2026, log do container | `[getDb] primary falhou: Cannot find module 'pg-types'` — a linha que fecha a causa |
| 03/10/2026, 12:08 → 12:24 | Pod reiniciou **3× em 1 h** sob carga (restarts de 1 para 3), memória em torno de **500 MB** |
| 03/10/2026, varredura | Páginas pesadas responderam **29–40 s** durante a varredura |

## Impacto (medido)

- **~5 h** de site indisponível (crash_loop do serviço no Guara).
- **Banco primário morto em toda consulta**: o Postgres do Guara (host interno
  `.cluster.local`) nunca conectou; toda leitura caiu no fallback.
- **Fallback vazio**: os logs `principal (Guara) vazio; tentando reserva` e
  `reserva neon vazia` se repetem — a página respondeu **HTTP 200 sem dado**,
  que é o modo de falha mais caro do portal: sem erro, sem 500, só ausência.
- **3 reinícios do pod em 1 h** sob carga, memória ~500 MB; páginas pesadas
  a 29–40 s enquanto o pod oscilava.

## Causa

Cadeia completa, em ordem:

1. O `pg` é carregado por `createRequire` com **argumento variável** em
   [`apps/web/lib/db/client.ts`](../../../apps/web/lib/db/client.ts). O tracer
   de saída do Next (`@vercel/nft`) não segue esse caminho, então o build
   standalone depende do `outputFileTracingIncludes` para copiar o pacote à mão.
2. A lista copiava **apenas** `node_modules/pg/**`. Mas `pg@8.23.0` não é um
   pacote só: é uma árvore de **13 pacotes** — `pg`, `pg-connection-string`,
   `pg-pool`, `pg-protocol`, `pg-types`, `pgpass`, `pg-int8`, `postgres-array`,
   `postgres-bytea`, `postgres-date`, `postgres-interval`, `split2`, `xtend`
   (fechamento de dependências medido com `node` em 03/10/2026, todos no
   `node_modules` da raiz do monorepo).
3. Em runtime o `pg` importa `pg-types`, que não estava no container →
   `Cannot find module 'pg-types'` → o `try/catch` de `getDb()` engole o erro e
   tenta o fallback → **banco primário morto para sempre**, sem falha visível
   na página.

Ou seja: o conserto de 20/09 tratou o sintoma do pacote raiz e deixou a
árvore de fora. A falha **não aparece no build** — só no container, em
produção, sob consulta real.

## Por que o site continuou de pé sem dado

O desenho do fallback (`lib/db/reserva.ts`) fez exatamente o que foi
programado a fazer: o principal falhou, a reserva (Neon) também veio vazia, e
`comBancoReserva` devolveu o `padrao` — a página renderizou com o estado
"ainda não rodou contra este banco". HTTP 200, HTML válido, sem dado nenhum.
O site parecia saudável enquanto o banco oficial estava morto. É a mesma
lição do incidente registrado em
[PLANO-FALLBACK-BANCO](../../planos/PLANO-FALLBACK-BANCO.md): fallback
silencioso esconde o principal caído.

## Conserto aplicado (Fase 0, 03/10/2026)

Em [`apps/web/next.config.ts`](../../../apps/web/next.config.ts), o bloco
`outputFileTracingIncludes["*"]` passou a copiar **os 13 pacotes da árvore
inteira** do `pg`, e não mais só `pg`. `serverExternalPackages: ["pg"]` foi
mantido; `outputFileTracingExcludes` não foi tocado.

O comentário do bloco foi reescrito com o porquê e a data da medição, para
que a próxima sessão não repita o encolhimento: **tirar uma linha dali faz o
standalone voltar a quebrar do mesmo jeito, e só no container.**

Não é o conserto de longo prazo — é o que tira o site do chão. As quatro
linhas de defesa abaixo é que impedem a repetição.

## Diagnóstico de memória

**Não há vazamento de pool no código.** Lido em 03/10/2026:

- [`lib/db/client.ts`](../../../apps/web/lib/db/client.ts) memoiza o pool do
  principal em `memo` (uma única `new Pool`, no máximo 10 conexões,
  `idleTimeoutMillis` 30 s);
- [`lib/db/reserva.ts`](../../../apps/web/lib/db/reserva.ts) NÃO cria
  conexão por consulta: `conexaoDe(url)` guarda cada conexão num `Map`
  (`conexoes`) e reutiliza — igual ao primary;
- `criarConexao` só é chamada por esses dois pontos (memoizados). Fora deles,
  `new Pool` só existe em scripts de scripts/ETL, que são processos avulsos.

Observação menor, sem correção nesta fase: `comTimeout` em `reserva.ts` não
limpa o `setTimeout` depois da corrida — o timer sobrevive até estourar
(máx. 6 s), sem retenção relevante e sem justificativa de teste para mexer.

Com o vazamento descartado no código, as opções **reais** de redução de
memória ficam fora do repositório e sem número inventado aqui:

- conferir o **limite de memória do serviço no painel do Guara** (ação (c)
  abaixo) — os 500 MB medidos precisam ser lidos contra o teto do plano;
- reduzir trabalho repetido por request (cache de página/agregado) antes de
  qualquer teto maior — medir antes de decidir.

## Solução de longo prazo (para não repetir)

1. 🚧 **Aquecimento pós-deploy + monitoramento de páginas** — script que
   toca as páginas que leem banco logo depois do deploy e monitora
   resposta/conteúdo. *Itens 2 e 3 da fila de outra sessão, em andamento
   naquela sessão.* É o item que teria pegado este incidente: o container
   subiu, respondeu 200 e estava sem dado.
2. 🚧 **Alerta do vigia para página quebrada** — hoje o
   `scripts/vigia-servidor.mts` (ver [postmortem 08/09](../../incidentes/2026-09-08-next-start-morto.md))
   vigia o processo; falta vigiar o **conteúdo**: página 200 sem dado, ou
   com latência acima do normal, tem que virar alerta no Telegram.
3. 🚧 **Conferir o limite de memória no painel do Guara** — comparar os
   500 MB medidos com o teto do serviço; decidir teto ou redução de
   trabalho com a medição na mão.
4. ✅ **Regra: deploy sempre validado com smoke das páginas que tocam
   banco** — depois de `guara deploy`, abrir as páginas que dependem do
   Postgres do Guara e confirmar **dado na tela**, não só HTTP 200. Escreva
   no runbook de [OPERACAO](../../05-operacao/OPERACAO.md) as URLs exatas.

## Lição de uma linha

**HTTP 200 não é saúde: vale o dado na tela, e a árvore de dependências do
runtime tem que inteira no container.**
