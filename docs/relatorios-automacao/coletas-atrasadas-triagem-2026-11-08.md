# Coletas atrasadas — triagem de 08/11/2026

> Triagem das 19 fontes que o vigia de coletores marcou como atrasadas ou sem carimbo
> (`docs/relatorios-automacao/vigia-coletores-status.json`, rodada das 18:14).
> Repo: `C:\DevCoder\controle-popular`. Worktree de trabalho: `C:\DevCoder\worktrees\dev3-f2`
> (detached sobre `origin/main` = `8658d0d8`). Árvore suja do checkout canônico não foi tocada.

## Resposta curta

1. **Quase nenhuma das fontes do `rotina-coletas` roda sozinha.** O único chamador agendado
   (`scripts/executar-rotina-madrugada.ps1`, tarefa `ControlePopular_PicoClaw_Madrugada`, 03:30)
   chamava `npx tsx scripts/rotina-coletas.mts --listar`: isso imprime o catálogo e **não coleta**.
   Resultado: 17 fontes com coletor mapeado ficaram paradas até alguém rodar à mão.
2. **SIGBM estava quebrado de verdade** e entrou em quarentena em 15/10: o `rotina-coletas`
   chamava `py -3`, e o ETL precisa de `pandas`. Consertado nesta triagem (venv do repo).
3. **Em 5 fontes o coletor grava num arquivo e o portal/vigia leem outro.** Mesmo coletando,
   o dado não chega à tela nem muda o carimbo.
4. **O build diário está abortando desde 01/10.** `ultima-contagem.json` ficou em 5.654 páginas;
   o build atual (zona Cidades on-demand) entrega 623–690 e o guarda de queda de 20% aborta
   antes de publicar. **O site não recebe dado novo há 5 semanas**, mesmo quando a coleta funciona.

## Causas raiz

| # | Causa | Evidência | Alcance |
|---|---|---|---|
| R1 | Agendamento só lista o catálogo | `executar-rotina-madrugada.ps1:42` (antes) chamava `--listar`; `rotina-coletas.mts` é o único invocador dos 17 scripts | 17 fontes |
| R2 | Python errado para ETL | `python -m etl.apis.sigbm_anm` → `ModuleNotFoundError: No module named 'pandas'`; o venv `etl/betim/.venv` tem pandas 2.3.3 e requests 2.34.2 | SIGBM (classe toda de coletores TS que chamam ETL) |
| R3 | Artefato do coletor ≠ artefato lido | ComunicaBR grava `apps/web/data/comunicabr-31.json`, o site lê `apps/web/public/data/comunicabr-31.json`; CGE/GTAC/AJRI/inspeções gravam `lib/*.ts`, o vigia aponta bundles antigos; SIGMINE aponta uma camada `.geojson` que nenhum script do repo escreve | 5 fontes |
| R4 | Fonte mudou/bloqueia ou falta dependência | Transferegov `detru/` → 404; FUNAI GetFeature → 403 nginx; `DadosAbertosBrasil` ausente para o congresso | transferegov, FUNAI, congresso |
| R5 | Deploy travado no guarda de páginas | 8 dias seguidos de `ABORTADO: 690 páginas contra 5654` (desde 31/10; 632 antes disso); último `publicado_em` = 01/10 | Site inteiro |

## Tabela por fonte

| Fonte | Freq. | Carimbo | Onde roda (ou deveria) | Causa | Ação / bloqueio |
|---|---|---|---|---|---|
| vale-b3-cvm | diária | 2026-08-30 (70d) | `coletar-vale-monitoramento.mts` via `rotina-coletas` | R1 + coleta manual por desenho (o próprio script diz "não roda na CI") | Agendar mensal com `--de/--ate`. Não rodado: COTAHIST 2026 tem 102 MB e o default baixa todos os anos |
| sigbm-barragens | diária | 2026-10-18 (21d) | idem | **R2**; quarentena desde 15/10 (3 falhas) | **Corrigido**; medido 9,8 s / 318 barragens / carimbo 2026-11-08; agendado na madrugada |
| noticias-desastres | diária | 2026-11-01 (7d) | idem | R1 | Coletor OK (76 itens, 14,7 s); **agendado na madrugada** |
| sigmine-anm | diária | sem carimbo | `coletar-sigmine-nacional.py` via `rotina-ambiental` | R3 (registry aponta camada órfã) + R1 (tarefas `CP-ambiental-*` nunca instaladas) | Coletor bruto OK (275.287 processos, 207 s, 9,3 MB com `--limit 2000`); **bloqueio**: decidir se gera camada `.geojson` ou se aposenta a entrada do vigia |
| salic-rouanet | mensal | 2026-08-15 (85d) | `coletar-salic-rouanet.mts` | R1 + coletor longo | Anda: 2.200/7.742 projetos em 5 min (~18 min no total). Agendar em janela noturna |
| comunicabr-repasses | mensal | 2026-08-15 (84d) | `coletar-comunicabr.mts` | **R3** (gravava onde ninguém lê) | **Corrigido** (DESTINO → `public/data`). Atualização real exige `--recomecar` (~19 min medidos) |
| biblioteca-atis | semanal | 2026-08-26 (74d) | `coletar-biblioteca-ati.py` | R1 + coletor longo | Raspagem viva (passou de 148 itens do Paraopeba); não terminou em 280 s. Agendar semanal |
| sirenejud-cnj | mensal | 2026-08-30 (70d) | `etl/betim/etl/apis/sirenejud_cnj.py` | R1: **nenhum wrapper/agenda chama o módulo** | Criar wrapper no `rotina-coletas` (exige decidir parâmetros do módulo) |
| ibama-licencas-sancoes | semanal | 2026-08-31 (69d) | `coletar-ibama-mg.mts` | R1 | Coletor OK (3,1 s); agendar semanal. Dado pequeno (6 licenças, 5 infrações) |
| cge-decisoes-lai | mensal | 2026-08-31 (69d) | `coletar-decisoes-cge-mg.mts` | **R3** (grava `lib/ambiental/decisoes-cge.ts`; registry aponta `data/decisoes-cge-lai.json`; cliente busca `public/data/decisoes-cge.json`, sem gerador) | Coletor OK (800 decisões, 183 s). **Bloqueio**: gerar o JSON do cliente e repontar o registry |
| congresso-mg-parlamentares | mensal | 2026-08-31 (68d) | `coletar-congresso-mg.py` (fora do MAPA) | R4: `DadosAbertosBrasil` ausente (nem no venv) | **Bloqueio**: instalar/fixar dependência; depois agendar |
| biblioteca-desastres | semanal | 2026-09-07 (62d) | `agregar-biblioteca-desastres.mts` | R1 | Agregador OK (3,1 s, 936 itens, `geradoEm` novo); agendar depois das ATIs |
| transferegov-convenios | semanal | sem carimbo | `coletar-convenios-federais-mg.mts` | R4: `repositorio.dados.gov.br/seges/detru/siconv_proposta.csv.zip` → **404**; `/seges/detru/` também 404 | **Bloqueio**: localizar o novo dump do Transferegov (ex-SICONV) |
| cnj-inspecoes | mensal | sem carimbo | `gerar-inspecoes-cnj.mts` | R3 + R1 | Gerador local OK (3,2 s, 33 órgãos/343 relatórios) mas grava `lib/judiciario/inspecoes-cnj.ts`; registry aponta `inspecoes-cnj-bundle.json` |
| funai-terras-indigenas | mensal | sem carimbo | `coletar-terras-indigenas.mts` | R4: WFS `geoserver.funai.gov.br/geoserver/ows?...GetFeature` → **403 nginx** (curl, UA do projeto e UA de Chrome; GetCapabilities responde 200) | **Bloqueio**: rota de acesso à fonte; o retry de 8 tentativas só repete o 403 por ~7 min |
| incra-quilombolas | mensal | sem carimbo | `scripts/etl/cavas/localizar-comunidades-tradicionais.py` | R1: fora do MAPA; a tarefa de cavas roda só `--tipo negativo` | Decidir agenda da camada; a camada não tem data |
| fgv-paraopeba | semanal | sem carimbo | `coletar-execucao-fgv.mts` | R1 | Não rodado; o bundle não tem `geradoEm`. Medir antes de agendar |
| auditoria-ajri | mensal | sem carimbo | `extrair-auditoria-ajri.mts` | R3 (grava `lib/paraopeba/auditoria-ajri.ts`; cliente busca `public/data/auditoria-ajri.json`, sem gerador) | **Bloqueio**: gerar o JSON do cliente |
| gtac-semad | mensal | sem carimbo | `coletar-tac-gtac-mg.mts` | R3 + R1 | Coletor OK (2.019 TACs, 11,9 s) mas grava `lib/ambiental/tac-gtac.ts`; registry aponta `tac-gtac-bundle.json` |

## Medições desta triagem (08/11/2026, pela máquina de produção)

| Coletor | Resultado | Tempo | Observação |
|---|---|---:|---|
| SIGBM/ANM (`py -3`) | **falha** | 3,4 s | `ModuleNotFoundError: pandas` |
| SIGBM/ANM (venv do repo) | 318 barragens MG / 908 Brasil | 9,8 s | carimbo `coletado_em` 2026-11-08 |
| `rotina-coletas --fonte sigbm-barragens --seco` | verde | 39,1 s | inclui varredura CPF; 0 CPF |
| noticias-desastres | 76 itens / 45 dias | 14,7 s | verde |
| `rotina-coletas --fonte noticias-desastres --seco` | verde | 41,3 s | inclui varredura CPF |
| SIGMINE nacional (`--limit 2000`) | 275.287 processos / 9,3 MB | 207,3 s | truncado por UF; `--limit 0` faz tudo |
| CGE decisões LAI | 800 decisões / 7 anos | 183,1 s | grava `.ts`, não o JSON do cliente |
| IBAMA MG | 6 licenças / 5 infrações | 3,1 s | verde |
| GTAC | 2.019 TACs / 393 municípios | 11,9 s | grava `.ts` |
| inspeções CNJ | 33 órgãos / 343 relatórios | 3,2 s | gerador local |
| biblioteca-desastres (agregador) | 936 itens | 3,1 s | carimbo novo |
| SALIC | 2.200/7.742 (28,4%) | 300 s (corte) | estimado ~18 min |
| biblioteca ATIs | parcial | 280 s (corte) | raspagem viva, sem erro |
| congresso MG | **falha** | 0,5 s | `DadosAbertosBrasil` ausente |
| Transferegov | **falha** | 3,4 s | HTTP 404 no `detru` |
| FUNAI WFS | **falha** | ~7 min | 403 em todas as 8 tentativas |
| Vale/B3 (conexão) | 200, 102 MB | — | não baixado |
| ANM (hosts) | `sigmine.anm.gov.br` sem DNS; `dadosabertos.anm.gov.br` 200 | — | o coletor novo usa o host que responde |

## Consertos aplicados

| Arquivo | Mudança |
|---|---|
| `scripts/rotina-coletas.mts` | (a) filhos TS herdam `RADAR_PYTHON` apontando para `etl/betim/.venv/Scripts/python.exe` quando o venv existe — conserta a classe `ModuleNotFoundError: pandas`; os coletores `.py` e a varredura CPF continuam no `py -3`; (b) `publicarDadosColetados` publica **só** os arquivos da rodada (antes copiava os `caminhoArquivo` de todos os 17 slugs, podendo arrastar dado mexido por outra sessão) |
| `scripts/coletar-comunicabr.mts` | `DESTINO` passa a ser `apps/web/public/data/comunicabr-<uf>.json` — mesmo arquivo que `lib/comunicabr/mg.ts`, `gerar-api-publica.mjs` e `gerar-indice-busca.mts` leem |
| `scripts/executar-rotina-madrugada.ps1` | passo 4 deixa de ser `--listar` e passa a coletar as duas diárias seguras (`sigbm-barragens`, `noticias-desastres`), com publicação após a varredura CPF |

Verificações: `rotina-coletas --listar` carrega; `--fonte sigbm-barragens --seco` exit 0 (39,1 s);
`--fonte noticias-desastres --seco` exit 0 (41,3 s); sintaxe do `.ps1` validada com o parser do
PowerShell; nenhuma dependência nova; nenhum dado bruto coletado para o repositório.

## Bloqueios e o que não foi verificado

- **Deploy (R5)**: o conserto exige **uma publicação com `--forcar-deploy`** para regravar
  `logs/ultima-contagem.json` com o patamar novo (690 páginas). É ato de operação/deploy e não
  foi feito nesta triagem. Enquanto isso, o site segue em 01/10.
- **Publicação automática não exercitada**: o caminho `publicarDadosColetados` foi revisado e o
  script roda em `--seco`, mas não houve push de dado nesta triagem de propósito.
- **Artefatos com dois destinos** (CGE, AJRI, inspeções, GTAC, SIGMINE): precisam de decisão sobre
  qual arquivo é o oficial e de um gerador de carimbo legível pelo vigia (`geradoEm`).
- **Fontes bloqueadas**: Transferegov (404), FUNAI (403), `DadosAbertosBrasil` (dependência),
  SIGMINE (camada sem gerador), INCRA (fora de agenda).
- **Não medido**: FGV, AJRI, Vale (download completo), reflexo das 853 cidades no sitemap
  (fora do escopo desta pendência).

## Ordem sugerida

1. Dono/operação: uma rodada `npx tsx scripts/rotina-local.mts --forcar-deploy` para destravar o site.
2. Dev: agendar semanal `ibama-licencas-sancoes`, `biblioteca-atis`, `biblioteca-desastres`,
   `cnj-inspecoes`; mensal `salic-rouanet`, `cge-decisoes-lai`, `gtac-semad`, `congresso-mg`
   (depois das dependências) e `vale-b3-cvm` com faixa de anos.
3. Dev: consolidar os artefatos duplicados e carimbar os geradores `.ts` com `geradoEm` em JSON
   lateral, para o vigia medir o que o coletor realmente escreve.
