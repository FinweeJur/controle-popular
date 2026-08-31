# Chatbot IA — plano (adaptação do template "Notebook LM do negócio")

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** plano, ativo, tarefa

## Sumário

- [Propósito](#propósito)
- [O que é](#o-que-é)
- [O ponto crítico: o portal JÁ tem assistente, e é determinístico](#o-ponto-crítico-o-portal-já-tem-assistente-e-é-determinístico)
- [Adaptação crítica do template (o que muda do Leilões)](#adaptação-crítica-do-template-o-que-muda-do-leilões)
- [As 4 camadas (adaptadas)](#as-4-camadas-adaptadas)
- [Riscos (honestos, no contexto do portal)](#riscos-honestos-no-contexto-do-portal)
- [Ordem de execução](#ordem-de-execução)
- [Vitória esperada](#vitória-esperada)
- [Origem](#origem)

> Escrito em 2026-08-16, a pedido do dono: ele trouxe o **"Plano Final
> Contextualizado — Chatbot IA pra Leilões.app"** e pediu para **adaptar
> criticamente** pro Controle Popular e registrar no plano. O template é de
> FAQ de leilão; aqui é portal de transparência, e isso muda as exigências.

## O que é

Um assistente de perguntas sobre o **acervo público** do portal: o visitante
pergunta ("como funciona a renúncia fiscal em Betim?") e a resposta sai dos
documentos reais do acervo (RAG), **com citação da fonte** — não do que o
modelo "achou".

## O ponto crítico: o portal JÁ tem assistente, e é determinístico

O assistente em produção (degraus 0–2, `apps/web/lib/assistente/compor.ts`) é
**determinístico**: sem modelo, sem rede, sem alucinação — "compare Betim e
BH", "o que falta em Betim", "Contagem não é atendida" respondem só com o
índice estático, em 0,35 ms. Essa escolha não foi falta de opção: num portal
lido por quem está sob estresse (denúncia, barragem, remoção), resposta
inventada custa caro.

O chatbot IA é um **degrau 3 opcional**, não uma substituição: entra onde o
determinístico não alcança (pergunta aberta, resumo, parafrase), mantendo
**citação obrigatória** e uma **ressalva visível** ("resposta gerada por IA —
confira a fonte"). Os dois convivem.

## Adaptação crítica do template (o que muda do Leilões)

1. **Só documento público entra na memória, e varrido pelas guardas.** Antes
   da ingestão, rodar as duas guardas de dado pessoal
   (`scripts/checar-dado-pessoal.py` e `scripts/checar-dado-pessoal-em-dado.py`).
   O template aceitava "documentos do negócio" na nuvem; aqui a barra é LGPD.
2. **Alucinação é risco de confiança, não de FAQ.** RAG estrito sobre o
   acervo; "não sei" fora dele; citação da fonte em toda resposta; e o caminho
   determinístico continua existindo lado a lado.
3. **Jurisdição do cérebro é decisão em aberto.** O template exigia "fora dos
   EUA/Europa" (SiliconFlow/China). O portal **já roda em GitHub (EUA),
   Cloudflare (EUA), Neon (EUA/EU)** — a restrição geográfica não é automática
   aqui. Se valer, SiliconFlow (`Qwen/Qwen3-8B` + `BAAI/bge-m3`) é o cérebro;
   se não, o leque abre (Z.ai, OpenRouter). Decisão do dono, registrada.
4. **Teto do Worker.** O porteiro (Cloudflare Worker) tem que caber no teto de
   bundle do alvo — o build já usa `--webpack` por causa disso; uma
   dependência grande de RAG pode estourar.
5. **Banco.** pgvector no Neon depende do banco (HTTP 402 até 01/09); o
   conceito pode ser provado no Postgres local.

## As 4 camadas (adaptadas)

| Camada | O que é | Escolha |
|---|---|---|
| **L1 Cérebro público** | API LLM + embeddings | SiliconFlow: `Qwen/Qwen3-8B` + `BAAI/bge-m3` (grátis, sem cartão, OpenAI-compatible); alternativa se a região abrir: Z.ai/OpenRouter — **decisão do dono** |
| **L2 Memória do bot** | vetores do acervo público | Neon **pgvector** (ou Postgres local até 01/09); só documentos públicos varridos pelas guardas |
| **L3 Porteiro** | pergunta → top-5 trechos → prompt → resposta + citação | Cloudflare Worker, dentro do teto de bundle |
| **L4 Laboratório local** | testar prompts + fallback de emergência | Ollama + **Bode 7B** / **Tucano-2.4B** no home-pc (i7-3770, 16 GB) |

## Riscos (honestos, no contexto do portal)

1. SiliconFlow é free tier — política/limite pode mudar; mitiga com fallback local (L4).
2. Latência ~1–3 s da API pro Brasil — aceitável pra chat; o determinístico continua instantâneo.
3. Dado **público** na nuvem — risco reduzido pela varredura das guardas; nada sensível.
4. Qwen3-8B não é topo de linha — suficiente pra pergunta sobre acervo, não pra análise complexa.
5. Verificação de conta do SiliconFlow (telefone) — alternativa Z.ai se travar.
6. **Específico do portal:** resposta IA precisa de ressalva visível e fonte clicável — a confiança do portal é o ativo, não a velocidade.

## Ordem de execução

1. **Decisões do dono** ✅ (22/08/2026): (a) cerebro — Maritaca/Sabia, DeepSeek
   como alternativa; (b) acervo = tudo que o assistente deterministico nao
   cobrir; (c) ressalva de IA sempre visivel com citacao.
2. **Provar conceito** ✅ (22/08/2026): pipeline local Ollama + nomic-embed-text
   sobre 4 normas federais ambientais — 3/4 acertos por similaridade.
3. **Laboratorio local (L4)** ✅ **superado em 31/08** — ver o parágrafo
   destacado abaixo; a rota `/assistente-ia-lab` continua, agora com o
   contrato v2.
4. **Definir acervo + varredura** ✅ **feito em 31/08**: acervo real em
   código (`apps/web/lib/assistente/acervo.ts`, ~110 pedaços das 6 frentes);
   a guarda de dado pessoal já cobre `etl/betim/dados` desde 22/08 (a nota
   do AGENTS.md está defasada).
5. **Worker porteiro + front** — detalhado e executado pelo plano do Seu
   Nonô abaixo.
6. **Publicar e testar com usuario real** — após build no home-pc.

> **31/08/2026 — este plano foi DETALHADO e executado em fases por
> [PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md):** Fases 0–4
> implementadas (acervo real; contrato v2 com `url`/`rota` na fonte;
> verificador determinístico de citação com abstenção e re-tentativa;
> ressalva de IA sempre visível com data/modelo; tela cheia estilo
> NotebookLM com histórico e painel de fontes; dataset de finetuning em
> `etl/finetuning/dados-seu-nono.jsonl`). A Fase 5 (pgvector na Neon) tem
> runbook próprio: [ROTEIRO-PGVECTOR-CHATBOT.md](ROTEIRO-PGVECTOR-CHATBOT.md).

## Vitória esperada

"Como funciona a renúncia fiscal em Betim?" → resposta **citando o documento
real** de onde veio, com link da fonte, em ~2 s, com zero custo recorrente — e
"não sei" honesto fora do acervo.

**1º passo concreto (≤ 2 min, decisão do dono):** responder às três perguntas
do passo 1 acima — região do cérebro, acervo inicial e ressalva de IA.
