# HOTSPOTS CodeScene — fila de refatoração

> **Tipo:** PLANO
> **Domínio:** global (CodeScene, refatoração de hotspots)
> **Última medição:** 2026-10-09
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** codescene, hotspots, refatoracao, saude, divida, bus factor, decline

## Sumário

- [Como esta leitura foi feita](#como-esta-leitura-foi-feita)
- [Fila — os 18, ao vivo](#fila--os-18-ao-vivo)
- [Declínio medido](#declínio-medido)
- [Próximos passos](#próximos-passos)
- [Já fechados — o que o número confirma](#já-fechados--o-que-o-número-confirma)
- [Bus factor / knowledge maps](#bus-factor--knowledge-maps)
- [Regras](#regras)

## Como esta leitura foi feita

**O job da nuvem está parado, e isso é o achado do dia.** Os 18 scores que a
API do CodeScene devolve hoje (job `7854262`) são **idênticos, casa por casa,
aos valores de ANTES das refatorações** — `sobre/page.tsx` vem 7,268 da nuvem
e está 10,0 na máquina; `Catalogo100PaginasClient.tsx` vem 2,170 e está 10,0.
Ou seja: dashboard e portões de PR estão decidindo com dado velho.

Por isso esta leitura é **local**, com o próprio analisador:

```bash
cs review <arquivo>     # requer CS_ACCESS_TOKEN; mede o arquivo na hora
cs delta <base> <head>  # mede o que os commits mudaram
```

Nunca presumir melhora — medir (regra 5, lá embaixo).

## Fila — os 18, ao vivo

Medição de 09/10/2026, `cs review` em cada hotspot. Saúde de 0 a 10;
quanto menor, mais caro de mexer. Ordenado do pior para o melhor.

| Saúde | Arquivo | Nuvem (velha) | Δ | Situação |
|---|---|---|---|---|
| **1,36** | `apps/web/lib/assistente/escada-determinista.ts` | 1,454 | **−0,09** | 🔴 vermelho, e piorou |
| 6,64 | `apps/web/lib/ambiental/licencas-unificada.ts` | 5,729 | +0,91 | 🟡 melhorou, ainda amarelo |
| 6,97 | `etl/betim/etl/common.py` | 6,870 | +0,10 | 🟡 |
| 7,03 | `apps/web/app/components/CompanheiroFlutuante.tsx` | 7,038 | 0,00 | 🟡 não tocado |
| 7,30 | `apps/web/lib/db/queries/betim.ts` | 7,090 | +0,21 | 🟡 |
| 7,96 | `apps/web/app/indice/page.tsx` | 7,982 | −0,02 | 🟡 micro-queda |
| 8,01 | `apps/web/app/components/PlayerRadio.tsx` | 8,014 | 0,00 | 🟢 |
| 8,15 | `apps/web/app/[municipio]/vereadores/[slug]/page.tsx` | 7,312 | +0,84 | 🟢 |
| 8,32 | `apps/web/app/funcaosocialterra/page.tsx` | 8,327 | −0,01 | 🟢 micro-queda |
| 8,45 | `apps/web/public/terras/globo/js/ui/rotulos.js` | 6,463 | +1,99 | 🟢 |
| 8,46 | `apps/web/app/components/TopNav.tsx` | 8,463 | 0,00 | 🟢 |
| 8,98 | `apps/web/app/layout.tsx` | 8,982 | 0,00 | 🟢 |
| 9,06 | `apps/web/app/ambiental/page.tsx` | 8,058 | +1,00 | 🟢 |
| 9,38 | `apps/web/lib/assistente/acervo.ts` | 6,982 | +2,40 | 🟢 |
| **10,00** | `apps/web/app/indice/Catalogo100PaginasClient.tsx` | 2,170 | +7,83 | ✅ nota perfeita |
| **10,00** | `apps/web/app/page.tsx` | 7,487 | +2,51 | ✅ nota perfeita |
| **10,00** | `apps/web/app/components/SeuNono.tsx` | 7,946 | +2,05 | ✅ nota perfeita |
| **10,00** | `apps/web/app/sobre/page.tsx` | 7,268 | +2,73 | ✅ nota perfeita |

## Declínio medido

**Só um arquivo regrediu de verdade: `escada-determinista.ts`.**
Passou de 1,454 para **1,36**, e continua no vermelho com **9 problemas**:

- **6 métodos complexos** — o pior é `degrau4Ferramentas` com
  **complexidade 54 e 216 linhas**; depois `degrau3Empresas` (cc 31),
  `degrau2Cidades` (cc 27), `degrau45Bases` (cc 26);
- **34 condicionais complexas** espalhadas em 9 funções;
- **6 métodos grandes** (o maior com 216 linhas);
- arquivo único passando de mil linhas, obsessão por primitivo e
  argumentos em string.

**Por que a refatoração anterior não subiu a nota.** O commit `cad5f8fa`
fez "156 inserções, 0 deleções". As regras que derrubam a nota aqui são
*Lines of Code in a Single File*, *Large Method* e *Complex Method* —
as três pioram ou não mudam quando só se **soma** linha. Separar em mais
funções sem quebrar as antigas não resolve; as funções grandes precisam
ser divididas de verdade.

Os três outros declínios são ruído de arredondamento (−0,01 e −0,02),
provavelmente do próprio arquivo ter mudado desde o job velho — não
merecem fila própria.

`cs delta e9431edd HEAD` (a semana das refatorações + este trabalho)
respondeu **"No issues found"**: nenhum commit introduziu problema novo.
O declínio é de arquivo velho, não de commit recente.

## Próximos passos

1. **🔴 Partir `degrau4Ferramentas` (cc 54, 216 linhas)** e depois
   `degrau3Empresas` (cc 31). É o único vermelho do projeto e o único em
   declínio. Prova de equivalência obrigatória (regra 2), porque este é o
   módulo que decide a resposta do assistente — erro aqui é resposta errada
   para o cidadão.
2. **🔁 Disparar re-análise na nuvem.** Enquanto o job `7854262` não
   atualizar, o dashboard e os portões de PR avaliam dado de antes da
   refatoração. Vale conferir depois em codescene.io.
3. **🎯 Registrar metas de dívida técnica** — o CodeScene mostra
   `technical debt goals` **vazio**. Sem meta, ele não avisa declínio
   sozinho. Sugerida: nenhum hotspot abaixo de 7,00, e
   `escada-determinista.ts` acima de 6,00.
4. **🟡 Amarelos que sobraram:** `licencas-unificada.ts` (6,64, 5 avisos),
   `common.py` (6,97), `CompanheiroFlutuante.tsx` (7,03),
   `betim.ts` (7,30). Depois do vermelho.

## Já fechados — o que o número confirma

A fila original de 08/10 dizia "12 de 18 fechados". O número de hoje
**confirma 4 com nota perfeita** e mostra o resto como *melhorado, não
fechado*:

| Saúde hoje | Arquivo | Commit | Veredito |
|---|---|---|---|
| 10,00 | `app/indice/Catalogo100PaginasClient.tsx` | `a4a7f213` | ✅ fechado |
| 10,00 | `app/page.tsx` | `cafcb712` | ✅ fechado |
| 10,00 | `app/components/SeuNono.tsx` | `e9431edd` | ✅ fechado |
| 10,00 | `app/sobre/page.tsx` | `23b37453` | ✅ fechado |
| 9,38 | `lib/assistente/acervo.ts` | `7ba60b26` | 🟢 melhorou (6,98 → 9,38) |
| 9,06 | `app/ambiental/page.tsx` | `4c7cf656` | 🟢 melhorou (8,06 → 9,06) |
| 8,45 | `public/terras/globo/js/ui/rotulos.js` | `23b37453` | 🟢 melhorou (6,46 → 8,45) |
| 8,15 | `app/[municipio]/vereadores/[slug]/page.tsx` | `23b37453` | 🟢 melhorou (7,31 → 8,15) |
| 7,30 | `lib/db/queries/betim.ts` | `bb6387d1` | 🟡 melhorou pouco (7,09 → 7,30) |
| 6,97 | `etl/betim/etl/common.py` | `23b37453` | 🟡 melhorou pouco (6,87 → 6,97) |
| 6,64 | `lib/ambiental/licencas-unificada.ts` | `6788cc43` | 🟡 melhorou (5,73 → 6,64) |
| **1,36** | `lib/assistente/escada-determinista.ts` | `cad5f8fa` | 🔴 **não fechou, piorou** |

## Bus factor / knowledge maps

**O que é.** Bus factor é o risco de uma pessoa só ser dona de um pedaço do
código: se ela sair, ninguém mais entende aquilo (o nome vem do "motorista
do ônibus"). No CodeScene isso vira o mapa de conhecimento — quanto mais
diferentes forem os donos de um arquivo, mais seguro ele está.

**Medição de 09/10/2026** (`code_ownership_for_path`, projeto 85760):

| Arquivo | Saúde | Revisões | Donos | Bus factor |
|---|---|---|---|---|
| `apps/web/app/page.tsx` | 10,00 | 51 | `FinweeJur` | **1** |
| `apps/web/app/components/TopNav.tsx` | 8,46 | 40 | `FinweeJur` | **1** |
| `apps/web/app/layout.tsx` | 8,98 | 38 | `FinweeJur` | **1** |
| `apps/web/app/components/SeuNono.tsx` | 10,00 | 36 | `FinweeJur` | **1** |
| `apps/web/lib/db/queries/betim.ts` | 7,30 | 32 | `FinweeJur` | **1** |
| `apps/web/public/terras/globo/js/ui/rotulos.js` | 8,45 | 16 | `FinweeJur` | **1** |
| `etl/betim/etl/common.py` | 6,97 | 10 | `FinweeJur` | **1** |

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
6. **Nuvem parada ≠ saúde boa** — se o job não rodou, o número da nuvem é
   o de antes. Confirme sempre com `cs review` local (medido 09/10).
