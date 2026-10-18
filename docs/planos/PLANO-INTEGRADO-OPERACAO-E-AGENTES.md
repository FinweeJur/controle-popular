# Plano integrado — Operação e agentes

> **Tipo:** PLANO
> **Domínio:** operação, deploy, infraestrutura, agentes, dívida de código
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [FERRAMENTAS-E-MCP.md](../05-operacao/FERRAMENTAS-E-MCP.md), [VERIFICACAO-E-ENTREGA.md](../03-desenvolvimento/VERIFICACAO-E-ENTREGA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** operacao, deploy, guara, azure, cota, codescene, linkmender, agentes, orquestracao, worktree, ci, seguranca, n8n, podman

## Sumário

- [Propósito](#propósito)
- [Hotspots do radar](#hotspots-do-radar)
- [Pendências por frente](#pendências-por-frente)
- [Decisões do dono](#decisões-do-dono)
- [Critérios de pronto](#critérios-de-pronto)
- [Origem / Histórico](#origem--histórico)

## Propósito

Plano único do tema **operação, infraestrutura e agentes**. Junta deploy,
dívida de código, LinkMender, orquestração multi-agente e a dívida das
worktrees, com o que o [radar](../02-estado/RADAR-HOTSPOTS.md) mediu.

Regra: **publicar só com ordem do dono** (§5.7.1). Commit e push seguem livres.

## Hotspots do radar

| Hotspot | Medido em | Comece por | Detalhe |
|---|---|---|---|
| **Cota do Guara estourada** — serviço `stopped`, deploy recusado | 09/10 | Azure: `gh workflow run azure-mirror.yml --ref main` | [ESTADO, Bloco A](../02-estado/ESTADO.md#bloco-a--fazer-agora) |
| ~~6 PRs do LinkMender abertos~~ | ✅ 18/10: PR #15 mesclado pelo bot (2.517 correções); os outros fechados | — | [PLANO-LINKMENDER](/docs/historico/planos/PLANO-LINKMENDER-E-ESCADA-18-10.md) |
| **3 amarelos do CodeScene** (`CompanheiroFlutuante` 7,03; `betim.ts` 7,30; `indice/page.tsx` 7,96) | 09/10 | `cs review <arquivo>` | [HOTSPOTSCODESCENE](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) |
| **Integração de PR do CodeScene desligada** e job da nuvem parado | 09/10 | codescene.io, projeto 85760 | [ESTADO, A8](../02-estado/ESTADO.md#bloco-a--fazer-agora) |
| **`cp-bots-lab` 7 commits à frente**; 8 worktrees paradas | 18/10 | `git worktree list` | [RELATORIOS-AGENTES](../02-estado/RELATORIOS-AGENTES.md) |
| **Radar do opencode é local** — não roda na CI | 18/10 | `npm run radar`, `npm run radar:opencode` | [RADAR-HOTSPOTS](../02-estado/RADAR-HOTSPOTS.md) |

## Pendências por frente

### 1. Deploy e infraestrutura

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| O1 | Destravar cota do Guara ou desistir do `.tech` | [ESTADO, A2](../02-estado/ESTADO.md#bloco-a--fazer-agora) | decisão do dono; Azure é o principal |
| O2 | SEO fases 4–5 pendentes de deploy | [ESTADO, A5](../02-estado/ESTADO.md#bloco-a--fazer-agora) | publicar quando o dono autorizar |
| O3 | Bot Telegram com 14 links corrigidos sem publicar | [ESTADO, A6](../02-estado/ESTADO.md#bloco-a--fazer-agora) | incluído no próximo deploy |
| O4 | CSP ainda em Report-Only | [PENDENCIAS-07-10](/docs/historico/planos/PENDENCIAS-07-10.md) | medir 24 h e decidir a virada |
| O5 | Conta Neon ainda ativa | [ESTADO, A4](../02-estado/ESTADO.md#bloco-a--fazer-agora) | dono cancela |
| O6 | home-pc com estado não remedido | [ESTADO, Bloqueios](../02-estado/ESTADO.md#bloqueios) | `tailscale status` antes de agendar |
| O7 | Rotacionar token Name.com e revisar secrets | [PENDENCIAS-07-10](/docs/historico/planos/PENDENCIAS-07-10.md) | dono |
| O8 | M9/M10: changedetection.io e n8n em Podman | [HANDOFF-M9-M10-PODMAN](/docs/historico/planos/HANDOFF-M9-M10-PODMAN.md) | 5 itens abertos; executar quando houver Podman |

### 2. Dívida de código e links

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| O9 | ~~Mesclar os 6 PRs do LinkMender~~ | ✅ 18/10: PR #15 mesclado pelo bot; #5–#8 e #14 fechados como superseded ([PLANO-LINKMENDER](/docs/historico/planos/PLANO-LINKMENDER-E-ESCADA-18-10.md)) | — |
| O10 | Refatorar os 3 amarelos do CodeScene | [HOTSPOTSCODESCENE](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | `cs review` antes e depois |
| O11 | Ligar a integração de PR do CodeScene | [ESTADO, A8](../02-estado/ESTADO.md#bloco-a--fazer-agora) | clique do dono no painel |
| O12 | Registrar metas de dívida no CodeScene | [HOTSPOTSCODESCENE](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | nenhum hotspot abaixo de 7,00 |
| O13 | Segurança Trivy: acompanhar achados | [PLANO-SEGURANCA-TRIVY-2026-10](/docs/historico/planos/PLANO-SEGURANCA-TRIVY-2026-10.md) | rodar `npm audit --omit=dev` |

### 3. Agentes e worktrees

| # | Pendência | Detalhe | Próxima ação |
|---|---|---|---|
| O14 | Orquestração v2: instalar OpenMausBot e criar os bots | [PLANO-ORQUESTRACAO-AGENTES-V2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | 7 pendências na v2; escolher uma por sessão |
| O15 | OpenCode + OpenRouter/chinês | [PLANO-ORQUESTRACAO-AGENTES-V2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | revalidar `opencode run` |
| O16 | Decidir o Needle (manter ou cortar) | [PLANO-ORQUESTRACAO-AGENTES-V2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | decisão do dono |
| O17 | Integrar ou arquivar `cp-bots-lab` (7 commits à frente) | `git worktree list` | inspecionar os 7 commits e decidir |
| O18 | Radar e inventário: manter **locais** | [PLANO-RADAR-AGENTES-HOTSPOTS-18-10](PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md) | não adicionar à CI; rodar `npm run radar` na sessão |

## Decisões do dono

1. Publicar no Azure (liga o build) — sempre manual.
2. Guara: esperar o ciclo da cota ou aposentar o `.tech`.
3. CodeScene: ligar a integração de PR no painel.
4. Orquestração: manter OpenMausBot como hub ou voltar ao orquestrador Python.

## Critérios de pronto

1. Deploy do Azure verde e página medida no ar.
2. LinkMender sem PR antigo aberto.
3. Nenhum hotspot abaixo de 7,00.
4. `docs/planos/` com no máximo os 3 planos integrados e o radar.

## Origem / Histórico

Consolida, em 18/10/2026, as pendências dos planos arquivados em
[`../historico/planos/`](../historico/planos/) ligados a operação, agentes e
dívida de código. Os documentos originais seguem íntegros lá.
