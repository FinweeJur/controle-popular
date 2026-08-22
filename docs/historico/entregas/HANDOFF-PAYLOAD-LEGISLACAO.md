# O deploy travou por tamanho de asset — e o culpado não era o dado

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, handoff, entrega

## Sumário

- [Propósito](#propósito)
- [O erro, literal](#o-erro-literal)
- [A causa](#a-causa)
- [O número que decide o conserto](#o-número-que-decide-o-conserto)
- [Não é só esta página](#não-é-só-esta-página)
- [O plano combinado com o dono](#o-plano-combinado-com-o-dono)
- [O que já está feito, para não refazer](#o-que-já-está-feito-para-não-refazer)
- [O que acontece amanhã se ninguém mexer](#o-que-acontece-amanhã-se-ninguém-mexer)

## Propósito

> ✅ **DESTRAVADO em 2026-08-15**, versão `721e648b` no ar em > `controlepopular.com.br`, com as 15.318 normas e cobertura de tema de 30,6% > conferidas na página publicada. O conserto está em > `apps/web/lib/ambiental/payload-compacto.ts`. > > **O passo 2 continua valendo.** O que se fez aqui foi...

> ✅ **DESTRAVADO em 2026-08-15**, versão `721e648b` no ar em
> `controlepopular.com.br`, com as 15.318 normas e cobertura de tema de 30,6%
> conferidas na página publicada. O conserto está em
> `apps/web/lib/ambiental/payload-compacto.ts`.
>
> **O passo 2 continua valendo.** O que se fez aqui foi levantar o teto, não
> tirá-lo do caminho: `sp/educacao.cache` seguia em 21 MiB quando isto foi
> escrito, e nada impede o corpus de dobrar de novo. Leia o resto deste
> documento como o diagnóstico que continua verdadeiro.
>
> ⚠️ **16/08/2026, mais tarde: apareceu um segundo teto, DIFERENTE deste.**
> Depois de mesclar 21+ commits do PC externo (novos coletores: Rouanet/
> SALIC, ComunicaBR, AJRI, índice estático generalizado em
> `lib/estatico/compactar.ts`), o `wrangler deploy` passou a recusar por
> **tamanho do SCRIPT do Worker**, não de um asset:
>
>     Your Worker exceeded the size limit of 3 MiB.
>     Total Upload: 22411.32 KiB / gzip: 3074.74 KiB
>
> Teto real: **3.072 KiB gzip** (plano gratuito). Overage medido: **~2,7 KiB**
> — quase nada, mas o site ficou na versão anterior até resolver (seguro, sem
> downtime). Causa isolada por medição: `apps/web/data/comunicabr-31.json`
> (2,16 MiB brutos, **687,9 KiB gzip** sozinho — ~22% do teto inteiro) é lido
> via `readFileSync` em `lib/comunicabr/mg.ts`, e esse padrão faz o
> OpenNext/Cloudflare adapter EMBUTIR o conteúdo do arquivo dentro do bundle
> do Worker, não servi-lo como asset separado.
>
> **Testado e descartado**: mover o arquivo para `apps/web/public/data/` e
> ajustar o `readFileSync` para o caminho novo — **não mudou nada**
> (3.074,71 → 3.074,74 KiB gzip). O mecanismo de embutir não olha para o
> diretório de origem; qualquer `readFileSync` de um caminho estático dentro
> do código do servidor parece ser candidato a inlining, esteja em `data/`
> ou em `public/`.
>
> **O que provavelmente resolve, não tentado ainda por falta de tempo**:
> converter `acervo()` em `lib/comunicabr/mg.ts` de leitura síncrona
> (`readFileSync` no escopo do módulo) para leitura assíncrona via
> `fetch()`/Cloudflare Assets binding, igual ao padrão que `educacao`/
> `legislacao` (municipal) já usam para tirar dado grande do bundle
> (`dados/[arquivo]/route.ts`). Blast radius pequeno e já medido: só 2
> arquivos de página (`app/dados/comunicabr/page.tsx`,
> `app/dados/comunicabr/[codigo]/page.tsx`) e o próprio teste de `mg.ts`
> importam essas funções — ambos já são Server Components `async`, então
> adicionar `await` nas chamadas é mudança pequena, não estrutural. Não fiz
> porque a sessão virou para outra prioridade (gatilho remoto,
> `docs/GATILHO-REMOTO.md`) antes de terminar de testar.

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

1. ✅ **Enxugar o payload** — FEITO. Nenhum campo pôde ser cortado (a tela usa
   os treze), então o ganho veio da forma: tupla em vez de objeto, dicionário
   para vocabulário fechado (`situacao` com 11 valores distintos, `tipo` com
   53, `orgao` com 174), prefixo de link em dicionário (4.077 links começam no
   mesmo domínio) e `chaveDedup` virando id de grupo — a tela nunca mostra a
   chave, só agrupa por ela.

   Medido: `legislacao.html` de 35,5 MiB de cache para **4,99 MiB**, `.rsc`
   **4,71 MiB**. Deploy passou.

   A armadilha que o formato introduz está coberta por teste: trocar duas
   posições da tupla grava campo errado **sem erro de tipo** — `ementa` e
   `data` são ambos `string | null`. Por isso o teste é ida-e-volta com
   igualdade profunda, e não amostragem de campo.

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
