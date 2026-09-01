# Plano — Seu Nonô tela cheia (estilo NotebookLM), com RAG citado e finetuning de apoio

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-31
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PLANO-CHATBOT-IA.md](../historico/planos/PLANO-CHATBOT-IA.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** chatbot, seu nono, notebooklm, rag, citacao, finetuning, ressalva, tela cheia, embeddings, pgvector, dado pessoal

## Sumário

- [Propósito](#propósito)
- [Critérios de sucesso](#critérios-de-sucesso)
- [Estado medido](#estado-medido)
- [Pesquisa — GitHub e Hugging Face](#pesquisa--github-e-hugging-face)
- [Realidade do finetuning](#realidade-do-finetuning)
- [Arquitetura alvo](#arquitetura-alvo)
- [Mudanças por subsistema](#mudanças-por-subsistema)
- [Finetuning local (L4)](#finetuning-local-l4)
- [Ordem de execução](#ordem-de-execução)
- [Casos de borda e modos de falha](#casos-de-borda-e-modos-de-falha)
- [Testes e aceitação](#testes-e-aceitação)
- [Suposições e decisões em aberto](#suposições-e-decisões-em-aberto)
- [Origem](#origem)

## Propósito

Evoluir o **Seu Nonô** de widget flutuante para um assistente **expansível a
tela cheia, no padrão NotebookLM**: conversa com histórico, respostas
fundamentadas **sempre com citação de página/fonte e link**, ressalva de IA
**sempre visível** ("confira a fonte"), e um trilho de **finetuning local
opcional** para o modelo "entender a proposta do portal". O finetuning não
substitui o cérebro de produção (Maritaca/DeepSeek, decisão 2 de 22/08) —
ataca prompt/retrieval na API e um modelo aberto local como fallback L4.

## Critérios de sucesso

1. Botão expandir/recolher no widget; tela cheia como diálogo acessível
   (`role="dialog"` + `aria-modal`, foco preso, Esc fecha,
   `prefers-reduced-motion`, 3 temas e escalas de texto do portal).
2. Toda resposta IA mostra: bloco de ressalva (modelo + data) + citações
   inline `[n]` clicáveis que abrem/copiam a página da fonte + painel de
   fontes com trecho.
3. Verificador determinístico pós-geração: todo `[n]` mapeia para fonte do
   contexto; todo número da resposta aparece no trecho citado; fora do
   limiar, abstenção honesta ("não encontrei no acervo" + link `/busca`).
4. Acervo real cobre as 6 frentes (não só as 4 normas de demonstração), com
   rota/URL em cada chunk e varredura de dado pessoal antes da ingestão.
5. Finetuning local só promove se passar o portão (benchmark F4 + golden set
   de citações) — precedente: 8B local reprovado para produção em 22/08.
6. `npm test`, `npx tsc --noEmit`, `python scripts/validar-documentacao.py`
   verdes; bundle da rota dentro do teto; nenhuma dependência nova no cliente.

## Estado medido

- **Widget** `apps/web/app/components/SeuNono.tsx`: escada determinística
  (frentes → categorias → perguntas → resposta pré-curada → busca → IA),
  máx. `24rem` × `60vh`. Dados em `SeuNonoData.ts` (FRENTES, pares
  pergunta→resposta com link) e sugestões contextuais em
  `apps/web/lib/seo/contexto-pagina.ts`.
- **Lab RAG** `/api/chatbot` (`apps/web/app/api/chatbot/route.ts`): `rag.ts`
  → `demonstracao.ts` (corpus = ementas com "barragem de Fund" de
  `etl/betim/dados/legislacao-mma.json`) → `ollama.ts` (`nomic-embed-text`,
  768 dims) → `similaridade.ts` → `geracao.ts` (API DeepSeek/Maritaca se
  chave, senão Ollama `qwen2.5:7b`). `FonteRag` hoje é só
  `{indice, texto, score}` — **sem URL/título**; a UI do lab (`ChatbotIa.tsx`)
  mostra texto puro.
- **Assistente de produção** já existe: `lib/chat-comum.ts`
  (`REGRAS_COMUNS` anti-alucinação, rate limit por IP, degradação honesta sem
  chave) + `route.din.ts` por zona (município, congresso, judiciário).
- **Decisões do dono (22/08)**: cérebro = Maritaca (Sabiá) com DeepSeek como
  alternativa; acervo = tudo que o determinístico não cobre; ressalva de IA
  sempre visível com citação.
- **Infra**: site servido por `next start` no home-pc + Cloudflare Tunnel
  (26/08); Neon em HTTP 402 até 01/09 (pgvector fica para depois); build só
  no home-pc; guarda de dado pessoal **não cobre** `etl/betim/dados/` (chip
  `task_dae5f906`).
- **Inconsistência medida**: o widget liga a IA por `NEXT_PUBLIC_AI_API_KEY`,
  mas o backend usa `AI_API_KEY_DEEPSEEK`/`AI_API_KEY_MARITACA`
  (`provedores.ts`) — o botão "Perguntar à IA" fica desligado mesmo com chave
  do backend configurada.
- **Precedente de qualidade**: `docs/dominios/congresso/F4-modelos.md`
  reprovou o 8B local (recall reducionista 3/10) e define o portão de
  aprovação de modelo (`python -m etl.benchmark`; recall reducionista ≥ 80%,
  técnico ≥ 90%, zero citação inventada).

## Pesquisa — GitHub e Hugging Face

### UIs estilo NotebookLM (padrões de interação, não código)

- [OpenNotebookLM (tom1030507)](https://github.com/tom1030507/OpenNotebookLM) —
  self-hosted; importa PDFs/páginas/transcrições, respostas com citação de
  volta à fonte, retrieval híbrido denso + BM25 sobre SQLite local, qualquer
  provedor OpenAI-compatível ou modelo local. Fonte do padrão "conversa +
  citações clicáveis".
- [nano-NotebookLM (ArthurYangX)](https://github.com/ArthurYangX/nano-NotebookLM)
  e [CosmiQ (ahmedsaed)](https://github.com/ahmedsaed/CosmiQ) — NotebookLM
  open-source leves; split view conversa/fontes.
- [obsidian-knowledge-ai (david46liu)](https://github.com/david46liu/obsidian-knowledge-ai) —
  RAG chat com citações, retrieval híbrido (BM25 + vetor + resumo), indexação
  multi-formato; bom para o desenho do painel de fontes.

### RAG com citação forçada e abstenção (o coração de "referências corretas")

- [grounded-rag (Bennittah)](https://github.com/Bennittah/grounded-rag) —
  "recusa responder quando deve": BM25 + rerank por LLM, citações forçadas,
  eval de retrieval/fidelidade/abstenção. Alinhado ao "não sei" honesto do
  portal.
- [rag-doc-qa (kgtceo)](https://github.com/kgtceo/rag-doc-qa) — RAG citado
  que abstém fora do escopo; eval com checagem de validade de citação, juiz
  de fidelidade LLM, comparação chunk-size/k. Modelo para o harness de
  avaliação.
- [litrag (nickjlamb)](https://github.com/nickjlamb/litrag) — eval de
  fidelidade de citação que sinaliza alegações não suportadas; padrão para o
  verificador pós-geração.

### Avaliação

- [RAGAS (firekeepers/ragas)](https://github.com/firekeepers/ragas) —
  faithfulness, answer relevancy, context precision/recall; para o harness do
  novo pipeline.
- [mteb-br (tardellirs)](https://github.com/tardellirs/mteb-br) e
  [brazembed-pt-br](https://github.com/tardellirs/brazembed-pt-br) — benchmark
  MTEB para pt-BR e embeddings pt-BR (~110M, BERTimbau; #1 da classe ~100M no
  MTEB(por)); base para escolher embedding com medição local.
- Citações inline fiéis: benchmark ALCE e
  [CAGE (arXiv 2607.24236)](https://arxiv-org.ezproxy.obspm.fr/html/2607.24236v2#1) —
  geração de citação inline atribuída.

### Modelos PT-BR candidatos a finetuning local (L4)

- [Bode (recogna-nlp/bode-7b-alpaca-pt-br)](https://huggingface.co/recogna-nlp/bode-7b-alpaca-pt-br)
  (também 13b e GGUF) — Llama-2 ajustado para tarefas em pt-br.
- [Gervásio 7B (PORTULAN)](https://huggingface.co/PORTULAN/gervasio-7b-portuguese-ptbr-decoder).
- [Sabiá-2 7B GGUF (QuantFactory)](https://huggingface.co/QuantFactory/sabia-7b-GGUF) —
  pesos abertos da família Maritaca; versão pequena para o home-pc.
- [Tucano (Nkluge-correa)](https://github.com/nkluge-correa/tucano) e
  [LLM-Tucano (RafaelGallo)](https://github.com/RafaelGallo/LLM-Tucano) —
  pré-treinados nativamente em português.
- Frameworks: QLoRA via unsloth/axolotl/peft+trl
  ([fine-tuning LoRA/QLoRA](https://effloow.com/articles/llm-fine-tuning-lora-qlora-guide-2026),
  [unsloth vs axolotl](https://www.ertas.ai/blog/ertas-vs-unsloth-vs-axolotl-2026)).

### Embeddings

- `nomic-embed-text` (já em uso, 768 dims, local/custo zero); `BAAI/bge-m3`
  (multilíngue, 1024 dims — a alternativa remota citada no PLANO-CHATBOT-IA
  via SiliconFlow); `intfloat/multilingual-e5-large`; `brazembed-pt-br`
  (específico pt-BR, validar no MTEB-BR).

### Infraestrutura

- Cloudflare Workers AI + Vectorize (embeddings + índice vetorial na borda) —
  [handbook freecodecamp](https://www.freecodecamp.org/news/build-a-production-rag-system-with-cloudflare-workers-handbook/);
  aplicável quando o Worker voltar a ser o alvo.
- [Neon pgvector](https://neon.com/guides/vector-search) (HNSW) — o banco do
  portal quando voltar (01/09); schema Drizzle já vive em `lib/db`.

## Realidade do finetuning

Medido em 22/08 (e reafirmado): **nem Maritaca nem DeepSeek publicam endpoint
de embeddings**; por extensão, **não há finetuning via API** para o cérebro
escolhido. O finetuning se divide em três, por ordem de custo:

1. **"Finetuning" sem pesos** (faz a diferença real na API): prompt-sistema
   "constituição do portal" (regras editoriais de PRODUTO.md/AGENTS.md +
   obrigação de marcadores `[n]` e link de fonte) + few-shot + tuning de
   retrieval (chunking, híbrido BM25⊕vetor, rerank) + verificador
   determinístico de citação. **É o maior ganho de "referências corretas".**
2. **Finetuning local (L4, opcional)**: QLoRA em modelo aberto pt-BR sobre
   dataset de instrução derivado do próprio portal. Só promove com o portão
   de validação (F4 + golden set).
3. **Avaliação contínua**: harness com RAGAS/golden set para medir citação
   antes de cada mudança de prompt/retrieval.

## Arquitetura alvo

### Degraus mantidos (decisão já tomada)

0 navegação → 1 busca no índice → 2 composição determinística respondem **sem
modelo**; o degrau 3 (RAG + LLM) entra só onde os anteriores devolvem vazio,
e a tela diz isso. Na tela cheia, os dois convivem: chips de atalho (degraus
0–2) + caixa de pergunta livre (degrau 3).

### Acervo real com URL de fonte (novo)

`apps/web/lib/assistente/acervo.ts` + manifesto versionado
`apps/web/data/assistente-acervo.json`:

- Fontes: páginas das 6 frentes (texto editorial + resumos), pares de
  `SeuNonoData.ts`, sugestões de `contexto-pagina.ts`, agregados da API
  pública `/api/v1/` e de `/api/dados-resumidos`, e os dados por rota
  (contratos/despesas/licitações, via JSON compactado já existente).
- Cada chunk carrega `{frente, rota, titulo, fonteUrl, texto}` — **chunk sem
  rota é excluído do acervo** (regra "ou o número não vai").
- Ingestão: ler → fatiar com `pedacos.ts` → vetorizar (`ollama.ts` local;
  alternativa remota `bge-m3`) → gravar índice. Produção pós-01/09: tabela
  de chunks com pgvector em `lib/db/schema.ts` + queries; até lá: JSON local
  versionado (mesmo padrão dos 853 municípios compactados).
- **Guarda antes de ingerir**: estender `DIRETORIOS_DADO` de
  `scripts/checar-dado-pessoal-em-dado.py` para cobrir `etl/betim/dados` e
  `assistente-acervo.json`; `sem-cpf-no-repo.test.ts` continua no pre-push/CI.

### Recuperação híbrida + verificação de citação (novo)

- BM25 (reusar índice de `scripts/gerar-indice-busca.mts`) ⊕ cosseno
  (`similaridade.ts`), fusão por RRF; rerank opcional por LLM do próprio
  provedor quando disponível (padrão grounded-rag), sem dependência nova.
- Abstenção: top-1 abaixo do limiar → "Não encontrei no acervo" + link
  `/busca`.
- Verificador pós-geração `apps/web/lib/assistente/verificador-citacao.ts`:
  (a) todo `[n]` da resposta tem fonte no contexto; (b) todo número da
  resposta aparece no trecho citado; (c) falhou → re-tenta com prompt mais
  estrito ou devolve com aviso. Reusa a disciplina de `rastrear()` do ETL do
  congresso (comparar grafias; falso alarme em métrica de alucinação é pior
  que não ter métrica).

### Contrato da resposta (v2)

`RespostaRag` v2: `{ resposta, modelo, data, ressalva: true, verificacao:
"ok" | "falhou", fontes: [{ indice, titulo, url, rota, trecho, score }] }`.
`FonteRag` ganha `titulo/url/rota` (hoje só texto). A UI renderiza `[n]`
inline clicáveis (abrir página / copiar link) e o painel de fontes.

### Ressalva de IA sempre visível

Componente novo `apps/web/app/components/RessalvaIa.tsx`: "Resposta gerada por
IA em {data} com o modelo {modelo}. Confira a fonte antes de decidir." + link
"Entenda como o Seu Nonô funciona" (explica degraus determinísticos vs IA).
Usado no widget e na tela cheia (decisão 4 de 22/08; regra editorial "resumo
gerado por modelo é o portal afirmando algo").

### Tela cheia estilo NotebookLM

- Estado `telaCheia` em `SeuNono.tsx`; botão Expandir/Recolher (ícones lucide);
  overlay `fixed inset-0 z-[60]` com `role="dialog" aria-modal="true"`, foco
  preso, Esc fecha, `prefers-reduced-motion` (existe exemplo de
  `role="dialog"` no globo, `public/terras/globo/js/ui/intro.js`).
- Desktop: esquerda = conversa com histórico de turnos (pergunta → resposta
  com chips `[n]`); direita = painel "Fontes desta resposta" (cards
  expansíveis: trecho, score, Abrir/Copiar) — padrão NotebookLM. Mobile:
  painel de fontes em aba/accordion.
- Histórico na sessão (localStorage opcional, sem dado pessoal); "Nova
  conversa"; sugestões de acompanhamento ("Perguntar em seguida") a partir de
  `contexto-pagina.ts` + top chunks; "Resposta errada?" → issue do GitHub
  (padrão já usado no widget).
- Sem biblioteca nova: `whitespace-pre-wrap` + chips de citação + links (nada
  de react-markdown).

### Números vêm do dado (nunca do modelo)

Para perguntas de dados ("quanto Betim gastou em 2025"), o pipeline injeta no
prompt os agregados determinísticos de `/api/dados-resumidos` (total, valor,
top) com a rota como fonte — o número vem da consulta real, o modelo só
embrulha (regra editorial).

## Mudanças por subsistema

| Arquivo | Mudança |
|---|---|
| `apps/web/app/components/SeuNono.tsx` | estado `telaCheia`, dialog full-screen, painel de fontes, histórico, chips `[n]`, ressalva; corrigir o gate de IA (usar detecção do backend — `NEXT_PUBLIC_AI_API_KEY` ≠ `AI_API_KEY_DEEPSEEK/MARITACA`) |
| `apps/web/lib/assistente/acervo.ts` (novo) | manifesto, ingestão, fatiamento, indexação |
| `apps/web/lib/assistente/verificador-citacao.ts` (novo) | verificação `[n]`↔fontes e números↔trecho |
| `apps/web/lib/assistente/embeddings/geracao.ts` | prompt "constituição do portal", marcadores `[n]`, `RespostaRag` v2 |
| `apps/web/lib/assistente/embeddings/rag.ts` | acervo real + híbrido + abstenção + verificação |
| `apps/web/lib/assistente/embeddings/demonstracao.ts` | vira fixture/teste (não é mais o acervo padrão) |
| `apps/web/app/api/chatbot/route.ts` | contrato v2 + acervo real + fallback determinístico |
| `apps/web/lib/chat-comum.ts` | `REGRAS_COMUNS` ganham citação `[n]` e ressalva; reusar `permitido()` no novo pipeline |
| `apps/web/app/components/RessalvaIa.tsx` (novo) | bloco de ressalva padrão |
| `apps/web/lib/db/schema.ts` + queries | tabela de chunks pgvector (pós-01/09) |
| `apps/web/data/assistente-acervo.json` (novo) | índice versionado |
| `scripts/gerar-indice-busca.mts` | alimenta BM25 do híbrido |
| `scripts/checar-dado-pessoal-em-dado.py` | `DIRETORIOS_DADO` ganha `etl/betim/dados` + manifesto |
| `scripts/exportar-finetuning.mts` (novo) | dataset instrução a partir de `SeuNonoData.ts`/`contexto-pagina.ts` |
| docs (este arquivo, `PLANO-CHATBOT-IA.md`, `ESTADO.md`) | registro do plano e do estado |

## Finetuning local (L4)

- **Dataset**: converter `FRENTES` (`SeuNonoData.ts`) + `CONTEXTOS`
  (`contexto-pagina.ts`) + QA coletadas do uso em tela cheia (opt-in, sem
  dado pessoal) para formato Alpaca: `{instrução: pergunta, resposta: resposta
  + "\nFonte: <url>"}` → `etl/finetuning/dados-seu-nono.jsonl`.
- **Receita**: QLoRA (unsloth ou peft+trl) sobre base pt-BR escolhida por
  medição no home-pc (Bode 7B / Gervásio 7B / Sabiá-2 7B / Tucano-2.4B), 1–2
  épocas, temperatura 0.2, prompt idêntico ao de produção. Treino fora do
  repositório (nunca commitar pesos).
- **Portão (não negociável)**: `python -m etl.benchmark` com recall
  reducionista ≥ 80%, técnico ≥ 90%, zero citação inventada; novo golden set
  de 20 perguntas do portal com URLs esperadas (proporção de respostas com
  link correto e sem número fora do trecho). Só promove para fallback L4 se
  passar — precedente F4.
- **Papel em produção**: nunca o cérebro (decisão 2); pré-filtro barato e
  fallback offline quando as APIs caem.

## Ordem de execução

- **Fase 0 — Acervo real + guarda**: manifesto, ingestão das 6 frentes,
  estender `DIRETORIOS_DADO`, testes. Não depende de Neon.
- **Fase 1 — Contrato v2 + verificação + abstenção**: upgrade `/api/chatbot`,
  híbrido, verificador, testes.
- **Fase 2 — Ressalva + correção do gate de IA**: `RessalvaIa.tsx`, chips
  `[n]` no widget.
- **Fase 3 — Tela cheia**: dialog, painel de fontes, histórico,
  acompanhamento, a11y.
- **Fase 4 — Finetuning L4** (paralelizável em worktree próprio): dataset,
  receita, benchmark.
- **Fase 5 — Produção (pós-01/09)**: pgvector na Neon, embeddings remotos,
  docs.

Regras do repo valem: worktree próprio, commit por pathspec explícito com
`-F`, sem `--force`, dado pessoal varrido antes de commitar.

## Casos de borda e modos de falha

- Neon 402: acervo em JSON local; o código não exige banco (padrão "Nenhuma
  licença coletada ainda").
- Ollama fora: erro honesto + degraus 0–2 (comportamento já existente).
- Chunk sem rota: excluído do acervo.
- Número na resposta fora do trecho citado: verificador marca falha →
  re-tentativa ou "não consegui verificar".
- Resposta longa: limite de tokens com aviso de truncamento.
- Abuso/rate limit: reusar `permitido()` de `chat-comum.ts`.
- Dado pessoal: guarda antes da ingestão; feedback não coleta dado pessoal.
- a11y: foco preso, Esc, 3 temas, escalas de texto, reduced motion.

## Testes e aceitação

- Vitest: `acervo.ts` (todo chunk com rota, manifesto completo),
  `verificador-citacao.ts` (marcadores, números, falsos alarmes), híbrido
  (top-k, abstenção), `geracao.ts` v2 (contrato), `RessalvaIa` (renderiza),
  tela cheia (estado, Esc, foco).
- Golden set de citações (20 perguntas × URLs esperadas).
- `npm test` + `npx tsc --noEmit` + `python scripts/validar-documentacao.py`;
  build no home-pc e medição de payload (teto 3 MiB gzip).

## Suposições e decisões em aberto

**Suposições:** cérebro continua Maritaca/DeepSeek (decisão 2); produção
segue home-pc + Tunnel (decisão 26/08), com limites do Worker respeitados
como fallback; acervo = páginas + dados + docs públicos, tudo passando pela
guarda; nenhuma dependência nova no cliente; "NotebookLM" aqui = conversa
fundamentada com citações inline + painel de fontes + histórico (sem
áudio/PDFs nesta fase; biblioteca de documentos fica como evolução).

**Decisões em aberto (responder antes/durante a Fase 4–5):** (1) embedding de
produção — `nomic-embed-text` local (custo zero) vs. `bge-m3` remoto
(SiliconFlow), medir antes; (2) escopo do acervo inicial — 6 frentes + 6
cidades, ou incluir `docs/` e dados crus; (3) investir no finetuning local
agora ou só depois de medir o RAG citado com o cérebro API; (4) histórico
persistente em localStorage — sim/não (privacidade).

## Origem

Plano aprovado em 2026-08-31, resultado de pesquisa externa (repositórios
GitHub e modelos Hugging Face listados na seção Pesquisa) sobre o estado
medido do Seu Nonô em `apps/web/app/components/SeuNono.tsx`,
`apps/web/lib/assistente/embeddings/` e `docs/planos/PLANO-CHATBOT-IA.md`.
Absorve e detalha as pendências do degrau 3 do assistente (ESTADO #24).
