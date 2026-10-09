# HOTSPOTS CodeScene — fila de refatoração

> **Tipo:** PLANO
> **Domínio:** global (CodeScene, refatoração de hotspots)
> **Última medição:** 2026-10-09
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** codescene, hotspots, refatoracao, saude, divida, bus factor

## Sumário

- [Fila (pior primeiro)](#fila-pior-primeiro)
- [Já fechados (12 de 18)](#já-fechados-12-de-18)
- [Bus factor / knowledge maps](#bus-factor--knowledge-maps)
- [Regras](#regras)

## Fila (pior primeiro)

Leitura de 07/10/2026 (projeto 85760). Saúde de 0 a 10; quanto menor,
mais caro de mexer. **12 dos 18 já fechados** em 08/10 — este doc lista
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
| 7 | ~~7,94~~ **10,00** | `apps/web/app/components/SeuNono.tsx` | 1.909 | 36 | ✅ nesting=4 eliminado, 2 métodos cc=10 quebrados, 6 avisos→0; commit `e9431edd` |
| 8 | ~~8,05~~ | `apps/web/app/ambiental/page.tsx` | 410 | 34 | ✅ AmbientalHome 400→48, BLOCOS partido em 2; commit `4c7cf656` |

Todos os 8 hotspots da fila original foram fechados. Saúde dos
refatorados sem número: **recalcular na próxima análise do CodeScene**
(nunca presumir — medir).

## Já fechados (12 de 18)

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
| 7,94 | `app/components/SeuNono.tsx` | `e9431edd` | nesting=4 eliminado, 2 métodos cc=10, 6 avisos→0, nota 10,00 |

Saúde dos refatorados: **recalcular na próxima análise do CodeScene**
(nunca presumir que melhorou — medir).

## Bus factor / knowledge maps

**O que é.** Bus factor é o risco de uma pessoa só ser dona de um pedaço do
código: se ela sair, ninguém mais entende aquilo (o nome vem do "motorista
do ônibus"). No CodeScene isso vira o mapa de conhecimento — quanto mais
diferentes forem os donos de um arquivo, mais seguro ele está.

**Medição de 09/10/2026** (`code_ownership_for_path`, projeto 85760):

| Arquivo | Saúde | Revisões | Donos | Bus factor |
|---|---|---|---|---|
| `apps/web/app/page.tsx` | 7,49 | 51 | `FinweeJur` | **1** |
| `apps/web/app/components/TopNav.tsx` | 8,46 | 40 | `FinweeJur` | **1** |
| `apps/web/app/layout.tsx` | 8,98 | 38 | `FinweeJur` | **1** |
| `apps/web/app/components/SeuNono.tsx` | 7,95 | 36 | `FinweeJur` | **1** |
| `apps/web/lib/db/queries/betim.ts` | 7,09 | 32 | `FinweeJur` | **1** |
| `apps/web/public/terras/globo/js/ui/rotulos.js` | 6,46 | 16 | `FinweeJur` | **1** |
| `etl/betim/etl/common.py` | 6,87 | 10 | `FinweeJur` | **1** |

**Leitura — e o cuidado para não alarmar.** Todo arquivo medido tem bus
factor 1, mas aqui **1 não é fragilidade**: o repo é do dono, e todas as
sessões de agente empurram para o MESMO `FinweeJur` — vale a conta do
GitHub, não a pessoa. O que isso de fato mede é: **um único ponto de
entrada** para o histórico do projeto.

Onde o número passa a valer de verdade: se um dia entrar outra conta
(terceiro, robô dedicado), aí sim uma diferença de donos passa a mostrar
quem entende o quê. Recalcular nessa hora.

**Dashboard (knowledge maps):**
[hotspots](https://codescene.io/projects/85760/jobs/7854262/results/code/technical-debt/system-map?max-code-health=10.00&min-change-freq=0&showHotspotsOnly=true&min-coverage=0.00&max-coverage=100.00#hotspots)
e
[biomarkers](https://codescene.io/projects/85760/jobs/7854262/results/code/biomarkers).

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
