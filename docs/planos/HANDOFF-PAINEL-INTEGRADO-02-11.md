# Handoff — painel integrado (02/11/2026)

> **Tipo:** HANDOFF
> **Domínio:** front-end, rotas, facetas, redirects, build, deploy
> **Última medição:** 2026-11-02
> **Leitura estimada:** curta (5–15 min)
> **Relacionados:** [PLANO-PAINEL-INTEGRADO-02-11.md](PLANO-PAINEL-INTEGRADO-02-11.md), [PROMPT-PAINEL-INTEGRADO.md](PROMPT-PAINEL-INTEGRADO.md), [PLANO-BUILD-RAPIDA.md](PLANO-BUILD-RAPIDA.md), [CONFORMIDADE-MOBILE.md](../03-desenvolvimento/CONFORMIDADE-MOBILE.md), [HIERARQUIA-DE-ACAO.md](../03-desenvolvimento/HIERARQUIA-DE-ACAO.md)
> **Palavras-chave:** handoff, painel, facetas, redirects, deploy, build, worktree

> **Atualização em 02/11/2026, depois deste handoff.** O merge foi feito
> (`618ac6a6`), o `assistente-acervo.json` foi regenerado (`ae91ff5c`, 53
> referências trocadas, 0 rotas velhas) e as cidades foram regeradas
> (`cb62069b`) — itens 1 a 3 da seção 4 estão fechados. O mesmo `ae91ff5c`
> acrescentou `turbopack.root` ao `next.config.ts`: **o worktree builda com
> Turbopack**, e a armadilha da junção deixou de valer. O que continua aberto
> é o item 4 (smoke pós-deploy), parte do 5 (medição de consultas) e o 6.

## Sumário

- [Onde está o trabalho](#1-onde-está-o-trabalho)
- [O que foi entregue](#2-o-que-foi-entregue)
- [O que está verificado](#3-o-que-está-verificado)
- [O que falta](#4-o-que-falta)
- [Armadilhas desta rodada](#5-armadilhas-desta-rodada)
- [Comandos prontos](#6-comandos-prontos)

## 1. Onde está o trabalho

- Branch: `painel-facetas` (empurrada para `origin`).
- Worktree: `.claude/worktrees/painel-facetas`, porta **3048**.
- Worktrees das famílias, já mergeadas: `painel-{congresso,judiciario,prefeitura,paraopeba,ambiental,empresas2,mobile}`.
- Branch rejeitada: `painel-empresas` (apagou busca/ordenação/CSV). **Não usar.**
- Estado: **23 commits à frente, 20 atrás da `main`**. Não foi mergeado.

## 2. O que foi entregue

| Família | Mudança | Onde |
|---|---|---|
| Direitos | 3 rotas → `/direitos-em-movimento/servicos?subfrente=` | 3 pontes |
| Congresso | 2 rotas → `/congresso/analises?recorte=` | 2 pontes |
| Judiciário | 4 rotas → `/judiciario/composicao?lente=` e `contatos` | 4 pontes |
| Prefeitura | 11 → 9 por cidade; painel `?area=` | 1 ponte por município |
| Paraopeba | `?fonte=vale`, `#indice` | 2 pontes |
| Terras | `/cidades` → `#catalogo-cidades` | 1 ponte |
| Ambiental | `?colecao=rios\|serras\|territorios`, `#sigbm-anm` | 4 pontes |
| Empresas | faceta `?setor=`, **nenhuma rota removida** | — |

Componentes novos: `PainelFacetas`, `Barras`, `PaginaPonte`, `NavegacaoSecoes`,
`ForaDaFaceta`, `AvisoReferencia`, `ConviteTema`, `WidgetsFlutuantes`.

Registro único de rotas antigas: `apps/web/lib/redirects/rotas-antigas.ts`
(17 entradas). `next.config.ts` monta os 301 a partir dele; cada ponte pergunta
o destino com `destinoAntigo()`. Teste de guarda em `rotas-antigas.test.ts`.

UI: tema inicial **claro** com convite para escuro/biomas; bicho não fala
sozinho; auditoria mobile (`scripts/auditar-mobile.mjs`).

## 3. O que está verificado

- `tsc --noEmit` limpo na árvore final.
- Testes: jurisprudência 14, redirects 6, sitemap 7, catálogo 100, empresas,
  prefeitura, congresso, paraopeba — todos verdes nos merges.
- Top-100: **0 de 100** apontando para rota redirecionada.
- Auditoria mobile: 346 rotas, 1 achado (banner de anúncio sem dimensão).
- `npx next build --webpack`: **714 páginas**, verde (antes dos últimos merges).
- `npx next build --turbopack` no worktree, depois de `ae91ff5c`: **716 páginas
  estáticas**, compile em 35 s, 7,1 min no total sem prebuild.

## 4. O que falta

1. **Merge na `main`** — 20 commits atrás; conflitos prováveis em
   `data/*.json`, `cidades-do-build.ts` e `proveniencia.json` (gerados).
2. **Build de produção (Turbopack) na `main`** — o worktree **já roda** com
   Turbopack desde `ae91ff5c` (`turbopack.root`); medido em 02/11/2026:
   compile em 35 s, 716 páginas estáticas, 7,1 min sem prebuild.
3. **Regenerar `data/assistente-acervo.json`** — feito em `ae91ff5c`: as 53
   referências antigas viraram as 17 rotas canônicas, 0 rotas velhas.
4. **Smoke pós-deploy** com `scripts/aquecer-pos-deploy.mts`.
5. **Medidas de build** (`PLANO-BUILD-RAPIDA.md`): medir consultas antes de
   cachear; o type-check dentro do build já é 5 dos 7 min no worktree.
6. Hierarquia botão × link: regra escrita, aplicação feita só em `/servicos`.

## 5. Armadilhas desta rodada

- **Turbopack + junção de `node_modules`: resolvido por `turbopack.root`.** O
  erro *“Symlink points out of the filesystem root”* acontece porque o alvo da
  junção fica fora da raiz do projeto. Com a raiz apontada para o checkout
  canônico, worktree e alvo ficam dentro dela — e o build volta ao Turbopack.
  A junção em si **não é obrigatória**: `npm ci` no worktree também serve, ao
  custo de 1,1 GB por worktree.
- **`git show ... > arquivo` no PowerShell grava UTF-16** e quebra o parse.
  Use `execFileSync` ou `Out-File -Encoding utf8`.
- **Commit com `--only` exige `git add -N`** para arquivo novo.
- **CodeScene barra função que já está no limite**: 120 linhas em
  `ServicosPage` obrigou extrair `ForaDaFaceta`.
- **Subagente pequeno apaga recurso sem avisar.** O prompt tem de dizer, em
  maiúsculas, que busca/filtro/CSV não podem sumir.

## 6. Comandos prontos

```powershell
# trabalhar na branch
cd X:\DevCoder\OpenCode\controle-popular\.claude\worktrees\painel-facetas

# dev (webpack; Turbopack tambem sobe: npx next dev --turbopack)
cd apps\web; npm run dev -- --port 3048

# verificação
npx tsc --noEmit
npx vitest run lib/redirects lib/sitemap lib/indice/catalogo.test.ts
node ../../scripts/auditar-mobile.mjs

# integração
git fetch origin
git merge origin/main            # resolver gerados: aceitar a main e regenerar
cd apps\web
npm run rotas:sitemap && npm run cidades && npm run indice:busca
```

Deploy só depois de build verde na `main`; custa ~17 min de cota Guara.
