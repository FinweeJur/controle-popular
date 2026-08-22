# OPERAÇÃO — coletar, construir e publicar o portal

Este arquivo é o procedimento de operação do portal: quem publica, como coletar, como publicar, onde vivem as credenciais e o que já quebrou.

## Quem publica, e de onde

| | |
|---|---|
| Publica | **somente o home-pc** — é a única máquina com Postgres local |
| Banco | Postgres local em `127.0.0.1:5432` (dump restaurado); Neon em HTTP 402 até 01/09 |
| Tarefa do Windows | `Controle Popular - rotina diaria`, 06:00, `StartWhenAvailable`, teto 4 h |
| Log | `logs/rotina-<carimbo>-<pid>.log` — a última linha diz `publicado.` ou `ABORTADO:` |
| Conferir | `Get-ScheduledTaskInfo -TaskName 'Controle Popular - rotina diaria'` (resultado 0 = publicou) |

Nesta máquina de desenvolvimento **não dá para buildar nem medir `.cache`**: não há banco, e a medida de tamanho de rota acontece no build. Se a tarefa depender disso, diga em vez de estimar.

## Ciclo de coleta

Coletores moram em `scripts/` e os ETL em `etl/`; a rotina os executa lendo os workflows `etl-*.yml`. As regras abaixo valem para todo coletor:

1. Pausa entre requisições (≥ 1 s onde a fonte exige), User-Agent que identifica o projeto honestamente (nunca UA de navegador falso), retomada por checkpoint e **fora da CI**.
2. Leia o `robots.txt` da fonte e **registre a decisão no cabeçalho do coletor** quando optar por seguir mesmo assim — há um caso no repositório (`www18.fgv.br` responde `Disallow: /`), feito a pedido do dono, com escopo reduzido e o raciocínio escrito.
3. Varra dado pessoal **antes de commitar** dado coletado: `apps/web/lib/sem-cpf-no-repo.test.ts` valida por mod-11 todo campo de texto em código/doc, e `scripts/checar-dado-pessoal-em-dado.py` varre o DADO ingerido — os diretórios em `DIRETORIOS_DADO`, no topo do script; ambos rodam no pre-push e na CI. Coletor novo que grava JSON a cada rodada entra em `DIRETORIOS_DADO` (nem o hook nem a CI passam `--extra` — essa flag só cobre um dump avulso de UMA rodada, rodado à mão). CPF em ementa oficial é redigido na própria ingestão.

O radar de notícias do Paraopeba roda **dentro** da rotina, antes do build — nunca existe coleta que não foi publicada. Regras medidas: guarda só título, veículo, data e link (nunca o corpo da matéria); coleta vazia não sobrescreve o arquivo bom; a data `gerado_em` aparece na tela; TJMG e MPMG ficaram de fora (RSS respondem 404 — medição em 16/08, remeça antes de decidir com ele).

## Publicar — passo a passo

### Rotina diária no home-pc (o caminho normal)

```bash
npx tsx scripts/rotina-local.mts --listar   # confira o que rodaria hoje, sem executar
npx tsx scripts/rotina-local.mts            # ETL → radar → build → travas → deploy
```

- `--sem-deploy` para antes de publicar; `--so-build` pula o ETL; `--so-etl` só coleta; `--dispatch` roda tudo ignorando a cadência; `--workflow`/`--job` limitam a rodada; `--forcar-deploy` atravessa o aviso de queda.
- A rotina **lê** os workflows em vez de repetir comandos. Os blocos `schedule:` **ficam** — são a fonte da cadência, apagá-los quebra a rotina em silêncio; um `if:` de formato desconhecido **aborta** em vez de pular.
- O bash é o do Git, resolvido a partir de onde o `git` está; `system32\bash.exe` (WSL) é recusado de propósito.
- Antes de tudo ela exige `DATABASE_URL` apontando para 127.0.0.1 em `etl/betim/.env` e `apps/web/.env.local` — nunca Neon (um build local com Neon já levou HTTP 402).
- Pré-requisitos da máquina: Postgres em 5432, venv em cada `etl/*`, Chromium do Playwright (`playwright install chromium`, sem `--with-deps`), `wrangler login` feito.

As travas que impedem publicar um site errado (o exit code do build não é o sinal de saúde — a contagem é):

| Trava | Valor | Significado |
|---|---:|---|
| Piso de páginas | < 1.000 aborta | 21 = build sem banco; 1.471 era o build correto (medição em 16/08 — remeça antes de decidir com ele) |
| Queda relativa | > 20% vs última aborta | pega tabela que esvaziou; `--forcar-deploy` atravessa o aviso |
| ETL inteiro no chão | 100% dos passos falham | é ambiente (bash, venv, credencial), não fonte — nada é construído |
| Asset grande | > 20 MiB avisa, > 25 MiB aborta | teto da Cloudflare; medido no build, antes de gastar o deploy |

### Build em outro PC (pedido pelo painel)

O pedido chega versionado em `apps/web/data/pedido-build.json`: quem pediu, por quê e o commit exato. Confira o `commitDoPedido` antes de buildar.

1. `git fetch` e `git checkout <commitDoPedido>` na máquina de build.
2. Restaure o dump no Postgres local (94 tabelas; sem pgvector, filtre as tabelas `embeddings` — nada no app as consulta). **Não confie no número da migration para saber o que falta — meça o estado do banco**: a numeração não é cronológica.
3. Crie `apps/web/.env.local` e `etl/betim/.env` com `localhost`, nunca Neon.
4. `npm ci` — nunca copie `node_modules` de uma máquina para outra.
5. `cd apps/web && npm run cf:deploy` — build + cache + publicação.

**O que nunca viaja entre máquinas:** `node_modules`, `.env*` com valor real, dumps, cookies de sessão de sites coletados, tokens. O `.env.example` versionado documenta as variáveis sem valores.

### GitHub Pages (legado)

Alvo alternativo, com gatilho **manual** e decisões em aberto — não é o caminho de publicação. O export estático fecha, mas mede 45.190 arquivos contra o teto de 20.000 (medição em 16/08 — remeça antes de decidir com ele): retomar o Pages exige resolver a emissão de payload RSC antes.

## Credenciais

| Onde | O quê |
|---|---|
| `apps/web/.env.local` | `DATABASE_URL` (localhost), `PAINEL_TOKEN` (painel de edição; fail-closed sem ele), `BETTER_AUTH_SECRET`, `RESEND_API_KEY` |
| `etl/*/.env` | `DATABASE_URL` de cada ETL |
| ambiente do wrangler | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`, ou `wrangler login` |

Nunca commit: `.env.local`, `.env`, dumps, cookies, tokens, chaves. Regra imutável: na máquina de build, `DATABASE_URL` é 127.0.0.1, ponto — o egress da Neon (~0,4 GB por rodada num teto de 5 GB/mês) era queimado exatamente por essa leitura.

## Payload de legislação

O corpus de legislação ambiental tem 15.318 normas (8.570 MMA/Conama, 370 CNDH, 4.077 Siam, 2.232 Semad, 69 ALMG — medição em 16/08, remeça antes de decidir com ele). O vocabulário de esfera é `municipal | estadual | nacional | internacional` — **`federal` não existe**; a tela escreve "federais" como rótulo e conta por fonte.

O handoff: a rota entregava o corpus inteiro como props de componente de cliente — 35,5 MiB contra o teto de 25 MiB por asset, com o texto real em 4,7 MiB (inflação de 7,5×). O deploy travava no fim e o site **parava no tempo**: ETL passava, build passava, só a publicação morria. Conserto no ar desde 15/08: tupla em vez de objeto, dicionários para vocabulário fechado (`situacao` com 11 valores, `tipo` com 53, `orgao` com 174), prefixo de link em dicionário — 4,99 MiB de cache, 4,71 MiB de RSC, com teste de ida-e-volta por igualdade profunda (trocar posição de tupla grava campo errado sem erro de tipo).

O teto continua valendo: 25 MiB por asset, 3 MiB gzip de bundle, 20.000 arquivos. A resposta durável é o **índice estático fatiado**: fatias por grupo em `public/busca-indice/**`, geradas por `scripts/gerar-indice-busca.mts` e consumidas por `lib/busca/indice.ts` — resolve `sp/educacao` (21 MiB) junto. Regra: acima de ~2 mil linhas, coleção **nunca** vai como props de cliente — serve do índice fatiado ou pagina no servidor (`TabelaEstatica`).

## Incidentes que afetam a operação

| Incidente | Efeito | Tratamento |
|---|---|---|
| Asset 35,5 MiB (payload de coleção) | deploy trava no fim; site para no tempo | preflight de tamanho na rotina (aviso 20 MiB, teto 25 MiB) |
| API responde 200 e mente | filtro ignorado, esqueleto com `nome_ibge: null` | valide o conteúdo, nunca o status |
| Código IBGE 6 × 7 dígitos | 6 é o de 7 sem verificador (`3106705` = Betim; `3106200` = BH) | case por código, nunca por nome |
| Cor medida em HSL vs OKLCH | paleta é OKLCH; transição de fundo congela o contraste | injete `transition: none` e meça no espaço certo |

A lista completa (incluindo a regra editorial: o número vem do dado, o modelo só embrulha) está no AGENTS.md — leia antes de tocar no repositório.

## Origem

Este arquivo absorveu, em 16/08/2026:

- `docs/_historico/rotina-local.md` — **ENTREGUE** (→ `docs/_historico/`): rotina local, travas e armadilhas viraram as seções acima.
- `docs/_historico/build-em-outro-pc.md` — **ENTREGUE** (→ `docs/_historico/`): virou a seção "Build em outro PC".
- `docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md` — **ENTREGUE** (→ `docs/_historico/`): virou a seção "Payload de legislação".
- `docs/_historico/RADAR-NOTICIAS-PARAOPEBA.md` — **ENTREGUE** (→ `docs/_historico/`): só o procedimento de coleta; a parte de fontes pertence ao doc de fontes.
- `docs/planos/deploy-github-pages.md` — **ATIVO** (→ `docs/planos/`): alvo alternativo com decisões em aberto; não é procedimento diário.