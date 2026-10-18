# Controle Popular

> Leia em português: [`README.md`](README.md).

An independent public-transparency portal for Brazil. It gathers official data
that is already public but scattered across dozens of systems and publishes it
in one place, by city and by topic, in plain language.

Live at **[controlepopular.com.br](https://controlepopular.com.br)**
(fallback: [controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev))

**Every number has a source, and every estimate shows its measured error rate.**
When the source has no data, the screen says so — a declared gap is information.

## What you find

| Front | Route | What it answers |
|---|---|---|
| Cities | `/[municipio]` | Contracts, tenders, official gazettes, transfers and finances |
| State assemblies | `/assembleias` | Composition, budgets and bills for all 27 states |
| Congress | `/congresso` | Federal bills by topic, committee and Minas Gerais bloc |
| Judiciary | `/judiciario` | Courts, CNJ inspections and environmental lawsuits |
| Land and mining pits | `/funcaosocialterra`, `/mineracao/cavas` | CAR, indigenous and quilombola lands, pits on the 3D globe |
| Paraopeba | `/paraopeba` | Brumadinho reparation, press radar and timeline |
| ONSA | `/ambiental` | Mariana, Vale, dams, licences, TACs and FOI rulings |
| International | `/internacional`, `/eua`, `/canada` | UN, UNESCO, WHO, SEC and TSX |
| Lab | `/laboratorio` | Offline civic notebook and dataset catalogue |

Details: [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) (Portuguese).

## Start with the docs

| You want… | Read |
|---|---|
| what to do now | [`docs/02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) and [`RADAR-HOTSPOTS.md`](docs/02-estado/RADAR-HOTSPOTS.md) |
| to understand the portal | [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) |
| to run it locally | [`docs/03-desenvolvimento/SETUP-LOCAL.md`](docs/03-desenvolvimento/SETUP-LOCAL.md) |
| to publish and operate | [`docs/05-operacao/OPERACAO.md`](docs/05-operacao/OPERACAO.md) |
| a source or collector | [`docs/06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) |
| the repository rules | [`AGENTS.md`](AGENTS.md) |

Full index: [`docs/README.md`](docs/README.md).

## Public API

- Interactive docs: **[`/api`](https://controlepopular.com.br/api)**
- OpenAPI spec: `/api/openapi.yaml`
- Datasets: `/api/v1/` (stable contract; breaking changes become `/api/v2/`)

## Licence

[AGPL-3.0-or-later](LICENSE). The data is public; so is the code that organises it.
