# Roteiro de execução — pendências consolidadas (2026-08-30)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-30
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](../../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [PLANO-CHATBOT-IA.md](PLANO-CHATBOT-IA.md), [TODO-PROXIMAS-RODADAS.md](TODO-PROXIMAS-RODADAS.md), [2026-08-30-ENTREGA-sirenejud-api-publica.md](../entregas/2026-08-30-ENTREGA-sirenejud-api-publica.md)
> **Palavras-chave:** roteiro, pendências, vale, monitoramento, chatbot, IA, sirenejud, fila, execução

> 🔒 **ARQUIVADO em 01/09/2026** — a fila viva e o estado de cada item estão no [ESTADO.md](../../02-estado/ESTADO.md); este arquivo fica como medição histórica de escopo.

## Sumário

- [Propósito](#propósito)
- [Fila ranqueada por custo × benefício](#fila-ranqueada-por-custo-benefício)
- [1. IA do assistente — degraus e provedores](#1-ia-do-assistente-degraus-e-provedores)
- [2. Monitoramento de empresas (Vale) — escopo expandido](#2-monitoramento-de-empresas-vale-escopo-expandido)
- [3. SIRENEJud fase 2](#3-sirenejud-fase-2)
- [4. Itens destravados pelo token dados.gov.br](#4-itens-destravados-pelo-token-dadosgovbr)
- [5. 01/09 — Neon volta](#5-0109-neon-volta)
- [6. Bloqueados por decisão do dono](#6-bloqueados-por-decisão-do-dono)
- [7. Como executar (agentes em paralelo)](#7-como-executar-agentes-em-paralelo)

## Propósito

Documento único com TODAS as pendências do portal em 30/08/2026, em ordem de
execução, com o custo estimado e o que destrava cada item. É o plano mestre:
o estado vivo continua em `ESTADO.md`; aqui mora a ordem e o detalhe de escopo
que cada trilha precisa para começar. Atualizar este arquivo a cada entrega.

## Fila ranqueada por custo × benefício

| # | Tarefa | Custo | Bloqueio | Onde |
|---|---|---|---|---|
| 0 | Colar `DADOS_GOV_BR_API_TOKEN` em `etl/betim/.env` | 1 min (dono) | — | ✅ **feito 30/08** |
| 1 | Regenerar índice estático com o banco local cheio (diário 16.601 atos, normas 8.570, SIRENEJud 322.842/MG, ComunicaBR) | minutos | nenhum | `apps/web/scripts/gerar-indice-busca.mts` |
| 2 | Ampliar respostas pré-prontas (degraus 0–2) com as análises novas — sem modelo | baixo | item 1 | §1 |
| 3 | Degrau 3: chaves DeepSeek + Maritaca com fallback — código pronto; falta colar as chaves | 2 min (dono) | chaves | §1 |
| 4 | Skip-link WCAG 2.4.1 em Terras/Paraopeba/`/busca`/`/sobre`/DEM | baixo | nenhum | REVISAO-UX §49 |
| 5 | Backfill PDFs → subir novos aprovados ao R2 | médio (rodeiro) | rede | rodando 30/08 |
| 6 | SIRENEJud fase 2 — integrações do catálogo dados.gov.br | médio | token (feito) | §3 |
| 7 | Incentivo ao esporte | médio | token (feito) | ESTADO #15 |
| 8 | Pró-Brumadinho: outras duas páginas | médio | nenhum | ✅ **entregue**: biblioteca pró-brumadinho (129 docs) + `/paraopeba/noticias` |
| 9 | URN / normas.leg.br | médio | nenhum | ✅ **validado**: URN LexML em `lib/ambiental/urn-lexml.ts` (24 testes) |
| 10 | Monitoramento de empresas (Vale) | alto | escopo no §2 | ✅ **entregue**: `/paraopeba/vale` (B3/VALE3) + `/vale/documentos` (CVM) + `/paraopeba/noticias` |
| 11 | 01/09 — runbook da Neon | alto | data | §5 |
| 12 | SIRENEJud shapefiles (77 MB, geometria do dano) | alto | nenhum | §3 |
| 13 | Gitee espelho | baixo (adm) | decisão de quando | ESTADO #29 |

**Bloqueados por decisão do dono:** Conecta gov.br (#16), licença *Icones do
Brasil* (#27), fusão ARQUITETURA × MAPA (#28), AJRI fases 2–3 (`AJRI_COOKIE`),
`AI_API_KEY` (dono vai colar, §1).

## 1. IA do assistente — degraus e provedores

**Regra dos degraus (já decidida):** 0 (navegação) → 1 (busca no índice) → 2
(composição determinística) respondem SEM modelo, em milissegundos. O degrau 3
(RAG + LLM) só é acionado quando os anteriores devolvem vazio — e a tela diz
isso. Pedido do dono (30/08): **incluir o máximo de respostas pré-prontas
sobre dados, análises e índice atualizado** — ou seja, crescer os degraus 0–2
antes de depender do modelo.

**Degrau 3 — dois provedores, um fallback (implementado em 30/08):**

- Chaves em `apps/web/.env.local`: `AI_API_KEY_DEEPSEEK=` e `AI_API_KEY_MARITACA=`
  (linhas já criadas — colar e pronto).
- O provedor ATIVO é escolhido no **painel de edição** (`/painel`, seção "IA do
  assistente") e gravado em `apps/web/data/ia-config.json` (ignorado pelo git).
  O outro vira **fallback automático**: se o ativo falhar, a geração tenta o
  outro na mesma pergunta.
- Código: `lib/assistente/embeddings/provedores.ts` (ordem/config) +
  `geracao.ts` (tentativa em cascata) + `app/api/painel/ia-config/route.local.ts`
  (GET/POST do painel). Trocar de provedor **não exige rebuild**.
- Definições: DeepSeek = `https://api.deepseek.com`, modelo `deepseek-chat`;
  Maritaca = `https://chat.maritaca.ai/v1`, modelo `sabia-3`. Ambos
  compatíveis com `POST /chat/completions`.

**Embeddings (vetorização):** nem DeepSeek nem Maritaca publicam endpoint de
embeddings (medido em 22/08 e reafirmado em 30/08). Caminho atual: **Ollama
local** no home-pc (instalado; subir o serviço). Pergunta em aberto do dono:
se o repo **colibri** ajuda a acelerar a resposta do Ollama local — responder
com medição antes de adotar (ver abaixo em "Em aberto"). Alternativa remota
gratuita: SiliconFlow `BAAI/bge-m3`.

**Em aberto (medir antes de decidir):**

- colibri × Ollama: qual repo exatamente (há mais de um projeto com esse nome
  — ASR/speech e aceleração de inferência não são a mesma coisa). Se for
  aceleração de inferência local (ex.: colibri como runner leve), medir
  latência antes/depois no mesmo prompt do acervo. Resposta honesta enquanto
  não medido: o gargalo do degrau 3 hoje é o embedding do acervo, não o
  decode do modelo — acelerar só a geração pode não ser onde está o tempo.
- SiliconFlow: empresa chinesa (Beijing). `bge-m3` é da BAAI (Beijing Academy
  of Artificial Intelligence), chinesa. Registrado para a decisão de região
  de processamento que o plano original já exigia (dado de acervo público,
  sem dado pessoal — a varredura de dado pessoal roda antes da ingestão).

## 2. Monitoramento de empresas (Vale) — escopo expandido

Pedido do dono (16/08), expandido em 30/08. É uma **frente nova** dentro do
portal. Escopo consolidado:

**2a. Fontes documentais (coleta):**

- Relatórios enviados à **CVM** (ITR, DFP, Fato Relevante, formulários de
  referência) — buscar e coletar os arquivos oficiais.
- Páginas do **site oficial da Vale**: relatórios de transparência,
  sustentabilidade, direitos humanos, reparação, fundação cultural,
  compensação e acordos — mapear as URLs dentro do site oficial antes de
  qualquer coleta.
- Contratos/acordos já conhecidos do acervo do portal (Acordo de Reparação
  Integral, TACs, AJRI) — reusar o que já está coletado.

**2b. Linha do tempo com gráfico de valor das ações (novo, 30/08):**

- Série histórica do **valor das ações negociadas na B3** (VALE3; considerar
  também o ticker ADR se o dono quiser) — gráfico SVG inline, sem biblioteca
  nova (regra do AGENTS.md).
- Eventos do portal (datas de rompimento, acordos, relatórios) marcados como
  pontos na linha do tempo ao lado do preço — com ressalva editorial:
  correlação ≠ causalidade; o gráfico mostra a série, não a interpretação.
- Fonte do preço a medir: B3 (séries históricas públicas), Yahoo Finance ou
  arquivo da B3 — decidir com medição de licença/frequência de atualização.

**2c. Painel de notícias recentes por nome da empresa (novo, 30/08):**

- Coletor que busca notícias recentes mencionando o nome da empresa (e termos
  das frentes do portal) — o modelo já existe: coletor de notícias diário
  (ESTADO #11) e radar de notícias do Paraopeba (feeds AEDAS/ADAI/Guaicuy).
- Painel na página com as notícias mais recentes, com data e link da fonte,
  sem resumo por modelo até decisão (regra editorial de resumo gerado).

**Ordem dentro da frente:** 2a (fontes) → 2b (timeline/preço) → 2c (notícias),
reusando `lib/globo`/`lib/mapa` para geocodificação quando houver dado
(ESTADO #23 — plano de georreferenciar o que 2a levantar).

## 3. SIRENEJud fase 2

Da entrega de 30/08 (`2026-08-30-ENTREGA-sirenejud-api-publica.md`):

- **Shapefiles ambientais** (`meioambiente-shape.zip`, 77 MB) — geometria do
  local do dano, quando existir (obrigatória só desde 2021). Entra como camada
  do globo 3D no padrão das outras (compactar se passar de ~8 MiB crus).
- **Integrações priorizadas do catálogo dados.gov.br** (destravadas pelo
  token): SIGBM/ANM (barragens de mineração), licenças e julgamentos do IBAMA,
  florestas públicas SFB, CNPJ/Receita.

## 4. Itens destravados pelo token dados.gov.br

- **Incentivo ao esporte** (ESTADO #15) — era JWT expirado; renovar a consulta
  ao catálogo assim que o token estiver em `etl/betim/.env`.
- **Catálogo dados.gov.br** — analisar os conjuntos priorizados no
  `docs/06-fontes/DADOS-GOV-BR.md` e coletar em ordem de valor por frente.

## 5. 01/09 — Neon volta

`ROTEIRO-NEON-01-09.md` (runbook pronto): migrations 0071–0077 → backfill de
temas → URLs do TJMG → carga das 8.570 normas federais → auditoria dos 25.729
links. Destrava também: Rouanet junção (ESTADO #10), pgvector do chatbot,
medição de payloads. ⚠️ O cabeçalho do runbook está no passado ("a Neon
voltou…") e ainda não rodou — corrigir o tempo verbal antes de ler como feito.

## 6. Bloqueados por decisão do dono

Conecta gov.br (credenciamento PJ), licença *Icones do Brasil*, fusão
ARQUITETURA × MAPA, AJRI fases 2–3 (`AJRI_COOKIE`), prazo LAI INCRA
(protocolo do dono). Nada disso anda sem a decisão — não entrar em fila
paralela.

## 7. Como executar (agentes em paralelo)

Preferência do dono (30/08): **sempre que possível, disparar agentes em
paralelo** — sessões simultâneas via jcode (modelo v4 flash) para acelerar.
Regras para paralelizar com segurança neste repo:

- Cada agente em **worktree próprio e porta própria** (regra 4 do AGENTS.md) —
  anexar no dev server de outro checkout responde 200 com código errado.
- **Um commit por agente, pathspec explícito** (regras 5–6) — nunca `git add .`.
- Tarefas que tocam o MESMO arquivo/rota NÃO paralelizam — dividir por arquivo
  de saída distinto (ex.: uma página por agente).
- Só um agente faz `next build` por vez na máquina que publica; os demais
  validam com `tsc --noEmit` + vitest.
- A coleta pautada (1,5 s entre requisições) é por DOMÍNIO — dois coletores
  contra o mesmo domínio não são "em paralelo", são duas filas que se somam;
  dividir por fonte, não por mês.

Candidatos naturais a paralelizar da fila acima: §2a/2b/2c da Vale (fontes,
timeline, notícias), os itens 4 (skip-link) e 8/9 (páginas) — todos tocam
arquivos distintos.
