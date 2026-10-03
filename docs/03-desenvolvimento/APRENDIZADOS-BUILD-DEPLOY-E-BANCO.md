# APRENDIZADOS — build, deploy, banco e ETL

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global (build, deploy, banco de dados, ETL)
> **Última medição:** 2026-10-03
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [PLANO-REDUCAO-BUILD.md](../planos/PLANO-REDUCAO-BUILD.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [FONTES.md](../06-fontes/FONTES.md)
> **Palavras-chave:** build, deploy, guara, docker, contexto, quota, postgres, etl, neon, reserva, ssl, pg_dump, cpf

## Sumário

- [Propósito](#propósito)
- [Build e deploy](#build-e-deploy)
- [Banco de dados, ETL e Postgres](#banco-de-dados-etl-e-postgres)
- [Regra de ouro](#regra-de-ouro)

## Propósito

Consolida o que já custou tempo real em build, deploy e banco, para uma sessão
nova não repetir. Cada item tem uma medição atrás. O detalhe operacional vive
em [OPERACAO.md](../05-operacao/OPERACAO.md); as armadilhas duráveis, na tabela
§6 do [AGENTS.md](/AGENTS.md).

## Build e deploy

- **Guara Cloud é a publicação principal.** Deploy é **manual**
  (`guara deploy --project controle-popular`), ~17 min, e o plano Starter dá
  **250 min/ciclo**. Auto-deploy está desligado: push na `main` só testa
  (`vitest` + `typecheck`). Cadência do dono: no máximo 1 deploy a cada ~5 dias.
- **Plano Starter (cotas medidas em 03/10/2026, docs.guaracloud.com):** RAM por
  container **64 MB request / 256 MB burst** (o Pro dá 512 MB), build **250
  min/mês** (R$0,10/min de excedente), **1 réplica**, logs **3 dias**. O
  **teto de 256 MB é o limitante do RUNTIME**, não do contexto de build: o Next
  standalone tenta ~500 MB e o kernel mata o pod (crash_loop de 03/10/2026).
  Mitigação atual: `NODE_OPTIONS=--max-old-space-size=192` no estágio `runner`
  (heap abaixo do teto, o GC recolhe antes do OOM) + pool `pg` em `max: 3`.
  Folga real, porém, só com o Pro (512 MB).
- **O contexto de build tem teto de 256 MB.** `docs/`, PDFs, dados brutos e
  `node_modules` saem pelo `.dockerignore`; JSON grande vira **amostra
  versionada** (F2 do [PLANO-REDUCAO-BUILD.md](../planos/PLANO-REDUCAO-BUILD.md)).
- **BuildKit 12 Gi:** o cache do Webpack em disco estoura o pod. `config.cache
  = false` no `next.config.ts` (standalone) compila em RAM.
- **Variável de build chega como Docker `ARG`.** Marcar `--build` no Guara
  **e** declarar `ARG`+`ENV` no estágio `builder` do `Dockerfile`; sem isso a
  página pré-renderizada que lê o banco sai **vazia** (HTTP 200 sem dado).
- **`-b` é só build.** Variável de runtime vai **sem** `-b` (ex.:
  `TELEGRAM_BOT_TOKEN` com `-b` deixou o bot mudo).
- **Teto de 60s por página no `next build`.** Página que estoura vira
  `Export encountered an error ... exiting the build`; o Next retenta
  (`staticGenerationRetryCount`). Página **DB-bound consistente** precisa sair
  do build (render sob demanda) ou perder custo.
- **`getCloudflareContext({ async: true })` no SSG** sobe wrangler/workerd e
  quebra no Alpine (musl). Use a variante **sync**.
- **`dynamicParams` só aceita literal** (expressão derruba o build).
- **Query de SSG fora de `comBancoReserva`** derruba o build num timeout.
- **Não buildar junto com outra sessão.** O PC é produção; use worktree
  isolado ([DESENVOLVIMENTO.md](DESENVOLVIMENTO.md)).
- **Diagnosticar build que falha:** `guara build-logs` estoura em **30s** no
  servidor. Use o cliente do CLI com timeout longo, **UUID completo** de
  projeto/serviço e `limit` pequeno (≤40). Procedimento em
  [OPERACAO.md](../05-operacao/OPERACAO.md).

## Banco de dados, ETL e Postgres

- **Três bancos, papéis distintos:** o **Postgres local** em `127.0.0.1:5432`
  é a fonte da verdade dos coletores e do build local; o app em produção usa o
  **Postgres do Guara** (`cp-postgres-597bd0`); a **Neon** é legado em 94%,
  sem uso, aguardando desligamento.
- **Cadeia de reserva por consulta** (`comBancoReserva`): principal Guara →
  Neon → home-pc; a primeira resposta não vazia vence. Timeout defensivo:
  **10s** no principal, **5s** nas reservas. `getDb()` sozinho **não** cobre
  conexão que trava — a reserva é por consulta.
- **Host interno fala TCP sem TLS.** `.svc.cluster.local` sem
  `ehHostInternoSemSsl()` dá `FATAL 08P01` (protocol_violation) e, no build,
  multiplica o timeout por centenas de rotas.
- **Replicação local → Guara:** `pg_dump --data-only` pelo proxy, com
  mapeamento de colunas quando o schema diverge (`*_uf` local → `*_mg`).
- **O Guara não tem pgvector.** O RAG do assistente roda **em memória**.
- **Coletores:** User-Agent honesto, pausa de 1–2 s por host, checkpoint de
  retomada, e duas armadilhas: APIs que devolvem **gzip silencioso** (`0x1f
  0x8b`) e console Windows em **cp1252** (`sys.stdout.reconfigure('utf-8')`).
- **Dado pessoal:** varre-se o **DADO ingerido** (`DIRETORIOS_DADO` de
  `scripts/checar-dado-pessoal-em-dado.py`), em duas etapas — mod-11 sempre, e
  `validate-docbr` quando instalado. O pre-push só roda com
  `git config core.hooksPath .githooks` (ligar uma vez por clone).
- **Fonte oficial, sempre.** Link canônico por registro; sem número ou URL
  inventados. Se a fonte não tem o dado, publica-se a **lacuna**, nunca um
  substituto.

## Regra de ouro

**Remeça antes de decidir.** Todo número neste documento tem uma medição e uma
data. Copiar número antigo é o erro que já se repetiu mais de uma vez neste
repositório.
