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
| Cidades | `/betim`, `/bh`, `/sp`, `/aracuai`, `/diamantina`, `/itinga` | Para onde vai o dinheiro da prefeitura e o que a câmara vota |
| Congresso | `/congresso` | Proposições federais por tema, comissão e bancada |
| Judiciário | `/judiciario` | Composição dos tribunais, vacância, inspeções CNJ, processos ambientais (SIRENEJud) |
| Função Social da Terra | `/funcaosocialterra` (+ `/mapa`, `/alertas`) | Quanto do território não tem imóvel declarado no CAR, no globo 3D |
| Paraopeba | `/paraopeba` | A reparação de Brumadinho: clipping, linha do tempo, documentos do processo |
| Ambiental | `/ambiental` | Pauta do COPAM, licenciamento, barragens, legislação e patrimônio cultural de MG |

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
