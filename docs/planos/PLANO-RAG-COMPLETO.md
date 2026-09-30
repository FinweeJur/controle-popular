# Plano do RAG completo do Seu Nonô

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [ROTEIRO-PGVECTOR-CHATBOT.md](ROTEIRO-PGVECTOR-CHATBOT.md), [PLANO-MEMORIA-RESISTENCIAS.md](PLANO-MEMORIA-RESISTENCIAS.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** rag, chatbot, seu nono, embeddings, acervo, bases de dados, guara, cloudflare, llm, pgvector, citacao

## Sumário

- [Propósito](#propósito)
- [Revisão do plano recebido](#revisão-do-plano-recebido)
- [Arquitetura real, medida](#arquitetura-real-medida)
- [O que muda](#o-que-muda)
- [Cobertura das bases de dados](#cobertura-das-bases-de-dados)
- [Fases](#fases)
- [Executado em 30/09/2026](#executado-em-30092026)
- [Riscos e métricas](#riscos-e-métricas)
- [Origem](#origem)

## Propósito

Este documento revisa criticamente um plano recebido para "ativar o RAG com
LLM no Seu Nonô" e o substitui por uma versão ancorada no que o repositório
realmente tem. O objetivo continua o mesmo: o leitor pergunta no site, o
sistema busca trechos com fonte e o LLM responde citando — mas o caminho
técnico estava errado em cinco pontos que mapeamos abaixo, e o alvo real de
cobertura ("todas as bases de dados") exige ampliar o ACERVO, não
reconfigurar banco.

Regra que governa tudo: **o número vem do dado; o modelo só embrulha**
(AGENTS.md §7). Resposta sem fonte no acervo absteve ("não sei, e aqui está o
que existe perto"), nunca inventa.

## Revisão do plano recebido

### O que está bom

- A sequência geral (ligar o degrau 3, verificar o índice, integrar o
  widget, testar, monitorar) é correta em espírito.
- Preocupar-se com citação obrigatória, ressalva de IA, fallback e injeção de
  prompt acerta o que já existe e precisa continuar valendo.
- Medir precisão/alucinação com um conjunto fixo de perguntas é a atitude
  certa; o `top-k` e o tamanho do trecho são parâmetros de ajuste reais.
- Provisionar chaves por secret, nunca no repositório, é obrigatório.

### O que sobra (ruído ou já pronto)

- **"Ajustar chunking por tipo de documento"** — o acervo é texto curado, não
  documento cru; o fatiador (`embeddings/pedacos.ts`, 120 palavras/20 de
  sobreposição) já existe e funciona. Não é o gargalo.
- **"Ativar a verificação de citações / o arquivo `verificacao.ts`"** — já
  existe e roda em produção, com outro nome: `lib/assistente/verificador-citacao.ts`,
  plugado em `rag.ts` (`gerarComVerificacao`), com re-tentativa única.
- **"Reindexar embeddings a cada push via GitHub Action"** — não há índice
  persistente; o índice é em memória do processo. Uma Action de reindexação
  não teria onde gravar e só gastaria cota.
- **Métricas "90% citam fonte / <3 s / zero alucinação"** — em boa parte já
  são garantidas por construção (abstenção + citação obrigatória). O que
  mede qualidade de verdade é a cobertura do acervo e a abstenção correta.

### O que tem que mudar

1. **Alvo de produção errado.** O plano inteiro fala em Cloudflare Workers
   (`wrangler secret put`, `npm run cf:deploy`). O alvo principal é o
   **Guara Cloud** (`www.controlepopular.com.br`, desde 19/09); o Worker é
   fallback técnico, sem custom domain (`ESTADO.md`). Deploy é **manual**
   (`guara deploy`, a cada ~5 dias por cota), e push só testa.
2. **Banco errado, e pgvector não existe.** O plano manda "verificar as
   tabelas `public.embeddings`/`congresso.embeddings` na Neon". A aplicação
   aponta para o **Postgres do Guara** (`cp-postgres-597bd0`); a Neon está em
   94% e sem uso. As duas tabelas `embeddings` (vector 384) existem no schema
   (`lib/db/schema.ts:794` e `:151`) mas **ninguém as lê**: zero queries,
   zero migrations, zero carga. A extensão `vector` **não está disponível no
   Guara**. Além disso, a dimensão do schema (384) não bate com nenhum
   embedding usado (768 `nomic-embed-text` ou 1024 `bge-m3`).
3. **O RAG não usa banco.** `lib/assistente/embeddings/rag.ts` monta o
   acervo **em memória** (`montarAcervo()`) e rankeia híbrido (cosseno 0,6 +
   lexical 0,4). Nada é persistido. O runbook de pgvector
   (`ROTEIRO-PGVECTOR-CHATBOT.md`) fica bloqueado pelo Guara — não é
   pré-requisito para ligar a IA hoje.
4. **Nomes errados.** A rota é `POST /api/chatbot` (`app/api/chatbot/route.ts`,
   `route.ts`, não `.din.ts`). `data/ia-config.json` **não existe** (é
   gitignored; `provedorAtivo` cai em `deepseek` por padrão). As chaves reais:
   `AI_API_KEY_DEEPSEEK`, `AI_API_KEY_MARITACA`, `AI_API_KEY_LING`, com os
   fallbacks `AI_API_KEY` + `AI_BASE_URL`; embeddings por `EMBED_API_KEY` /
   `EMBED_BASE_URL` / `EMBED_MODEL`; Ollama por `OLLAMA_BASE_URL` /
   `OLLAMA_EMBED_MODEL` / `OLLAMA_CHAT_MODEL`.
5. **Ollama não é fallback de produção.** No Guara (teto de 256 MB) o Ollama
   não cabe. O fallback real, sem chave de embedding, é o **índice
   lexical** (Jaccard) — o RAG degrada, não cai (comportamento já
   implementado em `rag.ts`, ramo `indiceOuLexical`).
6. **Faltava o essencial: cobertura.** O acervo cobre ~146 pedaços (respostas
   pré-curadas, sugestões por rota, 35 fichas, 160 posts, 12 designações,
   cavas e memória país/região/UF) e **não** cobria os 9 verbetes municipais
   de memória — nem as bases grandes versionadas (licenças estaduais,
   outorgas, sigmine, congresso, judiciário, internacional, ESG, cavas). Sem
   isso, "RAG completo" é só a configuração de uma chave.

## Arquitetura real, medida

```
SeuNono.tsx (widget global)
  ├─ avaliarEscadaDeterminista()   -> cartão pronto, sem LLM
  └─ POST /api/chatbot
        └─ responderComRag()  (lib/assistente/embeddings/rag.ts)
             ├─ montarAcervo()  (lib/assistente/acervo.ts, puro)
             ├─ vetorizar:  EMBED_API_KEY ? SiliconFlow bge-m3 : Ollama
             ├─ buscarNoAcervo(): cosseno 0,6 + lexical 0,4 (+ boost de rota)
             ├─ abstenção se top-1 < 0,10 (sem chamar o modelo)
             └─ gerarRespostaRag()  (lib/assistente/embeddings/geracao.ts)
                   ├─ provedor remoto ativo -> DeepSeek / Maritaca / Ling
                   └─ Ollama local (fallback final)
             └─ verificarCitacao() + 1 re-tentativa
```

- **Alvos:** Guara Cloud (principal), túnel do `home-pc` (servidor 2),
  Worker Cloudflare (fallback), GitHub Pages (export — a IA não existe lá,
  `route.ts` não vira arquivo estático).
- **Banco:** Postgres do Guara via `DATABASE_URL`. **O RAG não consulta o
  banco.**
- **Dado pessoal:** o acervo entra por módulos TS e JSON curados; a varredura
  `scripts/checar-dado-pessoal-em-dado.py` cobre `apps/web/data/`.

## O que muda

O desenho corrigido é: **ligar o degrau 3 é configuração; tornar o RAG
"completo" é cobertura do acervo.**

1. **Ligar o degrau 3 (runtime, sem repo).** ✅ **Já configurado no Guara**
   (verificado via `guara env list` em 30/09/2026): existem as chaves de
   geração `AI_API_KEY_DEEPSEEK`, `AI_API_KEY_MARITACA`, `AI_API_KEY_LING` e
   `AI_API_KEY` (+ `AI_BASE_URL`/`AI_MODEL` da Maritaca), e a de embeddings
   `EMBED_API_KEY` (busca vetorial remota). Nada de chave no repositório.
2. **Cobertura total das bases.** O acervo passa a incluir:
   - a **camada municipal** da memória (F3);
   - o **catálogo curado de bases** (`data/catalogo-bases-dados.json`), com
     fonte oficial por base;
   - um **inventário medido de todas as bases versionadas**
     (`data/bases-portal.json`, gerado por script), com um pedaço por tema e
     a página real do tema.
3. **Robustez e higiene.** Remover código morto (`INDICE_LEXICAL`), corrigir
   a docstring obsoleta da rota e manter a abstenção honesta.
4. **Verificação.** Testes de invariante do acervo (todo pedaço tem rota e
   fonte; catálogo e inventário presentes) e um conjunto de perguntas de
   fumaça.
5. **Persistência do índice (pgvector/Qdrant): cancelada** (decisão do dono,
   30/09/2026). O catálogo do Guara não tem pgvector; o **Qdrant** bateu o
   teto do plano (`TIER_LIMIT_EXCEEDED`, HTTP 402) e não será perseguido.
   Com 397 pedaços curtos, o índice em memória é o desenho final — remontar
   é barato e não gasta serviço novo.

## Cobertura das bases de dados

O inventário (`data/bases-portal.json`, medido em 30/09/2026) encontrou
**274 arquivos de dados, 233,7 MB**, agrupados em 22 temas com página real:

| Tema | Arquivos | MB | Página |
|---|---:|---:|---|
| Licenças ambientais estaduais/federais | 15 | 89,9 | /ambiental/licencas |
| Empresas, ESG e incentivos culturais | 33 | 73,6 | /empresas |
| Outorgas de água (ANA/IGAM) | 2 | 21,0 | /ambiental/nossos-rios |
| Mineração e cavas | 5 | 12,2 | /mineracao/cavas |
| Municípios, contratos e indicadores | 81 | 9,3 | /cidades |
| Meio ambiente e territórios | 11 | 7,0 | /ambiental |
| Direitos humanos | 4 | 4,3 | /direitos-em-movimento |
| Reparação Doce/Paraopeba | 12 | 3,3 | /paraopeba |
| Judiciário | 16 | 2,1 | /judiciario |
| Gestão e governo | 36 | 1,2 | /governo |
| (demais temas) | — | — | — |

**Medido em 30/09/2026:** o acervo tem **397 pedaços** —
`180` na frente geral, 39 em ambiental, 30 em estado, 25 em terra, 23 no
judiciário, 18 em cidades, 18 em direitos, 16 na central, 15 em
direitos-em-movimento, 14 em paraopeba, 14 no congresso e 5 em função social
da terra. Os pedaços novos desta rodada foram a memória municipal (9), o
catálogo curado (16) e o inventário (23).

**Limite declarado:** a contagem de registros é parcial — arquivos acima de
8 MB não são abertos para contar (o teste e o inventário marcam
`registros_parciais`). A classificação de tema é curada por regras; arquivo
ambíguo cai em "Outras bases" (rota `/busca`), nunca num tema errado
silencioso.

## Fases

| Fase | Entrega | Estado |
|---|---|---|
| **R0 — acervo municipal** | camada município no RAG | ✅ 30/09 |
| **R1 — bases catalogadas** | catálogo curado (`/api/v1/bases`) no RAG | ✅ 30/09 |
| **R2 — inventário medido** | gerador + `bases-portal.json` no RAG | ✅ 30/09 |
| **R3 — ligar degrau 3** | chaves no ambiente do Guara (runtime) | ✅ 30/09 (já configuradas; ver `guara env list`) |
| **R4 — golden set** | perguntas de fumaça + medição de abstenção | ✅ 30/09 (`lib/assistente/golden-set.ts`, 22 casos) |
| **R5 — persistência** | pgvector ou Qdrant para o índice | ⛔ cancelada (decisão 30/09): sem pgvector no Guara e Qdrant fora do plano; índice em memória é o desenho |

## Executado em 30/09/2026

- `lib/assistente/acervo.ts`: `deMemoria()` inclui `CAMADAS_MEMORIA.municipio`;
  novos `deBases()` (catálogo curado) e `deBasesPortal()` (inventário).
- `scripts/inventariar-bases-dados.mts` (novo): varre `apps/web/data` e
  `apps/web/public/data` e emite `data/bases-portal.json`.
- `data/bases-portal.json` (novo): 274 arquivos, 233,7 MB, 22 temas.
- `lib/assistente/embeddings/rag.ts`: removido o `INDICE_LEXICAL` morto.
- `app/api/chatbot/route.ts`: docstring corrigida (Guara, sem pgvector).
- `lib/assistente/acervo.test.ts`: novas invariantes (bases, inventário,
  memória municipal).
- Verificado no Guara: as chaves de geração e de embeddings já estão no
  ambiente (R3 pronto). Falta medir a qualidade (R4).
- **R4 — golden set** em `lib/assistente/golden-set.ts` (22 casos: 18 de
  fonte, 4 de abstenção) + `golden-set.test.ts`, rodando em modo lexical.
  O golden set revelou um defeito real: pergunta fora do escopo **não
  abstinha** ("receita de bolo de cenoura" casava o orçamento do
  Judiciário). Correção: `similaridade.ts` ganhou peso **IDF** e as
  palavras de pergunta entraram nas stopwords; `rag.ts` subiu o piso de
  abstenção do modo só-lexical para 0,45 (o híbrido segue em 0,10).
- **R5 — investigado no CLI do Guara (30/09):** o catálogo `postgres` **não
  oferece variante pgvector**, e a extensão `vector` não aparece em
  `pg_available_extensions` do banco atual (tem `postgis`, `pg_trgm`,
  `unaccent`).
- **Qdrant abandonado (30/09):** o CLI devolveu `TIER_LIMIT_EXCEEDED` (HTTP
  402) — o plano Starter (2 serviços) não comporta o serviço extra. Decisão
  do dono: não perseguir; o índice em memória é o desenho final.
- **Índice medido:** `montarAcervoDetalhado().cobertura.total` = **397
  pedaços** (não ~180), sem nenhuma resposta pulada por falta de rota.
- Verificação: suíte verde, `tsc --noEmit` limpo. Sem build nem deploy.

## Riscos e métricas

| Risco | Mitigação |
|---|---|
| Chave de API exposta | secret de ambiente (Guara), nunca no repo — ⚠️ o `guara env list` imprime os valores em texto: não compartilhar o terminal/log |
| LLM alucinar | prompt rígido + abstenção + verificação de citação |
| Base classificada no tema errado | regra curada; ambíguo cai em "Outras bases" |
| Índice frio/lento | lotes de 48, timeout de 180 s; degrada para lexical |
| Contagem errada | número MEDIDO no inventário, com data e `parcial` declarado |

Métricas de sucesso (a medir no R4): toda resposta cita fonte ou abstém;
abstenção não dispara para pergunta coberta; nenhuma resposta cita página
inexistente.

## Origem

Plano recebido em 30/09/2026 para "ativar o RAG com LLM". Revisão feita no
mesmo dia sobre a medição do código (`lib/assistente/**`, `lib/db/schema.ts`,
`next.config.ts`, workflows de CI) e substituição pelo desenho acima.
