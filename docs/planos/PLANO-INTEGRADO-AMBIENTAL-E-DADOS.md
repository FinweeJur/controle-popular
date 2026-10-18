# Plano integrado — Ambiental e dados

> **Tipo:** PLANO
> **Domínio:** ambiental, fontes, coletores, dados territoriais
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md), [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [COLETA-ETICA.md](../06-fontes/COLETA-ETICA.md), [PLANO-INTEGRADO-OPERACAO-E-AGENTES.md](PLANO-INTEGRADO-OPERACAO-E-AGENTES.md)
> **Palavras-chave:** ambiental, coletores, vigia, licenciamento, eia-rima, outorga, car, pncp, rio-doce, cavas, dados, frescor, lgpd

## Sumário

- [Propósito](#propósito)
- [Hotspots do radar](#hotspots-do-radar)
- [Pendências por frente](#pendências-por-frente)
- [Decisões do dono](#decisões-do-dono)
- [Critérios de pronto](#critérios-de-pronto)
- [Origem / Histórico](#origem--histórico)

## Propósito

Plano único do tema **ambiental e dados**. Reúne o que estava espalhado em
dezenas de planos arquivados em [`../historico/planos/`](../historico/planos/)
e o que o [radar](../02-estado/RADAR-HOTSPOTS.md) mediu em 18/10/2026.

Regra do plano: **primeiro regressão, depois envelhecimento, depois cobertura.**
Fonte que parou de atualizar dói mais que fonte que só está velha.

## Hotspots do radar

| Hotspot | Medido em | Comece por | Detalhe |
|---|---|---|---|
| ~~5 coletores vermelhos fora da catraca~~ | ✅ 18/10: eram acervo curado; viraram `estatica` no registry | `apps/web/lib/fontes/registry.ts` | [status](../relatorios-automacao/vigia-coletores-status.json) |
| **Fontes atrasadas: 18 → 9** | 18/10 após rodada; `sigbm-barragens` e `noticias-desastres` atualizados; falta `vale-b3-cvm` | coletores em `scripts/` e `etl/` | [status](../relatorios-automacao/vigia-coletores-status.json) |
| **`sigmine-anm` sem carimbo e diária** | 18/10 | `apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson` | [PLANO-DATA-DO-DADO](/docs/historico/planos/PLANO-DATA-DO-DADO.md) |
| **205 links EIA/RIMA 404** de 1.016 fichas (22 DNS, 20 bloqueados, 17 instáveis) | 18/10 | `etl/betim/scripts/gerar-ambiental-estudos.py --comparar` | [PENDENCIAS-AMBIENTAL-18-10](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) |
| **PNCP: 89 cidades na fila** (47 completas, 203 no manifesto) | 25/09 | `etl/betim/etl/pncp/checkpoint.py` | [PLANO-EXPANSAO-PNCP-199-CIDADES](/docs/historico/planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md) |
| **CAR só com amostra** (56 imóveis/45 cidades; base completa 1,16 mi) | 18/10 | `apps/web/app/ambiental/car/` | [ESTADO, B8](../02-estado/ESTADO.md#bloco-b--destravadas-aguardando-ordem) |
| **Rio Doce na Fase 1b** (8 processos CNJ confirmados) | 12/10 | `/riodoce/processos`, `/api/datajud` | [PLANO-PLATAFORMA-RIO-DOCE](/docs/historico/planos/PLANO-PLATAFORMA-RIO-DOCE.md) |
| **Cavas: Fases 2 e 4**, Sentinel bloqueado, gate v7 passou | 18/10 | [PLANO-GLOBO-CAVAS-MINERACAO](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md) | [ESTADO, B4](../02-estado/ESTADO.md#bloco-b--destravadas-aguardando-ordem) |

## Pendências por frente

### 1. Frescor e regressão de coletor

| # | Pendência | Evidência | Detalhe | Próxima ação |
|---|---|---|---|---|
| D1 | ~~Rodar os 5 coletores vermelhos~~ | ✅ 18/10: os 5 eram acervo curado e viraram `estatica` no registry; vigia caiu de 18 para 9 vermelhas | [status](../relatorios-automacao/vigia-coletores-status.json) | — |
| D2 | Priorizar as 3 diárias atrasadas | 41–49 dias | [PLANO-DATA-DO-DADO](/docs/historico/planos/PLANO-DATA-DO-DADO.md) | rodar por frequência, não por ordem |
| D3 | Instrumentar `sigmine-anm` | diária sem carimbo | `sigmine-operacao.geojson` | gravar `geradoEm` ou declarar estática |
| D4 | Fechar D2 do plano de data (checagem no browser) | 15/10 | [PLANO-DATA-DO-DADO](/docs/historico/planos/PLANO-DATA-DO-DADO.md) | Playwright em 390 px |

### 2. Dado ambiental já coletado

| # | Pendência | Evidência | Detalhe | Próxima ação |
|---|---|---|---|---|
| D5 | Rechecar 205 links EIA/RIMA mortos | 18/10 | [PENDENCIAS-AMBIENTAL-18-10](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | sondar `file/d/<id>/view` e atualizar selo |
| D6 | Outorgas sem município (P5) | 18/10 | [PENDENCIAS-AMBIENTAL-18-10](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | decidir escopo URGA ou xlsx com CSRF |
| D7 | CAR: cobertura municipal completa | 18/10 | [ESTADO, B8](../02-estado/ESTADO.md#bloco-b--destravadas-aguardando-ordem) | ETL + agregado server-side (§5.1) |
| D8 | 22 cidades sem licença na fonte | 18/10, conferido no WFS | [PENDENCIAS-AMBIENTAL-18-10](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md) | manter "sem registro na fonte"; não inventar |

### 3. Cobertura nova

| # | Pendência | Evidência | Detalhe | Próxima ação |
|---|---|---|---|---|
| D9 | Retomar PNCP (89 cidades) | 25/09 | [PLANO-EXPANSAO-PNCP-199-CIDADES](/docs/historico/planos/PLANO-EXPANSAO-PNCP-199-CIDADES.md) | retomar do checkpoint e remedir |
| D10 | Rio Doce Fase 1b | 12/10 | [PLANO-PLATAFORMA-RIO-DOCE](/docs/historico/planos/PLANO-PLATAFORMA-RIO-DOCE.md) | publicar os 8 CNJ e ligar DataJud |
| D11 | Cavas Fases 2 e 4 | 18/10 | [PLANO-GLOBO-CAVAS-MINERACAO](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md) | escolher fase e medir a banda |
| D12 | Remuneração de servidores e QSA | fila B6 | [ESTADO, B6](../02-estado/ESTADO.md#bloco-b--destravadas-aguardando-ordem) | pedir ordem antes de começar |
| D13 | Condicionantes ambientais (piloto Irapé/Setúbal) | 3 itens abertos | [PLANO-CONDICIONANTES-AMBIENTAIS](/docs/historico/planos/PLANO-CONDICIONANTES-AMBIENTAIS.md) | concluir o piloto e medir |

## Decisões do dono

1. Publicar é manual; nenhuma coleta publica sozinha.
2. Outorga por município: aceitar limite estrutural ou autorizar rota com CSRF.
3. Remuneração/QSA (B6): liberar ou manter na fila.
4. Cavas: autorizar a próxima rodada de VM (liga a máquina).

## Critérios de pronto

1. Vigia sem fonte vermelha fora da catraca por 2 rodadas.
2. Nenhuma fonte diária com lag acima de 3 dias.
3. EIA/RIMA sem link 404 que a fonte ainda publique.
4. PNCP e Rio Doce com número remedido e registrado.

## Origem / Histórico

Consolida, em 18/10/2026, as pendências dos planos arquivados em
[`../historico/planos/`](../historico/planos/) ligados a ambiental e dados.
Os documentos originais seguem íntegros lá; este plano só aponta e prioriza.
