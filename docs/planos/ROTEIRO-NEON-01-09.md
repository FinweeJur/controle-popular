# Roteiro — retomada da Neon em 2026-09-01 (HTTP 402)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** plano, ativo, tarefa

## Sumário

- [Propósito](#propósito)
- [Onde rodar](#onde-rodar)
- [Passo 1 — migrations pendentes (schema)](#passo-1-migrations-pendentes-schema)
- [Passo 2 — backfill do classificador de temas (atos_oficiais)](#passo-2-backfill-do-classificador-de-temas-atos-oficiais)
- [Passo 3 — URLs do TJMG em `direito_critico_precedentes`](#passo-3-urls-do-tjmg-em-direito-critico-precedentes)
- [Passo 4 — legislação federal (MMA + CNDH)](#passo-4-legislação-federal-mma-cndh)
- [Passo 5 — varredura total dos links em banco (item 6 do TODO)](#passo-5-varredura-total-dos-links-em-banco-item-6-do-todo)
- [Passo 6 — conferir que a Neon voltou de verdade](#passo-6-conferir-que-a-neon-voltou-de-verdade)
- [Origem](#origem)

> Escrito em 17/08/2026. Com a virada da cota da Neon em 01/09, os passos
> abaixo devem ser executados no `home-pc` para atualizar o banco que esteve em 402. Ordem importa:
> schema primeiro, dado depois, verificação por último. Tudo é idempotente
> (`if not exists`, `on conflict`) — reaplicar é seguro, mas não pula passo.

## Onde rodar

No **home-pc** (a máquina de build, que tem a Neon como `DATABASE_URL` no
`apps/web/.env.local`). Os comandos abaixo assumem `apps/web/` como diretório.

## Passo 1 — migrations pendentes (schema)

A Neon parou antes da `0071`. As 0072–0077 também nunca rodaram lá (foram
escritas entre 15 e 17/08, com a Neon já em 402). Aplicar em ordem:

```powershell
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0071_convenios_chave_estavel.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0072_patrimonio_tombado_iepha.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0073_legislacao_federal_esfera.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0074_adaptabrasil_risco_climatico.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0075_ouvidoria_betim_link_morto.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0076_arquivo_fontes.sql
npx tsx scripts/aplicar-migration.mts ../../supabase/betim/migrations/0077_atos_diario.sql
```

A `0071` é a que conserta o **convênio de Betim duplicado** (chave estável de
`convenios_federais`) — até ela rodar, aquele banco volta a duplicar convênio.

## Passo 2 — backfill do classificador de temas (atos_oficiais)

`etl/betim/.venv` (ou o Python com `requirements.txt` do ETL instalado):

```powershell
python -m etl.apis.classificar_temas_atos_oficiais --sondar   # confere
python -m etl.apis.classificar_temas_atos_oficiais            # grava
```

Esperado: **100 de 10.317** linhas com `temas` diferente do gravado (24 são o
efeito da regra de área protegida; os outros 76, limpeza de linhas nunca
classificadas). Idempotente — pode rodar de novo se uma regex mudar.

## Passo 3 — URLs do TJMG em `direito_critico_precedentes`

Os três links TJMG do seed apontavam para páginas que **morreram** (medido em
17/08: 404 nas três). O seed `etl/betim/dados-seed/direito-critico-popular.html`
já foi corrigido, mas a Neon guarda os valores antigos (a correção manual de
13/08 só rodou no banco local). Aplicar por SQL (o ingestor do seed não existe
mais no repo):

```sql
update direito_critico_precedentes set updated_at = now(),
  link_oficial = 'https://www.tjmg.jus.br/portal-tjmg/noticias/justica-estadual-ja-bloqueou-r-11-bilhoes-de-mineradora.htm'
where origem = 'direito-critico-popular' and id_fonte = 6;

update direito_critico_precedentes set updated_at = now(),
  link_oficial = 'https://consulta-jurisprudencia.tjmg.jus.br/pesquisa'
where origem = 'direito-critico-popular' and id_fonte = 7;

update direito_critico_precedentes set updated_at = now(),
  link_oficial = 'https://www.tjmg.jus.br/portal-tjmg/noticias/caso-brumadinho/'
where origem = 'direito-critico-popular' and id_fonte = 8;
```

Conferido ao vivo em 17/08: as três URLs novas respondem 200. O link do
id_fonte 7 é a **consulta de jurisprudência unificada** do TJMG
(desde 22/06/2026; a antiga `pesquisa-de-jurisprudencia.htm` morreu). O do
id_fonte 8 é o hub oficial do caso Brumadinho (a notícia específica de 2021
não sobreviveu ao novo portal).

## Passo 4 — legislação federal (MMA + CNDH)

Os JSONs já estão coletados e versionados (`etl/betim/dados/legislacao-mma.json`
— 8.570 normas, re-coletadas em 17/08 e idênticas ao congelado — e
`legislacao-cndh.json`). Só falta a carga, que o `carregar-legislacao-federal`
**recusa fazer contra a Neon** até o host local — em 01/09 ele passa a ser o
caminho errado para Neon; carregar no Postgres local e publicar com o build
normal, ou ajustar o host permitido se a carga for direto na Neon (decisão de
quem rodar — o script foi escrito para máquina com banco local):

```powershell
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-mma.json
npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-cndh.json
python -m etl.apis.classificar_temas_ambientais
```

Esperado: `ambiental_legislacao` com `fonte=mma` (8.570) e `fonte=cndh`,
esfera `nacional` — a lacuna do item 3 do TODO ("nenhuma norma federal,
nem a Resolução CONAMA que rege o licenciamento") fechada.

## Passo 5 — varredura total dos links em banco (item 6 do TODO)

A auditoria de 13/08 cobriu 129 URLs externas e **amostrou** 42 de 25.729
links guardados em banco. Rodar a varredura completa (por inteiro, não
amostra — ver o cabeçalho do script):

```powershell
node scripts/auditoria-links-normas.mjs
```

Saída: `scripts/_tmp-auditoria/resultado-<carimbo>.json`. Regras no script:
403/429/captcha não é quebrado; redirecionar para a home do órgão é quebra
disfarçada; `robots.txt` respeitado por host; UA honesto; pausa mínima por
host.

## Passo 6 — conferir que a Neon voltou de verdade

```powershell
npx tsx scripts/colunas-reais.mts convenios_federais atos_oficiais
```

E o convênio de Betim não duplicado:

```sql
select count(*), count(distinct (codigo, exercicio)) from convenios_federais
where id_municipio = '3106705';
```
