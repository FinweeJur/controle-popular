# Rodar o build em outro PC (e publicar no Cloudflare)

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

O dump é de 2026-07-28, 94 tabelas, e está algumas tabelas atrás do schema
atual. As migrations que faltam estão em `supabase/betim/migrations/` — aplique
em ordem numérica as que forem posteriores ao dump.

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
python -m etl.apis.feam_barragens --id-municipio 3106705
```

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
