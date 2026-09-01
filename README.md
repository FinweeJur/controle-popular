# Controle Popular

> Read this in English: [`README.en.md`](README.en.md).

Portal independente de transparência pública. Junta dado oficial que já é
público mas está espalhado por dezenas de sistemas e o publica numa tela só,
por cidade e por tema, em português comum.

No ar: **[controlepopular.com.br](https://controlepopular.com.br)**
(fallback: [controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev))

**Todo número tem fonte, e toda estimativa mostra a taxa de erro ao lado.**
Quando a fonte não tem, a tela diz que não tem — lacuna é informação, não
defeito escondido.

## As seis frentes

| Frente | Rota | O que responde |
|---|---|---|
| Cidades | `/[municipio]` (`/sp`, `/bh`, `/betim`, `/diamantina`, `/aracuai`, `/itinga`) | Contratos, licitações, **diários oficiais municipais** com classificação temática determinística, repasses federais (ComunicaBR) e finanças |
| Congresso | `/congresso` | Proposições federais por tema, comissão e bancada de Minas Gerais |
| Judiciário | `/judiciario` | Composição dos tribunais, vacância, inspeções CNJ e processos ambientais (SIRENEJud) |
| Função Social da Terra | `/funcaosocialterra` (+ `/mapa`, `/alertas`) | Vazio cadastral do CAR no globo 3D, terras indígenas, territórios quilombolas e **387 Unidades de Conservação (CNUC/MMA)** |
| Paraopeba | `/paraopeba` | A reparação de Brumadinho: auditoria FGV/AECOM, repasse aos 853 municípios (R$ 1,64 bi), clipping e linha do tempo |
| ONSA · Observatório Nacional Socioambiental | `/ambiental` (+ `/paraopeba/vale`, `/ambiental/mariana`) | **Acordo de Mariana (R$ 677 mi em MG)**, **Observatório Vale S.A. (B3/CVM)**, barragens do país (SIGBM/ANM), normas federais (MMA/CNDH), processos ambientais na Justiça (SIRENEJud), licenças IBAMA, TACs do GTAC, decisões LAI/CGE e pauta do COPAM |

## Destaques de Arquitetura e Dados

- **Regra das 5 Coisas em Páginas com Muito Dado:** Gráfico SVG acessível (sem bibliotecas pesadas), cartões de topo com agregados, busca textual sem acento, filtros interativos (`TagChip`) e exportação em planilha CSV com BOM UTF-8 e separador `;`.
- **Privacidade Rigorosa por Algoritmo:** Sanitização e anonimização automática de CPFs de pessoas físicas via cálculo **Mod-11** antes de qualquer persistência em dados abertos (100% de conformidade LGPD).
- **Coletores Automatizados:** Esteira com monitoramento proativo via Bot Telegram (`scripts/rotina-coletas.mts`) e automações locais com Podman (`changedetection.io` e `n8n`).

## API pública

Os dados agregados do portal são servidos também como JSON aberto, sem chave:

- Documentação interativa (Swagger UI, com "Try it out"): **[`/api`](https://controlepopular.com.br/api)**
- Spec OpenAPI: `/api/openapi.yaml`
- Datasets: `/api/v1/` (contrato estável; mudança quebrante vira `/api/v2/`)

## Stack

Monorepo npm. Next.js 16 em `apps/web` (App Router), ETL em Python em `etl/`,
Postgres (Neon/local) para leituras no build e Cloudflare D1 para escritas ao
vivo. Deploy em Cloudflare Workers via OpenNext:

```bash
cd apps/web && npm run cf:deploy
```

Para rodar localmente: Node 22, Python 3.12, PostgreSQL 16 — o passo a passo
completo está em [`README.en.md`](README.en.md) (em inglês) e em
[`docs/05-operacao/OPERACAO.md`](docs/05-operacao/OPERACAO.md).

## Documentação

A documentação vive em [`docs/`](docs/). Comece por:

- [`docs/LEIA-PRIMEIRO.md`](docs/LEIA-PRIMEIRO.md) — índice rápido.
- [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) — o que é o portal, frentes e regras editoriais.
- [`docs/02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) — o que está no ar, fila, bloqueios e dívida.
- [`docs/06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) — catálogo operacional das fontes, com as armadilhas medidas em cada uma.
- [`docs/06-fontes/DADOS-GOV-BR.md`](docs/06-fontes/DADOS-GOV-BR.md) — o que já usamos do catálogo federal e o que vale integrar.
- [`AGENTS.md`](AGENTS.md) — regras duras do repositório (commit, worktree, dado pessoal, publicação).

## Licença

[AGPL-3.0-or-later](LICENSE). O dado é público; o código que o organiza
também.
