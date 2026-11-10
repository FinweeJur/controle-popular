# Expansao para as 853 cidades de MG - Fase 1

> **Tipo:** RELATORIO
> **Dominio:** cidades
> **Ultima medicao:** 2026-11-08
> **Leitura estimada:** media (8-12 min)
> **Relacionados:** [expansao-fase0-2026-11-08.md](expansao-fase0-2026-11-08.md), [FONTES.md](../06-fontes/FONTES.md)
> **Palavras-chave:** expansao, municipios, MG, AMM, SIGPub, coletor, parser, layout, fase 1

## Sumario

- [Resumo](#resumo)
- [1. O que mudou no site](#1-o-que-mudou-no-site)
- [2. Correcao no coletor](#2-correcao-no-coletor)
- [3. Testes de regressao](#3-testes-de-regressao)
- [4. Piloto de dentro do repo](#4-piloto-de-dentro-do-repo)
- [5. Varredura de chamadores](#5-varredura-de-chamadores)
- [6. Riscos e o que nao foi verificado](#6-riscos-e-o-que-nao-foi-verificado)
- [7. Reprodutibilidade](#7-reprodutibilidade)

## Resumo

O coletor SIGPub do repo voltou a coletar. A busca da AMM-MG mudou de
formulario e de markup em novembro/2026; o modulo passou a ler o layout novo
por padrao e manteve o antigo como fallback. As cinco cidades-piloto da Fase 0
foram recoletadas pelo proprio modulo, sem wrapper externo, com os mesmos
580 registros e os mesmos 4.455.033 bytes, zero erro.

| Entrega | Resultado |
|---|---|
| Layout novo | `busca_avancada[entidade]`, datas ISO, `ul.lista-materias > li.materia-card` |
| Layout antigo | `entidadeUsuaria`, `dd/mm/aaaa`, `_token`, `#datatable` — fallback |
| Teste de regressao | 13 casos novos em `etl/betim/etl/camaras/sigpub_test.py` |
| Suite de coleta | 37 testes em `etl/camaras` + diario; 94 no ETL inteiro |
| Piloto (out/2026) | 580 registros, 25 requisicoes, 4.455.033 bytes, zero erro |
| Chamadores | so `scripts/coletar-diario-municipios.mts` executa o modulo; nenhum monta busca propria |

## 1. O que mudou no site

Medido ao vivo em 08/11/2026 com GET direto em
`https://www.diariomunicipal.com.br/amm-mg/pesquisar`:

| Ponto | Ate outubro/2026 | Em 08/11/2026 |
|---|---|---|
| Filtro de entidade | `busca_avancada[entidadeUsuaria]` | `busca_avancada[entidade]` |
| Datas | `dd/mm/aaaa` | ISO `aaaa-mm-dd` (`input type=date`) |
| Token CSRF | `busca_avancada[_token]` obrigatorio | nao existe mais no formulario |
| Resultado | `table#datatable > tbody > tr` | `ul.lista-materias > li.materia-card` |
| Link da materia | `/amm-mg/load/<HASH>` (302) | `/amm-mg/materia/<HASH>` (direto) |
| Total | "de 196 registros" | "de 213 materias" |
| Pagina | `busca_avancada[page]` | `busca_avancada[pagina]` |
| Sessao | cookie + token da mesma resposta | desnecessaria: GET direto devolve resultado |

O erro que bloqueava a Onda 1 era exatamente o token:

```
RuntimeError: token CSRF (busca_avancada[_token]) nao encontrado em
https://www.diariomunicipal.com.br/amm-mg/pesquisar
```

## 2. Correcao no coletor

Arquivo unico de codigo: `etl/betim/etl/camaras/sigpub.py`. Nenhum chamador
foi alterado.

- `_detectar_layout(corpo)` — reconhece "novo", "antigo" ou None. O layout
  novo e tentado primeiro; None vira `BloqueioSigpub`, nunca "0 materias".
- `_extrair_linhas` — despacha por resposta: cartoes no layout novo, tabela
  no antigo. Uma pagina antiga no meio de uma rodada nova nao vira zero.
- `_linha_do_cartao` / `_extrair_linhas_tabela` — mesmas chaves nos dois
  layouts: `hash`, `entidade`, `titulo`, `orgao`, `data_circulacao`, `link`.
- `_extrair_total_declarado` — le o resumo em `<strong>` do layout novo e o
  texto de "registros" do antigo.
- `_data_iso` — aceita `dd/mm/aaaa` e `dd-mm-aaaa`.
- `_buscar_pagina` — monta parametros do layout vigente; se a resposta nova
  vier no formato antigo, troca o estado, obtem o token e repete uma vez.
- `_buscar_mes` — para ao atingir o total declarado, sem requisicao extra de
  sondagem; paginacao incompleta continua levantando.
- `_montar_linha` — `link_fonte` usa o href servido (`/materia/<hash>` ou
  `/load/<hash>`); `chave_natural` continua `sigpub:<hash>`.
- `_buscar_detalhe_de_uma` — segue o link do layout, nao monta `/load/` fixo.
- `_iniciar_sessao` — devolve `layout` + `token` (token so no layout antigo).
- `USER_AGENT` — alinhado a regra do repo: `finweejur/github artur colito`.

O `--sondar` ganhou tres linhas de resumo (requisicoes, bytes UTF-8 e tempo de
coleta) para medir sem wrapper. Nada disso entra em `sync()` nem no banco.

Contrato de dado mantido: so metadados publicos (titulo, tipo, data, orgao,
entidade, link). Texto integral continua opt-in em `--com-detalhe` e nao foi
usado no piloto; CPF e nome de pessoa nao sao extraidos nem gravados.

## 3. Testes de regressao

Arquivo novo: `etl/betim/etl/camaras/sigpub_test.py` (13 casos, fixtures HTML
sanitizadas e ficticias). Cobre:

| Caso | Prova |
|---|---|
| Layout novo com 2 cartoes | hash, titulo, entidade, orgao, data e link |
| Layout antigo | tabela, data com hifen, ausencia de `link` |
| Pagina vazia | lista vazia, sem bloqueio |
| HTML inesperado | `BloqueioSigpub`, nao "0 materias" |
| Total | 2 no layout novo, 1 no antigo |
| Data | barra e hifen viram ISO |
| Linha montada | `/materia/` no novo, `/load/` no antigo, chave `sigpub:` |

Saidas:

```
python -m unittest etl.camaras.sigpub_test -v
Ran 13 tests ... OK

python -m pytest etl/camaras etl/diario_test.py etl/diario_adversarial_test.py -q
37 passed in 0.70s

python -m pytest etl -q
94 passed in 1.53s
```

Nao existe `TESTING.md` no repo; o comando usado segue o padrao dos testes
`*_test.py` de `etl/betim` e roda em `etl/betim`.

## 4. Piloto de dentro do repo

Comando oficial, sem banco, uma cidade por vez:

```
cd etl/betim
python -m etl.camaras.sigpub --sondar --entidade-usuaria <ID> \
  --rotulo-entidade <Nome> --desde 2026-10 --ate 2026-10
```

Periodo: outubro/2026 (mes fechado). Tempo medido dentro do processo, entre o
inicio e o fim de `_coletar_entidade`; bytes sao a soma dos corpos UTF-8.

| Cidade | IBGE | Entidade AMM | Registros | Tempo | Bytes | Reqs | Erro |
|---|---|---:|---:|---:|---:|---:|---|
| Abadia dos Dourados | 3100104 | 24197 | 31 | 5,55 s | 302.817 | 2 | - |
| Bocaiuva | 3107307 | 2192382 | 91 | 9,42 s | 699.391 | 4 | - |
| Formiga | 3126109 | 11944 | 343 | 30,11 s | 2.558.112 | 14 | - |
| Boa Esperanca | 3107109 | 833 | 43 | 5,50 s | 350.836 | 2 | - |
| Catas Altas | 3115359 | 566 | 72 | 7,58 s | 543.877 | 3 | - |
| **Total** | | | **580** | **58,16 s** | **4.455.033** | **25** | **0** |

Comparacao com a Fase 0 (wrapper temporario fora do repo):

| Metrica | Fase 0 | Fase 1 (repo) | Diferenca |
|---|---:|---:|---:|
| Registros | 580 | 580 | 0 |
| Bytes | 4.455.033 | 4.455.033 | 0 |
| Requisicoes | 25 | 25 | 0 |
| Tempo | 48,13 s | 58,16 s | +10,03 s (+20,8%) |

O volume e identico byte a byte e o numero de requisicoes e o mesmo: a
diferenca de tempo nao vem de coleta extra. O wrapper da Fase 0 nao foi
preservado, entao a causa exata do delta (parsing com lxml, ambiente ou
aquisicao) nao foi isolada — o que importa para a Onda 1 e que o custo por
requisicao segue o mesmo.

As camaras das cinco cidades continuam so localizadas na AMM (IDs 40180,
3981901, 9715, 4077813, 93469), nao coletadas — mesmo escopo da Fase 0.

## 5. Varredura de chamadores

```
git grep -n -E "entidadeUsuaria|busca_avancada\[_token\]|diariomunicipal\.com\.br|amm-mg" \
  -- ':!*.json' ':!*.jsonl' ':!*.md'
```

Resultado: nenhum outro ponto monta busca no SIGPub.

| Arquivo | Papel | Precisa mudar? |
|---|---|---|
| `etl/betim/etl/camaras/sigpub.py` | unico cliente HTTP da busca | sim — corrigido |
| `scripts/coletar-diario-municipios.mts` | agenda; executa `python -m etl.camaras.sigpub --id-municipio` | nao — herda a correcao |
| `scripts/rotina-coletas.mts` | agendador da madrugada | nao |
| `scripts/processar-diarios-municipais.mts` | mapeia links estaticos ja coletados | nao — nao faz HTTP |
| `apps/web/lib/fontes/registry.ts` | metadados da fonte | nao |
| `apps/web/lib/db/cidades-do-build.ts`, migrations | seeds de URL/entidade | nao |
| `apps/web/lib/betim/diario.ts` | le bundle JSON congelado | nao |

O caminho de producao `sync()` usa o mesmo `_buscar_mes`/`_buscar_pagina`
corrigidos; nao ha parser paralelo.

## 6. Riscos e o que nao foi verificado

- **Layout antigo nao foi exercitado ao vivo**: a fonte so serve o novo em
  08/11/2026. O fallback esta coberto por fixture, nao por resposta real.
- **`sync()` com banco nao rodou**: o worktree nao tem `DATABASE_URL`; o
  piloto usou `--sondar`, o modo oficial sem banco. A logica de rede e a
  mesma do `sync()`.
- **Semantica do "total"**: o numero anunciado confere com as cinco cidades,
  mas um mes com falha silenciosa de paginacao continua levantando erro (de
  proposito), nao gravando subcoleta.
- **LGPD**: o piloto nao gravou dado bruto. Texto integral continua opt-in;
  a varredura de CPF/nome sobre `atos_diario` segue pendente para a Onda 1.
- **Proxima mudanca do site**: `_detectar_layout` devolve None e o coletor
  aborta com bloqueio, em vez de contar zero.
- **Camaras**: 831 hosts SAPL seguem nao testados; a Fase 1 so fechou o
  diario AMM.

## 7. Reprodutibilidade

```
# testes
cd etl/betim
python -m unittest etl.camaras.sigpub_test -v
python -m pytest etl -q

# piloto de uma cidade
python -m etl.camaras.sigpub --sondar --entidade-usuaria 566 \
  --rotulo-entidade CatasAltas --desde 2026-10 --ate 2026-10

# producao (exige DATABASE_URL lido do cwd etl/betim)
python -m etl.camaras.sigpub --id-municipio 3121605 --partes prefeitura --desde 2026-10 --ate 2026-10
```

IDs do piloto vieram de `apps/web/data/expansao-fontes-mg.json` (Fase 0),
nunca de chute.
