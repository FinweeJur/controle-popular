# Runbook — pgvector do chatbot (Fase 5, pós-Neon)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** runbook, pgvector, neon, chatbot, embeddings, rag, acervo, chunks

## Sumário

- [Propósito](#propósito)
- [Quando roda](#quando-roda)
- [Ordem de execução](#ordem-de-execução)
- [Schema alvo](#schema-alvo)
- [Carga do acervo](#carga-do-acervo)
- [Troca do índice em memória pelo banco](#troca-do-índice-em-memória-pelo-banco)
- [Medições obrigatórias](#medições-obrigatórias)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Levar o acervo do chatbot (hoje montado em código por
`apps/web/lib/assistente/acervo.ts`, com índice vetorial em memória do
processo) para uma tabela de chunks com **pgvector na Neon**, quando o banco
voltar (HTTP 402 até 01/09/2026). Destrava: índice persistente (não depende
do Ollama estar de pé para indexar), escala além dos ~110 pedaços atuais,
consultas híbridas no banco e o degrau 3 servido em produção.

## Quando roda

- **Pré-requisito:** Neon de volta (runbook `ROTEIRO-NEON-01-09.md`).
- **Pré-requisito:** `next build` funcionando no home-pc (é ele quem publica).
- **Alternativa local:** a mesma migration + carga rodam no Postgres local do
  home-pc para desenvolvimento, sem tocar a Neon.

## Ordem de execução

1. Criar a extension e a tabela (abaixo) — migration nova em
   `apps/web/lib/db/` (padrão Drizzle do repo, `schema.ts`).
2. Gerar o manifesto: `cd apps/web && npx tsx scripts/exportar-finetuning.mts`
   (já grava `apps/web/data/assistente-acervo.json`).
3. Carga: script `scripts/carregar-chunks-pgvector.mts` (novo) lê o
   manifesto, vetoriza cada pedaço (Ollama local `nomic-embed-text` no
   home-pc, ou `bge-m3` remoto se decidido) e insere com `INSERT ... ON
   CONFLICT (id) DO UPDATE` (idempotente — re-rodar não duplica).
4. Trocar o índice em memória pelo banco no `rag.ts` (abaixo).
5. Medir e registrar (seção Medições).

## Schema alvo

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS assistente_chunks (
  id         text PRIMARY KEY,          -- id do AcervoFonte (pergunta:..., contexto:..., pagina:...)
  frente     text NOT NULL,
  rota       text NOT NULL,
  titulo     text NOT NULL,
  fonte_url  text NOT NULL,
  texto      text NOT NULL,
  vetor      vector(768) NOT NULL,      -- nomic-embed-text; 1024 se bge-m3 (ver decisão do embedding)
  criado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assistente_chunks_vetor_idx
  ON assistente_chunks USING hnsw (vetor vector_cosine_ops);
```

⚠️ A dimensão do vetor é do MODELO, não do schema: trocar de embedding muda
a dimensão e exige migration (a mesma disciplina de `ollama.ts`, que não
valida "768" em lugar nenhum).

## Carga do acervo

- Fonte da verdade: `montarAcervo()` (código). O JSON do manifesto é
  artefato derivado para a carga — regenerar antes de carregar, nunca editar
  à mão.
- Guarda de dado pessoal: `apps/web/data/` já está em `DIRETORIOS_DADO` de
  `scripts/checar-dado-pessoal-em-dado.py`; rodar a varredura antes do
  commit da carga (o manifesto passa pela guarda no pre-push/CI).
- Idempotência: `ON CONFLICT (id) DO UPDATE` — re-rodar a carga atualiza em
  vez de duplicar.

## Troca do índice em memória pelo banco

Em `apps/web/lib/assistente/embeddings/rag.ts`:

- `indexarAcervo()` hoje monta o acervo e vetoriza em lote em memória
  (funciona sem banco — o caminho de desenvolvimento e de fallback).
- Com a Neon de pé, o caminho de produção consulta a tabela:
  `SELECT id, frente, rota, titulo, fonte_url, texto, 1 - (vetor <=> $1) AS score
   FROM assistente_chunks ORDER BY vetor <=> $1 LIMIT $k` — cosseno direto
  no banco, mais o score lexical (Jaccard) somado em código com o mesmo peso
  (`PESO_COSSENO`/`PESO_LEXICAL` de `rag.ts`).
- Abstenção e verificação de citação não mudam: operam sobre as fontes
  retornadas, venham elas do banco ou da memória.
- Fallback: se a consulta ao banco falhar (banco fora), cai no índice em
  memória — o comportamento atual. Nunca erro 500 por causa do índice.

## Medições obrigatórias

1. **Payload da rota** (`/api/chatbot`): nada muda no cliente; conferir que
   o bundle da página que usa o widget continua dentro do teto (3 MiB gzip).
2. **Latência fim-a-fim** no home-pc, mesmo prompt do acervo: memória vs.
   pgvector (HNSW). Registrar antes/depois.
3. **Embedding de produção**: `nomic-embed-text` local (768 dims, custo
   zero, já em uso) vs. `bge-m3` remoto (1024 dims, SiliconFlow) — decisão do
   dono em aberto (PLANO-SEU-NONO-NOTEBOOKLM.md §10). Medir latência e
   acurácia no golden set de citações antes de trocar.

## Decisões registradas

- **Acervo construído em código, manifesto derivado** — sem JSON como fonte
  da verdade (evita artefato stale); o JSON é gerado por script para carga
  pgvector/auditoria (registrado em `acervo.ts`).
- **Guarda de dado pessoal já cobre `etl/betim/dados`** (desde 22/08) — a
  nota do AGENTS.md está defasada; nada a estender agora.
- **`ris-kernel` × Ollama**: em aberto, a medir no home-pc (latência de
  geração E embedding no mesmo prompt do acervo) — resolve a dúvida do
  `ROTEIRO-EXECUCAO-PENDENCIAS.md` §1; só troca o motor L4 com medição.

## Origem

Fase 5 do [PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md)
(2026-08-31). As Fases 0–4 estão implementadas; este runbook executa a Fase
5 quando a Neon voltar.
