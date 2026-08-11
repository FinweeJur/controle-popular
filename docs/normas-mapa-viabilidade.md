# Normas no mapa — viabilidade medida (2026-08-11)

> Pedido original do dono do projeto: leis/decretos com endereço virarem uma
> camada no globo 3D (`/funcaosocialterra/mapa`) — clicar no local mostra a
> norma; clicar na norma mostra "ver no mapa". Ele confirmou "avance", mas com
> a condição de medir antes de construir. Este documento é a medição. **A
> camada NÃO foi construída** — os números abaixo explicam por quê, e o que
> fazer se o usuário decidir insistir mesmo assim.

## O número que decide

**11,2% dos 10.317 atos oficiais têm alguma menção reconhecível de
logradouro/bairro/distrito na ementa** (1.160 atos, contagem exata sobre a
população inteira, não amostra). Isso cai dentro da faixa que o próprio pedido
definiu como "muito baixa" (`<10-15%`) — abaixo do patamar (30-40%) que o
pedido considerava razoável para justificar construir a camada inteira.
Testar o texto completo (não só a ementa) não melhora esse número — ver
abaixo.

**Decisão: não construir a tabela nova, a geocodificação, nem a camada no
globo.** Fica só este documento.

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

## O que faria a taxa valer a pena (se o usuário quiser reconsiderar)

Se no futuro o usuário quiser uma versão **muito mais estreita** do pedido
original — não "toda norma relacionada a um lugar", mas especificamente
**"ruas e praças nomeadas por lei"** — os 6,8% (`denomin*`, 704 atos,
concentrados em Diamantina e São Paulo) são um recorte genuinamente confiável
e barato de extrair: a lei inteira é sobre isso, o nome da rua está na
própria ementa, sem precisar abrir PDF nem geocodificar endereço com número
(dá pra geocodificar "Rua X, Diamantina/MG" direto no Nominatim). Isso NÃO
foi construído agora — é só o caminho que ficaria mais barato se a decisão
for diferente desta.

## O que NÃO mudou neste projeto

Nenhum schema, migration, camada do globo (`LAYER_REGISTRY` em
`apps/web/public/terras/globo/js/config.js`) ou código de produção foi
alterado. Este documento é a única mudança.
