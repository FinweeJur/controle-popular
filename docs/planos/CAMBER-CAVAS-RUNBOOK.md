# Runbook — Camber para a frente de cavas

> **Tipo:** PLANO
> **Domínio:** global (mineração + infraestrutura)
> **Última medição:** 2026-10-05
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** camber, nova, stash, l4, gpu, cavas, mineracao, cbers, inpe, embeddings, chinese-clip, mg, para, goias, bahia, amazonas, dado-publico

## Sumário

- [O que é o Camber](#o-que-é-o-camber)
- [Recursos do plano Student](#recursos-do-plano-student)
- [A estratégia: CPU gera, GPU classifica](#a-estratégia-cpu-gera-gpu-classifica)
- [Pré-requisitos](#pré-requisitos)
- [Prompt do Nova (cole)](#prompt-do-nova-cole)
- [Ordem dos estados](#ordem-dos-estados)
- [Regras que não se negociam](#regras-que-não-se-negociam)
- [Entregáveis e verificação](#entregáveis-e-verificação)
- [Custos e limites](#custos-e-limites)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## O que é o Camber

O Camber é uma plataforma de *data science* com agentes (CamberCloud). O uso é
por três peças:

- **Nova AI** — o chat. Você descreve a tarefa em português e ele **escreve e
  roda o código** nos nós da nuvem (`@nova ...`). Fundação Claude Sonnet.
- **Stash** — o disco de arquivos (`stash://usuario/...`), com upload por
  arrastar-e-soltar ou pela CLI.
- **Camber CLI** (`camber`) — subir/baixar arquivos e gerenciar times por
  script, para quando o chat não bastar.

Referência: <https://docs.cambercloud.com/docs/nova/>.

⚠️ O Camber é **nuvem de terceiro**. Aplica-se a regra **AGENTS § 5.8**: só dado
**público**; **nunca** dado pessoal, CPF ou segredo. As imagens de satélite
(CBERS/Sentinel) e as bases do Monitor/ANM são públicas — o modelo treinado
também pode subir (não é dado pessoal).

## Recursos do plano Student

Medido no painel do plano **Student** (GitHub Honor Roll), 05/10/2026:

| Recurso | Cota |
|---|---|
| CPU | **40 horas** |
| GPU | **5 horas** (1× NVIDIA L4, 24 GB de VRAM) |
| Stash (armazenamento) | **50 GB** |
| Mensagens de LLM | **50** |

A GPU é **uma só** (L4). O nó `XSMALL` com GPU tem 8 vCPU / 32 GB / 1 L4.

## A estratégia: CPU gera, GPU classifica

São **duas tarefas separadas** e só uma usa GPU:

1. **Gerar recortes** (Fase 1) — baixar janelas de satélite do INPE e recortar.
   É **CPU + rede**, **não usa GPU**. Rodar no **CPU** protege as 5 h de GPU.
2. **Embeddings / classificação** (Fase 2/4) — rodar o Chinese-CLIP treinado.
   Aí sim a GPU entra, e a L4 (24 GB) sobra para o modelo.

A rede continua sendo o gargalo da parte 1 (medido no `home-pc`: ~8 Mbps). Se a
banda do Camber for maior, o ganho aparece aqui.

## Pré-requisitos

1. **Modelo treinado no Stash.** Subir o checkpoint v5 (8 m) para, por exemplo,
   `stash://usuario/cavas/modelo-v5/`. A **geração não precisa dele** — só os
   embeddings.
2. **Repo público acessível.** O Nova clona
   <https://github.com/FinweeJur/controle-popular> (ou conecte pelo conector
   GitHub). O repo tem os scripts do pipeline.
3. **Escolher o nó certo em cada fase** (CPU na geração; GPU nos embeddings).

## Prompt do Nova (cole)

```
@nova Objetivo: montar a fila de revisão da frente "cavas de mineração" do
projeto Controle Popular (dado 100% público). NÃO treine; só gere e classifique.

1. Clone https://github.com/FinweeJur/controle-popular no Stash e leia
   AGENTS.md e docs/planos/PLANO-GLOBO-CAVAS-MINERACAO.md (Fases 1 e 4).
2. Instale: numpy, Pillow, rasterio, torch, transformers.
3. Baixe o checkpoint treinado em stash://usuario/cavas/modelo-v5/.

Fase A — RECORTES (nó CPU XSMALL, SEM GPU):
   python scripts/coletar-cavas-calibracao.py --tipo positivo --limite 50
   python scripts/coletar-cavas-calibracao.py --tipo negativo --limite 50
   Fontes: CBERS-4A via STAC do INPE (CC-BY). Estado desta rodada: MG.

Fase B — EMBEDDINGS (nó XSMALL COM GPU), só depois de A:
   python scripts/treinar-cavas-chinese-clip.py --dados scripts/.cache/cavas-calibracao \
       --sem-treino --so-avaliar
   python scripts/montar-fila-revisao-cavas.py

Salve recortes, índice e fila-revisao.jsonl em stash://usuario/cavas/saida/.

REGRAS (AGENTS.md): só dado público; nada pessoal/CPF/segredo; não toque em .env.
Publicar INDÍCIO, nunca "ilegal". Pausa 1–2 s por host, UA honesto, checkpoint.
Nunca Esri — só CBERS/Sentinel (CC-BY).

Comece pelas 100 de MG e me reporte: tempo/recorte, banda usada e tempo de embedding.
Depois seguimos PA, GO, BA, AM.
```

## Ordem dos estados

Decisão do dono (05/10/2026): **MG → PA → GO → BA → AM**.

- Para cada estado novo, seguir o padrão já existente de Goiás:
  `scripts/etl/cavas/alvos-go.py` (alvos + exclusão no WFS do MapBiomas) e
  `scripts/etl/cavas/coletar-cenas-go.py` (cenas no STAC do INPE).
- O coletor aceita `--cenas`, `--alvos`, `--exclusao`, `--ext` e `--uf`; a UF
  nova precisa entrar na lista de `--uf`.
- **Um escritor por checkpoint.** Sempre um estado por vez.

## Regras que não se negociam

- **AGENTS § 5.8** — nuvem de terceiro: só dado **público**. Proibido dado
  pessoal, CPF e segredo. Não ler `.env`.
- **AGENTS § 7** — publicar **indício**, nunca "ilegal". Frase fixa:
  *"receber sinal não é ilícito"*. A apuração é da autoridade.
- **AGENTS § 11** — pausa de **1–2 s por host**, User-Agent honesto, checkpoint
  de retomada, coleta fora da CI.
- **Nunca Esri.** Só CBERS/Sentinel (CC-BY). O PAN/nacional é caro; a decisão
  05/10 é **seguir no 8 m** (o 2 m não superou o v5).
- **Número só com data.** Lacuna é informação: diga quantos vieram sem imagem.

## Entregáveis e verificação

- Recortes + `checkpoint.jsonl` + manifesto
  (`apps/web/data/cavas-calibracao-manifesto.json`).
- Índice de embeddings e `fila-revisao.jsonl` (1 linha por candidato):
  coordenada, município, processo ANM, escore, legenda, link da imagem e do
  processo.
- Relatório: % de cobertura e itens sem imagem utilizável.
- Tudo salvo em `stash://usuario/cavas/saida/` e o caminho informado, para o
  `home-pc` puxar.

**Passo 1 obrigatório:** 100 candidatos de MG, medindo **tempo/recorte**,
**banda** e **tempo de embedding**. Só escalar depois de reportar.

## Custos e limites

- 1 crédito = 1 dólar. Job só consome **enquanto está `RUNNING`**.
- Nó GPU `XSMALL` = 1,5 crédito/hora. Nó XSMALL de CPU = 0,32 crédito/hora.
- Com **5 h de GPU** e o Chinese-CLIP, a classificação de dezenas de milhares
  de recortes cabe com folga — desde que a GPU **não** seja ligada na geração.
- **50 GB de Stash** ≈ 700 mil recortes de 70 KB. Não é o limite.

## Decisões registradas

- **Dev, 05/10/2026:** o Camber entra para tarefa pesada e **pública**. Ordem dos
  estados: **MG → PA → GO → BA → AM**.
- **Medido, 05/10/2026:** plano Student = 40 h CPU, 5 h GPU (L4 24 GB), 50 GB,
  50 mensagens. A geração é CPU/rede; a GPU fica para os embeddings.
- **Método, 05/10/2026:** "medir o tempo local antes de migrar" — já medido para
  o candidato principal (geração 2 m): ~5,2 recortes/min, limitado pela **rede**.

## Origem

- Pedido do dev em 05/10/2026, dentro do fechamento do gate v6 da frente de
  cavas. Documentação do Camber lida no mesmo dia
  (<https://docs.cambercloud.com/>) e painel do plano Student.
- Contexto e estado da frente: [ESTADO.md](../02-estado/ESTADO.md) e
  [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md).
