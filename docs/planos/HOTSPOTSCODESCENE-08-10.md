# HOTSPOTS CodeScene — fila de refatoração

> **Tipo:** PLANO
> **Domínio:** global (CodeScene, refatoração de hotspots)
> **Última medição:** 2026-10-08
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** codescene, hotspots, refatoracao, saude, divida

## Sumário

- [Fila (pior primeiro)](#fila-pior-primeiro)
- [Já fechados (4 de 18)](#já-fechados-4-de-18)
- [Regras](#regras)

## Fila (pior primeiro)

Leitura de 07/10/2026 (projeto 85760). Saúde de 0 a 10; quanto menor,
mais caro de mexer. **4 dos 18 já fechados** em 08/10 — este doc lista
só o que falta. Nunca refatorar por intuição: sempre a partir daqui
(AGENTS §7 e pendência 10 de PENDENCIAS-07-10.md).

| # | Saúde | Arquivo | Loc | Rev. | Observação |
|---|---|---|---|---|---|
| 1 | **6,46** | `apps/web/public/terras/globo/js/ui/rotulos.js` | 514 | 16 | JS estático do globo 3D, **fora do vitest** — avaliar harness de teste antes de mexer |
| 2 | **6,87** | `etl/betim/etl/common.py` | 647 | 10 | ETL Python, **fora da suíte vitest** — testar com `pytest` ou harness próprio |
| 3 | **7,09** | `apps/web/lib/db/queries/betim.ts` | 2.558 | 32 | Maior arquivo do repo; queries Drizzle; atrito subindo (0,20/mês) |
| 4 | **7,27** | `apps/web/app/sobre/page.tsx` | 613 | 19 | Página estática longa; extrair lógica para `lib/` |
| 5 | **7,31** | `apps/web/app/[municipio]/vereadores/[slug]/page.tsx` | 617 | 17 | Página dinâmica; extrair lógica para `lib/` |
| 6 | **7,49** | `apps/web/app/page.tsx` | 543 | 51 | Home; 51 revisões; atrito subindo (0,26/mês) |
| 7 | **7,95** | `apps/web/app/components/SeuNono.tsx` | 1.909 | 36 | Componente gigante; quebrar em sub-componentes |
| 8 | **8,06** | `apps/web/app/ambiental/page.tsx` | 410 | 34 | Página ambiental; extrair lógica para `lib/` |

## Já fechados (4 de 18)

| Saúde original | Arquivo | Commit | Prova |
|---|---|---|---|
| 1,45 | `lib/assistente/escada-determinista.ts` | `cad5f8fa` | 11 funções, 156 ins/0 del, 12 testes |
| 2,17 | `app/indice/Catalogo100PaginasClient.tsx` | `a4a7f213` | .tsx 505→92, 21 regras em lib/, 43 testes |
| 5,73 | `lib/ambiental/licencas-unificada.ts` | `6788cc43` | 18 if → tabela, 18 testes |
| 6,98 | `lib/assistente/acervo.ts` | `7ba60b26` | 11 if → tabela, sha256 igual, 30 testes |

Saúde dos 4 refatorados: **recalcular na próxima análise do CodeScene**
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
