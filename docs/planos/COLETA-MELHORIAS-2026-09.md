# Plano de melhorias de coleta — setembro/2026

> **Tipo:** PLANO
> **Domínio:** planos
> **Última medição:** 2026-09-03
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [FONTES.md](../06-fontes/FONTES.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** coleta, scrapers, pncp, sigpub, dom, comunicabr, funai, datajud, retry, backoff, checkpoint, rotina

## Sumário

- [Propósito](#propósito)
- [Inventário medido (fonte × coberta × status, 03/09)](#inventário-medido-fonte--coberta--status-0309)
- [Diagnóstico do "anda mal"](#diagnóstico-do-anda-mal)
- [Top-5 falhas, uma por uma](#top-5-falhas-uma-por-uma)
- [O que já foi corrigido nesta rodada](#o-que-já-foi-corrigido-nesta-rodada)
- [Ranque custo × benefício](#ranque-custo--benefício)
- [Regras que este plano não negocia](#regras-que-este-plano-não-negocia)
- [Origem / Histórico](#origem--histórico)

## Propósito

O dono pediu "melhorar os scrapers" (03/09). Uma varredura medida de subagente
diagnosticou a esteira inteira. Este plano grava o diagnóstico e ranqueia as
corrições; o que coube em código já saiu junto (helper `lib/coleta/
fetch-resiliente.ts`, publicado em 8829ada).

## Inventário medido (fonte × coberta × status, 03/09)

Medido de: `picoclaw-fontes-status.json` (01/09), 5 rodadas do
`picoclaw-historico.jsonl`, `rotina-coletas.mts` (MAPA_SCRIPTS), workflows
`etl-*.yml` e `agendar-tarefas-windows.ps1`.

| Fonte | Coberta por | Cadência | Status medido |
|---|---|---|---|
| PNCP contratos/licitações MG | `coletar-pncp-mg.mts` + `etl/pncp/*.py` | diário 08:00 UTC (CI) | 🟡 API 504 intermitente; `pncp-mg.json` com `coletaPendente: true` |
| Diário AMM-MG (SIGPub) | `etl/camaras/sigpub.py` | **sem agendamento** — só manual | ✅ parser saudável (222 matérias em 08/2026) |
| Diário BH (DOM-PBH) | `etl/camaras/domweb.py` | **sem agendamento** | ✅ funcional; gravação nunca exercitada (sem DATABASE_URL no histórico) |
| Transferegov/Siconv convênios | `coletar-convenios-federais-mg.mts` | madrugada | 🟡 raiz 200; rota de dados testada em 03/09 → 404 (caminho a conferir) |
| ComunicaBR repasses | `coletar-comunicabr.mts` | madrugada | 🔴 2/5 rodadas falhas — URL migrou p/ `presidencia.gov.br`; coletor atualizado, watcher alterna as duas |
| Notícias desastres | `coletar-noticias-desastres.py` | madrugada | ✅ 14 itens na janela de 03/09 |
| Notícias Paraopeba | `coletar-noticias-paraopeba.py` | **fora da rotina** | 🟡 último `gerado_em` 15/08 (19 dias); feeds vivos |
| FUNAI terras (watcher) | watcher PicoClaw | madrugada | 🔴 slug monitora host errado: raiz morre em ~30s, mas o WFS real (`/geoserver/ows`) respondeu 200 em 2,2s |
| DataJud/CNJ | watcher | — | 🔴 404 na home; API viva em outro caminho |
| SALIC Rouanet | `coletar-salic-rouanet.mts` | madrugada | 🟡 403 constante (UA específico); já tem checkpoint próprio |
| FNP / notícias municipais das 6 cidades | **NÃO coberta** | — | ❌ nenhum coletor no repo |

## Diagnóstico do "anda mal"

**Achado estrutural:** os coletores de notícias e diário oficial — exatamente
os que o dono sente faltando — **não têm agendamento nenhum**. A task das
03:30 chama `rotina-coletas.mts --listar` (que só lista!) e o
`orquestrador-rotinas.mts` é PoC com dados hardcoded. Não é parser quebrado:
é cron que não existe. Os parsers estão saudáveis (medido: SIGPub 222
matérias; notícias 13 itens na janela de 03/09).

Segundo achado: cada coletor tem retry ad-hoc seu — ou nenhum. O FGV não tem
retry nenhum (zero). Por isso uma instabilidade de 30s derruba a rodada.

## Top-5 falhas, uma por uma

1. **pncp-contratos** — `GET /api/consulta/v1/contratos` → 504 em 70s no
   teste de 03/09; background com `--seco` rodou >10min sem completar. O
   script funciona; a fonte está instável. Ação: retentar em janela
   diferente (madrugada, já que a API oscila) e aceitar paginação parcial
   com checkpoint.
2. **funai-terras-indigenas** — bug NO WATCHER, não na fonte: o slug sonda a
   raiz do host (morre ~30s) em vez do `/geoserver/ows` (200, 2,2s).
3. **comunicabr-repasses** — migração de domínio; coletor já atualizado, o
   watcher é que alterna entre URL velha e nova. Corrigir o alvo do watcher.
4. **datajud-cnj** — 404 por caminho errado no monitor.
5. **notícias/diário** — ausência de cron (ver diagnóstico).

## O que já foi corrigido nesta rodada

- **`apps/web/lib/coleta/fetch-resiliente.ts`** (publicado 03/09, 8829ada):
  UA honesto centralizado, backoff exponencial + teto + jitter, respeito a
  `Retry-After`, 4xx permanente sem retentar, 204 = sucesso vazio, BOM-strip,
  checkpoint JSON atômico em `etl/betim/dados/_checkpoints/`. 10/10 testes.
- Esteira reordenada (04/09): as tasks do Windows agora estão todas no
  `agendar-tarefas-windows.ps1` reproduzível — antes só havia 2 registradas
  lá e o resto nasceu na mão, de sessão em sessão.

## Ranque custo × benefício

| # | Ação | Custo | Benefício |
|---|---|---|---|
| 1 | Ligar `sigpub.py`, `domweb.py` e `noticias-paraopeba.py` na rotina da madrugada (3 entradas no MAPA_SCRIPTS do `rotina-coletas.mts`) | 1h | **alto** — é o dado que o dono sente faltando |
| 2 | Consertar os slugs do watcher (FUNAI → `/geoserver/ows`; DataJud → caminho da API; ComunicaBR → fixar `presidencia.gov.br`) | 1h | alto — derruba 3 🔴 do painel |
| 3 | Migrar `comunicabr`, `fgv` e `convenios-federais-mg` para o `fetch-resiliente` | 2–3h | médio — mata o retry zero do FGV |
| 4 | Registrar PNCP no `MAPA_SCRIPTS` com janela própria e checkpoint de página | 2h | médio — 504 é da fonte; com checkpoint a rodada parcial vira progresso |
| 5 | Conferir a rota de dados do Transferegov (404 de 03/09) contra a doc aberta | 1h | médio |
| 6 | Coletor FNP (notícias municipais) para as 6 cidades cobertas | 1 dia | alto — frente inteira descoberta |

Cada item 1–2 é um commit isolado; 3–4 mexem em coletores vivos e pedem
rodada de verificação seca antes.

## Regras que este plano não negocia

- Coletor novo que grava JSON a cada rodada entra na lista `DIRETORIOS_DADO`
  de `scripts/checar-dado-pessoal-em-dado.py` — varrer CPF ANTES de commitar
  (regra 2 do AGENTS.md).
- Pausa entre requisições, UA honesto (agora canônico no helper), checkpoint
  de retomada, e **nada de coleta dentro da CI** (regra de coleta do
  AGENTS.md).
- Lacuna é informação: fonte morta continua listada como morta, com data da
  última medição.

## Origem / Histórico

- Pedido do dono em 03/09 ("melhorar os scrapers"); diagnóstico medido por
  subagente (varredura das 19h, `deleg_a2264e9a`/task 3), top-5 testado ao
  vivo no mesmo dia sem WinError 10013 (rede estava OK na janela).
- 04/09: esteira reordenada com deploy às 05:50 e report com retry —
  publicado em f9eb93d.
