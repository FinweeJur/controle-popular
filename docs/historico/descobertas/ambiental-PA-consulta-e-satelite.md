# Ambiental PA — consulta prévia (Convenção 169) e satélite: o que é medível

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA
> **Data da medição:** 17/11/2026
> **Método:** sondagem ao vivo com `urllib`, UA honesto, 2 s entre requisições ao mesmo host, corpos salvos e contados
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Requisições feitas:** 69 (teto combinado: ~70)
> **Status:** descoberta. Nada foi gravado no banco, nada foi commitado.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. Método e limites](#2-método-e-limites)
- [3. URLs sondadas (status e tamanho)](#3-urls-sondadas-status-e-tamanho)
- [4. Consulta prévia: o que se mede hoje](#4-consulta-prévia-o-que-se-mede-hoje)
- [5. Satélite e fiscalização: o que se mede hoje](#5-satélite-e-fiscalização-o-que-se-mede-hoje)
- [6. O que já está no repo (medido)](#6-o-que-já-está-no-repo-medido)
- [7. O que está bloqueado e por quê](#7-o-que-está-bloqueado-e-por-quê)
- [8. robots.txt, licença e termos](#8-robotstxt-licença-e-termos)
- [9. Veredito por fonte](#9-veredito-por-fonte)
- [10. O que eu não medi](#10-o-que-eu-não-medi)

## 1. Resposta curta

**Consulta prévia não existe como tabela pronta em lugar nenhum. O que existe é a base territorial que permite perguntar.**

- **FUNAI — sim, e é bom.** O geoserver da FUNAI serve as Terras Indígenas por UF, via WFS público, com `fase_ti`. No Pará: **61 terras indígenas** tocam o estado (51 com `uf_sigla` exatamente `PA`), **19.064.417,8 ha**, atualizado até 01/09/2026. CSV, XLSX, KML e Shapefile na mesma URL.
- **A lista de processos de licenciamento com componente indígena não foi encontrada.** A FUNAI não publica isso nas páginas sondadas (`/atuacao/licenciamento-ambiental` = 404) e o caminho declarado para dados abertos é o `dados.gov.br`, que responde **401**.
- **Protocolos de consulta existem e são coletáveis**, mas são documento, não banco: o MPF publica **18 PDFs** na sua página de protocolos (11 com "protocolo" no nome, 2 do Pará: Munduruku e Juruna).
- **Satélite: queimadas vence.** O `dataserver-coids.inpe.br` tem listagem aberta, arquivos anuais por UF desde 2003 e CSV diário do Brasil inteiro. PA 2024 = **56.070 focos**, com `municipio` na linha.
- **PRODES não tem tabela por município.** Só polígono e raster: o GeoPackage da Amazônia Legal tem **788 MB**. Agregar por município é trabalho nosso, não download.

## 2. Método e limites

- Uma requisição por vez, `sleep` de 2 a 3 s entre chamadas ao mesmo host. Nenhum paralelismo por host.
- Toda resposta foi salva em disco. **Tamanho em bytes é o do corpo lido**, não o `Content-Length` do cabeçalho.
- Contagens foram feitas sobre o corpo baixado, com `csv`/`json` da biblioteca padrão. Onde baixei um recorte, está escrito "amostra de N".
- Dois enganos de método que valem registro:
  - `https://queimadas.dgi.inpe.br/robots.txt` devolve **404** depois de redirecionar para `https://terrabrasilis.dpi.inpe.br/queimadasrobots.txt` — o host antigo das queimadas hoje é o TerraBrasilis, e o caminho se cola sem barra.
  - `https://www.obt.inpe.br/OBT/assuntos/programas/amazonia/prodes` devolve **200**, mas o corpo é uma tela de login (`credentials_cookie_auth/require_login`). 200 com login dentro não é acesso.
- Um download de 2,1 MB foi truncado em 400 KB pelo meu salvador na primeira tentativa e o `zipfile` recusou o arquivo ("not a zip file"). Corrigido baixando inteiro. Quem for implementar: **conferir o tamanho antes de abrir o ZIP**.

## 3. URLs sondadas (status e tamanho)

62 sondagens registradas em log, mais 7 requisições de download/seletiva (WFS, HEAD, Range). Tabela completa:

| URL | Status | Corpo | Leitura |
|---|---|---|---|
| `https://www.gov.br/funai/robots.txt` | 200 | 518 B | `Disallow: /search`, `/login` só |
| `https://www.gov.br/funai/sitemap-index.xml` | 200 | 688 B | 7 sitemaps |
| `https://www.gov.br/funai/pt-br` | 200 | 539.162 B | sem link de "licenciamento" no menu |
| `https://www.gov.br/funai/pt-br/acesso-a-informacao/dados-abertos-1` | 200 | 346.468 B | só o Plano de Dados Abertos 2026-2028 e um link ao `dados.gov.br` |
| `https://www.gov.br/funai/pt-br/atuacao/licenciamento-ambiental` | **404** | 152.492 B | **não existe página de licenciamento nesse caminho** |
| `https://www.gov.br/funai/pt-br/atuacao/terras-indigenas` | 200 | 395.214 B | hub de terras indígenas |
| `https://www.gov.br/funai/pt-br/atuacao/terras-indigenas/geoprocessamento-e-mapas` | 200 | 445.736 B | **página com os links WFS de TI** |
| `https://www.gov.br/funai/pt-br/atuacao/terras-indigenas/geoprocessamento-e-mapas/painel-terras-indigenas` | 200 | 315.225 B | painel (visualização, sem tabela) |
| `https://geoserver.funai.gov.br/robots.txt` | **404** | 146 B | sem `robots.txt` publicado |
| `https://geoserver.funai.gov.br/geoserver/Funai/ows?…tis_poligonais…outputFormat=csv` | 200 | 233.543 B | **amostra de 3 feições**, 20 campos |
| `…tis_poligonais…propertyname=…&maxFeatures=2000` (PA) | 200 | 10.566 B | **61 linhas**, 9 campos sem geometria |
| `https://dados.gov.br/robots.txt` | **401** | 0 B | WAF barra antes do robots |
| `https://dados.gov.br/dados/api/publico/conjuntos-dados/manifestacoes-do-icmbio-no-procedimento-de-licenciamento-ambiental` | **401** | 0 B | API pública também barrada |
| `https://www.mpf.mp.br/robots.txt` | 200 | 919 B | `Disallow: /++api++`, `/search`, `/login` |
| `https://www.mpf.mp.br/sitemap-index.xml` | 200 | 1.060 B | 12 sitemaps |
| `https://www.mpf.mp.br/sitemap5.xml.gz` | 200 | 79.300 B | 5.000 URLs, 80 com "recomenda" |
| `https://www.mpf.mp.br/pa` | 200 | 630.115 B | 301 → `…/o-mpf/unidades/pr-pa`; sem lista de recomendações |
| `https://www.mpf.mp.br/atuacao/defesa-dos-direitos-do-cidadao/legislacao/recomendacoes/2024-1` | 200 | 551.778 B | SPA Volto, 65 linhas de texto, zero recomendação no HTML |
| `https://www.mpf.mp.br/atuacao-tematica/ccr4` | **404** | 154.193 B | caminho mudou |
| `https://www.mpf.mp.br/atuacao/populacoes-indigenas-e-comunidades-tradicionais` | 200 | 562.409 B | hub temático |
| `https://www.mpf.mp.br/atuacao/populacoes-indigenas-e-comunidades-tradicionais/publicacoes/protocolos-de-consulta` | 200 | 682.039 B | **18 PDFs listados** |
| `https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria/comunidades-quilombolas` | **404** | 152.949 B | caminho errado |
| `https://www.gov.br/incra/pt-br/assuntos/governanca-fundiaria` | 200 | 404.058 B | hub de governança fundiária |
| `https://www.gov.br/incra/pt-br/assuntos/quilombolas` | 200 | 393.676 B | 301 → `…/governanca-fundiaria/quilombolas` |
| `https://www.gov.br/incra/pt-br/composicao/diretoria-de-territorios-quilombolas-dq` | 200 | 397.799 B | competências + e-mail `licenciamentoquilombola@incra.gov.br` |
| `https://www.gov.br/incra/sitemap.xml` | **404** | 151.752 B | INCRA não publica sitemap nesse caminho |
| `https://www.gov.br/incra/pt-br/canais_atendimento/plataforma-de-governanca-territorial` | 200 | 85.721 B | 301 → `pro-pgt-incra.estaleiro.serpro.gov.br/pgt/home` |
| `https://pro-pgt-incra.estaleiro.serpro.gov.br/pgt/home` | 200 | 85.720 B | SPA com **hCaptcha** carregado; 1 linha de texto |
| `https://www.gov.br/icmbio/pt-br/acesso-a-informacao/dados-abertos` | 200 | 201.617 B | 17 conjuntos do ICMBio no catálogo |
| `https://www.gov.br/icmbio/pt-br/acesso-a-informacao/autuacoes-ambientais` | 200 | 165.513 B | sanções administrativas |
| `…/autuacoes-ambientais/infracoes-ambientais` | 200 | 198.146 B | mesma página (`infracoes-ambientais-1`) |
| `https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao` | 200 | 182.660 B | institucional, sem tabela por UF |
| `https://www.gov.br/icmbio/pt-br/assuntos/biodiversidade/unidade-de-conservacao` | **404** | 26 B | resposta JSON de erro |
| `https://geoserver.icmbio.gov.br/` | **000** | 0 B | **DNS não resolve** |
| `https://terrabrasilis.dpi.inpe.br/robots.txt` | 200 | 1.268 B | **`Disallow: /geoserver/`** |
| `https://terrabrasilis.dpi.inpe.br/` | 200 | 129.757 B | WordPress; links `/downloads/` |
| `https://terrabrasilis.dpi.inpe.br/downloads/` | 200 | 135.034 B | casca; dados vêm de API |
| `https://terrabrasilis.dpi.inpe.br/citacoes-e-licenca-de-uso/` | 200 | 118.487 B | **CC BY-SA 4.0**; atualização citada em 16/10/2026 |
| `https://terrabrasilis.dpi.inpe.br/business/api/v1/download/all` | 200 | 110.613 B | **231 itens JSON** com `link` de download |
| `https://terrabrasilis.dpi.inpe.br/download/dataset/` | **403** | 153 B | listagem de diretório bloqueada |
| `https://terrabrasilis.dpi.inpe.br/download/dataset/legal-amz-prodes/` | **403** | 153 B | idem |
| `HEAD …/legal-amz-prodes/vector/prodes_amazonia_legal_v20261016.gpkg.zip` | 200 | 788.401.755 B (declarado) | **o arquivo abre; só o diretório é 403** |
| `HEAD https://terrabrasilis.dpi.inpe.br/file-delivery/download/deter-amz/shape` | 200 | `application/zip`, sem tamanho | DETER sem `Content-Length` |
| `https://terrabrasilis.dpi.inpe.br/dashboard/api/v1/` | **404** | 116.499 B | caminho de API suposto não existe |
| `https://terrabrasilis.dpi.inpe.br/acesso-a-dados/` | **404** | 116.499 B | a página é `/downloads/` |
| `https://www.obt.inpe.br/OBT/assuntos/programas/amazonia/prodes` | 200 → **login** | 22.480 B | corpo é `require_login`; **não é acesso** |
| `https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/` | 200 | 2.599 B | listagem aberta: `10min/`, `anual/`, `diario/`, `mensal/` |
| `…/csv/anual/EstadosBr_sat_ref/` | 200 | 8.780 B | **uma pasta por UF** |
| `…/csv/anual/EstadosBr_sat_ref/PA/` | 200 | 8.471 B | **22 arquivos, 2003 a 2024** |
| `…/PA/focos_br_pa_ref_2024.zip` | 200 | 2.146.991 B | **56.070 focos, 9 colunas** |
| `…/PA/focos_br_pa_ref_2025.zip` | **404** | 196 B | 2025 ainda não fechou: vai no diário/mensal |
| `…/csv/diario/Brasil/` | 200 | 11.650 B | **1 CSV por dia**, 1,2 a 5,4 MB, publicados ~09:05 |
| `…/csv/mensal/` | 200 | 2.071 B | igual, granularidade mensal |
| `https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao` | 200 | 65.400 B | 8 famílias de recurso (CSV/JSON/XML) |
| `HEAD …/SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip` | 200 | 123.641.976 B | **50 CSVs, um por ano, 1977 a 2026** |
| `https://observatorio.direitosocioambiental.org/robots.txt` | 200 | 139 B | só `/wp-admin/` fora |
| `https://observatorio.direitosocioambiental.org/` | 200 | 305.229 B | WordPress, banco de protocolos |
| `…/protocolos/` | 200 | 119.214 B | 4 links por região; lista do Brasil em categorias |
| `…/protocolos-de-consulta-no-tapajos/` | 200 | 118.316 B | página do **Tapajós (PA)** |
| `https://api.mapbiomas.org/` | **000** | 0 B | timeout de conexão (10060) |

## 4. Consulta prévia: o que se mede hoje

### 4.1 FUNAI — a base territorial (coletável hoje)

A página de geoprocessamento da FUNAI entrega **links prontos de WFS**, não só um mapa. Cada link é público e filtra por UF via CQL. Exemplo usado (o mesmo padrão vale para as outras 26 UFs):

```
https://geoserver.funai.gov.br/geoserver/Funai/ows
  ?service=WFS&version=1.0.0&request=GetFeature
  &typeName=Funai:tis_poligonais
  &CQL_FILTER=uf_sigla LIKE '%PA%'
  &propertyname=terrai_codigo,terrai_nome,etnia_nome,municipio_nome,uf_sigla,superficie_perimetro_ha,fase_ti,modalidade_ti,data_atualizacao
  &outputFormat=csv&maxFeatures=2000
```

Resposta medida: **10.566 bytes, 61 linhas, 9 campos** (sem geometria). Com geometria, 3 feições já pesam 233.543 bytes — o polígono é o custo.

| Fase da TI (`fase_ti`) | TIs que tocam o PA |
|---|---|
| Regularizada | 33 |
| Declarada | 8 |
| Encaminhada RI | 7 |
| Homologada | 1 |
| Delimitada | 1 |
| Em Estudo | 1 |
| **Total** | **51** (61 linhas incluem TIs que dividem PA com outra UF) |

- Área somada das 51 com `uf_sigla = PA`: **19.064.417,8 ha**.
- Municípios citados nos registros: **56** (o campo `municipio_nome` vem concatenado com " e ", então é preciso quebrar).
- `data_atualizacao` traz valores heterogêneos — `01/09/2026`, `01/08/2025`, `01/08/2023`, `01/10/2015` e vazio. Não é um carimbo único de atualização.
- Camadas disponíveis no mesmo geoserver: `tis_poligonais`, `tis_poligonais_portarias`, `tis_pontos`, `tis_pontos_portarias`, `tis_cr`, `tis_ctl`, `aldeias_pontos`. Todas com link pronto por UF na página oficial.
- Não há `robots.txt` no `geoserver.funai.gov.br` (404), e os links são publicados pela própria FUNAI — uso sancionado pelo publicador.

**O que isso mede e o que não mede:** mede *onde há direito territorial e em que fase*, que é o pré-requisito de qualquer consulta. **Não mede se a consulta aconteceu.** Nenhum campo do WFS fala de empreendimento, licença ou consulta.

### 4.2 Processos de licenciamento com componente indígena — não encontrado em página pública

Três caminhos sondados, três ausências:

| Caminho | Resultado |
|---|---|
| `www.gov.br/funai/pt-br/atuacao/licenciamento-ambiental` | 404 |
| Menu da home da FUNAI | nenhum link com "licencia" |
| Dados abertos da FUNAI | só o Plano de Dados Abertos 2026-2028 e um link ao `dados.gov.br` (401) |

O e-mail `licenciamentoquilombola@incra.gov.br`, medido no texto da Diretoria de Territórios Quilombolas do INCRA, confirma que **o licenciamento é atribuição formal** (art. 123, II do regimento: "coordenar as atividades de licenciamento ambiental em terras ocupadas pelos remanescentes de quilombos"). O dado que prova a consulta não está publicado.

### 4.3 Protocolos de consulta — documento, não banco

**MPF (governamental, coletável):** a página `/atuacao/populacoes-indigenas-e-comunidades-tradicionais/publicacoes/protocolos-de-consulta` lista **18 PDFs distintos**, cada um com dois links (`@@display-file` e `@@download`). Onze têm "protocolo" no nome do arquivo; os do Pará são o **Munduruku** e o **Juruna** (Terra Indígena Paquiçamba, Volta Grande do Xingu). Há também Wajãpi, TIX Xingu, Krenak, Warao, Ciganos Calon e Rolim de Moura.

São PDFs em `www.mpf.mp.br`, com `robots.txt` que permite conteúdo (barra só `/++api++`, `/search`, `/login`). Dá para montar um índice `{povo, arquivo, url, hash}` — e baixar o texto é decisão separada, porque é PDF, não tabela.

**Observatório de Protocolos Comunitários (não governamental, coletável):** `observatorio.direitosocioambiental.org` mantém um banco de protocolos. Robots libera tudo menos `/wp-admin/`. A página `/protocolos/` só expõe 4 links por região — a lista brasileira está em páginas de categoria, então **é preciso paginar**. Tem página específica do **Tapajós (PA)**.

**Regra de dado pessoal neste caso:** protocolo é documento de povo, assinado por associações. Publicar o PDF com link e o nome do povo é legítimo; extrair nomes de pessoas do PDF e virar campo de banco, não.

### 4.4 Quilombolas — a fase de titulação não está acessível por HTTP simples

| Recurso | Situação |
|---|---|
| Página institucional de quilombolas do INCRA | 200, texto de competências, **sem tabela** |
| Diretoria de Territórios Quilombolas | 200, competências + e-mail de licenciamento |
| Plataforma de Governança Territorial (PGT) | 200, **SPA com hCaptcha**, 1 linha de texto, nenhum endpoint público |

O INCRA transfere o dado para a PGT, e a PGT é SPA com CAPTCHA. Não é paywall nem login: é um app que exige JS e resolve desafio anti-robô. **Não tentei contornar.** Fase de titulação por território no PA: **não medido**.

## 5. Satélite e fiscalização: o que se mede hoje

### 5.1 Queimadas / focos de calor (INPE) — a melhor fonte aberta

O host `queimadas.dgi.inpe.br` foi aposentado: hoje redireciona ao TerraBrasilis, e o dado mora em **`dataserver-coids.inpe.br`, com listagem de diretório aberta** (Apache index). Quatro granularidades medidas: `10min/`, `diario/`, `mensal/`, `anual/`.

**Por UF, anual:** `…/csv/anual/EstadosBr_sat_ref/PA/` tem 23 itens — **22 arquivos, 2003 a 2024**, de 404 KB a 2,0 MB. 2025 não existe no anual (ano não fechado); 404 no nome.

**Arquivo medido (2024):**

| Propriedade | Valor |
|---|---|
| Arquivo | `focos_br_pa_ref_2024.zip` |
| Tamanho | 2.146.991 B |
| CSV interno | `focos_br_pa_ref_2024.csv`, **56.070 linhas** (com cabeçalho) |
| Colunas | **9** — `id_bdq`, `foco_id`, `lat`, `lon`, `data_pas`, `pais`, `estado`, `municipio`, `bioma` |

Ou seja: **56.070 focos no PA em 2024, cada um com município e coordenada**. É o único dado de satélite desta lista que já vem por município, pronto.

**Frequência real:** `…/csv/diario/Brasil/` traz **um CSV por dia** com o Brasil inteiro (1,2 a 5,4 MB), datado de D-1 e publicado às **09:05**. O arquivo de hoje (`focos_diario_br_20261117.csv`) estava atualizado às 19:06 do próprio dia. A pasta `10min/` foi tocada às 20:00 de hoje — é o quase-tempo-real, para outro tipo de uso (não testado).

### 5.2 PRODES — existe, mas não como tabela municipal

- O TerraBrasilis tem **API interna de downloads**: `https://terrabrasilis.dpi.inpe.br/business/api/v1/download/all` → **200, 110.613 B, 231 itens** em JSON, cada um com `name`, `description`, `link`, `metadata`, `category`, `created`.
- Categorias medidas: PRODES por bioma, DETER por bioma, TerraClass, vegetação secundária, auxiliares. Nenhuma categoria "município".
- **Não existe CSV de desmatamento por município do PA** nessa API. O que existe é vetor e raster: o GeoPackage da Amazônia Legal (`prodes_amazonia_legal_v20261016.gpkg.zip`) declara **788.401.755 bytes** e o HEAD confirma 200. O do bioma Amazônia, ~820 MB, e os `accumulated_deforestation_*.zip` por ano.
- `https://terrabrasilis.dpi.inpe.br/download/dataset/` (listagem) devolve **403**; o **arquivo** devolve 200. A listagem está bloqueada, os arquivos não. Use a API para descobrir o link, nunca o índice de diretório.
- **DETER**: `…/file-delivery/download/deter-amz/shape` responde 200 com `application/zip` e **sem `Content-Length`**. Não baixei — amostra não medida.
- **`obt.inpe.br` é login.** A página institucional do PRODES devolve 200 com corpo de `require_login`. Fonte fechada na prática.
- Licença declarada: **CC BY-SA 4.0**, com nota de atualização dos dados anuais em 16/10/2026.

Consequência prática: para ter "desmatamento PRODES por município do PA" é preciso baixar ~800 MB de polígonos e cruzar com a malha municipal do IBGE. É projeto, não requisição.

### 5.3 IBAMA — autos de infração (já no repo) e licenças

**Autos de infração.** O que já está em `apps/web/data/ibama-autos-infracao.json` foi medido linha a linha:

| Medida | Valor |
|---|---|
| Registros gravados | **13.942** |
| Recorte por UF na fonte | **Sim**, campo `UF` (e `MUNICIPIO`) |
| Autos no PA | **2.160** (15,5% do total, maior UF) |
| Anos presentes no PA | **só 2026** (`2026-01` a `2026-11`, 2.160) |
| Municípios do PA citados | **110 strings** → **83 municípios reais** depois de normalizar acento |
| Soma das multas no PA | **R$ 1.605.017.167,03** |
| Top municípios | Novo Progresso 165, Prainha 111, Alenquer 98, São Félix do Xingu 84+79, Trairão 74, Altamira 69, Belém 65 |

Duas descobertas que valem correção:

1. **O coletor só lê um ano.** O ZIP da fonte tem **50 CSVs, um por ano, de 1977 a 2026** (123.641.976 bytes — listado pelo diretório central, sem baixar tudo). O coletor ordena os nomes e pega o último, então todo o histórico anterior a 2026 nunca foi coletado. "Autos do IBAMA no PA" hoje significa **autos de 2026 no PA**.
2. **`colunas` não bate com `linhas`.** O JSON publica 11 nomes em `colunas` mas grava **10 valores** por linha (o campo `infr` não vai na linha). Quem ler o arquivo por nome de coluna vai errar de campo em diante. Corrigir é uma linha no coletor, mas quem já consome precisa saber.
3. **Município com duas grafias.** `Sao Felix Do Xingu` e `São Félix Do Xingu` convivem no mesmo arquivo. Contar municípios por string infla o número em 27.

**Licenças ambientais do IBAMA** (`ibama-licencas.json`): 14.157 linhas, 8 campos (`proc`, `lic`, `tipo`, `emp`, `tipol`, `dt_emi`, `dt_ven`, `pac`). O próprio coletor registra em `obs`: *"CSV da fonte não informa município/UF"*. **Recorte por PA é impossível nesse dataset** — só por nome de empreendimento, o que não é recorte.

### 5.4 ICMBio — unidades de conservação e autuações

- O ICMBio cataloga **17 conjuntos** de dados abertos (medido na página), incluindo `limites-oficiais-de-unidades-de-conservacao-federais`, `desmatamento-em-unidades-de-conservacao-federais`, `areas-queimadas-em-unidades-de-conservacao-federais` e **`manifestacoes-do-icmbio-no-procedimento-de-licenciamento-ambiental`** — este último é o mais próximo de "consulta prévia" que apareceu.
- Mas o catálogo vive no `dados.gov.br`, que devolve **401** tanto no `robots.txt` quanto na API de conjuntos. Nenhum desses conjuntos pôde ser aberto.
- As páginas do ICMBio em `www.gov.br` (autuações, infrações, UCs) são **institucionais**: texto, normativas, subpáginas. Nenhuma publica tabela por UF. A de infrações anuncia "consultar os registros públicos de autos de infração", mas não linka o sistema em HTML — é botão de JS.
- `geoserver.icmbio.gov.br` **não resolve em DNS**.
- UCs federais no PA e autuações nelas: **não medido**, por bloqueio do catálogo.

## 6. O que já está no repo (medido)

| Arquivo | Registros | Recorte PA | Serve para consulta prévia? |
|---|---|---|---|
| `apps/web/data/ibama-autos-infracao.json` | 13.942 | 2.160 (só 2026) | Não. Mostra pressão de fiscalização, não consulta. |
| `apps/web/data/ibama-licencas.json` | 14.157 | **impossível** (sem UF) | Não. |
| audiências públicas SEMAS-PA | 25 (doc irmão) | sim | Parcial: audiência não é consulta a povo. |

## 7. O que está bloqueado e por quê

| Recurso | Situação | Motivo |
|---|---|---|
| `dados.gov.br` (catálogo e API) | **401** | WAF/auth antes de qualquer conteúdo. Nem o `robots.txt` abre. |
| PGT do INCRA (territórios quilombolas) | **SPA + hCaptcha** | App JS com desafio anti-robô. Contornar é proibido. |
| MPF — recomendações | **robots** | A listagem é Volto e os dados saem de `/++api++`, que o `robots.txt` proíbe explicitamente. |
| `terrabrasilis.dpi.inpe.br/geoserver/` | **robots** | `Disallow: /geoserver/`. WFS/WMS do TerraBrasilis fora de alcance. |
| `terrabrasilis.dpi.inpe.br/download/dataset/` | **403** | Listagem de diretório bloqueada para o meu UA. Os arquivos abrem; use a API. |
| `obt.inpe.br/…/prodes` | **login** | 200 com corpo de `credentials_cookie_auth/require_login`. |
| `geoserver.icmbio.gov.br` | **DNS** | Host não existe. |
| `api.mapbiomas.org` | **timeout** | Conexão não completou em 40 s. Não insisti. |
| Lista de processos de licenciamento com componente indígena | **não publicada** | Não é bloqueio: não achei página nem endpoint em 3 caminhos. |

## 8. robots.txt, licença e termos

| Host | robots.txt | Efeito para nós |
|---|---|---|
| `www.gov.br` (FUNAI, ICMBio, INCRA) | 200 | Barra `/search`, `/login`, `/edit`. Conteúdo liberado. |
| `geoserver.funai.gov.br` | **404** (sem robots) | Nenhuma restrição declarada; links publicados pela FUNAI. |
| `www.mpf.mp.br` | 200 | Barra `/++api++`, `/search`, `/login`, telas de edição. Conteúdo liberado. |
| `terrabrasilis.dpi.inpe.br` | 200 | **`Disallow: /geoserver/`** e `/wp-admin/`. `/download` e `/business/api` liberados. |
| `dataserver-coids.inpe.br` | **404** (sem robots) | Listagem de diretório aberta pelo próprio INPE. |
| `dadosabertos.ibama.gov.br` | 200 (já registrado no coletor) | `Crawl-Delay: 10`. Dataset e ZIP liberados. |
| `observatorio.direitosocioambiental.org` | 200 | Só `/wp-admin/` fora. |
| `dados.gov.br` | **401** | Sem robots legível. Tratei como bloqueado. |

Licença do dado de satélite: **CC BY-SA 4.0** (declarada na página de citações do TerraBrasilis). Atribuição ao INPE é obrigatória; compartilhar igual também.

Nenhuma fonte aqui exigiu login, pagamento ou quebra de limite para ser lida. As que exigiram foram registradas e abandonadas.

## 9. Veredito por fonte

| Fonte | Coletável hoje? | Registros medidos | Dificuldade | Ganho cívico em uma frase |
|---|---|---|---|---|
| **Queimadas INPE (anual por UF)** | **Sim** | 22 anos do PA, 56.070 focos em 2024, 9 campos com município | **Baixa**: ZIP + CSV, listagem aberta | Diz em qual município do PA o fogo aconteceu, ano a ano, sem intermediário. |
| **Queimadas INPE (diário)** | **Sim** | 1 CSV/dia do Brasil, 1,2–5,4 MB, publicado ~09:05 | **Baixa**: mesmo formato | Permite publicar foco de calor do PA com menos de um dia de atraso. |
| **FUNAI — TIs por UF (WFS)** | **Sim** | 61 TIs tocando o PA, 51 só-PA, 19,06 Mha, 9 campos | **Baixa**: WFS com `propertyname`, sem geometria | Mostra onde existe terra indígena e em que fase, que é a pergunta anterior à consulta. |
| **MPF — protocolos de consulta** | **Sim** | 18 PDFs, 11 protocolos no nome, 2 do PA | **Média**: são PDFs, o índice é fácil e o texto não | Prova documental de que o povo escreveu como quer ser consultado. |
| **Observatório de Protocolos (não-gov)** | **Sim** | banco com página do Tapajós (PA); lista brasileira exige paginar | **Média**: WordPress, categorias, sem API | Reúne protocolos que nenhum órgão público cataloga. |
| **PRODES (TerraBrasilis)** | **Parcial** | 231 itens na API; GeoPackage de 788 MB; **sem tabela municipal** | **Alta**: 800 MB + cruzamento com malha do IBGE | É a taxa oficial de desmatamento, mas por polígono, não por município. |
| **DETER** | **Parcial** | `application/zip` sem tamanho; não baixado | **Alta**: shape por bioma, sem campo municipal | Alerta de desmatamento em curso, se alguém agregar por município. |
| **IBAMA — autos** | **Sim, e subusado** | 2.160 no PA, todos de 2026; fonte tem 50 anos | **Baixa**: CSV anual por ano no mesmo ZIP | 50 anos de autuação no PA estão a um `for` de distância do que já existe. |
| **IBAMA — licenças** | **Não para PA** | 14.157 linhas, 8 campos, **sem UF** | **Alta**: falta o campo-chave | Não serve para recorte estadual; só por nome de empreendimento, o que engana. |
| **INCRA — quilombolas** | **Não** | 0 (PGT é SPA com hCaptcha) | **Bloqueada** | A fase de titulação do território quilombola continua invisível para o cidadão. |
| **ICMBio — UCs e autuações** | **Não** | 0 (catálogo em `dados.gov.br` = 401) | **Bloqueada** | Saber se houve autuação dentro de UC federal no PA exigiria furar o 401. |
| **MPF — recomendações** | **Não** | 0 (SPA + `/++api++` proibido) | **Bloqueada por robots** | O que o MPF recomendou sobre consulta prévia no PA não é enumerável hoje. |

## 10. O que eu não medi

Sendo explícito, para ninguém tratar ausência de medição como resultado:

- **PRODES por município do PA**: não existe tabela na fonte e eu não baixei os 788 MB para agregar. Número não medido.
- **DETER**: fiz HEAD, não baixei o shape. Contagem de avisos no PA: não medido.
- **ICMBio**: quantas UCs federais há no PA, e quantas autuações nelas. O catálogo deu 401 e não insisti.
- **INCRA/PGT**: quantos territórios quilombolas no PA e em que fase. CAPTCHA, não tentei.
- **MPF recomendações**: quantas tratam de consulta prévia no PA. Robots proíbe a API que alimenta a lista.
- **FUNAI**: se existe lista de processos de licenciamento com componente indígena em algum sistema interno (SILIC ou equivalente). Não achei caminho público; 3 caminhos sondados, 0 achados.
- **Observatório de Protocolos**: quantos protocolos ao todo, e quantos do PA. Só abri a home, `/protocolos/` e a página do Tapajós — a lista brasileira exige paginação que não fiz.
- **Queimadas 10min**: a pasta existe e foi tocada hoje às 20:00; não testei o conteúdo nem o formato.
