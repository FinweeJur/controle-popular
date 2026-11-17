# Fundiário PA: quem tem título, onde e desde quando

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA (fundiário)
> **Data da medição:** 17/11/2026
> **Método:** sondagem ao vivo com `curl.exe`, HTTP e DNS, uma requisição por vez, ~1,5 s entre chamadas ao mesmo host
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Requisições:** ~66 no total (inclui retentativas de DNS)
> **Status:** descoberta. Nada foi gravado no banco, nada foi commitado.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. O que foi sondado ao vivo](#2-o-que-foi-sondado-ao-vivo)
- [3. INCRA: o CSV de assentamentos é a joia](#3-incra-o-csv-de-assentamentos-é-a-joia)
- [4. ITERPA: ArcGIS aberto, gleba por gleba](#4-iterpa-arcgis-aberto-gleba-por-gleba)
- [5. Terras indígenas: FUNAI WFS](#5-terras-indígenas-funai-wfs)
- [6. SICAR / CAR: o host de consulta está quebrado](#6-sicar--car-o-host-de-consulta-está-quebrado)
- [7. Conflitos e desmatamento](#7-conflitos-e-desmatamento)
- [8. O que é coletável hoje](#8-o-que-é-coletável-hoje)
- [9. O que está bloqueado e por quê](#9-o-que-está-bloqueado-e-por-quê)
- [10. Veredito por fonte](#10-veredito-por-fonte)
- [11. O que NÃO se pode publicar](#11-o-que-não-se-pode-publicar)
- [12. O que não foi medido](#12-o-que-não-foi-medido)

## 1. Resposta curta

Três fontes abertas entregam o fundiário do Pará com número medido, hoje, sem login:

| Fonte | O que entrega | Registros medidos |
|---|---|---|
| INCRA (CSV SIPRA) | projeto de assentamento: nome, município, área, famílias, fase, ato de criação e data | **494 projetos no PA**, 13.216.380 ha, 70 municípios |
| ITERPA (ArcGIS `Destinação de Terras`) | gleba arrecadada/matriculada: município, área, situação, % desmatamento, contagem de CAR e SIGEF dentro | **525 glebas**, 11.969.328 ha |
| FUNAI (WFS `tis_poligonais_portarias`) | terra indígena: nome, etnia, município, área, fase e data de cada portaria | **51 TIs no PA**, 19.064.418 ha, 40 municípios |

O resto é bloqueado por infraestrutura morta: `acervofundiario.incra.gov.br`, `certificacao.incra.gov.br` e `painel.incra.gov.br` **não existem mais em DNS**, e a consulta pública do CAR entra em **loop infinito de redirect** por um `Location` malformado no próprio servidor. Não é rate limit nosso, não é CAPTCHA: é o serviço quebrado.

## 2. O que foi sondado ao vivo

Todas as medições em 17/11/2026. `000` = falha de DNS (`Could not resolve host`), não é 404.

| URL | Status | Tamanho | Leitura |
|---|---|---|---|
| `https://www.gov.br/incra/robots.txt` | 200 | 518 B | `User-agent: *`, só `Disallow: /search` e `/login` |
| `https://www.gov.br/incra/pt-br/acesso-a-informacao/dados-abertos` | 200 | 377.124 B | Página de dados abertos sem nenhum link de conjunto de dados no HTML |
| `https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/assentamentos` | 200 | 454.365 B | Descrição do programa. Sem lista, sem download |
| `https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/assentamentos-relacao-de-projetos` | 200 | 376.553 B | **Página do CSV**, modificada em 11/03/2026 |
| `.../assentamentosgeral.csv/@@download/file` | 200 | **1.412.756 B** | **CSV nacional, fonte SIPRA, gerado em 06/03/2026** |
| `.../dicionario_dados_relacao_projetos.xls/@@download/file` | 200 | 29.696 B | Dicionário de dados (códigos de fase, tipo, forma de obtenção) |
| `https://certificacao.incra.gov.br/csv_shp/export_shp.zip` | **000** | 0 B | `NXDOMAIN`. O download clássico do Acervo Fundiário morreu |
| `https://acervofundiario.incra.gov.br/` | **000** | 0 B | `NXDOMAIN` |
| `http://painel.incra.gov.br/sistemas/index.php` | **000** | 0 B | `NXDOMAIN` |
| `https://sigef.incra.gov.br/` | 200 | 21.141 B | Portal do Sigef, login via `sso.acesso.gov.br` |
| `https://sigef.incra.gov.br/consultar/` | 404 | 4.529 B | Rota de consulta pública não existe nesse caminho |
| `https://www.gov.br/incra/pt-br/painel/reforma-agraria-familias-homologadas` | 200 | 32.544 B | Redireciona para painel **Power BI** embutido (precisa JS) |
| `https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria/quilombolas` | 200 | 393.590 B | Só texto e um PDF de perguntas. **Nenhuma base** |
| `https://www.car.gov.br/robots.txt` | 404 | 11.521 B | Não há robots.txt no portal do SICAR |
| `https://www.car.gov.br/` | 200 | 5.020 B | SPA Angular `SICAR`, casca sem dado |
| `https://www.car.gov.br/js/script.js` | 200 | 357.545 B | Script legado. Zero endpoint `/publico/` de dados |
| `https://www.car.gov.br/publico/municipios/downloads` | 302 | 0 B | Redireciona para o host quebrado (abaixo) |
| `https://consultapublica.car.gov.br/publico/imoveis/index` | 302 | 0 B | `Location: https://consultapublica.car.gov.br:/publico/` — **dois-pontos sobrando no host** |
| `http://consultapublica.car.gov.br/publico/` | 301 | 185 B | Devolve o mesmo `Location` malformado. Loop infinito |
| `https://geoserver.funai.gov.br/geoserver/ows?...GetCapabilities` | 200 | 27.900 B | **8 camadas**, inclui `tis_poligonais_portarias` |
| `.../DescribeFeatureType&typeName=Funai:tis_poligonais_portarias` | 200 | 4.052 B | 39 campos descritos |
| `.../GetFeature&typeName=Funai:tis_poligonais_portarias&CQL_FILTER=uf_sigla='PA'` | 200 | **10.610.507 B** | **51 features, `totalFeatures: 51`** |
| `https://www.iterpa.pa.gov.br/` | **000** | 0 B | `NXDOMAIN`. O domínio antigo do ITERPA morreu |
| `https://portal.iterpa.pa.gov.br/robots.txt` | 200 | 181 B | Yoast: `User-agent: *` → `Disallow:` (vazio = tudo liberado) |
| `https://portal.iterpa.pa.gov.br/` | 200 | 176.950 B | Portal novo. Menu tem SiCARF e "transparência de regularização" |
| `https://sicarf.iterpa.pa.gov.br/` | 200 | 69.681 B | SiCARF: cadastro de regularização fundiária estadual |
| `https://sicarf.iterpa.pa.gov.br/transparencia` | 200 | 53.284 B | SPA. Dado vem por REST interno |
| `https://sicarf.iterpa.pa.gov.br/download` | 200 | 25.237 B | Módulo offline v2.14.10 para 6 serviços (doação, compra, PEAS, PEAEX, TEQ, certidão de título) |
| `https://sicarf.iterpa.pa.gov.br/publicacao` | 200 | 51.882 B | SPA de publicações |
| `https://arcgisportal.iterpa.pa.gov.br/portal/sharing/rest/search?q=*&f=json` | 200 | 58 B | `{"total":0}` — nada público no portal, mas o **Server** está aberto |
| `https://arcgisportal.iterpa.pa.gov.br/server/rest/services?f=json` | 200 | 1.312 B | **21 serviços públicos**, 8 pastas |
| `.../Destinação_de_Terras/FeatureServer/0/query?returnCountOnly` | 200 | 13 B | **`{"count":525}`** |
| `.../Destinação_de_Terras/.../query?outStatistics=...groupBy=situacao` | 200 | 1.830 B | 19 grafias distintas de situação (ver §4) |
| `.../Status_de_arrecadação/FeatureServer/0/query?returnCountOnly` | 200 | 14 B | **`{"count":1220}`** |
| `https://www.cptnacional.org.br/robots.txt` | 200 | 2.676 B | `Allow: /` para `*`, mas `Content-Signal: ai-train=no` |
| `https://www.cptnacional.org.br/` | 200 | 233.973 B | Tem `acervo/conflitos-no-campo/` e caderno anual |
| `https://terrabrasilis.dpi.inpe.br/` | 200 | 129.757 B | Tem `/downloads/` e dashboard PRODES |
| `https://geoftp.ibge.gov.br/.../tipologias_do_territorio/` | 200 | 21.274 B | Lista só a pasta `..._povos_indigenas_e_quilombolas/` |

## 3. INCRA: o CSV de assentamentos é a joia

**URL:** `https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/assentamentosgeral.csv/@@download/file`
**1.412.756 bytes**, latin-1, delimitador `;`, cabeçalho na linha 9. Fonte declarada no arquivo: **SIPRA**, `Data: 06/03/2026`.

Campos (na ordem, com o sentido que o próprio dicionário do INCRA dá):

| Campo | Conteúdo |
|---|---|
| `CÓDIGO DO PROJETO` | prefixo da UF + 7 dígitos. `PA` = SR(01) Belém, `AT` = SR(30) Santarém |
| `NOME DO PROJETO` | sigla (PA, PAE, PDS, RESEX, RTRQ…) + nome |
| `MUNICIPIO SEDE` | município do projeto |
| `AREA (ha)` | área medida |
| `NUMERO DE FAMILIAS ASSENTADAS` | **capacidade** do projeto (dicionário: "Nº de Famílias (capac.)") |
| `FAMILIAS ASSENT.` | **famílias que residem** no projeto |
| `FASE` | `03` Criado, `04` Em Instalação, `05` Em Estruturação, `06` Em Consolidação, `07` **código não definido no dicionário** |
| `TIPO` / `NUMERO` / `DATA DE CRIACAO` | ato normativo (DEC/POR/RES) e data de publicação |
| `FORMA OBTENCAO` / `DATA OBTENCAO` | Desapropriação, Arrecadação, Reconhecimento, Cessão, Compra e Venda, "Em Obtenção - T.Coop.Tec. SPU" |

**Medido para o Pará** (9.964 linhas nacionais; 494 do PA):

- **494 projetos de assentamento** (421 com prefixo `PA`, 73 com `AT`)
- **13.216.380 ha**
- **160.479 famílias** de capacidade; **150.891 famílias** residentes
- **70 municípios**
- por fase: Criado 370 · Em Instalação 40 · Em Estruturação 36 · Em Consolidação 35 · código `07` 13
- por SR: SR(01) Belém 420 · SR(30) Santarém 66 · SR(27) Sul do Pará 8
- por forma de obtenção: T.Coop.Tec. SPU 264 · Desapropriação 62 · Arrecadação 42 · Reconhecimento 27 · vazio 21 · Cessão 3 · Compra e Venda 2
- datas de criação de **1986 a 2025** (275 na década de 2000, 82 na de 2010, 23 na de 2020)

Custo de coleta: **1 requisição**. É o melhor custo-benefício do estado.

## 4. ITERPA: ArcGIS aberto, gleba por gleba

O domínio antigo `www.iterpa.pa.gov.br` morreu em DNS. O ITERPA hoje é `portal.iterpa.pa.gov.br` + `sicarf.iterpa.pa.gov.br` (o cadastro de regularização fundiária) + `arcgisportal.iterpa.pa.gov.br`.

O portal do ArcGIS Enterprise não lista nada para anônimo (`total: 0`), mas o **ArcGIS Server** responde sem token:

- `Destinação_de_Terras/FeatureServer/0` — polígono, `maxRecordCount: 2000`
- `Status_de_arrecadação/FeatureServer/0` — polígono
- `areas_disponiveis_arrecadacao`, `projeto_arrecadação_16012025`, `dashboard_atualização`, `dashboard_indicador`, `zee`, `censo_agropecuario`

Campos de `Destinação de Terras` (os 19, medidos):

```
id, denominaca, municipio, area_gleba_ha, situacao, sobrepoe,
perc_sobreposicao, desmatamento, ha_desmat, perc_desmat,
qtde_car, qtde_sigef, qtde_censo, qtde_ocupacao,
categoria_zee, conservacao, restauracao, regularizacao_fundiaria
```

**Medido:** 525 glebas, **11.969.328 ha**. Situação (com as 19 grafias do banco, sem normalizar — é sujeira do dado, não do nosso parser):

| `situacao` | glebas | ha |
|---|---|---|
| ARRECADADA E MATRICULADA | 342 | 9.231.820 |
| ARRECADADA e MATRICULADA | 115 | 1.113.657 |
| ARRECADADA, MATRICULADA e RETIFICADA | 29 | 593.211 |
| RETIFICADA E AVERBADA | 5 | 473.767 |
| RETIFICADA | 10 | 254.698 |
| RETIFICADA E MATRICULADA | 2 | 104.404 |
| MATRICULADA E RETIFICADA | 1 | 77.319 |
| demais grafias (12 variantes) | 21 | ~118.000 |
| ARRECADADA E AMTRICULADA (erro de digitação no banco) | 1 | 2.960 |
| ÁREA SUB JUDICE | 1 | 2.859 |

Amostra real (3 glebas da Gleba Guajará I, Prainha): 161.013,88 ha, `perc_desmat` 10,55%, `qtde_car` 48, `qtde_sigef` 39, `regularizacao_fundiaria` "Alto".

`Status de arrecadação`: **1.220 registros** com `disp`, `nmuc` (nome da UC), `nmmun`, `sigla`, `area_ha` — ex.: "Disponível em UC Estadual" / FLOTA / Alenquer / 671.205,58 ha.

Isso resolve o item "grilagem / desmatamento em imóvel" **sem precisar cruzar nada**: o ITERPA já entrega `perc_desmat`, `ha_desmat`, `qtde_car` e `qtde_sigef` por gleba. O trabalho de cruzamento CAR × PRODES é do Estado, e ele publicou o resultado.

## 5. Terras indígenas: FUNAI WFS

`https://geoserver.funai.gov.br/geoserver/ows` — WFS 1.1.0 aberto, sem chave. 8 camadas:

`Funai:aldeias_pontos`, `tis_cr`, `tis_ctl`, `tis_poligonais`, **`tis_poligonais_portarias`**, `tis_amazonia_legal_poligonais`, `tis_pontos`, `tis_pontos_portarias`.

A camada `tis_poligonais_portarias` tem os campos que interessam, com **data e número de cada portaria por fase**:

```
terrai_codigo, terrai_nome, etnia_nome, municipio_nome, uf_sigla,
superficie_perimetro_ha, fase_ti, modalidade_ti, reestudo_ti, cr,
faixa_fronteira,
data_em_estudo/tit_em_estudo, data_delimitada/tit_delimitada,
data_declarada/tit_declarada, data_homologada/tit_homologada,
data_regularizada/tit_regularizada
```

**Medido com `CQL_FILTER=uf_sigla='PA'`** (10,6 MB de resposta, `totalFeatures: 51`):

- **51 terras indígenas**, **19.064.418 ha**, **40 municípios**, **27 etnias**
- fase: Regularizada 33 · Declarada 8 · Encaminhada RI 7 · Delimitada 1 · Homologada 1 · Em Estudo 1
- modalidade: Tradicionalmente ocupada 41 · Reserva Indígena 7 · Dominial Indígena 2 · Interditada 1
- 32 com `data_homologada`, 33 com `data_regularizada`
- exemplo: Alto Rio Guamá, Garrafão do Norte/Nova Esperança do Piriá/Paragominas/Santa Luzia do Pará, Tembé e Timbira, 279.897,7 ha, homologada em 04/10/1993

O repo **já tem coletor**: `scripts/coletar-terras-indigenas.mts` (linha 42, mesmo WFS). Não é trabalho novo — é o mesmo coletor com filtro de UF.

## 6. SICAR / CAR: o host de consulta está quebrado

Duas coisas diferentes, as duas medidas:

1. **Portal nacional** `https://www.car.gov.br/` responde 200 com uma SPA Angular de 5.020 bytes. Não há robots.txt (404). O `js/script.js` (357.545 B) não contém nenhum endpoint `/publico/` de dados — a carga é toda por rota `#/` no navegador.
2. **Consulta pública** `https://consultapublica.car.gov.br/publico/imoveis/index` devolve **302 com `Location: https://consultapublica.car.gov.br:/publico/`** — dois-pontos antes da barra. O cliente segue, recebe 301 de volta para `https`, e o ciclo não termina: `curl` estourou em **50 redirects**. Todo o fluxo de download (`/publico/municipios/downloads`, `/publico/estados/downloads`) é redirecionado para esse host. **Não é bloqueio contra nós: é o serviço que não fecha conexão para ninguém.**

Consequência prática: **não existe hoje caminho aberto para o número de imóveis do CAR no Pará**, nem para o shapefile por município. O que dá para publicar sem medir é nada — e por isso não publicamos número de CAR.

Terceiro caminho, também fechado: `dados.gov.br/api/publico/conjuntos-dados` devolve **401** sem credencial de API.

O CAR do Pará é estadual, no SIMLAM/SEMAS — ver `ambiental-PA-semas.md`. Ali também não há camada de imóvel rural aberta.

## 7. Conflitos e desmatamento

**CPT (Comissão Pastoral da Terra) — não é governo.** É organização da Igreja Católica; o dado é dela, com metodologia própria de ouvidoria e denúncia, e é citado como CPT, nunca como "dado oficial". `robots.txt`: `User-agent: *` → `Allow: /`, com `Content-Signal: ai-train=no, use=reference` — leitura e referência liberadas, treinar modelo não. O acervo está em `https://cptnacional.org.br/acervo/conflitos-no-campo/` (link presente na home, 200) e o caderno anual em `cptnacional.org.br/caderno/conflitos-no-campo-brasil-2025/`. **Contagem de conflitos no PA não medido** — parei no limite de requisições.

**Dado oficial de mortes/conflitos no campo:** não localizei base oficial aberta nesta sessão. A Ouvidoria Nacional de Direitos Humanos (Disque 100) publica agregados, não caso a caso com terra. **Não medido**; registrar como lacuna, não como inexistência.

**PRODES:** `terrabrasilis.dpi.inpe.br` responde 200 (129.757 B) e tem `/downloads/` e dashboard de desmatamento da Amazônia Legal. O repo já consome INPE via STAC (`scripts/etl/cavas/coletar-cenas-go.py`, `data.inpe.br/bdc/stac/v1`). Mas, como o ITERPA já entrega `perc_desmat` por gleba, o cruzamento CAR × PRODES é **desnecessário para a primeira versão** — ver §4.

## 8. O que é coletável hoje

| # | Fonte | Requisições | Registros PA | Campos-chave |
|---|---|---|---|---|
| 1 | INCRA, CSV de assentamentos | 1 | 494 | nome, município, área, capacidade, residentes, fase, ato, data de criação, forma de obtenção |
| 2 | ITERPA, ArcGIS `Destinação de Terras` | 1 por página de 2.000 | 525 | gleba, município, área, situação, sobreposição, % desmatamento, qtde CAR/SIGEF |
| 3 | ITERPA, ArcGIS `Status de arrecadação` | 1 por página de 2.000 | 1.220 | disponibilidade, UC, município, sigla, área |
| 4 | FUNAI, WFS `tis_poligonais_portarias` | 1 | 51 | nome, etnia, municípios, área, fase, data e portaria por fase |
| 5 | INCRA, dicionário de dados (XLS) | 1 | — | códigos de fase, tipo de ato e forma de obtenção |

Todos com `User-Agent` honesto, sem login, sem CAPTCHA. As quatro bases cabem em menos de 20 MB de download e nenhuma exige paginação além de 2.000 por página.

## 9. O que está bloqueado e por quê

| Fonte | Situação | Causa medida |
|---|---|---|
| `acervofundiario.incra.gov.br` | morto | **NXDOMAIN**. Era a base geoespacial do Acervo Fundiário |
| `certificacao.incra.gov.br` | morto | **NXDOMAIN**. Era o `export_shp.zip` do INCRA |
| `painel.incra.gov.br` | morto | **NXDOMAIN**. Era o Painel Dinâmico de assentamentos |
| Consulta pública do CAR | inutilizável | `Location` malformado (`car.gov.br:` com dois-pontos) gera loop de 301/302 |
| Download do CAR por município | inutilizável | redireciona para o host acima |
| API `dados.gov.br` | fechado | **401** sem credencial |
| Painel "famílias homologadas" | não coletável | Power BI embutido, exige JS e token de embed |
| Territórios quilombolas do PA | **não medido** | INCRA não publica base na página `/quilombolas` (só PDF de FAQ); o Acervo Fundiário que a hospedava está NXDOMAIN |
| SiCARF (transparência, publicação) | parcial | SPA; o dado vem de REST interno não documentado. Não sondei o REST |
| Portal ArcGIS do ITERPA (itens) | fechado | `sharing/rest/search` → `total: 0` para anônimo. **O `server/rest` compensa** |

## 10. Veredito por fonte

| Fonte | Dificuldade | Ganho cívico em uma frase |
|---|---|---|
| **ITERPA — `Destinação de Terras`** | **baixa** (REST JSON, sem token, campos limpos) | Mostra gleba por gleba o que o Estado arrecadou e matriculou, quanto já desmatou e quantos cadastros do CAR/SIGEF estão dentro — é a resposta direta a "quem tem título, onde e desde quando". |
| **INCRA — CSV de assentamentos** | **muito baixa** (1 download) | Dá ao leitor os 494 assentamentos do PA com área, fase, famílias e data de criação, permitindo comparar promessa de reforma agrária com projeto efetivamente criado. |
| **FUNAI — WFS de TIs** | **baixa** (coletor já existe no repo) | Publica as 51 terras indígenas do PA com fase de demarcação e a data de cada portaria, o que mostra há quantos anos uma TI está parada em "Declarada". |
| **INCRA — quilombolas** | **alta** (base morta) | Sem território quilombola georreferenciado não há como medir sobreposição com títulos estaduais no PA. Exige LAI. |
| **SICAR / CAR** | **bloqueada** (serviço quebrado) | Seria a base do cruzamento "desmatamento dentro de imóvel cadastrado"; hoje o ITERPA entrega esse número pronto por gleba. |
| **CPT — conflitos** | **média** (HTML + PDF, licença de referência) | Dá a série de conflitos por terra no PA, com a ressalva de que é dado de organização da sociedade civil, não de governo. |
| **PRODES / TerraBrasilis** | **média** (STAC já usado no repo) | Confirma o desmatamento por polígono; útil só depois, porque o ITERPA já resume por gleba. |

**Qual integrar primeiro:** ITERPA `Destinação de Terras`. É REST JSON puro, 525 registros, uma requisição, e traz no mesmo objeto o município, a área, a situação jurídica da gleba e o desmatamento — três dos seis itens investigados em um único endpoint, sem LAI e sem interpretação nossa.

## 11. O que NÃO se pode publicar

O tema é terra, não pessoa. Nenhum CPF e nenhum nome de pessoa física sai daqui.

- **INCRA, "relação de beneficiários assentados"** — citada na mesma página do CSV de projetos. É nome de pessoa, com CPF e lote. **Não coletar, não abrir, não citar em página.** O que publicamos é o *projeto*, não o assentado.
- **SICAR/CAR, consulta por imóvel** — devolve o titular (CPF/CNPJ) do imóvel rural. Mesmo se o host voltasse, o imóvel é publicável; o titular pessoa física, não.
- **Sigef** — consulta por parcela mostra o detentor. Mesma regra.
- **SiCARF** (`/transparencia`, `/autenticidade`, `/credenciados`) — processos e certidões de título carregam CPF e matrícula do requerente. Se um dia for coletado, só o par (gleba, situação), nunca o requerente.
- **CPT, acervo de conflitos** — os registros nomeiam vítimas, acusados e lideranças. Publicar nome de pessoa em conflito agrário no Pará é risco de vida, não só risco de LGPD. Só agregado por município e tipo.
- **FUNAI, `aldeias_pontos`** — ponto de aldeia é coordenada de comunidade. A camada de **polígono de TI** basta para o leitor; não publicar ponto de aldeia nem coordenada de aldeia isolada.
- **Terceiros no ArcGIS do ITERPA** — `qtde_ocupacao` e `qtde_censo` são contagens, não listas; usar a contagem, nunca a lista de ocupantes.

Regra de bolso para o repo: se a linha identifica uma **pessoa**, não entra; se identifica **imóvel, gleba, projeto ou território**, entra.

## 12. O que não foi medido

- **Imóveis do CAR no Pará** (quantidade, área, status de análise): host de consulta em loop. Não medido.
- **Territórios quilombolas no PA** (quantidade, fase, área): INCRA sem base pública; Acervo Fundiário NXDOMAIN. Não medido. O repo tem `territorios-quilombolas.geojson` com 27 feições, mas é recorte de MG, de origem não registrada no script.
- **Conflitos no campo no PA pela CPT**: parei em ~66 requisições, sem abrir o acervo. Não medido.
- **Taxa PRODES do PA**: só confirmei que `terrabrasilis.dpi.inpe.br` e `/downloads/` respondem 200. Não baixei polígono nem taxa.
- **REST interno do SiCARF**: não sondei os endpoints por trás de `/transparencia`. É a próxima sonda natural, com sessão de navegador para descobrir a rota.
- **Títulos individuais do ITERPA por lote**: os serviços dão **gleba**, não lote titulado. Se o portal `sicarf` publicar título por imóvel, não achei o caminho nesta sessão.
