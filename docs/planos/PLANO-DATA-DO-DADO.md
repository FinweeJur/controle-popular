# PLANO — Data da coleta visível em toda página e porteiro/vigia na CI

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-15
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [PLANO-CI-RAG-INGESTAO-UNIDADES.md](PLANO-CI-RAG-INGESTAO-UNIDADES.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** data de coleta, rastreabilidade, vigia, porteiro, catraca, geradoEm, frescor do dado, ETL

## Sumário

- [Execução (15/10/2026)](#execução-15102026-mesma-tarde-do-plano)
- [Propósito](#propósito)
- [O que existe hoje (medido 15/10)](#o-que-existe-hoje-medido-1510)
- [Princípio inegociável](#princípio-inegociável)
- [Fase 0 — componente `DataColeta` (1 h)](#fase-0--componente-datacoleta-1-h)
- [Fase 1 — data de geração em todo JSON de dado (2 h de auditoria)](#fase-1--data-de-geração-em-todo-json-de-dado-2-h-de-auditoria)
- [Fase 2 — rollout página a página](#fase-2--rollout-página-a-página)
- [Fase 3 — posts do blog: data da FONTE, não só a de publicação](#fase-3--posts-do-blog-data-da-fonte-não-só-a-de-publicação)
- [Fase 4 — porteiro na CI (catraca, sem workflow novo)](#fase-4--porteiro-na-ci-catraca-sem-workflow-novo)
- [Fase 5 — vigia de coletores (o dono pergunta "o ETL está vivo?")](#fase-5--vigia-de-coletores-o-dono-pergunta-o-etl-está-vivo)
- [Fase 6 — travar no §8 como oitava qualidade (palavra final do dono)](#fase-6--travar-no-8-como-oitava-qualidade-palavra-final-do-dono)
- [Critérios de aceite](#critérios-de-aceite)
- [Riscos honestos](#riscos-honestos)

## Execução (15/10/2026, mesma tarde do plano)

Fases 0, 1, 2 (primeira onda), 4 (D1), 5 e 6 **executadas**; D2 (browser) e a
segunda onda do rollout ficam para a próxima sessão.

| Fase | Estado | Medido |
|---|---|---|
| 0 | ✅ | `DataColeta.tsx` + `lib/fontes/dataDoArquivo.ts` (leitor tolerante: 8 nomes de campo + 2 apelidos medidos) + 10 testes |
| 1 | ✅ auditado | 28 arquivos do registry: 19 já datados, 5 writers carimbados agora (`dumpar-modulo-dados.mts`, `coletar-convenios-federais-mg.mts`), 3 isentos por estática, e 8 sem carimbo — 3 geojson sem writer no repo (decisão do dono: criar coletor ou isentar), `sinesp-vde-2026` é snapshot manual, e os apelidos `ultima_atualizacao`/`atualizado_na_fonte` viraram tolerância no leitor (renomear é decisão do dono) |
| 2 | 1ª onda ✅ | 11 rotas datadas visíveis; 3 isentas com motivo (banco/geojson/bundle); páginas de banco ficam para a fase da data consultada; segunda onda segue o catálogo com o porteiro D1 contando a dívida |
| 4 D1 | ✅ | `scripts/checar-data-coleta.py` + catraca `padrao-catraca-datas.json` (14 rotas; regressão = vermelho, dívida = aviso) + 2º step no `padrao-pagina.yml` |
| 4 D2 | ⏳ | browser-asserção Playwright — próxima sessão (molde do `verificar-radio-navegacao.py`) |
| 5 | ✅ | `scripts/vigia-coletores.mts` + `vigia-coletores.yml` (cron 13:00 UTC). Verdade exposta na primeira rodada: **13 fontes atrasadas, 8 sem carimbo** — catraca nascida com as dívidas registradas; vermelho só para regressão |
| 6 | ✅ | §8 do AGENTS.md ganhou a oitava qualidade; PADRAO-PAGINA-WIKI passou de "seis" (estava atrás!) para "oito" com as linhas 7 e 8 + checklist |

## Propósito

O leitor — e o dono — não consegue hoje responder, na tela, "de quando é
este dado?" nem "se o coletor parou, eu vejo?". Este plano põe a **data da
informação / coleta na fonte** visível em toda página de dado e em todo
post, e acrescenta à CI um **porteiro** (a regra entra no diff) e um
**vigia** (o atraso de qualquer coletores fica vermelho, com lag medido).

## O que existe hoje (medido 15/10)

| Item | Medida | Onde |
|---|---|---|
| Páginas `page.tsx` no app | **314** | `apps/web/app/` |
| Páginas com QUALQUER marcador de data | **51** (~16%) | `rg "coletado em\|dados de\|Atualizado em\|geradoEm\|DataColeta"` |
| Posts no blog | **235**, todos com `publicadoEm`/`atualizadoEm` visíveis ("Publicado em X · editado em Y") | `app/noticias/[slug]/page.tsx:210` |
| Dado versionado com data de geração | **160** JSONs têm `geradoEm`/`gerado_em`/`atualizado_em`/`coleta` | `apps/web/data/` + `public/data/` |
| Registro de fontes com frequência | **34** `FonteDef` com `caminhoArquivo` + `frequenciaAtualizacao` (tempo-real/diária/semanal/mensal/anual/estática) | `lib/fontes/registry.ts` |
| Porteiro de padrão | já existe, com **catraca** (só pode melhorar) | `.github/workflows/padrao-pagina.yml` → `scripts/verificar-padrao-pagina.py --catraca docs/relatorios-automacao/padrao-catraca.json` |

Ou seja: a matéria-prima da data já existe em 2/3 dos JSONs. Falta
**uniformizar o campo**, **renderizar na tela** e **cobrar na CI**.

## Princípio inegociável

**A data exibida vem do dado, nunca do dedo.** Página que imprime
`"coletado em 15/08/2026"` como literal é mentira em potencial — a fonte
renova e a tela não. Aceito apenas data derivada do campo de geração do
JSON (ou do `atualizadoEm` da matéria). É a mesma disciplina de
"o número vem do dado" do §8 do AGENTS.md, estendida ao tempo.

## Fase 0 — componente `DataColeta` (1 h)

Um componente, zero abstração a mais:

- `apps/web/app/components/DataColeta.tsx`: props `{ coletadoEm: string; fonte?: string; competencia?: string }`.
- Renderiza uma linha visível, `text-sm` ou maior (§5.10), usando `<time dateTime>`:
  `Dado coletado em 15/08/2026 · fonte: ComunicaBR/MF (repasses até abril/2026)`.
- Cabeçalho §5.9 (papel, por que existe, fonte).
- Reuso obrigatório: nada de cada página inventar o seu <p> de data.

## Fase 1 — data de geração em todo JSON de dado (2 h de auditoria)

1. Lista: quais dos 160+ JSONs têm campo de data e em qual nome.
2. Convenção única: `geradoEm` (ISO) no cabeçalho de todo dump futuro;
   geradores/coletores que escrevem JSON carimbam a data na escrita
   (`new Date().toISOString()`), como já fazem `coletar-cambio.mts` e o
   `exportar-finetuning`.
3. Sem re-coleta não se digita: JSON sem data e coletor morto recebe a
   pendência registrada no plano, não um carimbo falso.
4. Renomeações adiadas (YAGNI): o leitor de data aceita os nomes atuais;
   o normalizador fica num util pequeno `lib/fontes/dataDoArquivo.ts`.

## Fase 2 — rollout página a página

- **Conjunto de trabalho:** páginas que publicam dado (estimativa ~250 das 314; as de instrumento — `/sobre`, hub de links, login de formulário — são isentas com justificativa na lista).
- **Mecânica por página:** importar `DataColeta`, uma linha abaixo da descrição do `<h1>` (ou no cartão de topo já existente), com `coletadoEm={dataDoArquivo(FONTE)}`.
- **Paralelização (regra do dono):** um subagente por arquivo de saída, eixos por vez (Terra → Direitos → Estado → Central); páginas com mais de uma fonte mostram a mais velha: `última coleta: DD/MM/AAAA`.
- **Gate por sessão:** `tsc` + `eslint` + `padrao-pagina` + `DataColeta presente` — e o §5.14 (cabe em 390 px porque é uma linha de texto simples).

## Fase 3 — posts do blog: data da FONTE, não só a de publicação

- "Publicado em / editado em" já é visível e verificado (`titulos.test.ts` cuida da caixa). Falta a **competência do dado citado**: campo novo nos posts com número, `dadosColetadosAte` (ISO, dia/mês), impresso ao lado do selo de IA.
- Post sem `dadosColetadosAte` e com R$/% no corpo → porteiro (Fase 4) marca; preenchimento a partir da data do JSON de origem de cada número (o coletor-câmbio/repasse/ComunicaBR carimba a sua).
- Quem regenera post (radar, agregados) escreve `geradoEm` + `dadosColetadosAte` no próprio dump de `noticias-portal.json` — mão humana não digita.

## Fase 4 — porteiro na CI (catraca, sem workflow novo)

Estender o que já existe (pattern do repo):

- `scripts/verificar-padrao-pagina.py` ganha a checagem **D1**: para toda
  página da lista de dados, presença de `<DataColeta` no fonte (import +
  uso) OU marcação de isenção com motivo no registro.
- Checagem **D2** (anti-fraude, runtime): Playwright (molde
  `verificar-radio-navegacao.py`) sobe o build no CI e varre ~20 páginas
  âncora + 2 posts, asserting `document` contém regex
  `/coletad[oa] em \d{2}\/\d{2}\/\d{4}|Publicado em \d{2}\/\d{2}\/\d{4}/`
  e que `<time>` existe — grep engana, browser não.
- **Catraca nova** (`docs/relatorios-automacao/padrao-catraca-datas.json`):
  contagem de pendências só desce; subir o número exige justificativa no
  PR. É o que impede o rollback silencioso.
- Roda no `padrao-pagina.yml` (push/PR), sem gastar cota de deploy.

## Fase 5 — vigia de coletores (o dono pergunta "o ETL está vivo?")

Um job novo (workflow `vigia-coletores.yml`, cron `0 13 * * *` UTC —
depois das ETLs) e um script, sem inventário manual:

1. Lê as **34** `FonteDef` do `lib/fontes/registry.ts`
   (`caminhoArquivo` + `frequenciaAtualizacao`).
2. Abre cada arquivo de dado, extrai `geradoEm` com
   `dataDoArquivo()` (Fase 1).
3. Calcula **lag em dias** e compara à régua da frequência:
   tempo-real > 2 d, diária > 3 d, semanal > 10 d, mensal > 40 d,
   anual > 400 d; `estática` pula.
4. Saída: tabela medida (fonte, esperado, último carimbo, lag, veredito)
   em `docs/relatorios-automacao/vigia-coletores-status.json` +
   `##[error]` quando qualquer fonte estourar (CI vermelha = alerta que
   não se apaga sozinho). Aviso no Telegram em 2-3 linhas quando o token
   voltar (§12).
5. É o "dispara só com o dono" invertido: o vigia não coleta, só lê o
   disco — custo zero, roda todo dia sem VM.

## Fase 6 — travar no §8 como oitava qualidade (palavra final do dono)

Proposta de redação para `AGENTS.md` §8 (8. **Rastreável no tempo**):

> Página de dado e post com número mostram a data da coleta da fonte,
> visível e derivada do dado (`<time>`, `geradoEm`), com o corte por
> programa quando a competência difere. Data digitada na mão é tão dano
> quanto número digitado na mão.

A regra entra no `PADRAO-PAGINA-WIKI.md` junto; o porteiro (Fase 4) é a
fiscalização automática da regra, o vigia (Fase 5) é a prova de que o
coletor trabalha.

## Critérios de aceite

1. Zero páginas de dado fora da catraca sem isenção justificada.
2. Vigia: 34 fontes medidas, lag e veredito por fonte no JSON de status;
   workflow vermelho quando alguma atrasa.
3. Blog: todo post com valor tem `dadosColetadosAte` visível.
4. `DataColeta` cobre as 20 páginas âncora com browser-asserção D2.
5. §8 com oitava qualidade aprovada + `validar-documentacao.py` verde.

## Riscos honestos

- **Conformidade falsa** (import de componente sem uso visível): D2 de
  browser é o contrapeso; D1 é só peneira rápida.
- **314 páginas não são todas de dado**: a lista de trabalho sai do
  registro de fontes + import de JSON/lib de dado, não de intuição.
- **Coletores mortos** (ex.: as ETLs Heroku `skipped` desde 08/10): o
  vigia vai ficar vermelho neles de propósito — é a primeira entrega
  honesta do status-quo. Decisão de conserto é do dono (pendência já
  registrada no PLANO-CI-RAG).
- **Dado multi-fonte com cortes diferentes** (ComunicaBR: 5 competências):
  mostrar a mais velha e a lista por programa; omitir a divergência é
  esconder que o dado é velho.
