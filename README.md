# Controle Popular

> Read this in English: [`README.en.md`](README.en.md).

Portal independente de transparência pública. Junta dado oficial que já é
público mas está espalhado por dezenas de sistemas — PNCP, Portal da
Transparência, IBGE, IBAMA, SEMAD-MG, Câmara dos Deputados, Senado, TSE — e
o publica numa tela só, por cidade e por tema.

No ar: **[controlepopular.finweejur.workers.dev](https://controlepopular.finweejur.workers.dev)**

**Todo número que o portal mostra tem fonte, e todo método que estima tem a
taxa de erro publicada ao lado do número.** É a regra que organiza o projeto
inteiro: quando não há fonte, a tela diz que não há — não preenche com
estimativa silenciosa.

---

## O que tem hoje

| Zona | Rota | O que responde |
|---|---|---|
| **Cidades** | `/betim`, `/diamantina`, … | Para onde vai o dinheiro da prefeitura e o que a câmara vota |
| **Congresso** | `/congresso` | Proposições federais, bancadas, comissões, votação nominal |
| **Judiciário** | `/judiciario` | Composição dos tribunais, vacância, indicações do Senado |
| **Ambiental** | `/ambiental` | Pauta do COPAM, autos de infração, barragens |
| **Busca** | `/busca` | Índice de texto sobre todo o acervo |

Seis cidades: **Betim, Belo Horizonte, São Paulo, Diamantina, Araçuaí e
Itinga**. Betim é a mais completa; as três do Vale do Jequitinhonha entraram
por último e ainda têm lacunas registradas.

Volume medido em 2026-08-10, no banco que gera o site:

| | |
|---|---:|
| Páginas pré-renderizadas | 1.471 |
| Parlamentares federais (com foto) | 593 |
| Proposições federais | 5.562 |
| Contratos municipais | 1.268 |
| Licitações municipais | 1.133 |
| Vereadores | 58 |

Por cidade a cobertura varia bastante — o portal mostra a lacuna em vez de
escondê-la.

---

## Como funciona

**O site é estático.** Não há banco de dados em produção: o `next build` lê o
Postgres **na hora do build** e transforma tudo em HTML pré-renderizado, que
vai para o Cloudflare Workers. Uma visita ao site não toca em banco nenhum.

```
fontes públicas  ──ETL (Python)──▶  Postgres  ──next build──▶  HTML estático  ──▶  Cloudflare Workers
```

Três partes:

- **`etl/`** — coletores em Python, um pacote por eixo (`betim`, `congresso`,
  `judiciario`). Cada módulo tem uma fonte só e sabe abortar quando ela muda.
- **`apps/web/`** — app Next.js 15 (App Router) com Drizzle ORM sobre o
  Postgres. É o que vira HTML.
- **`supabase/<eixo>/migrations/`** — SQL numerado, aplicado em ordem. Sem
  runner automático.

### O modo de falha que você precisa conhecer

Sem banco alcançável, `getDb()` devolve `null`, as páginas saem **vazias** e o
`next build` **termina com exit 0**. Build verde não é sinal de saúde. O sinal
é a contagem de páginas:

```bash
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

**21** = o banco não foi lido. **≥ 1.471** = correto. Todo script de deploy
deste repo confere isso antes de publicar.

### Atualização automática

Uma tarefa agendada roda `ETL → build → trava de contagem → deploy` uma vez
por dia, e **recusa publicar** se a contagem cair. Ver
[`docs/_historico/rotina-local.md`](docs/_historico/rotina-local.md).

```bash
npx tsx scripts/rotina-local.mts --listar
```

Os workflows em `.github/workflows/` continuam versionados e **declaram a
cadência** (é deles que a rotina lê os crons), mas não executam por
agendamento — o banco é local à máquina de build.

---

## Rodando localmente

Pré-requisitos: **Node 22**, **Python 3.12** e um **PostgreSQL** (16+).

### 1. Clonar e instalar

```bash
git clone https://github.com/FinweeJur/controle-popular.git
```

```bash
cd controle-popular && npm install
```

### 2. Banco

```bash
createdb controle_popular
```

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edite `apps/web/.env.local` e ponha a `DATABASE_URL`
(`postgresql://usuario:senha@127.0.0.1:5432/controle_popular`).

Aplique as migrations em ordem numérica, com `psql`:

```bash
for f in supabase/*/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

São idempotentes (`if not exists`), então repetir não quebra nada.

### 3. Trazer algum dado

Banco vazio sobe o app, mas toda tela aparece vazia. O ETL mais rápido de
rodar é o do Congresso — só precisa de `DATABASE_URL`, sem credencial externa:

```bash
cd etl/congresso && python -m venv .venv && .venv/bin/pip install -r requirements.txt
```

```bash
cp .env.example .env && .venv/bin/python -m etl.camara.parlamentares
```

No Windows o caminho é `.venv\Scripts\`. **Sempre em venv** — o pip global já
quebrou ferramenta neste projeto.

Cada eixo tem seu `.env.example`. O de `etl/betim/` pede mais chaves porque
cruza fontes que exigem cadastro:

| Variável | Para quê | Onde obter |
|---|---|---|
| `TRANSPARENCIA_API_KEY` | convênios, CEIS/CNEP, benefícios sociais | [Portal da Transparência](https://api.portaldatransparencia.gov.br/) — grátis |
| `GOOGLE_APPLICATION_CREDENTIALS` | Base dos Dados (BigQuery): saúde, educação, TSE | conta de serviço do GCP |

O `.env` guarda o **caminho** do arquivo de credencial, nunca o conteúdo.

### 4. Subir

```bash
npm run dev
```

`http://localhost:3000`. Para o build de produção, `npm run build` — e confira
a contagem de páginas, não o exit code.

---

## De onde vem cada dado

| Tema | Fonte |
|---|---|
| Contratos e licitações | PNCP (Portal Nacional de Contratações Públicas) |
| Convênios, sanções, benefícios | Portal da Transparência federal |
| População, PIB, agropecuária | IBGE |
| Escolas, saúde, mortalidade | INEP, CNES, SIH/SIM (via Base dos Dados) |
| Despesas e receitas | SICONFI |
| Autuação ambiental federal | IBAMA |
| Autuação ambiental estadual (MG) | CAP / SEMAD-MG |
| Barragens | SNISB e FEAM |
| Royalties da mineração | CFEM / ANM |
| Proposições e votações federais | APIs da Câmara e do Senado |
| Vereadores e fotos | TSE, SAPL, portais das câmaras |
| Nota de transparência | PNTP / ATRICON |

Cada coletor documenta no próprio arquivo a fonte, as armadilhas medidas e o
que ele deliberadamente **não** coleta.

---

## Alertas de contrato

O portal marca contratos com sinais de risco, e **separa dois tipos** — porque
tratá-los igual daria a uma suspeita estatística o mesmo peso de uma violação
de artigo de lei:

- **Violação legal** — dispensa perto do limite, aditivo acima do teto,
  fornecedor sancionado, fracionamento. Cada um com o dispositivo citado.
- **Heurística** — valor atípico para a categoria, capital social baixo. São
  sinais que TCU, CGU e Ministério Público usam para investigar, **não prova
  de irregularidade**, e a tela diz isso.

Todo contrato traz link para a página dele no PNCP. Acusar sem oferecer como
conferir seria pedir confiança, que é o contrário do que o portal defende.

---

## Documentação

| | |
|---|---|
| [`docs/_historico/rotina-local.md`](docs/_historico/rotina-local.md) | Como o site se atualiza sozinho |
| [`docs/_historico/worktrees.md`](docs/_historico/worktrees.md) | Trabalhar em frentes paralelas sem colidir |
| [`docs/_historico/build-em-outro-pc.md`](docs/_historico/build-em-outro-pc.md) | Montar a máquina de build do zero |
| [`docs/_historico/USAR-COM-IA.md`](docs/_historico/USAR-COM-IA.md) | Navegar o repo com um assistente no terminal |

---

## Licença

[AGPL-3.0-or-later](LICENSE). O dado é público; o código que o organiza
também.
