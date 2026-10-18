# RADAR — onde corrigir, atualizar, editar e ampliar

> **Tipo:** ESTADO
> **Domínio:** global (priorização de trabalho, documentação e operação)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](ESTADO.md), [RELATORIOS-AGENTES.md](RELATORIOS-AGENTES.md), [PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md](../planos/PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** radar, hotspots, corrigir, atualizar, editar, ampliar, refatorar, publicar, prioridade, links, coletores, codescene, linkmender

## Sumário

- [Propósito](#propósito)
- [Como usar em um minuto](#como-usar-em-um-minuto)
- [Cinco urgências de hoje](#cinco-urgências-de-hoje)
- [Corrigir agora](#corrigir-agora)
- [Atualizar dado](#atualizar-dado)
- [Editar conteúdo](#editar-conteúdo)
- [Ampliar cobertura](#ampliar-cobertura)
- [Refatorar](#refatorar)
- [Publicar e operar](#publicar-e-operar)
- [Fontes do radar](#fontes-do-radar)
- [Decisões registradas](#decisões-registradas)

## Propósito

Ser a **porta de entrada por intenção**. O leitor não precisa saber se o
assunto mora em `planos/`, `historico/`, `dominios/` ou no código.

Cada linha tem cinco partes: **hotspot**, **por que agora**, **onde começar**,
**documento de origem** e **próxima ação**. Sem número e sem data, a linha não
entra. Se decidir com um número antigo, remeça.

## Como usar em um minuto

| Você quer… | Abra |
|---|---|
| consertar algo quebrado | [Corrigir agora](#corrigir-agora) |
| renovar dado velho ou coletor parado | [Atualizar dado](#atualizar-dado) |
| melhorar texto, página ou acervo | [Editar conteúdo](#editar-conteúdo) |
| cobrir cidade, fonte ou rota nova | [Ampliar cobertura](#ampliar-cobertura) |
| diminuir custo de manutenção | [Refatorar](#refatorar) |
| colocar no ar ou destravar infraestrutura | [Publicar e operar](#publicar-e-operar) |
| agir no tema, com pendência organizada | [Ambiental e dados](../planos/PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md), [Produto e interface](../planos/PLANO-INTEGRADO-PRODUTO-E-INTERFACE.md), [Operação e agentes](../planos/PLANO-INTEGRADO-OPERACAO-E-AGENTES.md) |

Ordem de precedência: **dano > regressão > bloqueio > envelhecimento >
oportunidade**. Empate resolve por esforço pequeno primeiro.

Os pendências que estavam em 96 planos foram reunidas em **3 planos integrados**
e o restante foi arquivado em [`historico/planos/`](../historico/planos/).

Antes de escolher, confira a [fila viva do ESTADO](ESTADO.md#fila-viva).
Depois de executar, atualize a fonte — não este radar sozinho.

## Cinco urgências de hoje

1. **Cinco coletores vermelhos fora da catraca.** O vigia mediu 18 fontes
   atrasadas; 5 não estavam na régua de dívida conhecida.
2. **Dezoito fontes atrasadas.** Três delas são de frequência diária.
3. **97 das 100 páginas do topo ainda são parciais** na régua das oito
   qualidades.
4. **Seis PRs do LinkMender abertos.** O maior carrega 2.467 correções.
5. **Guara bloqueado por cota.** Publicar é pelo Azure, e só com ordem do dono.

## Corrigir agora

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **5 coletores vermelhos fora da catraca** | 18/10 16:21: 18 atrasadas, 13 na catraca. Novas: `mpmg-coerdoce` 42d, `mpmg-nucard` 42d, `dpmg-notas` 41d, `vale-sigma-lithium` 42d, `sinesp-vde` 42d | `npx tsx scripts/vigia-coletores.mts` | [status](../relatorios-automacao/vigia-coletores-status.json), [catraca](../relatorios-automacao/vigia-coletores-catraca.json) | rodar os 5 coletores ou registrar a dívida com o dono |
| **Cota do Guara estourada** | 09/10: serviço `stopped`, `crash_loop`, deploy recusado | plano Azure: `gh workflow run azure-mirror.yml --ref main` | [ESTADO, Bloco A](ESTADO.md#bloco-a--fazer-agora), [AGENTS §5.7.1](/AGENTS.md) | não tentar `guara deploy`; publicar só com ordem |
| **LinkMender com 6 PRs parados** | 18/10: #15 tem 2.467 correções; 1.762 de 2.459 links reprovados por 403/timeout | `scripts/agent-tools/sondar-pr-links.mts`, `linkmender-v2.mts` | [PLANO-LINKMENDER](/docs/historico/planos/PLANO-LINKMENDER-E-ESCADA-18-10.md) | conferir portão tolerante e mesclar em sequência |
| **Rota `/ambiental/contratos` não existe** | 14/10: auditada como “página inexistente” no top 100 | `apps/web/app/ambiental/` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | criar a rota ou remover o link do índice |
| **`/funcaosocialterra/mapa` fora da régua** | 14/10: faltam 5 itens (seções, índice, relacionados, gráfico, fonte) | `apps/web/app/funcaosocialterra/mapa/page.tsx` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | aplicar o checklist do [PADRAO-PAGINA-WIKI](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md) |
| **`/canada` fora da régua** | 14/10: faltam 5 itens; é hub internacional com dado | `apps/web/app/canada/page.tsx` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | fechar seções, índice, relacionados, gráfico e fonte |

## Atualizar dado

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **3 fontes diárias atrasadas** | 18/10: `sigbm-barragens` 41d, `noticias-desastres` 47d, `vale-b3-cvm` 49d | `scripts/etl/` e `scripts/` dos coletores | [status](../relatorios-automacao/vigia-coletores-status.json) | priorizar as diárias e regravar o carimbo |
| **`sigmine-anm` sem carimbo e diária** | 18/10: fonte diária, `carimbo: null` | `apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson` | [status](../relatorios-automacao/vigia-coletores-status.json) | instrumentar `geradoEm` ou declarar a fonte como estática |
| **18 fontes atrasadas no total** | 18/10: 13 conhecidas + 5 novas; teto por frequência | `npx tsx scripts/vigia-coletores.mts` | [PLANO-DATA-DO-DADO](/docs/historico/planos/PLANO-DATA-DO-DADO.md) | escolher por frequência, não por ordem alfabética |
| **205 links EIA/RIMA mortos** | 18/10: 740 ok, 205 `404`, 22 DNS, 20 bloqueados, 17 instáveis, 12 sem checagem | `etl/betim/scripts/gerar-ambiental-estudos.py --comparar` | [PENDENCIAS-AMBIENTAL](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | sondar `file/d/<id>/view`; atualizar selo e link |
| **Outorgas sem município** | 18/10: a grade pública só expõe a regional (URGA) | `scripts/etl/outorgas/coletar-outorgas-mg.mts` | [PENDENCIAS-AMBIENTAL](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | decidir: escopo regional ou export com CSRF |
| **PDFs da CNDH bloqueados** | 15/10: link aponta para a página do MDH, não para o PDF | `apps/web/data/relatorios-direitos-humanos.json` | [ESTADO, B10](ESTADO.md#bloco-b--destravadas-aguardando-ordem) | buscar o PDF depois do defeso eleitoral |
| **Data de coleta ausente em páginas** | Regra nova de 15/10; fiscalização automatizada | `scripts/checar-data-coleta.py`, `scripts/vigia-coletores.mts` | [PLANO-DATA-DO-DADO](/docs/historico/planos/PLANO-DATA-DO-DADO.md), [AGENTS §8](/AGENTS.md) | rodar o porteiro D1 e corrigir páginas sem `<DataColeta>` |

## Editar conteúdo

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **97 de 100 páginas parciais** | 14/10: só 2 completas; faltam índice wiki, relacionados, gráfico e fonte | `scripts/verificar-padrao-pagina.py` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | corrigir por eixo, começando pelos hubs |
| **`/terra-e-territorios` com 4 faltas** | 14/10: índice wiki, relacionados, gráfico e fonte | `apps/web/app/terra-e-territorios/page.tsx` | [padrão de página](../relatorios-automacao/padrao-pagina-2026-10-14.md) | aplicar o checklist do padrão wiki |
| **Texto da memória com datas inconsistentes** | 14/10: triagem registrada, revisão assistida só propõe | `docs/relatorios-automacao/inconsistencias-mistica.md` | [revisão da memória](../relatorios-automacao/inconsistencias-mistica.md) | revisar à mão; máquina não reescreve resumo |
| **Planos concluídos ainda em `planos/`** | 18/10: 98 planos; exemplos: navegação/notificações concluído em setembro; orquestração v1 superada pela v2 | `docs/planos/` | [FILA-AGENTES](/docs/historico/entregas/FILA-AGENTES.md), [ORQUESTRAÇÃO v2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | mover para `historico/` com redirect e atualizar o ESTADO |
| **9 worktrees antigas no disco** | 18/10: `cp-bots-lab` está 7 commits à frente; as outras 8 estão atrás e sem trabalho próprio | `git worktree list` | [RELATORIOS-AGENTES](RELATORIOS-AGENTES.md#worktrees-e-linhas-de-trabalho) | decidir: integrar os 7 commits ou arquivar a worktree |
| **SEO de 04/10 pode estar vencido** | 04/10: canonicals apontando para `/`, páginas 503 e títulos ausentes | `npx tsx scripts/auditar-seo.mts` | [auditoria SEO](../relatorios-automacao/auditoria-seo-2026-10-04.md) | remedir antes de tratar como erro atual |

## Ampliar cobertura

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **PNCP: 89 cidades na fila** | 25/09: 47 completas, 89 na fila, 203 no manifesto | `etl/betim/etl/pncp/checkpoint.py` | [ESTADO, B5](ESTADO.md#bloco-b--destravadas-aguardando-ordem), [PLANO-PNCP](/docs/historico/planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md) | retomar do checkpoint e medir de novo |
| **CAR só com amostra** | 18/10: 56 imóveis em 45 cidades na tela; base completa tem 1,16 mi | `apps/web/app/ambiental/car/` | [ESTADO, B8](ESTADO.md#bloco-b--destravadas-aguardando-ordem) | ETL + agregado server-side, respeitando §5.1 |
| **Rio Doce na Fase 1b** | 12/10: 8 processos CNJ confirmados; falta lista na tela | `/riodoce/processos`, `/api/datajud` | [PLANO-RIO-DOCE](/docs/historico/planos/PLANO-PLATAFORMA-RIO-DOCE.md), [ESTADO, B9](ESTADO.md#bloco-b--destravadas-aguardando-ordem) | publicar os 8 CNJ e ligar a consulta ao vivo |
| **Cavas: Fases 2 e 4** | 18/10: gate v7 passou; Sentinel segue bloqueado; Fases 2 e 4 na fila | `docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md` | [PLANO-CAVAS](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [ESTADO, B4](ESTADO.md#bloco-b--destravadas-aguardando-ordem) | escolher a próxima fase e medir o custo de rede |
| **12 cidades ativas no build** | 05/10: 621 rotas com 12 cidades; 5.570 municípios já coletados | `apps/web/scripts/cidades-do-build` e `CIDADES_DO_BUILD` | [ESTADO, A7](ESTADO.md#bloco-a--fazer-agora) | ampliar por lote, com testes do assistente |
| **22 cidades sem licença na fonte** | 18/10: 22/22 deram zero no WFS da Semad; é lacuna da fonte | `apps/web/lib/ambiental/` | [PENDENCIAS-AMBIENTAL](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | manter “sem registro na fonte”; não inventar dado |
| **Remuneração de servidores e QSA** | Fila B6: novas APIs, 1–2 semanas, aguarda ordem | fontes no plano arquivado §8 | [ESTADO, B6](ESTADO.md#bloco-b--destravadas-aguardando-ordem) | pedir ordem ao dono antes de começar |

## Refatorar

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **`CompanheiroFlutuante.tsx` — 7,03** | 09/10: pior amarelo restante | `apps/web/app/components/CompanheiroFlutuante.tsx` | [HOTSPOTS](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | `cs review` antes e depois; refatorar em passos de 3–5 |
| **`lib/db/queries/betim.ts` — 7,30** | 09/10: 2.558 linhas, 32 revisões | `apps/web/lib/db/queries/betim.ts` | [HOTSPOTS](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | quebrar por domínio, com teste de equivalência |
| **`app/indice/page.tsx` — 7,96** | 09/10: micro-queda; ainda amarelo | `apps/web/app/indice/page.tsx` | [HOTSPOTS](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | extrair blocos; medir de novo |
| **Job da nuvem do CodeScene parado** | 09/10: nuvem devolve notas antigas; portão de PR não ligado | codescene.io, projeto 85760 | [HOTSPOTS](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md), [ESTADO, A8](ESTADO.md#bloco-a--fazer-agora) | dono dispara reanálise e liga a integração de PR |
| **Metas de dívida vazias** | 09/10: sem meta, o CodeScene não avisa declínio | codescene.io, projeto 85760 | [HOTSPOTS](/docs/historico/planos/HOTSPOTSCODESCENE-08-10.md) | registrar: nenhum hotspot abaixo de 7,00 |

## Publicar e operar

| Hotspot | Por que agora (medido) | Comece por | Origem | Próxima ação |
|---|---|---|---|---|
| **Deploy principal é Azure** | 06/10: `www` no Azure; Guara `stopped` por cota | `gh workflow run azure-mirror.yml --ref main` | [OPERACAO](../05-operacao/OPERACAO.md), [AGENTS §5.7.1](/AGENTS.md) | pedir ordem ao dono; build ~6 min |
| **Certificado do domínio** | Canal separado, ~1 min, sem build | `gh workflow run azure-certificado.yml` | [OPERACAO](../05-operacao/OPERACAO.md) | usar só quando o certificado for o problema |
| **CSP ainda em Report-Only** | 08/10: coletor ligado; falta decidir a virada bloqueante | `apps/web/next.config.ts`, `apps/web/public/_headers` | [PENDENCIAS-07-10](/docs/historico/planos/PENDENCIAS-07-10.md) | medir 24 h e decidir com o dono |
| **Conta Neon ainda ativa** | 08/10: app no Heroku; Neon em 94% e sem uso | painel Neon | [ESTADO, A4](ESTADO.md#bloco-a--fazer-agora) | dono cancela a conta |
| **home-pc: estado não remedido** | 09/10: visto por último em 08/10 23:38 UTC | `tailscale status` | [ESTADO, Bloqueios](ESTADO.md#bloqueios) | remedir antes de agendar coleta ou túnel |
| **Planos de orquestração em aberto** | 18/10: OpenMausBot como hub; 7 pendências na v2 | [PLANO-ORQUESTRACAO-AGENTES-V2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | [ORQUESTRAÇÃO v2](/docs/historico/planos/PLANO-ORQUESTRACAO-AGENTES-V2.md) | escolher uma pendência por sessão |

## Fontes do radar

Rodar quando quiser atualizar os sinais. Nenhum comando publica nada.

```bash
# inventário de relatórios de agente e planos (local)
npm run radar

# extrato de prompt e conclusão das sessões do opencode (local)
npm run radar:opencode

# frescor das 29 fontes do registry
npx tsx scripts/vigia-coletores.mts

# régua das oito qualidades (top 100)
python scripts/verificar-padrao-pagina.py

# SEO on-page
npx tsx scripts/auditar-seo.mts

# saúde de um arquivo ou do diff
cs review <arquivo>
cs delta --git-hook --staged

# PRs e worktrees
gh pr list
git worktree list
```

O detalhe de cada fonte automática está em
[`docs/relatorios-automacao/`](../relatorios-automacao/). O inventário dos
agentes está em [RELATORIOS-AGENTES.md](RELATORIOS-AGENTES.md).

**Cobertura de agentes medida em 18/10/2026:** 9 transcrições de subagente em
arquivo e **130 sessões do opencode** (96 subagentes) extraídas do banco local
para [opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md).

**Estes comandos são locais e não vão para a CI.** O extrato lê o banco do
opencode da máquina; em clone sem banco ele não tem o que ler.

## Decisões registradas

1. **18/10/2026 — radar por intenção.** Quem procura não sabe a pasta; a
   entrada tem de ser a pergunta.
2. **18/10/2026 — número com data ou não entra.** Toda linha carrega a
   medição e o documento que a sustenta.
3. **18/10/2026 — regressão antes de envelhecimento.** Coletor que parou dói
   mais que coletor que só está velho.
4. **18/10/2026 — radar não substitui a fila.** O
   [ESTADO](ESTADO.md#fila-viva) continua sendo a fonte de verdade do que está
   aberto; o radar é a porta de entrada.
5. **18/10/2026 — nenhum deploy sem ordem.** O radar aponta o caminho; a
   decisão de publicar é do dono.
