# Controle Popular

> Read this in English: [`README.en.md`](README.en.md).

Portal independente de transparência pública. Junta dado oficial que já é
público mas está espalhado e publica numa tela só, por cidade e por tema, em
português comum.

No ar: **[controlepopular.com.br](https://controlepopular.com.br)**
(fallback: [controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev))

**Todo número tem fonte, e toda estimativa mostra a taxa de erro ao lado.**
Quando a fonte não tem, a tela diz que não tem — lacuna é informação.

## O que você encontra

| Frente | Rota | O que responde |
|---|---|---|
| Cidades | `/[municipio]` | Contratos, licitações, diários oficiais, repasses e finanças |
| Assembleias | `/assembleias` | Composição, orçamento e proposições das 27 UFs |
| Congresso | `/congresso` | Proposições federais por tema, comissão e bancada |
| Judiciário | `/judiciario` | Tribunais, inspeções CNJ e processos ambientais |
| Terra e Cavas | `/funcaosocialterra`, `/mineracao/cavas` | CAR, terras indígenas, quilombolas e cavas no globo 3D |
| Paraopeba | `/paraopeba` | Reparação de Brumadinho, clipping e linha do tempo |
| ONSA | `/ambiental` | Mariana, Vale, barragens, licenças, TACs e LAI |
| Internacional | `/internacional`, `/eua`, `/canada` | ONU, UNESCO, OMS, SEC e TSX |
| Laboratório | `/laboratorio` | Caderno cívico offline e catálogo de bases |

Detalhe de cada eixo: [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md).

## Comece pela documentação

| Você quer… | Leia |
|---|---|
| saber o que fazer agora | [`docs/02-estado/ESTADO.md`](docs/02-estado/ESTADO.md) e [`RADAR-HOTSPOTS.md`](docs/02-estado/RADAR-HOTSPOTS.md) |
| entender o portal | [`docs/01-produto/PRODUTO.md`](docs/01-produto/PRODUTO.md) |
| rodar na sua máquina | [`docs/03-desenvolvimento/SETUP-LOCAL.md`](docs/03-desenvolvimento/SETUP-LOCAL.md) |
| publicar e operar | [`docs/05-operacao/OPERACAO.md`](docs/05-operacao/OPERACAO.md) |
| consultar uma fonte | [`docs/06-fontes/FONTES.md`](docs/06-fontes/FONTES.md) |
| as regras do repositório | [`AGENTS.md`](AGENTS.md) |

O índice completo está em [`docs/README.md`](docs/README.md).

## API pública

- Documentação interativa: **[`/api`](https://controlepopular.com.br/api)**
- Spec OpenAPI: `/api/openapi.yaml`
- Datasets: `/api/v1/` (contrato estável; quebra vira `/api/v2/`)

## Licença

[AGPL-3.0-or-later](LICENSE). O dado é público; o código que o organiza também.
