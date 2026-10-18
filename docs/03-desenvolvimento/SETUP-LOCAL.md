# Setup local — rodar o portal na sua máquina

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global (ambiente local, banco, ETL, build)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md)
> **Palavras-chave:** setup, local, node, python, postgres, database-url, etl, build, env, credenciais

## Sumário

- [Propósito](#propósito)
- [Requisitos](#requisitos)
- [Clonar e instalar](#clonar-e-instalar)
- [Banco](#banco)
- [Popular com dado](#popular-com-dado)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Rodar](#rodar)
- [O modo de falha que você precisa conhecer](#o-modo-de-falha-que-você-precisa-conhecer)
- [De onde vem cada dado](#de-onde-vem-cada-dado)

## Propósito

Passo a passo para um clone novo rodar o portal, o ETL e o build.
O detalhe de deploy e operação fica em [OPERACAO.md](../05-operacao/OPERACAO.md).

## Requisitos

- **Node 22**
- **Python 3.12**
- **PostgreSQL 16+**

## Clonar e instalar

**Clone só em `X:\DevCoder`.** O caminho canônico é
`X:\DevCoder\controle-popular`; nada de `C:\Users\...`. Regra completa em
[CHECKOUT-CANONICO.md](CHECKOUT-CANONICO.md).

```powershell
cd X:\DevCoder
git clone https://github.com/FinweeJur/controle-popular.git
cd controle-popular && npm install
```

O `npm install` liga sozinho os hooks de Git (`.githooks`) pelo `postinstall`.
Confira com `git config --get core.hooksPath` — deve dizer `.githooks`.

## Banco

```bash
createdb controle_popular
cp apps/web/.env.example apps/web/.env.local
```

Edite `apps/web/.env.local` e defina `DATABASE_URL`
(`postgresql://user:password@127.0.0.1:5432/controle_popular`).
Aplique as migrations em ordem numérica:

```bash
for f in supabase/*/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

As migrations são idempotentes (`if not exists`); rodar de novo não quebra.

## Popular com dado

Banco vazio sobe o app, mas toda tela renderiza vazia.
O ETL mais rápido é o do Congresso — só precisa de `DATABASE_URL`:

```bash
cd etl/congresso && python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env && .venv/bin/python -m etl.camara.parlamentares
```

No Windows o caminho é `.venv\Scripts\`. **Sempre em venv.**

Cada eixo tem seu `.env.example`. O de `etl/betim/` pede mais chaves porque
cruza fontes que exigem cadastro:

| Variável | O que destrava | Onde obter |
|---|---|---|
| `TRANSPARENCIA_API_KEY` | transferências federais, listas de sanção, auxílios | [Portal da Transparência](https://api.portaldatransparencia.gov.br/) — grátis |
| `DADOS_GOV_BR_API_TOKEN` | API do catálogo federal de dados abertos | conta em [dados.gov.br](https://dados.gov.br/) — grátis |
| `GOOGLE_APPLICATION_CREDENTIALS` | Base dos Dados (BigQuery): saúde, educação, eleições | service account do GCP |

O `.env` guarda o **caminho** do arquivo de credencial, nunca o conteúdo.

## Rodar

```bash
npm run dev
```

Abre em `http://localhost:3000`.
Para build de produção, `npm run build` — e confira a contagem de páginas,
não só o exit code.

## O modo de falha que você precisa conhecer

Sem banco alcançável, as páginas renderizam **vazias** e o `next build`
**sai com 0**. Build verde não é sinal de saúde. O sinal é a contagem:

```bash
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

**21** significa que o banco nunca foi lido. **1.471+** é o correto
(medido em 16/08/2026 — remeça antes de decidir com esse número).

## De onde vem cada dado

| Tema | Fonte |
|---|---|
| Contratos e licitações | PNCP |
| Transferências federais, sanções, auxílios | Portal da Transparência |
| População, PIB, agropecuária | IBGE |
| Escolas, saúde, mortalidade | INEP, CNES, SIH/SIM (via Base dos Dados) |
| Receita e despesa municipal | SICONFI |
| Autos de infração ambiental federal | IBAMA |
| Autos ambientais estaduais (MG) | CAP / SEMAD-MG |
| Barragens | SNISB, FEAM, ANM |
| Royalties de mineração | CFEM / ANM |
| Proposições e votações federais | APIs da Câmara e do Senado |
| Processos ambientais | CNJ — SIRENEJud (lote) e DataJud (ao vivo) |
| Vereadores e fotos | TSE, SAPL, portais das câmaras |
| Nota de transparência | PNTP / ATRICON |

Cada coletor documenta, no próprio arquivo, a fonte, as armadilhas medidas
e o que ele **não** coleta. O catálogo operacional é
[FONTES.md](../06-fontes/FONTES.md).
