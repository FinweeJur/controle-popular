# Rodar o build em outro PC (e publicar no Cloudflare)

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, procedimento, operacao

## Sumário

- [Propósito](#propósito)
- [Antes de tudo: a armadilha que já custou egress real](#antes-de-tudo-a-armadilha-que-já-custou-egress-real)
- [Parte 1 — preparar a máquina (uma vez só)](#parte-1-preparar-a-máquina-uma-vez-só)
- [Parte 2 — a rotina, toda vez que quiser atualizar o site](#parte-2-a-rotina-toda-vez-que-quiser-atualizar-o-site)
- [O que dá errado, e o que significa](#o-que-dá-errado-e-o-que-significa)
- [Por que isto vale a pena](#por-que-isto-vale-a-pena)

## Propósito

> Escrito em 2026-08-09. O objetivo é a **arquitetura C** de > `deploy-github-pages.md` §7: o banco e o build ficam na sua máquina, o > Cloudflare só serve o resultado. O PC **não precisa ficar ligado** para o > site funcionar — só na hora de atualizar o dado. ---

> Escrito em 2026-08-09. O objetivo é a **arquitetura C** de
> `deploy-github-pages.md` §7: o banco e o build ficam na sua máquina, o
> Cloudflare só serve o resultado. O PC **não precisa ficar ligado** para o
> site funcionar — só na hora de atualizar o dado.

---

## Antes de tudo: a armadilha que já custou egress real

**Nunca deixe um `apps/web/.env.local` apontando para a Neon nesta máquina.**

Em 2026-08-09 um `next build` local conectou de verdade na Neon e levou HTTP
402, porque o Next carrega esse arquivo sozinho. Conferir com `env | grep` não
adianta: o comando só vê variável de shell, não o dotfile.

A regra desta máquina: `DATABASE_URL` aponta para `localhost`, e ponto. Se você
precisar da Neon algum dia, use outra variável e outro comando.

---

## Parte 1 — preparar a máquina (uma vez só)

### 1. Node 22

O `wrangler` exige Node 22 ou mais novo. Baixe o **zip oficial** de
`nodejs.org/dist/latest-v22.x/` (`node-v22.x.x-win-x64.zip`), extraia em
`C:\nodejs22` e ponha essa pasta no PATH antes de qualquer outra instalação de
Node.

Confira:

```bash
node -v
```

Tem que responder `v22.x.x`. Se responder `v20`, o PATH não pegou.

### 2. PostgreSQL

Instale o PostgreSQL 18 (installer oficial). Anote a senha do usuário
`postgres` — ela não aparece em lugar nenhum depois.

Confira que subiu:

```bash
pg_isready -h 127.0.0.1 -p 5432
```

> Numa das máquinas do projeto o serviço ficou na porta **5433**, não 5432.
> Se `pg_isready` não responder, confira a porta real em Serviços do Windows.

Crie o banco e as extensões que o dump exige — **`vector` não vem de fábrica**,
e sem ela o restore quebra no meio:

```bash
createdb -h 127.0.0.1 -U postgres controle_popular
psql -h 127.0.0.1 -U postgres -d controle_popular -c "create extension if not exists pg_trgm; create extension if not exists pgcrypto; create extension if not exists \"uuid-ossp\"; create extension if not exists vector;"
```

Se `vector` reclamar que não existe, instale o **pgvector** para o PostgreSQL
18 antes de continuar.

### 3. Restaurar o dump

```bash
pg_restore -h 127.0.0.1 -U postgres -d controle_popular --no-owner --no-privileges X:/DevCoder/_migracao-neon/dump/cp.dump
```

O dump é de 2026-07-28 e tem 94 tabelas.

> **NÃO confie no número da migration para saber o que falta — MEÇA o estado.**
>
> Este documento dizia "aplique as posteriores ao dump" e a sessão de
> 2026-08-09 tratou isso como "`0045` a `0051`". Estava errado por 18
> migrations. O estado medido do dump é ~`0033`: faltavam colunas de `0025`,
> `0035`, `0038` e `0039`, tabelas de `0041` e `0044`, e — o pior — os **seeds
> das cidades**: `municipios` veio com **uma linha só** (Betim), então BH, São
> Paulo e os três dos Vales não existiam.
>
> A causa é que **a numeração não é cronológica**. A história do repo foi
> reescrita: `0001`–`0026` têm todas o mesmo timestamp, e a `0027` foi escrita
> em 08-03, *depois* do dump, apesar do número baixo.
>
> O que funciona é perguntar ao banco. Para cada migration, veja se o objeto
> que ela cria já existe:
>
> ```bash
> psql -h 127.0.0.1 -U postgres -d controle_popular -tAc \
>   "select count(*) from information_schema.tables where table_name='<tabela>'"
> ```
>
> Aplicadas de fato em 2026-08-09: betim `0003`–`0051`, congresso `0003`–`0009`,
> judiciário `0003`–`0008` e `terras/0001`. As falhas "já existe" são benignas.
> As reais, todas de estreia: `0045_defesa_civil_so_betim` (`coluna "slug" não
> existe` — faz `where slug != 'betim'`, e `municipios` não tem coluna `slug`; o
> slug é derivado em código) e três seeds do judiciário (`0004`, `0005`, `0007`).

**Sem pgvector?** As duas tabelas `embeddings` (em `public` e `congresso`) são
as únicas que exigem `vector`. Nada no app as consulta — `lib/betim/chat.ts` diz
explicitamente que faz busca por palavra-chave. Dá para restaurar sem elas,
gerando uma lista filtrada, e o build não perde nada:

```bash
pg_restore -l cp.dump | grep -v -i embeddings > toc.txt
pg_restore -h 127.0.0.1 -U postgres -d controle_popular --no-owner --no-privileges -L toc.txt cp.dump
```

Resultado medido assim: 92 das 94 tabelas, 44.446 linhas.

### 4. Clonar o repositório e instalar

```bash
git clone https://github.com/FinweeJur/controle-popular
cd controle-popular
npm ci
```

### 5. Apontar para o banco local

Crie `apps/web/.env.local` com **localhost, nunca a Neon**:

```
DATABASE_URL=postgresql://postgres:SUA_SENHA@127.0.0.1:5432/controle_popular
```

> **Isto sozinho NÃO bastava, e o passo estava incompleto até 2026-08-09.**
>
> `getDb()` usava `neon()` em modo HTTP, que não abre conexão Postgres — ele
> monta uma URL de API a partir do host. Apontar para `127.0.0.1` dava:
>
> ```
> NeonDbError: Error connecting to database:
> TypeError: Failed to parse URL from https://api.0.0.1/sql
> ```
>
> Corrigido em `1a616a0`: `criar(url)` escolhe o motor pelo **hostname** —
> node-postgres para `localhost`/`127.0.0.1`/`::1`, neon-http para o resto. Se
> você clonou depois desse commit, o passo 5 basta mesmo. Se não, atualize.

E crie também `etl/betim/.env`, com a mesma regra — é de lá que os coletores
leem:

```
DATABASE_URL=postgresql://postgres:SUA_SENHA@127.0.0.1:5432/controle_popular
```

> **O runner de migration NÃO serve para banco local.** O
> `apps/web/scripts/aplicar-migration.mts` usa o `Pool` do
> `@neondatabase/serverless`, que fala WebSocket com a Neon. Para o Postgres
> daqui, use `psql -f` direto.

### 6. Entrar na conta Cloudflare (uma vez)

```bash
npx wrangler login
```

Abre o navegador e pede autorização. Alternativa sem navegador: exportar
`CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no ambiente.

---

## Parte 2 — a rotina, toda vez que quiser atualizar o site

```bash
cd controle-popular
git pull
```

**1. Atualizar o dado** (os ETLs leem fontes públicas e gravam no banco local):

```bash
cd etl/betim
python -m etl.apis.cap_autos_infracao --id-municipio 3106705
python -m etl.apis.feam_barragens
python -m etl.apis.snisb_barragens
```

> `feam_barragens`/`snisb_barragens` não recebem mais `--id-municipio` desde a
> migration `0057_ref_municipios_mg.sql` (2026-08-11): as duas fontes são
> estaduais/nacionais, então o coletor sincroniza **MG inteira** numa rodada
> só, resolvendo o município de cada linha pelo nome que a fonte grafa contra
> `ref_municipios_mg`. `snisb_barragens` aceita `--uf` (default `MG`).

Cada coletor aceita `--sondar`, que consulta e mostra o resultado **sem gravar
nada**. Use quando quiser só conferir se a fonte mudou.

**2. Construir e publicar:**

```bash
cd ../../apps/web
npm run cf:deploy
```

Isso faz build, popula o cache e publica. Leva alguns minutos.

**3. Conferir que subiu:** abra o site. Se algo estiver com dado velho, foi o
build que não rodou, não o Cloudflare que demorou — a publicação é imediata.

---

## O que dá errado, e o que significa

| Sintoma | Causa | O que fazer |
|---|---|---|
| `Wrangler requires at least Node.js v22` | PATH pegou o Node antigo | pôr `C:\nodejs22` na frente do PATH |
| `basePath has to start with a /` no Git Bash | o MSYS converteu `/controle-popular` em caminho do Windows | usar `MSYS_NO_PATHCONV=1` ou rodar pelo PowerShell |
| Build gera páginas vazias e **publica assim mesmo** | `DATABASE_URL` ausente — `getDb()` devolve `null` de propósito | conferir o `.env.local`; é a pior falha do pipeline porque sai com exit 0 |
| `extension "vector" is not available` | pgvector não instalado | instalar pgvector antes do restore |
| Build morre no meio do prerender | página com erro de dado | ler qual rota falhou; o build não publica pela metade |

---

## Por que isto vale a pena

Com o banco em `localhost`, o `next build` lê o banco inteiro sem custo nenhum
— **o egress da Neon era queimado exatamente por essa leitura**, ~0,4 GB por
rodada num teto de 5 GB por mês. Rodando aqui, o teto deixa de existir e a
cadência passa a ser sua.

O que **não** funciona nesta arquitetura, e é preciso saber: as 15 rotas
`.din.ts` (chat, formulários, painel, login) precisam de servidor. Enquanto o
alvo for Cloudflare Workers, elas continuam funcionando normalmente — este
documento só muda **onde o build roda**, não o que o site é. A migração para
HTML puro (`output: export`) é outro assunto, e está em
`deploy-github-pages.md` §8, ainda em aberto.
