# Dados abertos do ONS — catálogo e o que entra na fase 1

> **Tipo:** FONTE
> **Domínio:** energia
> **Última medição:** 2026-11-18 (catálogo completo do CKAN e peso real dos três conjuntos da fase 1)
> **Leitura estimada:** média (10–20 min)
> **Relacionados:** [FONTES.md](FONTES.md), [COLETA-ETICA.md](COLETA-ETICA.md), [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** ons, dados abertos, ckan, energia, carga, geração, ear, hidrologia, constrained-off, cmo, transmissão, fase 1

## Sumário

- [Por que esta fonte existe](#por-que-esta-fonte-existe)
- [Como o ONS publica](#como-o-ons-publica)
- [Regras de coleta e a decisão sobre o robots.txt](#regras-de-coleta-e-a-decisão-sobre-o-robotstxt)
- [Os 88 conjuntos, por tema](#os-88-conjuntos-por-tema)
- [O que entra na fase 1 e por quê](#o-que-entra-na-fase-1-e-por-quê)
- [Peso real medido na fase 1](#peso-real-medido-na-fase-1)
- [Como rodar os coletores](#como-rodar-os-coletores)
- [Armadilhas medidas](#armadilhas-medidas)
- [Origem / Histórico](#origem--histórico)

## Por que esta fonte existe

O ONS opera o Sistema Interligado Nacional e publica, em dado aberto, o
que o cidadão precisa para entender a conta de luz: quanto se consome,
quanto se gera, de que fonte, por quanto e com quanta água no
reservatório. Nenhum outro órgão publica isso com esse grão.

O portal do Controle Popular usa essa fonte para responder perguntas
diretas — "de onde vem a luz do meu subsistema?", "a energia está cara
porque choveu pouco?", "quanta eólica é desperdiçada por falta de
linha?" — sem depender de release de assessoria.

## Como o ONS publica

- **Portal:** <https://dados.ons.org.br/> — CKAN, o mesmo software do
  catálogo de Minas.
- **API:** `/api/3/action/package_list` (nomes) e
  `/api/3/action/package_show?id=<nome>` (ficha e recursos).
- **Arquivos:** bucket público S3 `ons-aws-prod-opendata`. Cada conjunto
  publica o mesmo dado em **CSV, XLSX e PARQUET** (e dicionário em PDF/JSON).
  O ETL baixa **CSV**: é o formato que a biblioteca padrão lê sem
  dependência, em fluxo, sem estourar memória.
- **Grão:** quase tudo é anual por arquivo (`CARGA_ENERGIA_2025.csv`), com
  histórico desde 2000. Conjunto novo aparece como recurso novo, não como
  arquivo trocado — por isso o coletor lê a lista do CKAN em vez de fixar
  URL no código.
- **Licença:** Creative Commons Atribuição (**CC-BY**), declarada nos 88
  conjuntos (`license_id = cc-by`). Publicar com crédito ao ONS é a
  condição; cada gráfico do portal precisa citar a fonte.
- **Volume do acervo:** os 88 conjuntos somam **106.986,0 MB**
  declarados no CKAN (todas as versões de formato somadas) e
  **74.818,4 MB** só nos CSV. O maior conjunto sozinho
  (`programacao_diaria`) declara mais de 30 GB em 2.279 recursos.

## Regras de coleta e a decisão sobre o robots.txt

O `robots.txt` do portal (`https://dados.ons.org.br/robots.txt`) diz:

```
Disallow: /api/
Crawl-Delay: 10
```

`/api/` está fora do alcance de robô de indexação. A coleta pela API é
**ordem explícita do dono** para dado aberto CC-BY, e fica registrada
aqui e no cabeçalho dos dois coletores, como manda a
[COLETA-ETICA.md](COLETA-ETICA.md). O que o script faz para não abusar:

| Regra | Como está no código |
|---|---|
| User-Agent honesto | `finweejur/github artur colito`, fixo, nunca UA de navegador |
| `Crawl-Delay` | 10 s entre chamadas ao CKAN, por worker |
| Paralelismo | no máximo 4 chamadas ao mesmo tempo (≈1 requisição a cada 2,5 s) |
| Bucket S3 | sem `robots.txt`; 1,5 s entre arquivos, um por vez |
| Repetição | 4 tentativas com espera crescente em 5xx/rede; nunca martela |
| Sem dado pessoal | o ONS publica operação de usina, não pessoa; nada de CPF no acervo |

## Os 88 conjuntos, por tema

Tabela gerada a partir de `apps/web/data/ons/catalogo.json` (coletado em
2026-11-18). **Tamanho** é o declarado no CKAN em MB (1 MB = 1.048.576
bytes, como o Windows mostra); **CSV** é só a fatia que o ETL baixa. A
soma de todas as versões de formato é maior que o arquivo CSV porque
XLSX e PARQUET repetem o mesmo dado.


### Carga e demanda (9 conjuntos, 77,4 MB declarados)

Quanto o país consome, por subsistema e por hora. É a base para dizer se a luz que falta é problema de oferta ou de rede.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Carga de Energia Diária](https://dados.ons.org.br/dataset/carga-energia) | `carga-energia` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 3,1 | 1,4 | 18/11/2026 |
| [Carga de Energia Mensal](https://dados.ons.org.br/dataset/carga-mensal) | `carga-mensal` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,1 | 0,0 | 18/11/2026 |
| [Carga de Energia Programada](https://dados.ons.org.br/dataset/carga-energia-programada) | `carga-energia-programada` | API, JSON, PDF | 3 | 0,0 | 0,0 | 01/10/2025 |
| [Carga de Energia Verificada](https://dados.ons.org.br/dataset/carga-energia-verificada) | `carga-energia-verificada` | API, JSON, PDF | 3 | 0,0 | 0,0 | 01/10/2025 |
| [Carga global de Roraima](https://dados.ons.org.br/dataset/cargaglobal-roraima) | `cargaglobal-roraima` | CSV, JSON, PARQUET, PDF, XLSX | 17 | 0,0 | 0,0 | 19/10/2026 |
| [Curva de Carga Horária](https://dados.ons.org.br/dataset/curva-carga) | `curva-carga` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 71,8 | 39,2 | 18/11/2026 |
| [Demanda Máxima Diária por Subsistema](https://dados.ons.org.br/dataset/demanda_maxima_di) | `demanda_maxima_di` | CSV, JSON, PARQUET, PDF, XLSX | 11 | 0,7 | 0,4 | 18/11/2026 |
| [Interrupção de Carga](https://dados.ons.org.br/dataset/interrupcao_carga) | `interrupcao_carga` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,5 | 0,7 | 18/11/2026 |
| [Oferta - Resposta à Demanda](https://dados.ons.org.br/dataset/oferta_respostademanda) | `oferta_respostademanda` | CSV, JSON, PARQUET, PDF, XLSX | 14 | 0,2 | 0,1 | 18/11/2026 |


### Geração (16 conjuntos, 58.684,4 MB declarados)

Quanto se produz, por usina, por fonte e por subsistema. Separa o que é operação verificada do que é programação (DESSEM).

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Balanço de Energia nos Subsistemas](https://dados.ons.org.br/dataset/balanco-energia-subsistema) | `balanco-energia-subsistema` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 233,4 | 118,0 | 18/11/2026 |
| [Capacidade Instalada de Geração](https://dados.ons.org.br/dataset/capacidade-geracao) | `capacidade-geracao` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 2,0 | 1,3 | 18/11/2026 |
| [Dados de Classificação EVT](https://dados.ons.org.br/dataset/classificacao-evt) | `classificacao-evt` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,0 | 0,0 | 28/04/2026 |
| [Dados do Histórico de Despacho de Energia de Janeiro/2021 A Setembro/2024](https://dados.ons.org.br/dataset/descontinuado-dados-do-historico-de-despacho-de-energia-de-01-2021-a-09-2024) | `descontinuado-dados-do-historico-de-despacho-de-energia-de-01-2021-a-09-2024` | CSV, JSON, PARQUET, PDF | 10 | 0,0 | 0,0 | 28/04/2026 |
| [Dados do Relacionamento Entre Conjuntos e Usinas](https://dados.ons.org.br/dataset/usina_conjunto) | `usina_conjunto` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,6 | 0,3 | 18/11/2026 |
| [Dados do Relacionamento Entre Grupos de Pequenas Usinas e Usinas](https://dados.ons.org.br/dataset/usina_pqu) | `usina_pqu` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,3 | 0,2 | 18/11/2026 |
| [Modalidade de Operação de Usinas](https://dados.ons.org.br/dataset/modalidade-usina) | `modalidade-usina` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,3 | 0,8 | 18/11/2026 |
| [Energia Vertida Turbinável](https://dados.ons.org.br/dataset/energia-vertida-turbinavel) | `energia-vertida-turbinavel` | CSV, JSON, PARQUET, PDF, XLSX | 136 | 3.589,2 | 2.126,9 | 18/11/2026 |
| [Geração Comercial Para Exportação Internacional](https://dados.ons.org.br/dataset/geracao-exportacao-internacional) | `geracao-exportacao-internacional` | CSV, JSON, PARQUET, PDF, XLSX | 16 | 3,0 | 1,7 | 18/11/2026 |
| [Geração de Itaipu Binacional - Base horária](https://dados.ons.org.br/dataset/geracao_itaipu) | `geracao_itaipu` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 33,4 | 15,0 | 18/11/2026 |
| [Geração por Usina em Base Horária](https://dados.ons.org.br/dataset/geracao-usina-2) | `geracao-usina-2` | CSV, JSON, PARQUET, PDF, XLSX | 247 | 17.028,3 | 10.978,6 | 18/11/2026 |
| [Geração Térmica por Motivo de Despacho](https://dados.ons.org.br/dataset/geracao-termica-despacho-2) | `geracao-termica-despacho-2` | CSV, JSON, PARQUET, PDF, XLSX | 212 | 5.846,1 | 3.963,2 | 18/11/2026 |
| [Unidade Geradora em Operação como Compensador Síncrono](https://dados.ons.org.br/dataset/uge_opera_csi) | `uge_opera_csi` | CSV, JSON, PARQUET, PDF, XLSX | 20 | 39,7 | 28,2 | 18/11/2026 |
| [Dados dos Valores da Programação Diária](https://dados.ons.org.br/dataset/programacao_diaria) | `programacao_diaria` | CSV, JSON, PARQUET, PDF, XLSX | 2279 | 31.861,8 | 25.471,8 | 17/11/2026 |
| [DESSEM - Balanço de Energia Detalhado](https://dados.ons.org.br/dataset/balanco_dessem_detalhe) | `balanco_dessem_detalhe` | CSV, JSON, PARQUET, PDF, XLSX | 1633 | 26,0 | 8,7 | 18/11/2026 |
| [DESSEM - Balanço de Energia Geral](https://dados.ons.org.br/dataset/balanco_dessem_geral) | `balanco_dessem_geral` | CSV, JSON, PARQUET, PDF, XLSX | 1636 | 19,4 | 5,8 | 18/11/2026 |


### Renováveis (eólica e solar) (8 conjuntos, 36.511,3 MB declarados)

Fator de capacidade e restrição de operação (constrained-off): quanta energia renovável existe, quanta é gerada e quanta é desperdiçada por limite de rede.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Fator de Capacidade de Geração Eólica e Solar](https://dados.ons.org.br/dataset/fator-capacidade-2) | `fator-capacidade-2` | CSV, JSON, PARQUET, PDF, XLSX | 220 | 5.533,2 | 3.588,9 | 18/11/2026 |
| [Dados de Restrição de Operação por Constrained-off de Usinas Eólicas](https://dados.ons.org.br/dataset/restricao_coff_eolica_usi) | `restricao_coff_eolica_usi` | CSV, JSON, PARQUET, PDF, XLSX | 188 | 3.213,4 | 2.153,5 | 18/11/2026 |
| [Dados de Restrição De Operação Por Constrained-off de Usinas Eólicas - Detalhamento Por Usinas](https://dados.ons.org.br/dataset/restricao_coff_eolica_detail) | `restricao_coff_eolica_detail` | CSV, JSON, PARQUET, PDF, XLSX | 190 | 19.181,9 | 12.480,8 | 18/11/2026 |
| [Dados de Restrição de Operação por Constrained-off de Usinas Eólicas Intra SemiHora](https://dados.ons.org.br/dataset/coff_eolica_usi_intrasemihora) | `coff_eolica_usi_intrasemihora` | CSV, JSON, PARQUET, PDF, XLSX | 188 | 894,5 | 638,4 | 18/11/2026 |
| [Dados de Restrição de Operação por Constrained-off de Usinas Fotovoltaicas](https://dados.ons.org.br/dataset/restricao_coff_fotovoltaica) | `restricao_coff_fotovoltaica` | CSV, JSON, PARQUET, PDF, XLSX | 98 | 729,5 | 499,9 | 18/11/2026 |
| [Dados de Restrição De Operação Por Constrained-off de Usinas Fotovoltaicas - Detalhamento Por Usinas](https://dados.ons.org.br/dataset/restricao_coff_fotovoltaica_detail) | `restricao_coff_fotovoltaica_detail` | CSV, JSON, PARQUET, PDF, XLSX | 100 | 4.780,2 | 3.219,3 | 18/11/2026 |
| [Dados de Restrição de Operação por Constrained-off de Usinas Fotovoltaicas Intra SemiHora](https://dados.ons.org.br/dataset/coff_fotovoltaica_intrasemihora) | `coff_fotovoltaica_intrasemihora` | CSV, JSON, PARQUET, PDF, XLSX | 98 | 240,7 | 171,1 | 18/11/2026 |
| [Dados dos Valores da Previsão Versus Programado - Eólicas e Solares](https://dados.ons.org.br/dataset/programacao_x_previsao) | `programacao_x_previsao` | CSV, JSON, PARQUET, PDF, XLSX | 2306 | 1.937,9 | 1.283,5 | 17/11/2026 |


### Preço e oferta (5 conjuntos, 258,3 MB declarados)

Custo marginal de operação (CMO), custo variável das térmicas e ofertas de importação. É o preço que o consumidor paga, na origem.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [CMO Semanal](https://dados.ons.org.br/dataset/cmo-semanal) | `cmo-semanal` | CSV, JSON, PARQUET, PDF, XLSX | 68 | 0,8 | 0,3 | 18/11/2026 |
| [CMO Semi-Horário](https://dados.ons.org.br/dataset/cmo-semi-horario) | `cmo-semi-horario` | CSV, JSON, PARQUET, PDF, XLSX | 23 | 28,2 | 17,0 | 18/11/2026 |
| [CVU das Usina Térmicas](https://dados.ons.org.br/dataset/cvu-usitermica) | `cvu-usitermica` | CSV, JSON, PARQUET, PDF, XLSX | 68 | 14,7 | 9,5 | 18/11/2026 |
| [Importação de Energia na Modalidade Comercial por Bloco](https://dados.ons.org.br/dataset/importacaoenergia-comercial-2) | `importacaoenergia-comercial-2` | CSV, JSON, PARQUET, PDF, XLSX | 27 | 214,1 | 137,1 | 18/11/2026 |
| [Ofertas de Preço para Importação](https://dados.ons.org.br/dataset/ofertapreco-importacao) | `ofertapreco-importacao` | CSV, JSON, PARQUET, PDF, XLSX | 26 | 0,5 | 0,2 | 01/09/2026 |


### Hidrologia (18 conjuntos, 6.443,1 MB declarados)

Água que entra, água que fica e energia armazenada. Inclui EAR, ENA, vazão, nível de reservatório e a geometria das bacias.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [EAR Diário por Bacia](https://dados.ons.org.br/dataset/ear-diario-por-bacia) | `ear-diario-por-bacia` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 16,3 | 8,4 | 18/11/2026 |
| [EAR Diário por REE - Reservatório Equivalente de Energia](https://dados.ons.org.br/dataset/ear-diario-por-ree-reservatorio-equivalente-de-energia) | `ear-diario-por-ree-reservatorio-equivalente-de-energia` | CSV, JSON, PARQUET, PDF, XLSX | 35 | 4,6 | 2,5 | 18/11/2026 |
| [EAR Diário por Reservatório](https://dados.ons.org.br/dataset/ear-diario-por-reservatorio) | `ear-diario-por-reservatorio` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 273,1 | 149,3 | 18/11/2026 |
| [EAR Diário por Subsistema](https://dados.ons.org.br/dataset/ear-diario-por-subsistema) | `ear-diario-por-subsistema` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 3,7 | 1,7 | 18/11/2026 |
| [ENA Diário por Bacia](https://dados.ons.org.br/dataset/ena-diario-por-bacia) | `ena-diario-por-bacia` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 22,4 | 10,3 | 18/11/2026 |
| [ENA Diário por REE - Reservatório Equivalente de Energia](https://dados.ons.org.br/dataset/ena-diario-por-ree-reservatorio-equivalente-de-energia) | `ena-diario-por-ree-reservatorio-equivalente-de-energia` | CSV, JSON, PARQUET, PDF, XLSX | 35 | 6,7 | 3,1 | 18/11/2026 |
| [ENA Diário por Reservatório](https://dados.ons.org.br/dataset/ena-diario-por-reservatorio) | `ena-diario-por-reservatorio` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 293,8 | 154,0 | 18/11/2026 |
| [ENA Diário por Subsistema](https://dados.ons.org.br/dataset/ena-diario-por-subsistema) | `ena-diario-por-subsistema` | CSV, JSON, PARQUET, PDF, XLSX | 83 | 4,9 | 2,0 | 18/11/2026 |
| [Dados Hidráulicos por Reservatório – Base diária](https://dados.ons.org.br/dataset/dados-hidrologicos-res) | `dados-hidrologicos-res` | CSV, JSON, PARQUET, PDF, XLSX | 202 | 749,3 | 420,2 | 18/11/2026 |
| [Dados Hidráulicos por Reservatório – Base horária](https://dados.ons.org.br/dataset/dados_hidrologicos_ho) | `dados_hidrologicos_ho` | CSV, JSON, PARQUET, PDF, XLSX | 616 | 4.201,7 | 2.779,4 | 18/11/2026 |
| [Dados Hidrológicos - Volume de Espera Recomendado](https://dados.ons.org.br/dataset/res_volumeespera) | `res_volumeespera` | CSV, JSON, PARQUET, PDF, XLSX | 66 | 22,5 | 15,2 | 18/11/2026 |
| [Reservatório - tabelas cota x area x volume](https://dados.ons.org.br/dataset/res_cotaareavolume) | `res_cotaareavolume` | CSV, JSON, PARQUET, PDF | 4 | 3,9 | 3,2 | 13/11/2026 |
| [Reservatórios](https://dados.ons.org.br/dataset/reservatorio) | `reservatorio` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,1 | 0,0 | 18/11/2026 |
| [Contornos das Bacias Hidrográficas](https://dados.ons.org.br/dataset/bacia_contorno) | `bacia_contorno` | ZIP | 1 | 0,0 | 0,0 | 27/05/2024 |
| [Dados de Grandezas Fluviométricas](https://dados.ons.org.br/dataset/grandezas_fluviometricas) | `grandezas_fluviometricas` | CSV, JSON, PARQUET, PDF, XLSX | 203 | 343,6 | 271,1 | 18/11/2026 |
| [Grandezas Fluviométricas Depreciadas](https://dados.ons.org.br/dataset/deprec_fluv) | `deprec_fluv` | CSV, JSON, PARQUET, XLSX | 37 | 104,8 | 78,8 | 29/10/2026 |
| [Dados Hidrológicos Depreciados de Reservatórios](https://dados.ons.org.br/dataset/deprec_hidro) | `deprec_hidro` | CSV, JSON, PARQUET, XLSX | 82 | 391,8 | 218,2 | 29/10/2026 |
| [Precipitação Diária Observada](https://dados.ons.org.br/dataset/precipitacao-estacao) | `precipitacao-estacao` | CSV, JSON, PDF | 4 | 0,0 | 0,0 | 28/04/2026 |


### Rede e transmissão (27 conjuntos, 493,7 MB declarados)

O que transporta a energia: linhas, subestações, transformadores, intercâmbio entre subsistemas e os indicadores de confiabilidade e qualidade da rede básica.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Capacidade de Transformação da Rede Básica](https://dados.ons.org.br/dataset/capacidade-transformacao) | `capacidade-transformacao` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,7 | 0,4 | 18/11/2026 |
| [Linhas de Transmissão da Rede de Operação](https://dados.ons.org.br/dataset/linha-transmissao) | `linha-transmissao` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,4 | 0,7 | 18/11/2026 |
| [Subestação da Rede de Operação](https://dados.ons.org.br/dataset/subestacao) | `subestacao` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,3 | 0,2 | 18/11/2026 |
| [Equipamentos de Controle de Reativos](https://dados.ons.org.br/dataset/equipamento-controle-reativo) | `equipamento-controle-reativo` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,6 | 0,4 | 18/11/2026 |
| [Usinas prestando serviço ancilar de reativo conforme PRIMEIRO SANDBOX](https://dados.ons.org.br/dataset/usi_servicoancilar_sandbox) | `usi_servicoancilar_sandbox` | CSV, JSON, PARQUET, PDF, XLSX | 38 | 0,3 | 0,2 | 09/11/2026 |
| [Dados de Intercâmbio de Energia por Modalidade](https://dados.ons.org.br/dataset/intercambio_modalidade) | `intercambio_modalidade` | CSV, JSON, PARQUET, PDF, XLSX | 60 | 95,4 | 66,3 | 18/11/2026 |
| [Intercâmbio do SIN com Outros Países](https://dados.ons.org.br/dataset/intercambio-internacional) | `intercambio-internacional` | CSV, JSON, PARQUET, PDF, XLSX | 60 | 33,3 | 23,0 | 18/11/2026 |
| [Intercâmbios Entre Subsistemas](https://dados.ons.org.br/dataset/intercambio-nacional) | `intercambio-nacional` | CSV, JSON, PARQUET, PDF, XLSX | 60 | 73,8 | 46,4 | 18/11/2026 |
| [Dados dos Programados dos Elementos de Fluxo Controlado](https://dados.ons.org.br/dataset/programacao_fluxo_controlado) | `programacao_fluxo_controlado` | CSV, JSON, PARQUET, PDF, XLSX | 2317 | 152,6 | 105,1 | 17/11/2026 |
| [Dados dos indicadores de confiabilidade da rede básica: ATLS – atendimento aos limites sistêmicos](https://dados.ons.org.br/dataset/ind_confiarb_atls) | `ind_confiarb_atls` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,1 | 0,1 | 18/11/2026 |
| [Dados dos indicadores de confiabilidade da rede básica: CCAL – controle de carregamento de linhas de transmissão](https://dados.ons.org.br/dataset/ind_confiarb_ccal) | `ind_confiarb_ccal` | CSV, JSON, PARQUET, PDF, XLSX | 6 | 2,7 | 1,1 | 18/11/2026 |
| [Dados dos indicadores de confiabilidade da rede básica: CCAT – controle de carregamento de transformadores](https://dados.ons.org.br/dataset/ind_confiarb_ccat) | `ind_confiarb_ccat` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,5 | 0,9 | 18/11/2026 |
| [Indicadores de Confiabilidade da Rede Básica: CIPER – Carga Interrompida por Perturbações](https://dados.ons.org.br/dataset/ind_confiarb_ciper) | `ind_confiarb_ciper` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,0 | 0,6 | 18/11/2026 |
| [Indicadores de Confiabilidade da Rede Básica: DREQ, FREQ](https://dados.ons.org.br/dataset/ind_confiarb_dreq_freq) | `ind_confiarb_dreq_freq` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,0 | 0,6 | 18/11/2026 |
| [Indicadores de Confiabilidade da Rede Básica: ENS – Energia Não Suprida](https://dados.ons.org.br/dataset/ind_confiarb_energianaosuprida) | `ind_confiarb_energianaosuprida` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,8 | 0,5 | 18/11/2026 |
| [Indicadores de Confiabilidade da Rede Básica: Robustez – RMAL, RMCS, RRB e RRBCS](https://dados.ons.org.br/dataset/ind_confiarb_robustez) | `ind_confiarb_robustez` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 4,7 | 3,0 | 18/11/2026 |
| [Indicadores de Confiabilidade da Rede Básica: SM - Severidade das Perturbações](https://dados.ons.org.br/dataset/ind_confiarb_severidade) | `ind_confiarb_severidade` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 1,0 | 0,6 | 18/11/2026 |
| [Dados dos indicadores de cumprimento de providências: ECPA E PCPA](https://dados.ons.org.br/dataset/ind_providencia_ecpa_pcpa) | `ind_providencia_ecpa_pcpa` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 4,7 | 3,0 | 18/11/2026 |
| [Dados dos indicadores de qualidade de energia da rede básica: DFD – desempenho da frequência em distúrbios - mensal e anual](https://dados.ons.org.br/dataset/ind_qualid_dfd_meano) | `ind_qualid_dfd_meano` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,1 | 0,1 | 18/11/2026 |
| [Dados dos indicadores de qualidade de energia da rede básica: DFD – desempenho da frequência em distúrbios – por evento](https://dados.ons.org.br/dataset/ind_qualid_dfd_evento) | `ind_qualid_dfd_evento` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,0 | 0,0 | 18/11/2026 |
| [Dados dos indicadores de qualidade de energia da rede básica: DFP – desempenho da frequência em regime permanente](https://dados.ons.org.br/dataset/ind_qualid_dfp_regime) | `ind_qualid_dfp_regime` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 0,3 | 0,2 | 18/11/2026 |
| [Indicadores de Disponibilidade de Função Transmissão – Conversores](https://dados.ons.org.br/dataset/ind_disponibilidade_ft_conversor) | `ind_disponibilidade_ft_conversor` | CSV, JSON, PARQUET, PDF, XLSX | 23 | 0,1 | 0,0 | 18/11/2026 |
| [Indicadores de Disponibilidade de Função Transmissão – Equipamentos de Controle de Reativo](https://dados.ons.org.br/dataset/ind_disponibilidade_ft_reativo) | `ind_disponibilidade_ft_reativo` | CSV, JSON, PARQUET, PDF, XLSX | 50 | 0,5 | 0,2 | 18/11/2026 |
| [Indicadores de Disponibilidade de Função Transmissão – Linhas de Transmissão e Transformadores](https://dados.ons.org.br/dataset/ind_disponibilidade_ft_trlt) | `ind_disponibilidade_ft_trlt` | CSV, JSON, PARQUET, PDF, XLSX | 50 | 0,4 | 0,1 | 18/11/2026 |
| [Taxas TEIFa e TEIP](https://dados.ons.org.br/dataset/taxa_teif_teip) | `taxa_teif_teip` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 5,0 | 3,4 | 18/11/2026 |
| [Taxas TEIFa E TEIP - Parâmetros](https://dados.ons.org.br/dataset/taxa_teif_teip_parametro) | `taxa_teif_teip_parametro` | CSV, JSON, PARQUET, PDF, XLSX | 23 | 106,2 | 85,6 | 18/11/2026 |
| [Taxas TEIFa Oper e TEIP Oper](https://dados.ons.org.br/dataset/taxa_teif_teip_oper) | `taxa_teif_teip_oper` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 5,1 | 3,6 | 18/11/2026 |


### Disponibilidade e desempenho (4 conjuntos, 4.517,7 MB declarados)

Quanto do parque está disponível e quanto tempo fica parado. É o que explica apagão, manutenção e a diferença entre capacidade instalada e geração real.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Dados de Disponibilidade de Usinas](https://dados.ons.org.br/dataset/disponibilidade_usina) | `disponibilidade_usina` | CSV, JSON, PARQUET, PDF, XLSX | 338 | 4.444,4 | 3.344,6 | 18/11/2026 |
| [Indicadores de Desempenho das Funções Geração por Unidade Geradora em Base Anual](https://dados.ons.org.br/dataset/ind_disponibilidade_fgeracao_uge_anual) | `ind_disponibilidade_fgeracao_uge_anual` | CSV, JSON, PARQUET, PDF, XLSX | 5 | 6,1 | 3,8 | 18/11/2026 |
| [Indicadores de Desempenho das Funções Geração por Unidade Geradora em Base Mensal](https://dados.ons.org.br/dataset/ind_disponibilidade_fgeracao_uge_mensal) | `ind_disponibilidade_fgeracao_uge_mensal` | CSV, JSON, PARQUET, PDF, XLSX | 50 | 67,1 | 44,5 | 18/11/2026 |
| [Indicadores de Disponibilidade de Função Geração para o SIN – Base Mensal](https://dados.ons.org.br/dataset/ind-disponibilidade-geracao-sin) | `ind-disponibilidade-geracao-sin` | CSV, JSON, PARQUET, PDF, XLSX | 51 | 0,2 | 0,0 | 18/11/2026 |


### Institucional (1 conjuntos, 0,0 MB declarados)

Metadado do próprio portal, não série de operação.

| Conjunto | Chave CKAN | Formatos | Recursos | Tamanho (MB) | CSV (MB) | Atualizado |
|---|---|---|---|---|---|---|
| [Ambiente Colaborativo - GITHUB](https://dados.ons.org.br/dataset/ambiente-colaborativo) | `ambiente-colaborativo` | PDF | 2 | 0,0 | 0,0 | 27/05/2024 |


## O que entra na fase 1 e por quê

Três conjuntos, escolhidos por **responderem à pergunta do leitor com
dado que já existe em grão certo**, e por serem os mais leves do acervo
que ainda contam a história toda:

| Série do portal | Conjunto do ONS | Por que entra |
|---|---|---|
| `energia-carga.json` | `carga-energia` — Carga de Energia Diária | Dá a carga por subsistema desde 2000. Sem ela não existe "quanto o Brasil consome" nem comparação entre regiões. CSV anual de ~55 KB: 27 anos somam menos de 1,5 MB. |
| `energia-balanco.json` | `balanco-energia-subsistema` — Balanço de Energia nos Subsistemas | É o único conjunto que abre a **geração por fonte** (hidráulica, térmica, eólica, solar) no mesmo registro em que traz carga e intercâmbio. É o que permite dizer "a fatia da eólica no Nordeste é X%". É o mais pesado da fase (bruto horário). |
| `energia-ear.json` | `ear-diario-por-subsistema` — EAR Diário por Subsistema | Energia armazenada em % do máximo. É o termômetro da crise hídrica e o número que o leitor de conta alta procura. Diário, 27 anos, menos de 2 MB. |

**Por que mensal e não diário/horário:** o bruto do balanço tem ~118 MB
em 27 anos e ~43 mil linhas por ano (uma por hora × subsistema); o leitor
quer tendência, participação e comparação, não a hora. A agregação mensal
reduz para 5 linhas (4 subsistemas + o agregado SIN) × 12 meses e mantém
a pergunta respondível. Diário entra quando houver página que peça
diário — aí o recorte é outro, provavelmente por subsistema e por janela.

**O que fica de fora, e por quê:**

- `programacao_diaria` (31,1 GB), `disponibilidade_usina` (4,3 GB) e
  `geracao-usina-2` (16,6 GB): peso inviável para coletar no PC e para
  versionar; exigem ETL em banco, não JSON de build.
- `ear-diario-por-reservatorio` (273 MB) e
  `ena-diario-por-reservatorio` (294 MB): o recorte por subsistema
  responde à pergunta geral; o por reservatório só faz sentido com página
  própria, por bacia.
- `constrained-off` eólica e solar (3,1 GB e 730 MB): é a frente
  mais interessante (desperdício de renovável) e a mais cara; fica para a
  fase 2, com recorte por usina e agregação no download.
- `cmo-semi-horario` (28 MB) e `cvu-usitermica` (15 MB): preço entra
  na fase 2, quando a página de tarifa existir.

## Peso real medido na fase 1

Medido em 2026-11-18, baixando o CSV de cada ano e agregando. "Bruto" é o
que foi baixado para a pasta temporária e **não é versionado**; "JSON" é o
que fica no repositório. Em MB decimal são 127,0 MB baixados — a tabela
usa 1 MB = 1.048.576 bytes, como o Windows mostra.

| Conjunto | Arquivos CSV | Bruto baixado | JSON gerado | Registros | Janela |
|---|---|---|---|---|---|
| `carga-energia` | 27 | 1,4 MB | 295,5 KB | 1292 | 2000-01 a 2026-11 |
| `balanco-energia-subsistema` | 27 | 118,0 MB | 758,9 KB | 1615 | 2000-01 a 2026-11 |
| `ear-diario-por-subsistema` | 27 | 1,7 MB | 409,1 KB | 1292 | 2000-01 a 2026-11 |
| **Total** | **81** | **121,1 MB** | **1.463,4 KB** | **4199** | — |

Cada JSON fica **abaixo de 1 MB** (o maior é o balanço, com 758,9 KB)
e os três juntos somam 1.463,4 KB. O teto é conferido por
`apps/web/lib/ons/ons.test.ts` (regra dura 5.1: coleção grande não vai
como prop de componente de cliente).

## Como rodar os coletores

```bash
# catálogo completo (88 conjuntos) — ~5 min por causa do Crawl-Delay de 10 s
python scripts/coletar-ons-catalogo.py

# as três séries da fase 1 — ~6 min (o balanço é 90% do peso)
python scripts/coletar-ons-energia.py

# uma série só, para depurar
python scripts/coletar-ons-energia.py --serie ear

# guardar o bruto para auditoria (por padrão é apagado)
python scripts/coletar-ons-energia.py --manter-bruto

# conferir o dado gerado
cd apps/web && npx vitest run lib/ons
```

Os dois scripts são **idempotentes**: a chave da série é (subsistema, mês),
a saída é ordenada e o arquivo é sobrescrito, nunca duplicado. Cada linha
guarda `fonte` (a URL exata do CSV de origem) e `coletadoEm` — número sem
rastro não é auditável.

## Armadilhas medidas

- **`robots.txt` com `Disallow: /api/` e `Crawl-Delay: 10`.** Coletar sem
  ler o arquivo é o erro mais fácil de cometer. A exceção está registrada
  acima e no cabeçalho dos scripts; a espera de 10 s é respeitada.
- **O tamanho declarado no CKAN é a soma de todos os formatos.** O
  `balanco-energia-subsistema` declara 233 MB, mas o CSV real é ~118 MB.
  Quem planeja download pelo número do catálogo baixa o dobro.
- **Mês faltando no dado oficial.** Fevereiro de 2014 tem 27 dias no
  `carga-energia` (não 28). O coletor grava a contagem em `dias`; mês
  incompleto aparece na série em vez de virar média silenciosamente
  errada.
- **EAR acima de 100% existe na fonte.** Seis registros do Norte passam de
  100% (2000, 2010 e 2011, teto de 103,66%), porque o máximo de referência
  do subsistema foi corrigido depois. O coletor **não corrige o dado
  oficial**: guarda o valor e o teste de `lib/ons` aceita até 105%,
  cobrando que a anomalia continue rara e restrita ao Norte. Página que
  exibir 103% precisa de legenda, não de tesoura.
- **O balanço publica também o agregado `SIN`**, além dos quatro
  subsistemas: são 5 linhas por mês, não 4. Quem somar "todos os
  subsistemas" sem excluir `SIN` conta o país duas vezes.
- **Novembro de 2026 está em curso** (17 dias na medição). O último mês da
  série é sempre parcial — a página não pode tratá-lo como mês fechado.
- **Uma requisição isolada ao CKAN falhou com 502** durante a medição; a
  repetição com espera resolveu. Sem retry, o catálogo vem incompleto e o
  teste de 88 conjuntos pega.
- **Uma leitura do S3 ficou pendurada 20 min** em 18/11/2026 sem estourar
  o timeout de 300 s do `urlopen`. O coletor hoje usa 45 s por socket,
  grava em `.part` e confere o tamanho declarado antes de aceitar o CSV.
- **Conjunto "Sem atualização"** (`classificacao-evt`, `precipitacao-estacao`,
  `descontinuado-...`) ainda aparece na API; quem monta página por tag
  precisa excluir esses ou avisar que o dado parou.
- **`dados_hidrologicos_ho` tem 616 recursos** (um por usina/mês) e 4,1 GB.
  Não é um arquivo, é uma varredura — não entra em fase sem escolher
  recorte.

## Origem / Histórico

- **2026-11-18 — fase 1 do eixo de energia.** Catálogo dos 88 conjuntos,
  três séries mensais (carga, balanço por fonte, EAR) e testes. Bruto
  medido: 121,1 MB baixados, 1.463,4 KB versionados. A decisão de
  coletar pela API está registrada (exceção à regra geral de `robots.txt`,
  por ordem do dono).

