# Plano — Redução e otimização do contexto de build

> **Tipo:** PLANO
> **Domínio:** global (build / deploy)
> **Última medição:** 2026-10-01
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [OPERACAO.md](../05-operacao/OPERACAO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** build, dockerignore, contexto, limite 256 MB, guara, payload, compactacao, camada, pdf, json

## Sumário

- [O problema](#o-problema)
- [Medição de 01/10/2026](#medição-de-01102026)
- [Fase 1 — .dockerignore (ganho imediato)](#fase-1--dockerignore-ganho-imediato)
- [Fase 2 — tirar JSON grande do contexto](#fase-2--tirar-json-grande-do-contexto)
- [Fase 3 — compactação](#fase-3--compactação)
- [Verificação por item](#verificação-por-item)
- [Execução (01/10/2026) — F1 + F2 feitas, F3 dispensada](#execução-01102026--f1--f2-feitas-f3-dispensada)
- [Decisões registradas](#decisões-registradas)

## O problema

O deploy no Guara Cloud falha por **tamanho do contexto de build**, cujo teto é
**256 MB**. Dois deploys seguidos morreram assim (30/09 22:35 e 01/10 02:04): o
primeiro por `EmptyDir buildkitd` (12 Gi), o segundo já fora dele, mas ainda
acima do teto de contexto. O `ARG DATABASE_URL` (commit `0b703abd`) deixou o
build **mais pesado**, porque as páginas pré-renderizadas passaram a sair com
dado em vez de vazias — o disco do build cresce junto. Enquanto o contexto não
baixar, **nenhum deploy passa**.

## Medição de 01/10/2026

Contexto efetivo (tudo que não está no `.dockerignore`): **443,7 MB** — **1,7×
o teto de 256 MB**.

Por pasta de topo:

| MB | Pasta |
|---:|---|
| 354,3 | `apps` |
| 67,4 | `etl` |
| 14,5 | `docs` |
| 5,3 | `scripts` |
| 1,1 | `companion` |

Maiores arquivos:

| MB | Arquivo |
|---:|---|
| 24,7 | `apps/web/data/cetesb-sp-licencas.json` |
| 22,1 | `apps/web/data/esg/vale-environment_doc.pdf` |
| 22,1 | `apps/web/data/esg/Vale_Vale_Natureza_2024.pdf.pdf` |
| 22,1 | `apps/web/data/documentos-empresas/vale-relatorio-natureza-biodiversidade-2024.pdf` |
| 18,4 | `apps/web/data/imasul-ms-licencas.json` |
| 15,2 | `etl/betim/dados/ckan-mg-fiscais-contrato.json` |
| 15,2 | `apps/web/data/semar-pi-licencas.json` |
| 13,9 | `apps/web/data/iema-es-licencas.json` |
| 12,8 | `apps/web/data/ana-outorgas.json` |
| 9,3 | `apps/web/data/sigmine-nacional.json` |
| 8,1 | `etl/betim/dados/decisoes-licenciamento-mg.json` |
| 8,0 | `apps/web/data/sema-mt-licencas.json` |

Três forças inflam o contexto: **PDF** (66 MB só nos 3 maiores), **JSON de
licença de outras UFs** (`cetesb-sp`, `imasul-ms`, `semar-pi`, `iema-es`,
`sema-mt` — ~80 MB) e **`docs/`** (14,5 MB, não é lido no build).

## Fase 1 — .dockerignore (ganho imediato)

O que o build **não** lê deve sair do contexto. Ganho estimado: **~95 MB**.

- `docs/` — 14,5 MB; nenhum passo de build lê `docs/`.
- `apps/web/data/**/*.pdf` — ~66 MB. **Conferir antes**: um PDF só pode sair se
  nenhum passo de build o abre (normalmente o PDF é servido ao leitor, não lido
  no `next build`). Ver [Verificação por item](#verificação-por-item).
- `apps/web/data/esg/` — se os PDFs e JSONs de ESG não entram em nenhum
  `import` de página.

### Verificação feita (01/10/2026)

- **PDF**: `vale-environment_doc`, `Vale_Vale_Natureza_2024`,
  `documentos-empresas/*` **não** aparecem em `import`/leitura de build — só um
  nome de CSV de download. **Seguro excluir** (~66 MB).
- **JSON de licença**: `semar-pi`, `imasul-ms`, `iema-es`, `cetesb-sp` **são
  lidos** por `apps/web/lib/ambiental/licencas-unificada.ts` no build. Não dá
  para só ignorar — precisam mudar de camada.

### Conta do orçamento (443,7 MB → alvo ≤ 256 MB)

| Fase | Ganho | Resta |
|---|---:|---:|
| — | — | 443,7 |
| F1 PDFs + `docs/` | −80 | ~364 |
| F2 JSON de licença para Camada 2 | −80 | ~284 |
| F3 compactação dos que ficam | −30 a −40 | **~245** |

Só o conjunto das três fases passa.

## Fase 2 — tirar JSON grande do contexto

Os JSON de licença de outras UFs (~80 MB) são **Camada 1** hoje (bundle) e
**são lidos no build** (`licencas-unificada.ts`). Caminho já usado no repo para
dado grande: **Camada 2** (`apps/web/public/data/*`, servido como asset) +
leitura no runtime, ou **fatias** com o índice.

- Mover `cetesb-sp`, `imasul-ms`, `semar-pi`, `iema-es`, `sema-mt`,
  `sigmine-nacional`, `ana-outorgas`, `igam-outorgas` para `public/data/` e
  servir por `fetch`, como já fazem `comunicabr-31.json` e `sirenejud-mg.json`.
- Alternativa quando o dado tem de ser pré-renderizado: **fatiar** por UF/ano e
  manter no contexto só o índice (padrão de `congresso/proposicoes`).

## Fase 3 — compactação

O repo já tem dois codecs: `apps/web/lib/comunicabr/arquivo.ts` e
`apps/web/lib/estatico/compactar.ts` (esqueleto + rótulos internados). Aplicar
ao JSON que **fica** no contexto. **Não unificar os dois** (decisão de 16/08):
remeça antes.

## Verificação por item

Antes de cada exclusão, provar que o build não usa o arquivo:

```bash
# o PDF/JSON é importado por código de build?
rg -n "esg/vale-environment_doc|documentos-empresas" apps/web/app apps/web/lib
```

Só remover o que `rg` não encontrar em `import`/`readFileSync` de rota
pré-renderizada. Depois, remedir o contexto com o mesmo script da Fase 0 e só
então **um** deploy (a cota de build está em 281/250 min).

## Execução (01/10/2026) — F1 + F2 feitas, F3 dispensada

Medido no worktree limpo (`origin/main` do dia, sem `node_modules`/`.next`):
**442,1 MB antes → 223,5 MB depois** (teto 256 MB, folga de ~32 MB).

- **F1 (`.dockerignore`):** `docs/`, `scripts/` da raiz, `companion/`,
  `supabase/`, `bots/`, `colibri/`, `handoffs/`, `skills/`, `.hermes/`,
  `.github/`, `.githooks/`, o `etl/` FORA de `etl/betim/dados/` (único trecho
  que o build lê, via `lib/server-only/json-etl.ts`) e os PDFs de
  `data/esg/` + `data/documentos-empresas/` (rg confirma: nenhum
  `import`/`readFileSync` no build — só nome de CSV de download).
- **F2 — caminho "fatiar", não "mover para public/data":** mover para
  `public/data/` NÃO tiraria nada do contexto (`COPY . .` manda o `public/`
  inteiro; medido: `public/` pesa 99,6 MB e segue no contexto). O que
  funcionou foi a alternativa do próprio plano ("fatiar"): o JSON completo
  segue versionado no repo, mas **fora do contexto via `.dockerignore`**, e o
  build lê a **amostra versionada** em `apps/web/data/amostras/` — mesmos
  metadados (total real, ressalva, truncado), só a janela que a página já
  publicava (300/500 linhas por órgão). Gerador:
  `scripts/gerar-amostras-licencas.mts` (entra no prebuild; no Guara, sem o
  JSON completo, mantém a amostra versionada). Leitor: `licencas-unificada.ts`
  agora prefere a amostra. Guarda: `lib/ambiental/licencas-amostras.test.ts`
  (amostra existe, janela respeitada, total real preservado).
- **F3 não foi precisada.** Com F1+F2 o alvo foi atingido com folga; os codecs
  de compactação ficam intocados (decisão de 16/08 preservada).
- **Verificação:** `tsc --noEmit` limpo; 12 testes verdes (8 do
  `licencas-unificada.test.ts` + 4 novos); eslint 0 erros (1 warning
  pré-existente); **simulação do Guara** com só as amostras no lugar dos JSON
  completos: 6.912 registros, total real 641.265, 18 órgãos, `truncado: true`.

## Decisões registradas

- **Teto de contexto = 256 MB** (Guara). O número que importa é o **contexto
  efetivo** (pós-`.dockerignore`), não o tamanho do repo.
- **Dado grande sai do bundle, não do repo.** Mover para Camada 2 preserva a
  fonte e tira o peso do build — é o caminho que o projeto já usa.
- **PDF não é dado de build.** Se não é aberto no `next build`, não vai para o
  contexto.
- **Deploy é caro** (~20 min, cota estourada em 01/10): commitar muito,
  deployar uma vez, depois de remedir.
