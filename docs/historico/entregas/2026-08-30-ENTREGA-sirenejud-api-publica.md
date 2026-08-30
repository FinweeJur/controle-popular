# 2026-08-30 — ENTREGA: SIRENEJud nas frentes + API pública v1 + catálogo dados.gov.br

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-30
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [FONTES.md](../../06-fontes/FONTES.md), [DADOS-GOV-BR.md](../../06-fontes/DADOS-GOV-BR.md), [PRODUTO.md](../../01-produto/PRODUTO.md), [ESTADO.md](../../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** SIRENEJud, CNJ, API pública, OpenAPI, Swagger UI, dados.gov.br, globo 3D, comarca

## Sumário

- [O que foi pedido](#o-que-foi-pedido)
- [O que foi entregue](#o-que-foi-entregue)
- [Medições da entrega](#medições-da-entrega)
- [As três armadilhas que a fonte escondia](#as-três-armadilhas-que-a-fonte-escondia)
- [O que ficou fora (fase 2)](#o-que-ficou-fora-fase-2)

## O que foi pedido

Quatro frentes, numa sessão: integrar os dados do [SIRENEJud](https://sirenejud.cnj.jus.br/home) nas páginas de Meio Ambiente e de Judiciário e no mapa; desenhar uma API pública no modelo do [foco-cidadao.com.br/docs](https://foco-cidadao.com.br/docs); analisar o catálogo [dados.gov.br](https://dados.gov.br/dados/) (o que já usamos, o que vale integrar); e atualizar o README.

## O que foi entregue

1. **Coletor SIRENEJud** — `etl/betim/etl/apis/sirenejud_cnj.py`: baixa o parquet oficial em massa do S3 público do CNJ e agrega por comarca (MG) e por UF/tribunal (Brasil). Só contagens e tempos — nomes de partes nem são lidos ("conta, nunca teor").
2. **`/ambiental/judiciario`** — processos ambientais por município de MG: cartões, gráfico SVG inline, filtro, ordenação por coluna, CSV do filtrado (`;` + BOM UTF-8). Tabela grande vai como asset (`/data/sirenejud-mg.json`) para painel de cliente, nunca como props.
3. **`/judiciario/sirenejud`** — recorte nacional por UF e tribunal, explicitando que é a mesma base-mãe (DataJud) do Justiça em Números.
4. **Camada `processos-ambientais-cnj` no globo 3D** — um polígono por comarca (malha IBGE), grupo "pistas". Sentinelas do painel atualizadas (41→42 linhas, 45→46 fontes, id novo no contrato público de deep-links).
5. **API pública v1 estática** — `/api` (Swagger UI 5.27.1 vendorizado, com "Try it out"), `/api/openapi.yaml`, `/api/v1/{manifesto,status}.json` e 14 datasets, tudo gerado no prebuild por `apps/web/scripts/gerar-api-publica.mjs`. Sem chave; DataJud fora de propósito (licença veda derivados); contrato estável, quebrante vira v2.
6. **`docs/06-fontes/DADOS-GOV-BR.md`** — uso atual do catálogo federal (Transferegov/dETRU, CKAN MMA, dados.mg.gov.br), a pendência do token expirado e sugestões por frente com prioridades (SIGBM/ANM, licenças e julgamentos IBAMA, florestas públicas SFB, CNPJ).
7. **README.md reescrito** (URL certa, frentes, stack, API) e **README.en.md** sincronizado.

## Medições da entrega

| Número | O que é |
|---|---|
| 1.460.581 | processos ambientais no arquivo do SIRENEJud (Brasil) |
| 322.842 | deles em Minas Gerais (TJMG 280.480, TRF6 27.228, TRF1 15.134) |
| 298 | comarcas de MG com processos, 298/298 casadas com a malha do IBGE |
| 108.612 / 51.442 / 5.798 | Governador Valadares (efeito Mariana), Belo Horizonte, Ipatinga |
| 07/07/2025 | data do arquivo público do CNJ — a ressalva que viaja colada a todo número |
| 14 | datasets na estreia da API v1 |
| 1.093 + 141 | testes verdes (vitest + globo) na validação final |

## As três armadilhas que a fonte escondia

1. **O campo `cod_ibge` do arquivo não é o código IBGE** — é o código interno da comarca do órgão julgador (Belo Horizonte vem `583`, Governador Valadares `1929`). O IBGE real foi casado por nome normalizado contra a malha municipal (a fonte já entrega os nomes sem acento); quem não casasse entraria com `cod_ibge: null` e reportado, nunca forçado.
2. **Datas-sentinela** — `2400-01-01` é nulo e há anos como 1904: 1.007 registros contaminariam séries e médias; contam-se em `anos_anomalos` e não entram nas séries.
3. **Atualização irregular** — o download em massa estava 14 meses parado quando medido; a ABJ já documentou o download quebrado em 2022. A data do arquivo está no JSON, na tela e no `aviso` da camada do globo.

## O que ficou fora (fase 2)

- Shapefiles ambientais do SIRENEJud (`meioambiente-shape.zip`, 77 MB) — geometria do local do dano, quando existir (obrigatória só desde 2021).
- Renovar `DADOS_GOV_BR_API_TOKEN` (destrava também a frente "incentivo ao esporte", ESTADO.md item 15).
- Integrações priorizadas do catálogo: SIGBM/ANM, licenças e julgamentos do IBAMA, florestas públicas SFB, CNPJ/Receita.
- `next build` completo não rodou nesta sessão (depende de banco); validação foi tsc + vitest + testes do globo + guardas de dado pessoal.
