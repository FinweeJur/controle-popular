# Expansao para as 853 cidades de MG - Fase 2

> **Tipo:** RELATORIO
> **Dominio:** cidades
> **Ultima medicao:** 2026-11-08
> **Leitura estimada:** media (8-12 min)
> **Relacionados:** [expansao-fase0-2026-11-08.md](expansao-fase0-2026-11-08.md), [expansao-fase1-2026-11-08.md](expansao-fase1-2026-11-08.md), [ESTADO.md](../02-estado/ESTADO.md)
> **Palavras-chave:** expansao, municipios, MG, sitemap, busca, indice, congelado, cidades-do-build, 853, fase 2

## Sumario

- [Resumo](#resumo)
- [1. Metodo](#1-metodo)
- [2. Sitemap](#2-sitemap)
- [3. Busca](#3-busca)
- [4. Congelado](#4-congelado)
- [5. Links mortos](#5-links-mortos)
- [6. Medido vs estimado](#6-medido-vs-estimado)
- [7. Riscos](#7-riscos)
- [8. Reprodutibilidade](#8-reprodutibilidade)
- [9. Verificacao](#9-verificacao)

## Resumo

Medi sitemap, busca e o modulo congelado com as 853 cidades ativas, sem
Postgres e sem rodar build. O veredito muda pouco em relacao as estimativas
anteriores, mas com tres correcoes importantes:

| Entrega | Resultado medido |
|---|---|
| Sufixos por cidade no sitemap | **61** (52 da lista manual + 9 descobertos no disco) |
| Sitemap com 853 so-pagina | **52.511 URLs**, **9.821.120 bytes** (9,4 MiB) |
| Sitemap com 853 e fontes completas | **49.952 URLs**, **9.331.786 bytes** (8,9 MiB) |
| Sitemap hoje (12 cidades, sem banco) | 1.187 URLs, 219.484 bytes |
| Teto do protocolo de sitemap | **50.000 URLs por arquivo** - as duas projecoes com banco real estouram |
| Busca hoje (indice real no disco) | 31.653 documentos, **18.119.482 bytes** (17,3 MiB) |
| Crescimento do indice so por mapear 853 cidades | **+163.389 bytes** em documentos ComunicaBR (+ ~30 KB estimados em vocabulario/formas) |
| `cidades-do-build.ts` hoje (12 cidades) | **13.883 bytes** - nao 21,4 KB como estimado antes |
| `cidades-do-build.ts` com 853 completas | **1.236.930 bytes** (48.220 gzip) |
| `cidades-do-build.ts` com 853 so-pagina | **223.464 bytes** (15.006 gzip) |
| Links mortos hoje no indice real | **0** (24.366 documentos de cidade, todos com slug no build) |

A frase que resume: **o indice de busca nao multiplica por cidade; o sitemap
multiplica e passa do teto do protocolo.** O risco de link morto nao vem do
tamanho, vem de congelar a lista de cidades e o indice em momentos diferentes.

## 1. Metodo

- Worktree temporario `C:\DevCoder\worktrees\dev2\f2` em `674a7275` (origin/main).
- Sem `.env.local` e sem `DATABASE_URL`; `getDb()` devolve `null` e
  `listarCidades()` cai em `CIDADES_DO_BUILD` (`lib/db/queries/municipios.ts:169-185`).
- Injetei dois arquivos gerados no lugar de `lib/db/cidades-do-build.ts`,
  sempre restaurando o original ao fim de cada medicao:
  - **853 so-pagina:** `fontes: null` nas 853 cidades, como a proposta de
    "cidade so-pagina" do diagnostico da F0.
  - **853 completa:** estrutura da entrada real de Aracuai replicada nas 853
    (hosts derivados do slug; `cnpj_prefeitura`, `lat` e `lng` de modelo, so
    para medir bytes). Nao e dado de fonte.
- O sitemap foi gerado chamando a exportacao real de `app/sitemap.ts`, e o XML
  foi serializado no formato exato do Next, conferido contra o sitemap do
  build de hoje em `.next/server/app/sitemap.xml.body` (mesmas tags e quebras
  de linha).
- Nada de build de 853, deploy, output export ou dado bruto.

## 2. Sitemap

Sufixos efetivos (`app/sitemap.ts:182-188`): **52** da lista manual
`ROTAS_CIDADE` + **9** descobertos no disco que nao estavam nela - `/gestao`,
`/historico`, `/indice`, `/interesses`, `/legislacao`, `/painel-do-cidadao`,
`/prefeitura/diario`, `/prefeitura/fornecedores`, `/terras/cruzamentos`
(`lib/sitemap/rotas-descobertas.ts:286-346`) = **61**.

Os 4 sufixos com gate de fonte (`camara/proposicoes`, `citrolandia`,
`links-uteis-mg`, `meio-ambiente/paraopeba`) passam todos quando `fontes` e
`null`, porque `temFonte()` devolve `true` nesse caso
(`lib/db/queries/municipios.ts:420-424`). Com fontes completas, 3 deles caem e
sobram 58 por cidade.

| Cenario | Cidades | URLs totais | URLs de cidade | Sufixos/cidade | XML |
|---|---:|---:|---:|---:|---:|
| Hoje, sem banco | 12 | 1.187 | 709 | 58 a 61 | 219.484 B (214 KB) |
| 853 so-pagina | 853 | **52.511** | **52.033** | 61 | **9.821.120 B** (9,4 MiB) |
| 853 com fontes completas | 853 | **49.952** | **49.474** | 58 | **9.331.786 B** (8,9 MiB) |

Tempo de geracao, sem banco: **10-75 ms** com 12 cidades e **128-131 ms** com
853. O tempo com Postgres **nao foi medido**: `rotasDeCidade()` faz duas
consultas por cidade (`app/sitemap.ts:195` para noticias e `:226` para
vereadores), ou seja **1.706 consultas** com 853 cidades, disparadas em
`Promise.all` (`:545`).

**Projecao com o banco real de hoje.** O sitemap do build atual tem 8.845 URLs
e 1.894.532 bytes, dos quais **8.029 sao globais** (congresso, empresas etc.)
e 816 sao de cidade. Somando os globais reais a expansao medida:
**~60.062 URLs** (853 so-pagina) ou **~57.503** (fontes completas), com
**~12,9 MB** e **~12,3 MB** de XML pela media real de 214 bytes/URL.

**Teto do protocolo:** 52.511 (medido) e ~60 mil (projetado) passam do limite
de **50.000 URLs por arquivo** do sitemap. A projecao com fontes completas
(49.952) passa por apenas 48 URLs e estoura assim que noticias/vereadores
entram. Antes de ativar 853, o sitemap precisa virar indice fatiado - o Next
suporta `generateSitemaps()`, que hoje nao e usado.

## 3. Busca

**O que o script mede e o que ele nao mede.** `scripts/gerar-indice-busca.mts`
sai cedo quando nao ha banco (`:208-221`) e grava um indice vazio - sem chamar
`listarCidades()`. Por isso o tempo e o tamanho do caminho vazio nao mudam
com o catalogo:

| Cenario | Tempo | Saida |
|---|---:|---:|
| 12 cidades, sem banco | 2.055 ms | 3 manifestos, 276 bytes |
| 853 cidades, sem banco | 1.760 ms | 3 manifestos, 276 bytes |

A diferenca e ruido de inicializacao do `tsx`; o caminho vazio nem abre a
lista de cidades.

**Indice real de hoje** (gerado no build das 06:14 desta maquina, lido do
disco em `apps/web/public/busca-indice/`):

| Grupo | Linhas | Bytes | Fatias |
|---|---:|---:|---:|
| documentos | 31.653 | 13.283.438 | 7 |
| vocabulario | 33.543 | 4.230.012 | 3 |
| formas | 33.886 | 605.592 | 1 |
| **total em disco** | | **18.119.482** (17,3 MiB) | 14 arquivos |

**Crescimento causado so por ativar 853 cidades.** O indice nao cria um
documento por cidade. O unico bloco que depende do catalogo e o ComunicaBR
(`scripts/gerar-indice-busca.mts:480-529`): ele gera um documento por
municipio de MG que tenha valor publicado. O arquivo `comunicabr-31.json` tem
**853 municipios de MG com valor**; hoje so **11** casam com a lista de 12
cidades, com **11 documentos e 2.056 bytes**. Com 853 cidades mapeadas:
**853 documentos, 165.445 bytes** - **+163.389 bytes**, media de 194 bytes por
documento, com texto real do arquivo.

Em vocabulario/formas, a estimativa e **+~30 KB** (923 formas de superficie
distintas contra 38 de hoje; o radical de verdade vem do `ts_lexize` do
Postgres e nao foi medido). Total: o indice sairia de ~18,1 MB para **~18,3 MB
(+1%)**. O custo dominante continua sendo o acervo do banco, nao as cidades.

**Tempo com banco nao medido.** Alem das consultas de acervo, cada municipio
ComunicaBR com valor faz uma consulta `to_tsvector` propria, em serie
(`:511-513`): 853 consultas contra 11 hoje. Estimativa: **+1 a 3 s**, sem
medicao.

**Payload da pagina `/busca`.** `listarCidades()` vai inteira como prop para o
componente cliente (`app/busca/page.tsx:57`; `BuscaClient.tsx:65-68`) e vira o
`<select>` de territorio (`:225-231`):

| Cenario | JSON das cidades | Bytes de `<option>` |
|---|---:|---:|
| 12 cidades (entradas completas) | 9.729 B | 613 B |
| 853 so-pagina | 146.201 B | 48.958 B |
| 853 completas | **913.150 B** | 48.958 B |

Com banco no build, `listarCidades()` devolve as linhas completas - entao o
cenario realista e o de **913 KB** de JSON embutido na pagina estatica, nao o
de 146 KB.

**Links mortos.** O indice real tem **24.366 documentos com slug de cidade**,
todos dos 12 slugs do build: **0 links mortos hoje**. O risco aparece quando
uma cidade nova for coletada antes de entrar no congelado: documentos de
`atos_oficiais`/`proposicoes` apontam para `/${slug}/prefeitura/legislacao` e
`/${slug}/camara/proposicoes` (`:287-289` e `:337-339`) e passam pelo layout
`app/[municipio]/layout.tsx:86`, que devolve 404 para slug fora da lista. Os 11
documentos ComunicaBR nao correm esse risco: o destino
`/dados/comunicabr/<codigo>` le o arquivo versionado e nao a tabela
`municipios` (`app/dados/comunicabr/[codigo]/page.tsx:247-248`).

Correcao de premissa: o script **entra no `prebuild`** como `indice:busca`
(`apps/web/package.json:10,16`) - o cabecalho do arquivo, que diz "roda manual",
esta velho. Isso e bom: rodando no mesmo `prebuild` do `npm run cidades`, o
indice e o congelado saem do mesmo estado do banco.

## 4. Congelado

`lib/db/cidades-do-build.ts` e um array literal TypeScript importado por tres
modulos: `lib/db/queries/municipios.ts` (fallback do servidor),
`lib/assistente/catalogo.ts` (servidor) e `lib/cidades/cobertas.ts`, que e
importado por `app/cidades/TabelaCidadesClient.tsx` (componente **cliente**) e
portanto vai para o bundle do navegador.

| Cenario | Bytes | gzip | Bytes/entrada |
|---|---:|---:|---:|
| Hoje (12 cidades, arquivo real) | **13.883** | 2.920 | 1.157 |
| 853 completas (simulado) | **1.236.930** (1,18 MiB) | 48.220 | 1.450 |
| 853 so-pagina (simulado) | **223.464** (218 KB) | 15.006 | 262 |

O valor de 21,4 KB para 12 cidades que circulou no diagnostico da F0 **nao
confere** com o arquivo versionado: sao 13.883 bytes. A projecao de ~1,45 MB
para 853 completas fica em **1,21 MB** medidos; a versao so-pagina fica em
**218 KB**.

No bundle cliente de `/cidades`, a versao completa acrescenta **~45 KB gzip**
(2,9 KB -> 48,2 KB) e a so-pagina **~12 KB gzip** (2,9 KB -> 15,0 KB).

## 5. Links mortos

Tres superficies, tres comportamentos:

| Superficie | Hoje | Com 853 ativas e congelado de 12 |
|---|---|---|
| Sitemap | 816 URLs de cidade no build real | **52.033 URLs de cidade** anunciadas; so as 12 cidades resolvem - **~51,2 mil URLs para 404** |
| Indice de busca | 24.366 docs de cidade, 0 mortos | docs das cidades novas so nascem depois da coleta; cada doc de cidade fora do congelado vira 404 |
| Seletor de `/busca` | 12 opcoes | 853 opcoes; cidade sem documento mostra "nenhum resultado", nao 404 |

O caso do sitemap e o mais grave porque e o que o buscador le. Ele so fica
correto se o `prebuild` regerar `cidades-do-build.ts` com o mesmo banco que
gerou o sitemap. Quando `BUILD_TARGET=standalone` ou `DOCKER_BUILD=1`, o
gerador preserva o arquivo versionado e sai com 0
(`scripts/gerar-cidades.mts:79-84`): nesse cenario o sitemap anuncia 853 e o
runtime so conhece 12.

## 6. Medido vs estimado

| Item | Medido | Estimado / nao medido |
|---|---|---|
| Sufixos por cidade | 61 (52 + 9) | - |
| Sitemap 853 so-pagina | 52.511 URLs, 9.821.120 B, 128-131 ms sem banco | tempo com 1.706 consultas ao Postgres |
| Sitemap 853 completa | 49.952 URLs, 9.331.786 B | idem |
| Sitemap com globais reais | - | ~60.062 URLs, ~12,9 MB |
| Indice hoje | 31.653 docs, 18.119.482 B | - |
| Indice com 853 | +163.389 B em documentos (ComunicaBR real) | +~30 KB em vocabulario/formas; +1 a 3 s de consultas |
| `/busca` payload | 913.150 B JSON (853 completas), 48.958 B de options | tamanho final do HTML/RSC |
| Congelado | 13.883 B hoje; 1.236.930 B completo; 223.464 B so-pagina | - |

Nao medido, por restricao: build com 853, deploy, geracao de sitemap/indice
com Postgres real, e o HTML final de `/busca`. O build atual foi usado apenas
como referencia de formato e de corpus global.

## 7. Riscos

1. **Teto de 50.000 URLs do sitemap.** Medido: 52.511 na versao so-pagina;
   ~60 mil com os globais reais. Precisa de indice fatiado antes da Onda 2/3.
2. **Congelado e sitemap em momentos diferentes.** Se o `prebuild` nao
   regerar `cidades-do-build.ts` com o mesmo banco, ~51,2 mil URLs do sitemap
   apontam para 404 no Worker.
3. **Payload de `/busca`.** 913 KB de JSON de cidades com entradas completas
   (146 KB so-pagina) mais 49 KB de `<option>`; a pagina e `force-static`
   (`app/busca/page.tsx:40`) e carrega tudo no cliente.
4. **Bundle cliente de `/cidades`.** A versao completa do congelado soma
   ~45 KB gzip ao navegador; a so-pagina, ~12 KB.
5. **Custo de consultas do sitemap.** 1.706 consultas com 853 cidades, em
   `Promise.all`; nao medidas. E o unico ponto do sitemap que cresce por
   cidade no build.
6. **`temFonte(null) = true`.** Com cidade so-pagina, os 61 sufixos entram no
   sitemap mesmo sem fonte; a pagina responde estado vazio, mas isso so esta
   garantido pelo layout - vale conferir uma rota gated em runtime antes de
   anunciar em massa.
7. **Indice depende do banco no `prebuild`.** Sem `DATABASE_URL` ele grava
   indice vazio e o `/busca` sobe sem acervo; o aviso e um `console.warn`
   (`scripts/gerar-indice-busca.mts:212-221`).

## 8. Reprodutibilidade

Scripts descartaveis usados fora do commit, em `apps/web/_f2/`:

```powershell
# com o worktree em 674a7275, sem DATABASE_URL
node _f2/prep.mjs                             # gera as duas versoes de cidades-do-build.ts
npx tsx _f2/medir-sitemap.mts                 # chama app/sitemap.ts e serializa o XML
npx tsx _f2/medir-busca-mapa.mts              # payload de /busca + docs ComunicaBR reais
npx tsx _f2/medir-indice-real.mts             # le o indice real de public/busca-indice
npx tsx scripts/gerar-indice-busca.mts        # caminho sem banco: indice vazio
```

Para trocar o cenario, copiar `_f2/out/cidades-853-so-pagina.ts` (ou
`cidades-853-completa.ts`) sobre `apps/web/lib/db/cidades-do-build.ts`,
rodar o medidor e restaurar o original. O sitemap real de referencia esta em
`apps/web/.next/server/app/sitemap.xml.body`.

## 9. Verificacao

- Arquivo original `lib/db/cidades-do-build.ts` restaurado apos cada medicao
  (`git status` sem alteracao de fonte).
- Nenhum build de 853, nenhum deploy, nenhum dado bruto gravado.
- Numeros de documentos do indice conferidos contra o manifesto real
  (`docs/manifesto.json`: 31.653 linhas, 7 fatias).
- Contagem de 853 municipios ComunicaBR conferida expandindo o arquivo real
  com o codec do proprio repo.
- XML confere com o formato do build real (`<url>` em linha propria, `loc`,
  `lastmod`, `changefreq`, `priority`).
