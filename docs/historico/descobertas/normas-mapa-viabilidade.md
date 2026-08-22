# Normas no mapa — viabilidade medida (2026-08-11)

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, documentacao

## Sumário

- [Propósito](#propósito)
- [O número que descreve a cobertura (não decide mais nada sozinho)](#o-número-que-descreve-a-cobertura-não-decide-mais-nada-sozinho)
- [Cobertura por município](#cobertura-por-município)
- [Os 11,2% que batem são majoritariamente confiáveis — mas são poucos](#os-112-que-batem-são-majoritariamente-confiáveis-mas-são-poucos)
- [Texto completo não ajuda — testado, não suposto](#texto-completo-não-ajuda-testado-não-suposto)
- [O que foi construído (Passo 2, depois da correção)](#o-que-foi-construído-passo-2-depois-da-correção)
- [Números da primeira rodada (2026-08-11)](#números-da-primeira-rodada-2026-08-11)

## Propósito

> Pedido original do dono do projeto: leis/decretos com endereço virarem uma > camada no globo 3D (`/funcaosocialterra/mapa`) — clicar no local mostra a > norma; clicar na norma mostra "ver no mapa". Ele confirmou "avance", com a > condição de medir antes de construir. Este documento é a medição....

> Pedido original do dono do projeto: leis/decretos com endereço virarem uma
> camada no globo 3D (`/funcaosocialterra/mapa`) — clicar no local mostra a
> norma; clicar na norma mostra "ver no mapa". Ele confirmou "avance", com a
> condição de medir antes de construir. Este documento é a medição.

> **Correção de 2026-08-11, depois da primeira versão deste documento.** A
> primeira versão concluía "não construir", usando `<10-15%` de cobertura como
> corte de parada. O dono do projeto corrigiu esse raciocínio: as outras
> camadas do globo TAMBÉM são parciais por natureza (`spu-imoveis-uniao` é
> 553 pontos de um cadastro que não cobre todo imóvel do Brasil;
> `pesquisa-noticias` é oportunista por design) — cobertura parcial não é
> defeito nesta arquitetura, é a regra. O corte de 10-15% não deveria ter sido
> aplicado aqui. **A camada FOI construída**, usando exatamente o subconjunto
> medido abaixo (ementa, sem PDF/texto completo — que os próprios testes
> abaixo mostram que não ajuda). Os números de medição continuam corretos e
> ficam registrados; só a conclusão no fim mudou.

## O número que descreve a cobertura (não decide mais nada sozinho)

**11,2% dos 10.317 atos oficiais têm alguma menção reconhecível de
logradouro/bairro/distrito na ementa** (1.160 atos, contagem exata sobre a
população inteira, não amostra). Testar o texto completo (não só a ementa)
não melhora esse número — ver abaixo.

## Cobertura por município

| Município | Atos | Ementa com endereço | link_fonte |
|---|---:|---:|---|
| Araçuaí | 651 | 20 (3,1%) | 651/651 — SAPL, HTML por norma |
| Belo Horizonte | 3.586 | 353 (9,8%) | 3.586/3.586 — API DOM-web, texto completo por ato |
| Betim | 660 | 1 (0,2%) | **0/660 — não existe** |
| Diamantina | 3.148 | 519 (16,5%) | 3.148/3.148 — mas é **a mesma URL genérica em todo registro** (`cmdiamantina.mg.gov.br/leis`), não linka a norma individual |
| Itinga | 39 | 0 (0,0%) | 39/39 — PDF direto (Simple System) |
| São Paulo | 2.233 | 267 (12,0%) | 2.233/2.233 — HTML por norma, texto completo |
| **Total** | **10.317** | **1.160 (11,2%)** | |

Termos que mais disparam o regex (uma ementa pode bater mais de um):
`bairro` 586 · `rua` 437 · `distrito de` 304 · `praça` 158 · `vila` 129 ·
`travessa` 75 · `avenida` 56 · `loteamento` 13 · `viela` 8 · `zona
rural/urbana` 7 · `estrada` 4 · `largo` 4 · `alameda` 2 · `rodovia` 1 ·
`quadra` 1. (`Av.`, `rod.`, `km `, `BR-`/`MG-`/`SP-` não bateram nenhuma vez
na amostra.)

## Os 11,2% que batem são majoritariamente confiáveis — mas são poucos

Revisão manual de 30 ementas sorteadas dentre as que bateram no regex (fora o
subconjunto óbvio de "denominação de rua"): **27/30 (90%) são referência real
de lugar** — a maioria em nível de **bairro/distrito** ("Declara de utilidade
pública... situado no Bairro Buritis"), uma parte menor com **rua + número**
de precisão real, sobretudo em decretos de São Paulo ("Avenida Francisco
Machado da Silva, nº 1410, Distrito de Cachoeirinha"). Os 3 falsos positivos
foram todos por "rua" aparecendo fora de contexto de endereço — "população em
situação de rua", programa "Rua para Todos".

Ou seja: **o problema não é confiabilidade do que se acha — é volume**. Não é
"achismo demais", é "endereço de verdade, só que raro" (~1 em cada 9 normas).

Dentro desses 11,2%, o subconjunto mais confiável de todos é a lei cujo
**objeto inteiro é nomear uma rua/praça** (ementa começa com "Dá denominação
de..." / "Denomina..." / "Estabelece o nome de..." — em BH a fórmula é "Dá o
nome de..."). Contagem por `ementa ~* 'denomin'` (subconta BH, que usa outra
fórmula): **704/10.317 (6,8%)** — concentrado em Diamantina (428) e São Paulo
(255); quase zero em BH (2, por causa da fórmula diferente), Araçuaí (18),
Betim (1), Itinga (0).

## Texto completo não ajuda — testado, não suposto

O pedido pedia testar se o texto INTEIRO da norma (não só a ementa) teria
taxa de acerto maior. Testado nos dois formatos de fonte que o projeto tem:

**Belo Horizonte** (API do DOM-web tem `conteudo_html` — o corpo inteiro do
ato, sem precisar de PDF, ver `etl/betim/etl/pbh/legislacao.py`): amostra de
20 atos reais do banco. Batendo só nos 3 primeiros parágrafos (proxy de
ementa): 2/20 (10%). Batendo no corpo inteiro: 3/20 (15%) — **mas o hit
extra foi falso positivo** ("população em situação de rua", não endereço).
Ler o ato inteiro não achou nenhum endereço a mais que a ementa já não
tivesse — só trouxe ruído.

**Itinga** (único município com PDF direto por norma, `pymupdf`): amostra de
18 PDFs baixados e lidos. **17/18 (94%) são scan de imagem, zero texto
extraível** — sem OCR (fora do escopo deste projeto, que não tem essa
ferramenta) não dá pra ler nem a ementa, quanto mais achar endereço.

**Diamantina e Betim nem dá pra testar**: Diamantina só tem uma URL genérica
igual em todo registro (não linka a norma específica); Betim não grava
`link_fonte` — o coletor (`etl/betim/etl/prefeitura/legislacao.py`) nunca
populou esse campo.

## O que foi construído (Passo 2, depois da correção)

A camada usa o subconjunto de ~1.160 atos que batem no regex de ementa
descrito acima — **sem** tentar PDF ou texto completo (os testes acima mostram
que isso não aumenta a cobertura real, só adiciona ruído/scan sem texto).
Para cada ato do subconjunto:

1. **Extração** (`etl/betim/etl/normas_geo/extrair.py`): tenta capturar o
   nome do logradouro/praça/bairro/distrito citado, com a mesma lógica de
   confiança da revisão manual acima — `alta` quando há rua/avenida/praça/
   travessa/alameda/estrada/rodovia/largo/viela com um nome próprio depois,
   `media` quando só há bairro/distrito/vila/loteamento. Sem nome capturável,
   o ato fica de fora (não inventa).
2. **Geocodificação** (`etl/betim/etl/normas_geo/geocodificar.py`): Nominatim,
   1 requisição/segundo, `User-Agent` identificado, cache em disco por texto
   de busca normalizado (evita geocodificar a mesma rua/bairro duas vezes —
   muitos atos citam o mesmo lugar).
3. **Schema**: `supabase/betim/migrations/0058_atos_oficiais_geo.sql` — tabela
   nova `atos_oficiais_geo`, não mexe em `atos_oficiais`.
4. **Camada**: `normas-geolocalizadas` em `LAYER_REGISTRY`
   (`apps/web/public/terras/globo/js/config.js`), GeoJSON gerado em
   `apps/web/public/terras/globo/dados/camadas/normas-geolocalizadas.geojson`
   por `etl/betim/etl/normas_geo/gerar_geojson.py`.
5. **Ficha**: `js/ui/rotulos.js` ganhou os rótulos novos (tipo de norma,
   ementa, confiança, link para a norma original).
6. **Norma → mapa**: `/[municipio]/camara/legislacao` ganhou um link "Ver no
   mapa" nas normas com geocodificação; `/funcaosocialterra/mapa` aceita
   `?camada=normas-geolocalizadas&idx=N` e abre a ficha certa direto.

## Números da primeira rodada (2026-08-11)

Snapshot da primeira execução do pipeline — muda a cada rerun (mais atos
publicados, Nominatim achando algo que não achou antes), por isso é
"primeira rodada", não "estado atual": quem quiser o número de agora roda
`select count(*) from atos_oficiais_geo where lat is not null` ou olha o log
de `gerar_geojson.py`.

- **Extração** (`extrair.py`): 1.151/10.147 atos com ementa (11,3%) — bate
  com a medição de viabilidade (11,2% sobre o total, incluindo os sem
  ementa). Confiança alta=510, média=641.
- **Geocodificação** (`geocodificar.py`): dos 1.151 extraídos, 806 consultas
  distintas ao Nominatim (muitos atos citam o mesmo bairro), **743
  encontraram um ponto (64,6%)** — os outros 408 atos extraídos ficam em
  `atos_oficiais_geo` sem `lat`/`lng` (o lugar foi reconhecido no texto, mas
  o Nominatim não achou correspondência geográfica) e por isso não entram no
  mapa.
- **Camada final** (`gerar_geojson.py`): **743 pontos** no GeoJSON —
  confiança alta=189, média=554. Por cidade: Belo Horizonte 301, Diamantina
  246, São Paulo 193, Araçuaí 2, Betim 1, Itinga 0.
- Ou seja: da população inteira de 10.317 atos, **743 (7,2%) viraram ponto
  no mapa** nesta rodada. É o número real da camada publicada, menor que os
  11,2% da extração porque geocodificar por nome não acha tudo (bairro
  antigo, grafia que o OSM não tem, nome que colidiu com outro lugar do
  Brasil e a busca restrita a `countrycodes=br` não resolveu).
