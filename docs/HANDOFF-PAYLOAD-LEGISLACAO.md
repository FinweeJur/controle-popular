# O deploy está travado por tamanho de asset — e o culpado não é o dado

> Escrito em 2026-08-15, no fim da sessão que carregou a legislação federal.
> **O site no ar é o de 10:08 daquele dia.** O código está publicado
> (`b9e34c5`), o build passa, mas `cf:deploy` recusa.

## O erro, literal

```
Error: Asset too large.
Cloudflare Workers supports assets with sizes of up to 25 MiB.
We found a file .open-next/assets/cdn-cgi/_next_cache/<hash>/ambiental/legislacao.cache
with a size of 35.5 MiB.
```

## A causa

`app/ambiental/legislacao/page.tsx` entrega **todas** as normas como props para
`BuscaLegislacaoUnificada`, que é componente de cliente. Isso serializa o
corpus inteiro no payload da rota. Com as 6.378 estaduais cabia; com as 8.940
federais carregadas em 15/08, não cabe mais.

## O número que decide o conserto

| | |
|---|---:|
| texto real das 15.318 ementas (+ indexação, tipo, órgão, link) | **4,7 MiB** |
| `legislacao.cache` gerado | **35,5 MiB** |
| razão | **7,5×** |

**Não é volume de dado, é custo de entrega.** O payload vai embutido duas
vezes (HTML e RSC flight) e cada linha repete o nome de todos os campos. 15
mil normas cabem folgadas em 25 MiB; 15 mil normas serializadas deste jeito,
não.

Medido por esfera, para servir de régua:

| esfera | normas | texto | bytes/ementa |
|---|---:|---:|---:|
| estadual | 6.378 | 1,7 MiB | 197 B |
| nacional | 8.940 | 3,0 MiB | 206 B |

## Não é só esta página

```
36 MiB  ambiental/legislacao.cache      ← estourou
21 MiB  sp/educacao.cache               ← a 4 MiB do teto, sem ninguém ter mexido
11 MiB  bh/camara/legislacao.cache
9,5 MiB diamantina/camara/legislacao.cache
```

`sp/educacao` vai cobrar a mesma conta sozinho, na próxima ingestão. Tratar
isto como caso isolado da legislação é adiar o mesmo susto.

## O plano combinado com o dono

1. **Enxugar o payload** — nomes de campo curtos ou array de arrays em vez de
   objetos, e cortar campo que a busca não usa. Contido, mensurável, invisível
   na tela, e ataca exatamente os 7,5×. É o que destrava.
2. **Servir a busca do índice estático** — a infraestrutura já existe
   (`public/busca-indice/**`, fatiada por grupo, gerada por
   `scripts/gerar-indice-busca.mts`, consumida por `lib/busca/indice.ts`).
   É a resposta durável e resolve `sp/educacao` junto.

Descartadas, com o motivo: **separar por esfera em duas rotas** (mata o "numa
busca só", que é a promessa da página) e **reverter a carga federal** (desfaz
o trabalho e devolve o portal ao estado de não ter legislação federal).

## O que já está feito, para não refazer

- 8.940 normas federais no Postgres local (8.570 MMA + 370 CNDH), medidas
  contra a fonte viva.
- Temas reclassificados sobre as 15.318: **4.690 (30,6%)** — estadual 31,5%,
  nacional 28,2%. Antes da carga a tela publicava 13,1%, que era uma média
  verdadeira escondendo 31,5% de um lado e 0% do outro.
- As 5 fontes de legislação + o classificador declarados como passos mensais
  em `etl-betim.yml` (antes não estavam em workflow nenhum — ver
  `docs/rotina-local.md`).
- CPF na ementa oficial redigido na ingestão por `redigir_documentos`, com
  regressão diária (`python -m etl.apis._legislacao_ambiental --testar`).

## O que acontece amanhã se ninguém mexer

A rotina das 06:00 roda, o ETL passa, o build passa com 3.872 páginas — e o
deploy falha no mesmo ponto. **O site não quebra; ele para no tempo.** O log
do dia termina em `ABORTADO:` e `Get-ScheduledTaskInfo` mostra resultado ≠ 0.
