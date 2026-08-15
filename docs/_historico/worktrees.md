# Trabalhar em worktrees paralelos

> Escrito em 2026-08-09, depois que a sessão da máquina de build acumulou cinco
> frentes independentes. Existe porque a colisão que já aconteceu neste repo —
> duas migrations com o mesmo número, escritas em branches diferentes — não é
> evitável por atenção, só por combinação.

## A regra que resolve 90% dos conflitos: cada worktree tem SEU território

Os worktrees abaixo foram recortados para **não tocarem nos mesmos arquivos**.
Se um deles precisar mexer fora do território, ele **para e avisa** em vez de
editar — porque o conflito descoberto no merge custa mais que a espera.

| Worktree | Território (só isto) | Entrega |
|---|---|---|
| `cp-busca` | `apps/web/lib/busca/**`, `apps/web/scripts/gerar-indice-busca.mts`, `apps/web/app/busca/**` | Gerador do índice + tela estática da `/busca` |
| `cp-searchparams` | `apps/web/app/[municipio]/camara/**`, `apps/web/app/[municipio]/prefeitura/**`, `apps/web/app/congresso/{agenda,alertas,bons-exemplos,proposicoes,votacoes}/**` | As 12 páginas que ainda leem `searchParams` no servidor |
| `cp-vias-osm` | `etl/betim/etl/apis/osm_vias.py`, `supabase/terras/migrations/**` | Coletor de vias do OSM (subtrair faixa de estrada do G0) |
| `cp-fotos` | `etl/betim/etl/bd/tse.py`, `etl/judiciario/**`, `supabase/betim/migrations/**` | Foto de vereador (TSE) e de magistrado |
| `cp-ambiental` | `etl/betim/etl/apis/{cap_autos_infracao,ibama_fiscalizacao}.py`, `apps/web/app/[municipio]/meio-ambiente/**` | Rodar os coletores que faltam e ligar as telas |

**Território compartilhado, e por isso proibido a todos:** `lib/db/schema.ts`,
`lib/db/client.ts`, `lib/zonas.ts`, `next.config.ts`, `package.json`. Mexer
nesses é tarefa da `main`, feita entre merges — nunca dentro de um worktree.

## Numeração de migration: reserve ANTES de escrever

Já colidiu. A `0045_defesa_civil_so_betim.sql` traz o aviso no próprio
cabeçalho: *"Numero pode colidir com outra migration em worktree paralelo —
resolver a ordem no merge, nao aqui."* Ela nunca rodou, e quando rodou (hoje)
falhou por outro motivo.

A combinação:

1. Antes de criar o arquivo, rode `git fetch origin && git log origin/main --oneline -5`.
2. Pegue o **maior número existente em `origin/main`** e some 1.
3. Se dois worktrees precisarem de migration ao mesmo tempo, o **segundo a
   mergear renumera** — o número é do arquivo, não do conteúdo, e renomear é
   barato. Renumerar depois de aplicado no banco não é.
4. Migration **nunca** é `update ... where <coluna que você não conferiu>`.
   A `0045` quebrou com `coluna "slug" não existe` porque assumiu uma coluna
   que o `municipios` não tem — o slug é derivado em código.

## Como commitar

- Mensagem em português, **primeira linha diz o efeito**, não o arquivo
  ("Vereador: filtro de tema vai para o cliente", não "atualiza page.tsx").
- O corpo explica **por quê** e traz **número medido**. Este projeto trata
  "número medido, não impressão" como regra, não como estilo.
- Sem acento na mensagem de commit (o terminal do Windows corrompe).
- Rodapé obrigatório:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- **Antes de todo commit:** `npx tsc --noEmit` e `npm test`. Os dois limpos, ou
  não commita. Hoje o projeto tem 50 testes.

## Como mergear

O `main` é a referência; os worktrees seguem `main`, nunca o contrário.

```bash
git fetch origin
git rebase origin/main      # rebase, nao merge: o historico fica legivel
npx tsc --noEmit && npm test
git push origin <sua-branch>
```

Depois, na `main`:

```bash
git merge --no-ff <sua-branch>
```

`--no-ff` porque o merge commit é onde fica registrado que aquela frente
existiu — e este repo usa o histórico como documentação.

## O que verificar depois do merge, sempre

O build tem um modo de falha silencioso que já custou uma sessão: sem banco
alcançável, `getDb()` devolve `null`, as páginas saem vazias e **o build
termina com exit 0**. Então o teste de que o merge não quebrou nada não é o
build passar — é a **contagem de páginas**:

```bash
cd apps/web && npm run build
node -e "console.log(Object.keys(require('./.next/prerender-manifest.json').routes).length)"
```

Referências medidas em 2026-08-09: **21** páginas = sem banco (errado).
**1.263** = com o banco local. Caiu para 21? O `.env.local` não foi lido, ou o
Postgres não subiu — não é o seu código.

## A regra que não se negocia

`apps/web/.env.local` e `etl/betim/.env` apontam para `127.0.0.1`, **e ponto**.
Nunca para a Neon. O Next carrega esse dotfile sozinho e `env | grep` não o
enxerga — só vê variável de shell. Foi assim que um build local conectou na
Neon e levou HTTP 402.
