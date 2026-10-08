# HOTSPOTS CodeScene — fila de refatoração

> **Tipo:** PLANO
> **Domínio:** global (CodeScene, refatoração de hotspots)
> **Última medição:** 2026-10-08
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** codescene, hotspots, refatoracao, saude, divida

## Sumário

- [Fila (pior primeiro)](#fila-pior-primeiro)
- [Já fechados (11 de 18)](#já-fechados-11-de-18)
- [Regras](#regras)

## Fila (pior primeiro)

Leitura de 07/10/2026 (projeto 85760). Saúde de 0 a 10; quanto menor,
mais caro de mexer. **11 dos 18 já fechados** em 08/10 — este doc lista
só o que falta. Nunca refatorar por intuição: sempre a partir daqui
(AGENTS §7 e pendência 10 de PENDENCIAS-07-10.md).

| # | Saúde | Arquivo | Loc | Rev. | Observação |
|---|---|---|---|---|---|
| 1 | ~~6,46~~ **8,45** | `apps/web/public/terras/globo/js/ui/rotulos.js` | 514 | 16 | ✅ `formatarValor` (cc=59) → tabela `FORMATADORES`; commit `23b37453` |
| 2 | ~~6,87~~ **6,97** | `etl/betim/etl/common.py` | 647 | 10 | ✅ `_executar` (cc=43) → 4 métodos por operação; commit `23b37453` |
| 3 | ~~7,09~~ | `apps/web/lib/db/queries/betim.ts` | 2.558 | 32 | ✅ 72/99 literais de reserva → `emBetim()`, −51 linhas; commit `bb6387d1` |
| 4 | ~~7,26~~ **10,00** | `apps/web/app/sobre/page.tsx` | 613 | 19 | ✅ 6 seções → `app/sobre/components/`; nota perfeita; commit `23b37453` |
| 5 | ~~7,31~~ **8,15** | `apps/web/app/[municipio]/vereadores/[slug]/page.tsx` | 617 | 17 | ✅ 3 seções → `components/`; cc=64→39; commit `23b37453` |
| 6 | ~~7,49~~ | `apps/web/app/page.tsx` | 543 | 51 | ✅ Hub ~550→48 linhas, 13 seções no mesmo arquivo; commit `cafcb712` |
| 7 | **7,95** | `apps/web/app/components/SeuNono.tsx` | 1.909 | 36 | nesting=4, 2 métodos cc=10 |
| 8 | ~~8,05~~ | `apps/web/app/ambiental/page.tsx` | 410 | 34 | ✅ AmbientalHome 400→48, BLOCOS partido em 2; commit `4c7cf656` |

Só resta a linha 7. Saúde dos refatorados sem número: **recalcular na
próxima análise do CodeScene** (nunca presumir — medir).

## Já fechados (11 de 18)

| Saúde original | Arquivo | Commit | Prova |
|---|---|---|---|
| 1,45 | `lib/assistente/escada-determinista.ts` | `cad5f8fa` | 11 funções, 156 ins/0 del, 12 testes |
| 2,17 | `app/indice/Catalogo100PaginasClient.tsx` | `a4a7f213` | .tsx 505→92, 21 regras em lib/, 43 testes |
| 5,73 | `lib/ambiental/licencas-unificada.ts` | `6788cc43` | 18 if → tabela, 18 testes |
| 6,46 | `public/terras/globo/js/ui/rotulos.js` | `23b37453` | cc=59 → tabela FORMATADORES |
| 6,87 | `etl/betim/etl/common.py` | `23b37453` | cc=43 → 4 métodos por operação |
| 6,98 | `lib/assistente/acervo.ts` | `7ba60b26` | 11 if → tabela, sha256 igual, 30 testes |
| 7,09 | `lib/db/queries/betim.ts` | `bb6387d1` | `emBetim()` em 72/99 chamadas, −51 linhas, 242 testes |
| 7,26 | `app/sobre/page.tsx` | `23b37453` | 6 seções → components/, nota 10,00 |
| 7,31 | `app/[municipio]/vereadores/[slug]/page.tsx` | `23b37453` | 3 seções → components/, cc=64→39 |
| 7,49 | `app/page.tsx` | `cafcb712` | Hub ~550→48, 13 seções no mesmo arquivo |
| 8,05 | `app/ambiental/page.tsx` | `4c7cf656` | AmbientalHome 400→48, BLOCOS em 2 funções |

Saúde dos refatorados: **recalcular na próxima análise do CodeScene**
(nunca presumir que melhorou — medir).

## Regras

1. **Só refatorar o que está nesta fila** — nunca por intuição (AGENTS §7).
2. **Prova de equivalência**: diff com 0 deleções (mecânico) ou dump
   sha256 idêntico (tabelas de dados).
3. **Testes antes e depois**: cada hotspot ganha teste em `lib/` (vitest)
   ou harness próprio (Python/JS estático).
4. **Um hotspot por commit**, com mensagem citando o commit original e a
   prova de equivalência.
5. **Saúde renasce na próxima leitura** — não marcar como "melhorado" sem
   número do CodeScene.
